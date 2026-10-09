// Purpose: Shared username generation helper.
const crypto = require('crypto');

function sanitizeBaseName(name) {
  const value = String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

  return value.slice(0, 18) || 'user';
}

function generateUsername(name, options = {}) {
  const maxLength = Number.isInteger(options.maxLength) ? Math.max(8, options.maxLength) : 16;
  const base = sanitizeBaseName(name);
  const suffix = crypto.randomInt(1000, 9999).toString();
  const limit = Math.max(4, maxLength - suffix.length);
  const username = base.slice(0, limit);

  return `${username || 'user'}${suffix}`.slice(0, maxLength);
}

module.exports = { generateUsername, sanitizeBaseName };
