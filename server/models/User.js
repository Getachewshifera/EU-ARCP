// Purpose: User accounts and role/profile data.
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, trim: true, maxlength: 80 },
  middleName: { type: String, trim: true, maxlength: 80 },
  lastName: { type: String, trim: true, maxlength: 80 },
  name: { type: String, trim: true, maxlength: 160 },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 60 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['student', 'lecturer', 'admin'], default: 'student', index: true },
  status: {
    type: String,
    enum: ['PENDING_ACTIVATION', 'ACTIVE', 'EXPIRED', 'DISABLED', 'active', 'suspended'],
    default: 'PENDING_ACTIVATION',
    index: true,
  },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved', index: true },
  emailVerified: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true, index: true },
  mustChangePassword: { type: Boolean, default: false },
  activationExpiresAt: { type: Date, default: null },
  passwordChangedAt: { type: Date, default: null },
  university: { type: mongoose.Schema.Types.ObjectId, ref: 'University', required: true },
  college: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program' },
  academicYear: { type: String, trim: true, maxlength: 50 },
  identityId: { type: String, trim: true, uppercase: true, maxlength: 50 },
  studentId: { type: String, trim: true, maxlength: 50 },
  lecturerId: { type: String, trim: true, maxlength: 50 },
  phone: { type: String, trim: true, maxlength: 40 },
  profilePhoto: { type: String, trim: true },
  bio: { type: String, trim: true, maxlength: 2000 },
  otpHash: { type: String, select: false },
  otpPurpose: { type: String, enum: ['registration', 'password-reset'] },
  otpExpiresAt: { type: Date, select: false },
  resetTokenHash: { type: String, select: false },
  resetTokenExpiresAt: { type: Date, select: false },
}, { timestamps: true });

userSchema.index({ role: 1, identityId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
