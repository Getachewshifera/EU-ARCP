// Purpose: One-time code creation and verification.
const crypto = require('crypto');
const { hashSecret } = require('../utils/password');

function generateOTP(length = 6) {
  const value = Number.isInteger(length) && length > 0 ? length : 6;
  return Array.from({ length: value }, () => crypto.randomInt(0, 10)).join('');
}

function hashOTP(value) {
  return hashSecret(String(value));
}

module.exports = { generateOTP, hashOTP };
