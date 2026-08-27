const { Schema, model } = require('mongoose');

const ChunkSchema = new Schema({
  documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
  content: { type: String, required: true },
  chunkIndex: { type: Number, required: true },
  pageNumber: { type: Number },
  // Vector array — indexed via Atlas Vector Search, NOT a standard Mongo index.
  // Atlas Vector Search index JSON (create in Atlas UI):
  // { "fields": [
  //   { "type": "vector", "path": "embedding", "numDimensions": 384, "similarity": "cosine" },
  //   { "type": "filter", "path": "documentId" }
  // ]}
  embedding: { type: [Number], index: false },
}, { timestamps: true });

// MongoDB text index on content for hybrid keyword search (bonus feature #15)
ChunkSchema.index({ content: 'text' });

module.exports = model('Chunk', ChunkSchema);
