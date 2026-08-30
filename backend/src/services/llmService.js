/**
 * LLM service — thin wrapper supporting Groq, OpenAI, and Gemini.
 * Provider selected via LLM_PROVIDER env var.
 */

/**
 * Call Groq (Llama 3) completion API.
 */
async function callGroq(messages) {
  const Groq = require('groq-sdk');
  const client = new Groq({ apiKey: process.env.LLM_API_KEY });
  const resp = await client.chat.completions.create({
    model: process.env.LLM_MODEL || 'openai/gpt-oss-20b',
    messages,
    temperature: 0.2,
    max_tokens: 2048,
  });
  return resp.choices[0].message.content;
}

/**
 * Call OpenAI GPT completion API.
 */
async function callOpenAI(messages) {
  const { OpenAI } = require('openai');
  const client = new OpenAI({ apiKey: process.env.LLM_API_KEY });
  const resp = await client.chat.completions.create({
    model: process.env.LLM_MODEL || 'gpt-4o-mini',
    messages,
    temperature: 0.2,
    max_tokens: 1024,
  });
  return resp.choices[0].message.content;
}

/**
 * Call Google Gemini completion API.
 */
async function callGemini(messages) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.LLM_API_KEY);
  const model = genAI.getGenerativeModel({ model: process.env.LLM_MODEL || 'gemini-1.5-flash' });

  const systemMsg = messages.find((m) => m.role === 'system')?.content || '';
  const history = messages
    .filter((m) => m.role !== 'system')
    .slice(0, -1)
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const lastMsg = messages[messages.length - 1].content;
  const chat = model.startChat({ history, systemInstruction: systemMsg });
  const result = await chat.sendMessage(lastMsg);
  return result.response.text();
}

/**
 * Main LLM call entry point.
 * Returns a friendly fallback string instead of throwing if the key is
 * missing/invalid — this keeps the server alive and chat functional.
 *
 * @param {Array<{role: string, content: string}>} messages
 * @returns {Promise<string>}
 */
async function callLLM(messages) {
  const key = process.env.LLM_API_KEY || '';
  const isPlaceholder = !key || key.includes('your_') || key.includes('_here') || key.length < 20;

  if (isPlaceholder) {
    console.error('[LLM] API key is missing or a placeholder — returning fallback answer.');
    return (
      'The AI service is not configured yet. ' +
      'Please add a valid Groq/OpenAI/Gemini API key as LLM_API_KEY in backend/.env and restart the server.'
    );
  }

  const provider = (process.env.LLM_PROVIDER || 'groq').toLowerCase();

  try {
    switch (provider) {
      case 'openai':  return await callOpenAI(messages);
      case 'gemini':  return await callGemini(messages);
      case 'groq':
      default:        return await callGroq(messages);
    }
  } catch (err) {
    const msg = err.message || '';
    console.error(`[LLM] ${provider} call failed:`, msg);

    if (msg.includes('401') || msg.toLowerCase().includes('invalid api key') || msg.toLowerCase().includes('unauthorized')) {
      return 'The AI API key is invalid or expired. Please update LLM_API_KEY in backend/.env with a valid key.';
    }
    if (msg.includes('429') || msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('quota')) {
      return 'The AI service rate limit was reached. Please wait a moment and try again.';
    }
    if (msg.toLowerCase().includes('model_not_found') || msg.toLowerCase().includes('does not exist')) {
      return 'The configured AI model is unavailable. Please update LLM_MODEL in backend/.env and restart the backend.';
    }
    // Generic — do NOT rethrow; keeps the server alive
    return 'I encountered a temporary error generating a response. Please try again in a moment.';
  }
}

/**
 * Build a one-shot summarization prompt.
 */
async function summarizeDocument(text) {
  const messages = [
    {
      role: 'system',
      content:
        'You are a helpful assistant summarizing an IIIT Pune document for students. ' +
        'Write a concise 3-5 sentence summary covering the main topics, key facts, and who the document is relevant to.',
    },
    {
      role: 'user',
      content: `Please summarize this document:\n\n${text.slice(0, 6000)}`,
    },
  ];
  return callLLM(messages);
}

module.exports = { callLLM, summarizeDocument };
