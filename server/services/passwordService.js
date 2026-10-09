// Purpose: Password hashing, verification, and related operations.
const { hashPassword, verifyPassword, hashSecret } = require('../utils/password');

function validatePasswordPolicy(password) {
  if (typeof password !== 'string') return 'Password is required.';
  if (password.length < 8 || password.length > 200) {
    return 'Password must be between 8 and 200 characters.';
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
    return 'Password must include upper-case, lower-case, and numeric characters.';
  }
  return null;
}

module.exports = { hashPassword, verifyPassword, hashSecret, validatePasswordPolicy };
