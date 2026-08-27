const { Schema, model } = require('mongoose');

const AnalyticsEventSchema = new Schema({
  eventType: {
    type: String,
    enum: ['query', 'upload', 'feedback', 'no_answer'],
    required: true,
    index: true,
  },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: true });

module.exports = model('AnalyticsEvent', AnalyticsEventSchema);
