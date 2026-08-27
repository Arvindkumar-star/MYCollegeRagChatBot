const { Schema, model } = require('mongoose');

const CollectionSchema = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = model('Collection', CollectionSchema);
