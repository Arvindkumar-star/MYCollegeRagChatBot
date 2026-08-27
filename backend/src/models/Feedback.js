const { Schema, model } = require('mongoose');

const FeedbackSchema = new Schema({
  messageId: { type: Schema.Types.ObjectId, ref: 'Message', required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: String, enum: ['up', 'down'], required: true },
  comment: { type: String },
}, { timestamps: true });

module.exports = model('Feedback', FeedbackSchema);
