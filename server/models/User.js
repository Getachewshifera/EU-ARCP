// Purpose: User accounts and role/profile data.
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, trim: true, maxlength: 80 },
  lastName: { type: String, trim: true, maxlength: 80 },
  name: { type: String, trim: true, maxlength: 160 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['student', 'lecturer', 'admin'], default: 'student', index: true },
  status: { type: String, enum: ['active', 'suspended'], default: 'active', index: true },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved', index: true },
  emailVerified: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true, index: true },
  university: { type: String, trim: true, maxlength: 180 },
  college: { type: String, trim: true, maxlength: 180 },
  department: { type: String, trim: true, maxlength: 180 },
  program: { type: String, trim: true, maxlength: 180 },
  studentId: { type: String, trim: true },
  employeeId: { type: String, trim: true },
  phone: { type: String, trim: true, maxlength: 40 },
  profilePicture: { type: String, trim: true },
  bio: { type: String, trim: true, maxlength: 2000 },
  otpHash: { type: String, select: false },
  otpPurpose: { type: String, enum: ['registration', 'password-reset'] },
  otpExpiresAt: { type: Date, select: false },
  resetTokenHash: { type: String, select: false },
  resetTokenExpiresAt: { type: Date, select: false },
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
