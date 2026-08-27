/**
 * Document ingestion pipeline:
 * 1. Extract text from PDF (pdf-parse, fallback to tesseract.js for scanned PDFs)
 * 2. Sentence-aware chunking via @langchain/textsplitters RecursiveCharacterTextSplitter
 * 3. Embed each chunk via embeddingService
 * 4. Save chunks to MongoDB
 * 5. Optionally auto-summarize and update document.summary
 * 6. Update document.status to 'ready' or 'failed'
 */

const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');

const Document = require('../models/Document');
const Chunk = require('../models/Chunk');
const { embedBatch } = require('./embeddingService');
const { summarizeDocument } = require('./llmService');

const CHUNK_SIZE = 500;       // target tokens (~2000 chars)
const CHUNK_OVERLAP = 50;     // overlap tokens (~200 chars)

function getStoredFilePath(fileUrl) {
  if (!fileUrl) return null;
  const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
  const fileName = path.basename(fileUrl);
  const filePath = path.join(uploadDir, fileName);
  return filePath.startsWith(`${uploadDir}${path.sep}`) ? filePath : null;
}

/**
 * Extract text from a PDF file path.
 * Falls back to tesseract.js OCR for image-heavy PDFs.
 *
 * @param {string} filePath
 * @returns {Promise<{ text: string, pageTexts: string[], ocrUsed: boolean }>}
 */
async function extractTextFromPDF(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  let parsedData;
  let parser;

  try {
    // pdf-parse v2 uses a parser instance and exposes page-level text.
    parser = new PDFParse({ data: fileBuffer });
    parsedData = await parser.getText();
  } catch (err) {
    console.warn('pdf-parse failed, trying OCR:', err.message);
    parsedData = null;
  } finally {
    if (parser) await parser.destroy().catch(() => {});
  }

  const totalPages = parsedData?.total || 1;
  const rawText = parsedData?.text || '';

  // Short text PDFs are valid text PDFs. Only OCR when no usable text exists.
  if (!rawText.trim()) {
    console.log('No embedded PDF text found — using OCR fallback');
    return await extractTextWithOCR(filePath, totalPages);
  }

  const pageTexts = parsedData.pages?.length
    ? parsedData.pages.map((page) => page.text || '')
    : splitIntoPages(rawText, totalPages);
  return { text: rawText, pageTexts, ocrUsed: false };
}

/**
 * Split extracted text into per-page arrays (best-effort heuristic).
 */
function splitIntoPages(text, numPages) {
  // pdf-parse uses form-feed character \f to separate pages sometimes
  if (text.includes('\f')) {
    const pages = text.split('\f');
    return pages.length >= numPages ? pages.slice(0, numPages) : pages;
  }
  // If no form-feed, distribute text evenly across pages
  const charsPerPage = Math.ceil(text.length / numPages);
  const pages = [];
  for (let i = 0; i < numPages; i++) {
    pages.push(text.slice(i * charsPerPage, (i + 1) * charsPerPage));
  }
  return pages;
}

/**
 * OCR fallback using tesseract.js (pure JS, no external binary).
 * @param {string} filePath
 * @param {number} numPages
 */
async function extractTextWithOCR(filePath, numPages) {
  // Use Tesseract to OCR each page rendered as an image
  // For simplicity, we OCR the entire file as one pass
  const { createWorker } = require('tesseract.js');
  const worker = await createWorker('eng');
  const {
    data: { text },
  } = await worker.recognize(filePath);
  await worker.terminate();

  const pageTexts = splitIntoPages(text, Math.max(numPages, 1));
  return { text, pageTexts, ocrUsed: true };
}

/**
 * Chunk text and enrich each chunk with its page number.
 *
 * @param {string[]} pageTexts - text per page
 * @returns {Promise<Array<{content: string, pageNumber: number, chunkIndex: number}>>}
 */
async function chunkPageTexts(pageTexts) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE * 4,    // chars (~4 chars per token)
    chunkOverlap: CHUNK_OVERLAP * 4,
    separators: ['\n\n', '\n', '. ', '! ', '? ', ' ', ''],
  });

  const allChunks = [];
  let globalIndex = 0;

  for (let pageIdx = 0; pageIdx < pageTexts.length; pageIdx++) {
    const pageText = pageTexts[pageIdx].trim();
    if (!pageText) continue;

    const splits = await splitter.splitText(pageText);
    for (const content of splits) {
      if (content.trim().length < 20) continue; // skip empty/tiny chunks
      allChunks.push({
        content: content.trim(),
        pageNumber: pageIdx + 1,
        chunkIndex: globalIndex++,
      });
    }
  }

  return allChunks;
}

/**
 * Main ingestion function — called as a background fire-and-forget job.
 * Updates document.status throughout.
 *
 * @param {string} documentId - MongoDB Document _id
 * @param {string} filePath - absolute path to the uploaded file
 */
async function ingestDocument(documentId, filePath) {
  console.log(`[Ingestion] Starting: documentId=${documentId}`);

  try {
    // 1. Extract text
    const { text, pageTexts, ocrUsed } = await extractTextFromPDF(filePath);
    console.log(`[Ingestion] Extracted ${text.length} chars, ocrUsed=${ocrUsed}`);

    // 2. Chunk
    const rawChunks = await chunkPageTexts(pageTexts);
    console.log(`[Ingestion] Created ${rawChunks.length} chunks`);

    // 3. Embed all chunks in batch
    const contents = rawChunks.map((c) => c.content);
    const embeddings = await embedBatch(contents);
    console.log(`[Ingestion] Embedded ${embeddings.length} chunks`);

    // 4. Save chunks to MongoDB
    const chunkDocs = rawChunks.map((chunk, i) => ({
      documentId,
      content: chunk.content,
      chunkIndex: chunk.chunkIndex,
      pageNumber: chunk.pageNumber,
      embedding: embeddings[i],
    }));

    // Delete existing chunks (re-ingestion support)
    await Chunk.deleteMany({ documentId });
    await Chunk.insertMany(chunkDocs);
    console.log(`[Ingestion] Saved ${chunkDocs.length} chunks to MongoDB`);

    // 5. Auto-summarization (bonus #13) — fire-and-forget, don't fail ingestion if it errors
    let summary = null;
    try {
      if (process.env.LLM_API_KEY) {
        summary = await summarizeDocument(text);
      }
    } catch (summaryErr) {
      console.warn('[Ingestion] Auto-summarization failed (non-fatal):', summaryErr.message);
    }

    // 6. Mark document as ready
    await Document.findByIdAndUpdate(documentId, {
      status: 'ready',
      ocrUsed,
      processingError: null,
      processedAt: new Date(),
      ...(summary && { summary }),
    });
    console.log(`[Ingestion] ✅ Document ${documentId} ready`);
  } catch (err) {
    console.error(`[Ingestion] ❌ Failed for document ${documentId}:`, err.message);
    await Document.findByIdAndUpdate(documentId, {
      status: 'failed',
      processingError: err.message.slice(0, 500),
    });
  }
}

async function reingestDocument(document) {
  const filePath = getStoredFilePath(document.fileUrl);
  if (!filePath || !fs.existsSync(filePath)) {
    await Document.findByIdAndUpdate(document._id, { status: 'failed' });
    throw new Error(`Uploaded file not found: ${document.filename}`);
  }

  await Document.findByIdAndUpdate(document._id, { status: 'processing' });
  return ingestDocument(document._id.toString(), filePath);
}

module.exports = { ingestDocument, extractTextFromPDF, reingestDocument };
