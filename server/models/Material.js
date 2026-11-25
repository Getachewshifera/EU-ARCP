// Purpose: Uploaded learning materials and metadata.
const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 180 },
  subject: { type: String, trim: true, maxlength: 160 },
  course: { type: String, trim: true, maxlength: 160 },
  description: { type: String, trim: true, maxlength: 4000 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  university: { type: mongoose.Schema.Types.ObjectId, ref: 'University', index: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null, index: true },
  storagePath: { type: String, select: false },
  fileUrl: { type: String, select: false },
  fileName: { type: String, required: true },
  mimeType: { type: String, required: true },
  fileSize: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  rejectionReason: { type: String, trim: true, maxlength: 1000 },
  views: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

schema.set('toJSON', {
  transform(_document, record) {
    delete record.storagePath;
    delete record.fileUrl;
    return record;
  },
});

module.exports = mongoose.models.Material || mongoose.model('Material', schema);
