/**
 * RAG pipeline service — the heart of the chatbot.
 *
 * Flow:
 *   1. Embed the user's question
 *   2. Run hybrid similarity search (semantic + keyword)
 *   3. If all scores below threshold → return "I don't know" (no LLM call)
 *   4. Build prompt: system instructions + retrieved chunks + conversation history + question
 *   5. Call LLM
 *   6. Return answer + structured sources
 */

const { embedText } = require('./embeddingService');
const { similaritySearch } = require('./vectorSearchService');
const { callLLM } = require('./llmService');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const AnalyticsEvent = require('../models/AnalyticsEvent');

const MAX_CONTEXT_TURNS = parseInt(process.env.RAG_MAX_CONTEXT_TURNS) || 6;

const SYSTEM_PROMPT = `You are an official academic assistant for IIIT Pune (Indian Institute of Information Technology, Pune).
You answer questions using ONLY the document excerpts provided below as context.

Rules:
- If the context contains the answer, respond clearly and cite which document(s) you used.
- If the context does NOT contain the answer, say: "I don't have information about that in the uploaded IIIT Pune documents."
- Do NOT use your general training knowledge to fill in gaps. Only use what is in the provided context.
- Keep answers concise (2-5 sentences) unless the question requires detail.
- Always be helpful, professional, and student-friendly.`;

/**
 * Build the LLM messages array from context chunks and conversation history.
 */
function buildMessages(question, chunks, history) {
  const contextText = chunks
    .map(
      (c, i) =>
        `[Source ${i + 1}: ${c.documentTitle}, Page ${c.pageNumber || 'N/A'}]\n${c.content}`
    )
    .join('\n\n---\n\n');

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Here are the relevant excerpts from IIIT Pune documents:\n\n${contextText}\n\n---\nPlease answer the following question using only the context above.`,
    },
    { role: 'assistant', content: 'Understood. I will answer based only on the provided context.' },
  ];

  // Add conversation history (last N turns for context retention)
  const recentHistory = history.slice(-MAX_CONTEXT_TURNS);
  for (const msg of recentHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }

  // Add the current question
  messages.push({ role: 'user', content: question });

  return messages;
}

/**
 * Main RAG function.
 *
 * @param {string} question - user's question
 * @param {string} conversationId - MongoDB Conversation _id
 * @param {string} userId - MongoDB User _id
 * @param {string|null} collectionId - optional scope to a collection
 * @returns {Promise<{ answer: string, sources: Array, confidenceScore: number, conversationId: string, messageId: string }>}
 */
async function ragChat(question, conversationId, userId, collectionId = null) {
  // 1. Embed the question
  const queryEmbedding = await embedText(question);

  // 2. Hybrid similarity search
  const chunks = await similaritySearch(queryEmbedding, question, undefined, collectionId);

  let answer;
  let sources = [];
  let confidenceScore = 0;

  if (chunks.length === 0) {
    // 3. Unknown question — no relevant chunks found
    answer =
      "I don't have information about that in the uploaded IIIT Pune documents. Please contact the institute directly or check iiitp.ac.in for the latest information.";

    // Log no_answer event for admin analytics
    AnalyticsEvent.create({
      eventType: 'no_answer',
      userId,
      metadata: { question, conversationId },
    }).catch(() => {});
  } else {
    // 4. Build prompt
    const history = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .select('role content')
      .lean();

    const messages = buildMessages(question, chunks, history);

    // 5. Call LLM
    answer = await callLLM(messages);

    // 6. Build sources array
    confidenceScore = chunks[0]?.score || 0;
    sources = chunks.map((c) => ({
      documentId: c.documentId,
      chunkId: c._id,
      documentTitle: c.documentTitle,
      page: c.pageNumber,
      excerpt: c.content.slice(0, 300),
      score: Math.round((c.score || 0) * 100) / 100,
    }));

    // Log query event
    AnalyticsEvent.create({
      eventType: 'query',
      userId,
      metadata: { question, conversationId, chunksFound: chunks.length, confidenceScore },
    }).catch(() => {});
  }

  // Save user message
  await Message.create({
    conversationId,
    role: 'user',
    content: question,
  });

  // Save assistant message
  const assistantMsg = await Message.create({
    conversationId,
    role: 'assistant',
    content: answer,
    sources,
    confidenceScore,
  });

  // Auto-title the conversation from first question (if title is still default)
  await Conversation.findOneAndUpdate(
    { _id: conversationId, title: 'New Conversation' },
    { title: question.slice(0, 60) + (question.length > 60 ? '…' : '') }
  );

  return {
    answer,
    sources,
    confidenceScore,
    conversationId,
    messageId: assistantMsg._id.toString(),
  };
}

module.exports = { ragChat };
