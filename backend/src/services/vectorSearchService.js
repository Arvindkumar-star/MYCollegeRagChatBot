/**
 * Vector search service using MongoDB Atlas $vectorSearch aggregation.
 *
 * Falls back to pure keyword (MongoDB text) search if the Atlas vector
 * index is missing — so the chatbot still works without Atlas setup.
 */

const Chunk = require('../models/Chunk');
const Document = require('../models/Document');

const TOP_K = parseInt(process.env.RAG_TOP_K) || 5;
const SIMILARITY_THRESHOLD = parseFloat(process.env.RAG_SIMILARITY_THRESHOLD) || 0.35;

// Track whether vector index exists so we don't spam warnings
let _vectorIndexMissing = false;

/**
 * Pure keyword text search — fallback when vector index is not available.
 */
async function keywordOnlySearch(queryText, topK = TOP_K, collectionId = null) {
  try {
    const filter = { $text: { $search: queryText } };
    if (collectionId) {
      const docs = await Document.find({ collectionId, isActive: true }).select('_id');
      const docIds = docs.map((d) => d._id);
      if (docIds.length === 0) return [];
      filter.documentId = { $in: docIds };
    }

    const results = await Chunk.find(
      filter,
      { score: { $meta: 'textScore' }, content: 1, documentId: 1, pageNumber: 1, chunkIndex: 1 }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(topK)
      .populate('documentId', 'title isActive collectionId')
      .lean();

    return results
      .filter((c) => c.documentId?.isActive)
      .map((c) => ({
        _id: c._id,
        content: c.content,
        documentId: c.documentId._id,
        documentTitle: c.documentId.title,
        pageNumber: c.pageNumber,
        chunkIndex: c.chunkIndex,
        score: Math.min((c.score || 0) / 5, 1), // normalise textScore to 0-1
      }));
  } catch (err) {
    console.error('[VectorSearch] Keyword fallback failed:', err.message);
    return [];
  }
}

/**
 * Pure semantic vector search via Atlas $vectorSearch.
 */
async function semanticSearch(queryEmbedding, topK = TOP_K, collectionId = null) {
  if (_vectorIndexMissing) return [];

  let filterStage = null;
  if (collectionId) {
    const docs = await Document.find({ collectionId, isActive: true }).select('_id');
    const docIds = docs.map((d) => d._id);
    if (docIds.length === 0) return [];
    filterStage = { documentId: { $in: docIds } };
  }

  const vectorSearchStage = {
    $vectorSearch: {
      index: 'vector_index',
      path: 'embedding',
      queryVector: queryEmbedding,
      numCandidates: Math.max(topK * 20, 100),
      limit: topK,
      ...(filterStage && { filter: filterStage }),
    },
  };

  const results = await Chunk.aggregate([
    vectorSearchStage,
    {
      $lookup: {
        from: 'documents',
        localField: 'documentId',
        foreignField: '_id',
        as: 'doc',
      },
    },
    { $unwind: '$doc' },
    { $match: { 'doc.isActive': true } },
    {
      $project: {
        _id: 1,
        content: 1,
        documentId: 1,
        pageNumber: 1,
        chunkIndex: 1,
        documentTitle: '$doc.title',
        collectionId: '$doc.collectionId',
        score: { $meta: 'vectorSearchScore' },
      },
    },
  ]).catch((err) => {
    const isIndexError =
      err.codeName === 'IndexNotFound' ||
      err.code === 40324 ||
      err.message?.includes('$vectorSearch') ||
      err.message?.includes('vector') ||
      err.message?.includes('index');

    if (isIndexError) {
      if (!_vectorIndexMissing) {
        _vectorIndexMissing = true;
        console.warn(
          '[VectorSearch] Atlas Vector Search index "vector_index" not found.\n' +
          '  Falling back to keyword-only search.\n' +
          '  To enable semantic search: create a vector index in MongoDB Atlas UI.\n' +
          '  Path: "embedding", Dimensions: 384, Similarity: cosine'
        );
      }
      return [];
    }
    throw err;
  });

  return results;
}

/**
 * Hybrid search: blends semantic + keyword scores.
 * Falls back to keyword-only when semantic returns nothing.
 */
async function hybridSearch(queryEmbedding, queryText, topK = TOP_K, collectionId = null) {
  const [semanticResults, keywordResults] = await Promise.all([
    semanticSearch(queryEmbedding, topK * 2, collectionId),
    Chunk.find(
      { $text: { $search: queryText } },
      { score: { $meta: 'textScore' }, content: 1, documentId: 1, pageNumber: 1 }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(topK * 2)
      .populate('documentId', 'title isActive')
      .lean(),
  ]);

  // If vector index missing → use keyword results directly
  if (semanticResults.length === 0 && keywordResults.length > 0) {
    console.log('[VectorSearch] Semantic empty — using keyword-only results');
    return keywordResults
      .filter((c) => c.documentId?.isActive)
      .slice(0, topK)
      .map((c) => ({
        _id: c._id,
        content: c.content,
        documentId: c.documentId._id,
        documentTitle: c.documentId.title,
        pageNumber: c.pageNumber,
        score: Math.min((c.score || 1) / 5, 1),
      }));
  }

  // Blend scores
  const scoreMap = new Map();

  for (const chunk of semanticResults) {
    const id = chunk._id.toString();
    scoreMap.set(id, {
      ...chunk,
      semanticScore: chunk.score,
      keywordScore: 0,
      combinedScore: 0.7 * chunk.score,
    });
  }

  for (const chunk of keywordResults) {
    if (!chunk.documentId?.isActive) continue;
    const id = chunk._id.toString();
    const kwScore = chunk.score || 0;
    if (scoreMap.has(id)) {
      const entry = scoreMap.get(id);
      entry.keywordScore = kwScore;
      entry.combinedScore = 0.7 * entry.semanticScore + 0.3 * kwScore;
    } else {
      scoreMap.set(id, {
        _id: chunk._id,
        content: chunk.content,
        documentId: chunk.documentId._id,
        documentTitle: chunk.documentId.title,
        pageNumber: chunk.pageNumber,
        semanticScore: 0,
        keywordScore: kwScore,
        combinedScore: 0.3 * kwScore,
      });
    }
  }

  return Array.from(scoreMap.values())
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, topK)
    .map((c) => ({ ...c, score: c.combinedScore }));
}

/**
 * Main entry point. Returns results above threshold.
 * Uses lower threshold in keyword-only mode.
 */
async function similaritySearch(queryEmbedding, queryText = null, topK = TOP_K, collectionId = null) {
  let results;
  if (queryText) {
    results = await hybridSearch(queryEmbedding, queryText, topK, collectionId);
  } else {
    results = await semanticSearch(queryEmbedding, topK, collectionId);
  }

  const threshold = _vectorIndexMissing ? 0.05 : SIMILARITY_THRESHOLD;
  return results.filter((r) => (r.score || 0) >= threshold);
}

module.exports = { similaritySearch, semanticSearch, hybridSearch, keywordOnlySearch, SIMILARITY_THRESHOLD };
