const router = require('express').Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Feedback = require('../models/Feedback');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const { authenticate } = require('../middleware/auth');
const { ragChat } = require('../services/ragService');

// POST /chat — main RAG endpoint
router.post('/chat', authenticate, async (req, res) => {
  const { message, conversation_id, collectionId } = req.body;
  if (!message || !message.trim())
    return res.status(400).json({ error: 'message is required' });

  // Create or reuse conversation
  let conv;
  if (conversation_id) {
    conv = await Conversation.findOne({ _id: conversation_id, userId: req.user._id });
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });
  } else {
    conv = await Conversation.create({ userId: req.user._id, title: 'New Conversation' });
  }

  const result = await ragChat(message.trim(), conv._id.toString(), req.user._id, collectionId || null);

  res.json({
    conversation_id: conv._id,
    message_id: result.messageId,
    answer: result.answer,
    sources: result.sources,
    confidence: result.confidenceScore,
  });
});

// GET /conversations — list user's conversations
router.get('/conversations', authenticate, async (req, res) => {
  const convs = await Conversation.find({ userId: req.user._id })
    .sort({ updatedAt: -1 })
    .select('_id title createdAt updatedAt')
    .lean();
  res.json(convs);
});

// GET /conversations/:id — get messages in a conversation
router.get('/conversations/:id', authenticate, async (req, res) => {
  const conv = await Conversation.findOne({ _id: req.params.id, userId: req.user._id });
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });

  const messages = await Message.find({ conversationId: conv._id })
    .sort({ createdAt: 1 })
    .lean();

  res.json({ conversation: conv, messages });
});

// DELETE /conversations/:id — permanently delete the user's conversation
router.delete('/conversations/:id', authenticate, async (req, res) => {
  const conv = await Conversation.findOne({ _id: req.params.id, userId: req.user._id });
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });

  const messages = await Message.find({ conversationId: conv._id }).select('_id').lean();
  const messageIds = messages.map((message) => message._id);
  await Promise.all([
    Feedback.deleteMany({ messageId: { $in: messageIds }, userId: req.user._id }),
    Message.deleteMany({ conversationId: conv._id }),
    Conversation.deleteOne({ _id: conv._id }),
  ]);

  res.json({ success: true, message: 'Conversation deleted' });
});

// POST /conversations/:id/export — export conversation as .txt [bonus]
router.post('/conversations/:id/export', authenticate, async (req, res) => {
  const conv = await Conversation.findOne({ _id: req.params.id, userId: req.user._id });
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });

  const messages = await Message.find({ conversationId: conv._id }).sort({ createdAt: 1 }).lean();

  let text = `IIIT Pune Chatbot — Conversation Export\n`;
  text += `Title: ${conv.title}\n`;
  text += `Date: ${conv.createdAt.toISOString()}\n`;
  text += '='.repeat(60) + '\n\n';

  for (const msg of messages) {
    const role = msg.role === 'user' ? 'You' : 'IIIT Pune Assistant';
    text += `${role}:\n${msg.content}\n`;
    if (msg.sources?.length) {
      text += `Sources: ${msg.sources.map((s) => `${s.documentTitle} (p.${s.page})`).join(', ')}\n`;
    }
    text += '\n';
  }

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', `attachment; filename="conversation-${conv._id}.txt"`);
  res.send(text);
});

// POST /messages/:id/feedback — thumbs up/down [bonus]
router.post('/messages/:id/feedback', authenticate, async (req, res) => {
  const { rating, comment } = req.body;
  if (!['up', 'down'].includes(rating))
    return res.status(400).json({ error: 'rating must be "up" or "down"' });

  const message = await Message.findById(req.params.id);
  if (!message) return res.status(404).json({ error: 'Message not found' });

  const feedback = await Feedback.findOneAndUpdate(
    { messageId: message._id, userId: req.user._id },
    { rating, comment },
    { upsert: true, new: true }
  );

  // Log to analytics
  AnalyticsEvent.create({
    eventType: 'feedback',
    userId: req.user._id,
    metadata: { messageId: message._id, rating, comment },
  }).catch(() => {});

  res.json({ success: true, feedback });
});

// GET /suggested-questions [bonus]
router.get('/suggested-questions', authenticate, async (req, res) => {
  const questions = [
    'What are the admission requirements for B.Tech at IIIT Pune?',
    'What is the fee structure for the current academic year?',
    'What hostel facilities are available for students?',
    'What are the placement statistics for CSE graduates?',
    'What scholarships are available for students at IIIT Pune?',
    'What departments does IIIT Pune offer?',
    'What is the academic calendar for this semester?',
    'What library resources are available to students?',
  ];
  res.json(questions);
});

module.exports = router;
