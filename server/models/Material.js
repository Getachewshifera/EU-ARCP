// Purpose: Uploaded learning materials and metadata.
const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 180 },
  subject: { type: String, trim: true, maxlength: 160 },
  course: { type: String, trim: true, maxlength: 160 },
  description: { type: String, trim: true, maxlength: 4000 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  fileUrl: { type: String, required: true },
  fileName: { type: String, required: true },
  mimeType: { type: String, required: true },
  fileSize: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  rejectionReason: { type: String, trim: true, maxlength: 1000 },
  views: { type: Number, default: 0, min: 0 },
}, { timestamps: true });
module.exports = mongoose.models.Material || mongoose.model('Material', schema);
