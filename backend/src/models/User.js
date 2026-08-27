const { Schema, model } = require('mongoose');

const UserSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin', 'faculty'], default: 'student' },
}, { timestamps: true });

module.exports = model('User', UserSchema);
