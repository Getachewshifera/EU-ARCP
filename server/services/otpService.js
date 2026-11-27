// Purpose: One-time code creation and verification.
const crypto = require('crypto');
const { hashSecret } = require('../utils/password');
const { sendOtpEmail } = require('./emailService');

const OTP_LIFETIME_MS = 10 * 60 * 1000;

function generateOTP(length = 6) {
  const value = Number.isInteger(length) && length > 0 ? length : 6;
  return Array.from({ length: value }, () => crypto.randomInt(0, 10)).join('');
}

function hashOTP(value) {
  return hashSecret(String(value));
}

async function saveAndSendOtp(user, purpose) {
  const otp = generateOTP();
  user.otpHash = hashOTP(otp);
  user.otpPurpose = purpose;
  user.otpExpiresAt = new Date(Date.now() + OTP_LIFETIME_MS);
  user.otpAttempts = 0;
  user.otpLockedUntil = null;
  await user.save();
  try {
    await sendOtpEmail(user.email, otp, purpose);
  } catch (error) {
    user.otpHash = undefined;
    user.otpPurpose = undefined;
    user.otpExpiresAt = undefined;
    user.otpAttempts = 0;
    user.otpLockedUntil = null;
    await user.save();
    throw new Error('Email delivery is unavailable. Please try again later.');
  }
}

module.exports = { generateOTP, hashOTP, saveAndSendOtp };
