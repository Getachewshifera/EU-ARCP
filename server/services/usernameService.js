// Purpose: Username generation and availability checks.
const crypto = require('crypto');
const User = require('../models/User');

function normalizeIdentityId(value) {
  return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

async function generateUniqueUsername({ role, identityId, model = User, prefix = 'EUARCP' } = {}) {
  const normalizedRole = String(role || '').toLowerCase();
  const normalizedId = normalizeIdentityId(identityId);
  if (!normalizedRole || !normalizedId) {
    throw new Error('A valid role and identity ID are required to generate a username.');
  }

  const roleTag = normalizedRole === 'lecturer' ? 'LEC' : 'STD';
  let base = `${prefix}${roleTag}${normalizedId}`;
  const maxBaseLength = 28;
  if (base.length > maxBaseLength) {
    base = `${prefix}${roleTag}${normalizedId.slice(0, maxBaseLength - prefix.length - roleTag.length)}`;
  }

  let candidate = base.toLowerCase();
  let suffix = 1;
  while (await model.exists({ username: candidate })) {
    const safeSuffix = crypto.randomInt(100, 9999).toString();
    candidate = `${base.slice(0, Math.max(6, 24 - safeSuffix.length)).toLowerCase()}${safeSuffix}`;
    suffix += 1;
    if (suffix > 20) break;
  }

  return candidate;
}

module.exports = { generateUniqueUsername, normalizeIdentityId };
