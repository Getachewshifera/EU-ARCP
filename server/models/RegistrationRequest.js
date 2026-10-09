// Purpose: Account registration history and activation-related audit data.
const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  firstName: { type: String, trim: true, maxlength: 80 },
  middleName: { type: String, trim: true, maxlength: 80 },
  lastName: { type: String, trim: true, maxlength: 80 },
  email: { type: String, lowercase: true, trim: true, index: true },
  username: { type: String, trim: true, lowercase: true, maxlength: 60 },
  role: { type: String, enum: ['student', 'lecturer'], required: true },
  university: { type: mongoose.Schema.Types.ObjectId, ref: 'University' },
  college: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program' },
  identityId: { type: String, trim: true, uppercase: true, maxlength: 50 },
  academicYear: { type: String, trim: true, maxlength: 50 },
  status: { type: String, enum: ['submitted', 'activated', 'failed_delivery', 'expired'], default: 'submitted', index: true },
  note: { type: String, trim: true, maxlength: 1000 },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
}, { timestamps: true });

schema.index({ email: 1, role: 1 }, { unique: true, sparse: true });
module.exports = mongoose.models.RegistrationRequest || mongoose.model('RegistrationRequest', schema);
