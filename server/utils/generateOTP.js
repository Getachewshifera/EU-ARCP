// Purpose: Shared one-time code generation helper.
const crypto = require('crypto');

function generateOTP(length = 6) {
  const digitsLength = Number.isInteger(length) && length > 0 ? length : 6;
  const value = Array.from({ length: digitsLength }, () => crypto.randomInt(0, 10));
  return value.join('');
}

module.exports = { generateOTP };
