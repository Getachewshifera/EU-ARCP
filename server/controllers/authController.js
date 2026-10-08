// Purpose: Handles authentication and account verification requests.
const crypto = require('crypto');
const User = require('../models/User');
const RegistrationRequest = require('../models/RegistrationRequest');
const { sendOtpEmail } = require('../services/emailService');
const { hashPassword, hashSecret, verifyPassword } = require('../utils/password');
const { signToken } = require('../utils/token');

const OTP_LIFETIME_MS = 10 * 60 * 1000;

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

async function register(request, response, next) {
  try {
    const { firstName, lastName, email, university, password } = request.body || {};
    const role = request.params.role;
    const normalizedEmail = normalizeEmail(email);
    if (!firstName?.trim() || !lastName?.trim() || !normalizedEmail || !university?.trim()) {
      return response.status(400).json({ message: 'First name, last name, email, and university are required.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return response.status(400).json({ message: 'Enter a valid email address.' });
    }
    if (typeof password !== 'string' || password.length < 8 || password.length > 200) {
      return response.status(400).json({ message: 'Password must be at least 8 characters.' });
    }
    if (await User.exists({ email: normalizedEmail })) {
      return response.status(409).json({ message: 'An account with this email already exists.' });
    }

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      name: `${firstName.trim()} ${lastName.trim()}`,
      email: normalizedEmail,
      password: await hashPassword(password),
      university: university.trim(),
      role,
      status: 'active',
      approvalStatus: 'pending',
      emailVerified: false,
      isActive: true,
    });
    let registration;
    try {
      registration = await RegistrationRequest.create({
        user: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        university: university.trim(),
        role,
      });
      await saveAndSendOtp(user, 'registration');
    } catch (error) {
      if (registration) await RegistrationRequest.deleteOne({ _id: registration._id });
      await User.deleteOne({ _id: user._id });
      throw error;
    }
    return response.status(201).json({
      email: user.email,
      status: 'pending',
      requiresVerification: true,
      message: 'Registration submitted. Verify your email before signing in.',
    });
  } catch (error) {
    return next(error);
  }
}

async function login(request, response, next) {
  try {
    const email = normalizeEmail(request.body?.email);
    const password = request.body?.password;
    if (!email || typeof password !== 'string') {
      return response.status(400).json({ message: 'Email and password are required.' });
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await verifyPassword(password, user.password))) {
      return response.status(401).json({ message: 'Email or password is incorrect.' });
    }
    if (user.status === 'suspended' || user.isActive === false) {
      return response.status(403).json({ message: 'This account is suspended.' });
    }
    if (!user.emailVerified) {
      return response.status(403).json({ message: 'Verify your email before signing in.' });
    }
    if (user.approvalStatus !== 'approved') {
      return response.status(403).json({ message: 'Your registration is awaiting administrator approval.' });
    }
    const token = signToken({ sub: String(user._id), role: user.role });
    return response.json({ token, user: publicUser(user) });
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
      return response.json({ email, verified: true, status: user.approvalStatus });
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
    await user.save();
    return response.json({ message: 'Password updated successfully.' });
  } catch (error) {
    return next(error);
  }
}

function logout(_request, response) {
  return response.json({ message: 'Signed out successfully.' });
}

module.exports = { register, login, verifyOtp, forgotPassword, resetPassword, logout };
