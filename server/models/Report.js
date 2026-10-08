// Purpose: User-submitted reports and their review status.
const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material' },
  reason: { type: String, required: true, trim: true, maxlength: 500 },
  description: { type: String, trim: true, maxlength: 3000 },
  status: { type: String, enum: ['open', 'reviewing', 'resolved', 'dismissed'], default: 'open', index: true },
  resolution: { type: String, trim: true, maxlength: 1000 },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
module.exports = mongoose.models.Report || mongoose.model('Report', schema);
