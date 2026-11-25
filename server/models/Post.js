// Purpose: Administrator-authored posts shown across the platform.
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  content: { type: String, required: true, trim: true, maxlength: 10000 },
  imageFile: { type: String, default: '' },
  imageMimeType: { type: String, default: '' },
  status: { type: String, enum: ['draft', 'published'], default: 'published', index: true },
  publishedAt: { type: Date, default: null },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.models.Post || mongoose.model('Post', schema);
