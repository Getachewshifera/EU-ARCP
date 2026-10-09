// Purpose: Handles authentication and account verification requests.
const crypto = require('crypto');
const fs = require('fs/promises');
const mongoose = require('mongoose');
const User = require('../models/User');
const University = require('../models/University');
const College = require('../models/College');
const Department = require('../models/Department');
const Program = require('../models/Program');
const RegistrationRequest = require('../models/RegistrationRequest');
const { sendOtpEmail, sendActivationEmail } = require('../services/emailService');
const { generateUniqueUsername, normalizeIdentityId } = require('../services/usernameService');
const { generatePassword } = require('../utils/generatePassword');
const { hashPassword, hashSecret, verifyPassword } = require('../utils/password');
const { signToken } = require('../utils/token');

const OTP_LIFETIME_MS = 10 * 60 * 1000;
const ACTIVATION_WINDOW_MS = 5 * 60 * 1000;

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function publicUser(user) {
  const account = user.toObject ? user.toObject() : { ...user };
  delete account.password;
  delete account.otpHash;
  delete account.otpExpiresAt;
  delete account.resetTokenHash;
  delete account.resetTokenExpiresAt;
  return account;
}

async function saveAndSendOtp(user, purpose) {
  const otp = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  user.otpHash = hashSecret(otp);
  user.otpPurpose = purpose;
  user.otpExpiresAt = new Date(Date.now() + OTP_LIFETIME_MS);
  await user.save();
  try {
    await sendOtpEmail(user.email, otp, purpose);
  } catch (error) {
    user.otpHash = undefined;
    user.otpPurpose = undefined;
    user.otpExpiresAt = undefined;
    await user.save();
    throw error;
  }
}

async function validateAcademicReferences({ universityId, collegeId, departmentId, programId, level }) {
  const university = universityId ? await University.findById(universityId).lean() : null;
  if (!university) {
    throw new Error('The selected university was not found.');
  }

  if (collegeId) {
    const college = await College.findById(collegeId).lean();
    if (!college || String(college.university) !== String(university._id)) {
      throw new Error('The selected college does not belong to the selected university.');
    }
  }

  if (departmentId) {
    const department = await Department.findById(departmentId).lean();
    if (!department || String(department.university || department.college) !== String(university._id)) {
      throw new Error('The selected department does not belong to the selected university.');
    }
  }

  if (programId) {
    const program = await Program.findById(programId).lean();
    if (!program) {
      throw new Error('The selected program was not found.');
    }
    const department = await Department.findById(program.department).lean();
    if (!department || String(department.university || department.college) !== String(university._id)) {
      throw new Error('The selected program does not match the selected academic structure.');
    }
  }

  if (level === 'student' && !collegeId) {
    throw new Error('College is required for student registration.');
  }
  if (level === 'student' && !departmentId) {
    throw new Error('Department is required for student registration.');
  }
  if (level === 'student' && !programId) {
    throw new Error('Program is required for student registration.');
  }

  return { university, collegeId, departmentId, programId };
}

async function register(request, response, next) {
  try {
    const role = String(request.params.role || '').toLowerCase();
    const payload = request.body || {};
    if (!['student', 'lecturer'].includes(role)) {
      return response.status(400).json({ message: 'Only student and lecturer registrations are supported.' });
    }

    const firstName = String(payload.firstName || '').trim();
    const middleName = String(payload.middleName || '').trim();
    const lastName = String(payload.lastName || '').trim();
    const email = normalizeEmail(payload.email);
    const phone = typeof payload.phone === 'string' ? payload.phone.trim() : '';
    const universityId = String(payload.universityId || payload.university || '').trim();
    const collegeId = String(payload.collegeId || payload.college || '').trim();
    const departmentId = String(payload.departmentId || payload.department || '').trim();
    const programId = String(payload.programId || payload.program || '').trim();
    const academicYear = typeof payload.academicYear === 'string' ? payload.academicYear.trim() : '';
    const identityId = normalizeIdentityId(role === 'student' ? (payload.studentId || payload.identityId || payload.universityId) : (payload.lecturerId || payload.identityId));

    if (!firstName || !lastName || !email || !universityId || !identityId) {
      return response.status(400).json({ message: 'First name, last name, email, university, and identity ID are required.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return response.status(400).json({ message: 'Enter a valid email address.' });
    }
    if (phone && !/^[+]?[(]?[0-9]{1,4}[)]?[-\s0-9]{6,}$/.test(phone)) {
      return response.status(400).json({ message: 'Enter a valid phone number.' });
    }
    if (role === 'student' && (!academicYear || !/^(Year\s*\d+|\d+)$/.test(academicYear))) {
      return response.status(400).json({ message: 'Academic year is required for student registration.' });
    }
    if (!mongoose.isValidObjectId(universityId)) {
      return response.status(400).json({ message: 'University reference is invalid.' });
    }

    await validateAcademicReferences({ universityId, collegeId, departmentId, programId, level: role });

    const existing = await User.findOne({ $or: [{ email }, { role, identityId }] }).lean();
    if (existing) {
      return response.status(409).json({ message: 'An account with this email or identity ID already exists.' });
    }

    let registrationRecord = null;
    const generatedUsername = await generateUniqueUsername({ role, identityId });
    const temporaryPassword = generatePassword(14);
    const profilePhoto = request.file ? `/uploads/${request.file.filename}` : (typeof payload.profilePhoto === 'string' ? payload.profilePhoto.trim() : '');

    if (request.file && !['image/jpeg', 'image/png'].includes(request.file.mimetype)) {
      await fs.unlink(request.file.path).catch(() => {});
      return response.status(400).json({ message: 'Profile photo must be a JPEG or PNG image.' });
    }

    try {
      const user = await User.create({
        firstName,
        middleName,
        lastName,
        name: `${firstName} ${middleName ? `${middleName} ` : ''}${lastName}`.trim(),
        username: generatedUsername,
        email,
        password: await hashPassword(temporaryPassword),
        role,
        status: 'PENDING_ACTIVATION',
        mustChangePassword: true,
        activationExpiresAt: new Date(Date.now() + ACTIVATION_WINDOW_MS),
        university: universityId,
        college: collegeId || undefined,
        department: departmentId || undefined,
        program: programId || undefined,
        academicYear: role === 'student' ? academicYear : undefined,
        identityId,
        studentId: role === 'student' ? identityId : undefined,
        lecturerId: role === 'lecturer' ? identityId : undefined,
        phone: phone || undefined,
        profilePhoto: profilePhoto || undefined,
        isActive: true,
        emailVerified: true,
      });

      registrationRecord = await RegistrationRequest.create({
        user: user._id,
        firstName,
        middleName,
        lastName,
        email,
        username: generatedUsername,
        role,
        university: universityId,
        college: collegeId || undefined,
        department: departmentId || undefined,
        program: programId || undefined,
        identityId,
        academicYear: role === 'student' ? academicYear : undefined,
        status: 'submitted',
      });

      await sendActivationEmail(email, generatedUsername, temporaryPassword, role);
      return response.status(201).json({
        username: generatedUsername,
        email,
        status: 'PENDING_ACTIVATION',
        requiresPasswordChange: true,
        message: 'Registration submitted successfully. Use your temporary username and password to activate your account within five minutes.',
        registrationId: String(registrationRecord._id),
      });
    } catch (error) {
      if (request.file) await fs.unlink(request.file.path).catch(() => {});
      if (registrationRecord) await RegistrationRequest.deleteOne({ _id: registrationRecord._id }).catch(() => {});
      if (error?.code === 11000) {
        return response.status(409).json({ message: 'This email or identity ID has already been used.' });
      }
      throw error;
    }
  } catch (error) {
    return next(error);
  }
}

async function login(request, response, next) {
  try {
    const usernameInput = typeof request.body?.username === 'string' ? request.body.username.trim() : '';
    const emailInput = normalizeEmail(request.body?.email || '');
    const loginKey = usernameInput || emailInput;
    const password = request.body?.password;
    if (!loginKey || typeof password !== 'string') {
      return response.status(400).json({ message: 'Username or email and password are required.' });
    }

    const user = await User.findOne({
      $or: [{ username: loginKey.toLowerCase() }, { email: loginKey.toLowerCase() }],
    }).select('+password');

    if (!user || !(await verifyPassword(password, user.password))) {
      return response.status(401).json({ message: 'Invalid username or password.' });
    }

    if (user.status === 'PENDING_ACTIVATION') {
      if (user.activationExpiresAt && new Date(user.activationExpiresAt).getTime() <= Date.now()) {
        user.status = 'EXPIRED';
        user.isActive = false;
        await user.save();
        return response.status(403).json({ message: 'Your activation window has expired. Contact the administrator or re-register.' });
      }
      return response.json({
        requiresPasswordChange: true,
        username: user.username,
        email: user.email,
        message: 'Change your temporary password to complete activation.',
      });
    }

    if (user.status === 'DISABLED' || user.status === 'EXPIRED' || user.status === 'suspended') {
      return response.status(403).json({ message: 'This account is not active.' });
    }

    if (user.status !== 'ACTIVE') {
      return response.status(403).json({ message: 'Account access is restricted.' });
    }

    const token = signToken({ sub: String(user._id), role: user.role });
    return response.json({ token, user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
}

async function activateAccount(request, response, next) {
  try {
    const usernameInput = typeof request.body?.username === 'string' ? request.body.username.trim() : '';
    const email = normalizeEmail(request.body?.email || '');
    const currentPassword = typeof request.body?.currentPassword === 'string' ? request.body.currentPassword : '';
    const newPassword = typeof request.body?.newPassword === 'string' ? request.body.newPassword : '';
    const confirmPassword = typeof request.body?.confirmPassword === 'string' ? request.body.confirmPassword : '';
    const loginKey = usernameInput || email;

    if (!loginKey || !currentPassword || !newPassword || !confirmPassword) {
      return response.status(400).json({ message: 'Username, current password, and new password are required.' });
    }
    if (newPassword !== confirmPassword) {
      return response.status(400).json({ message: 'The new password and confirmation do not match.' });
    }
    if (newPassword === currentPassword) {
      return response.status(400).json({ message: 'Choose a different password than the temporary one.' });
    }
    if (newPassword.length < 8 || newPassword.length > 200) {
      return response.status(400).json({ message: 'Password must be between 8 and 200 characters.' });
    }

    const user = await User.findOne({
      $or: [{ username: loginKey.toLowerCase() }, { email: loginKey.toLowerCase() }],
    }).select('+password');
    if (!user) {
      return response.status(401).json({ message: 'The account could not be found.' });
    }
    if (user.status !== 'PENDING_ACTIVATION') {
      return response.status(403).json({ message: 'This account is not pending activation.' });
    }
    if (!(await verifyPassword(currentPassword, user.password))) {
      return response.status(401).json({ message: 'The current password is incorrect.' });
    }
    if (user.activationExpiresAt && new Date(user.activationExpiresAt).getTime() <= Date.now()) {
      user.status = 'EXPIRED';
      user.isActive = false;
      await user.save();
      return response.status(403).json({ message: 'The activation deadline has passed. Please contact support.' });
    }

    user.password = await hashPassword(newPassword);
    user.status = 'ACTIVE';
    user.isActive = true;
    user.mustChangePassword = false;
    user.activationExpiresAt = null;
    user.passwordChangedAt = new Date();
    await user.save();

    const token = signToken({ sub: String(user._id), role: user.role });
    return response.json({
      token,
      user: publicUser(user),
      message: 'Account activated successfully.',
    });
  } catch (error) {
    return next(error);
  }
}

async function verifyOtp(request, response, next) {
  try {
    const email = normalizeEmail(request.body?.email);
    const otp = String(request.body?.otp || '');
    const purpose = request.body?.purpose;
    if (!email || !/^\d{6}$/.test(otp) || !['registration', 'password-reset'].includes(purpose)) {
      return response.status(400).json({ message: 'A valid email, six-digit code, and purpose are required.' });
    }
    const user = await User.findOne({ email }).select('+otpHash +otpExpiresAt');
    if (!user || user.otpPurpose !== purpose || !user.otpHash || !user.otpExpiresAt
      || user.otpExpiresAt <= new Date() || hashSecret(otp) !== user.otpHash) {
      return response.status(400).json({ message: 'The verification code is invalid or expired.' });
    }
    user.otpHash = undefined;
    user.otpPurpose = undefined;
    user.otpExpiresAt = undefined;
    if (purpose === 'registration') {
      user.emailVerified = true;
      await user.save();
      return response.json({ email, verified: true, status: user.status });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetTokenHash = hashSecret(resetToken);
    user.resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();
    return response.json({ email, resetToken });
  } catch (error) {
    return next(error);
  }
}

async function forgotPassword(request, response, next) {
  try {
    const email = normalizeEmail(request.body?.email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return response.status(400).json({ message: 'Enter a valid email address.' });
    }
    const user = await User.findOne({ email });
    if (user && user.status !== 'suspended') await saveAndSendOtp(user, 'password-reset');
    return response.json({ message: 'If the account exists, a verification code has been sent.' });
  } catch (error) {
    return next(error);
  }
}

async function resetPassword(request, response, next) {
  try {
    const email = normalizeEmail(request.body?.email);
    const token = request.body?.resetToken;
    const password = request.body?.password;
    if (typeof password !== 'string' || password.length < 8 || password.length > 200) {
      return response.status(400).json({ message: 'Password must be at least 8 characters.' });
    }
    const user = await User.findOne({ email }).select('+resetTokenHash +resetTokenExpiresAt');
    if (!user || typeof token !== 'string' || !user.resetTokenHash || !user.resetTokenExpiresAt
      || user.resetTokenExpiresAt <= new Date() || hashSecret(token) !== user.resetTokenHash) {
      return response.status(400).json({ message: 'The password reset token is invalid or expired.' });
    }
    user.password = await hashPassword(password);
    user.resetTokenHash = undefined;
    user.resetTokenExpiresAt = undefined;
    user.mustChangePassword = false;
    await user.save();
    return response.json({ message: 'Password updated successfully.' });
  } catch (error) {
    return next(error);
  }
}

function logout(_request, response) {
  return response.json({ message: 'Signed out successfully.' });
}

module.exports = { register, login, activateAccount, verifyOtp, forgotPassword, resetPassword, logout };
