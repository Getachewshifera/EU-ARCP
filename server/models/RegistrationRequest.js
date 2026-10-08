// Purpose: Account registration applications and their review status.
const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  firstName: { type: String, required: true, trim: true, maxlength: 80 },
  lastName: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  role: { type: String, enum: ['student', 'lecturer'], required: true },
  university: { type: String, required: true, trim: true, maxlength: 180 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  note: { type: String, trim: true, maxlength: 1000 },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
}, { timestamps: true });
module.exports = mongoose.models.RegistrationRequest || mongoose.model('RegistrationRequest', schema);
