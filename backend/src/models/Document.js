const { Schema, model } = require('mongoose');

const DocumentSchema = new Schema({
  collectionId: { type: Schema.Types.ObjectId, ref: 'Collection', index: true },
  title: { type: String, required: true, trim: true },
  filename: { type: String, required: true },
  fileUrl: { type: String, required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  version: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true, index: true },
  summary: { type: String },           // auto-summarization bonus
  ocrUsed: { type: Boolean, default: false },
  processingError: { type: String },
  processedAt: { type: Date },
  status: {
    type: String,
    enum: ['processing', 'ready', 'failed'],
    default: 'processing',
    index: true,
  },
}, { timestamps: true });

module.exports = model('Document', DocumentSchema);
