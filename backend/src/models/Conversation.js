const { Schema, model } = require('mongoose');

const ConversationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, default: 'New Conversation' },
  language: { type: String, default: 'en' },
}, { timestamps: true });

module.exports = model('Conversation', ConversationSchema);
