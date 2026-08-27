const { Schema, model } = require('mongoose');

const SourceSchema = new Schema({
  documentId: { type: Schema.Types.ObjectId, ref: 'Document' },
  chunkId: { type: Schema.Types.ObjectId, ref: 'Chunk' },
  documentTitle: String,
  page: Number,
  excerpt: String,
  score: Number,
}, { _id: false });

const MessageSchema = new Schema({
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  sources: [SourceSchema],
  confidenceScore: Number,
}, { timestamps: true });

module.exports = model('Message', MessageSchema);
