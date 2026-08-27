/**
 * Embedding service
 * Supports: xenova (local, free) | openai
 * Configured via EMBEDDING_PROVIDER env var.
 */

let _pipeline = null;

/**
 * Embed a single text string using @xenova/transformers (local, no API cost).
 */
async function embedWithXenova(text) {
  if (!_pipeline) {
    // Lazy-load — only runs once
    const { pipeline } = await import('@xenova/transformers');
    _pipeline = await pipeline('feature-extraction', process.env.EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2');
  }
  const output = await _pipeline(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

/**
 * Embed a single text string using OpenAI text-embedding-3-small.
 */
async function embedWithOpenAI(text) {
  const { OpenAI } = require('openai');
  const client = new OpenAI({ apiKey: process.env.LLM_API_KEY });
  const resp = await client.embeddings.create({
    model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
    input: text,
  });
  return resp.data[0].embedding;
}

/**
 * Main entry point: embed text using whichever provider is configured.
 * @param {string} text
 * @returns {Promise<number[]>}
 */
async function embedText(text) {
  const provider = (process.env.EMBEDDING_PROVIDER || 'xenova').toLowerCase();
  if (provider === 'openai') return embedWithOpenAI(text);
  return embedWithXenova(text);
}

/**
 * Embed a batch of texts. Returns array of embedding arrays.
 * @param {string[]} texts
 * @returns {Promise<number[][]>}
 */
async function embedBatch(texts) {
  // Process sequentially to avoid memory spikes with xenova
  const results = [];
  for (const text of texts) {
    results.push(await embedText(text));
  }
  return results;
}

module.exports = { embedText, embedBatch };
