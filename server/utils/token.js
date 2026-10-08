// Purpose: Shared token creation and verification helpers.
const crypto = require('crypto');

function resolveSecret(secret) {
  const value = (secret || process.env.JWT_SECRET || '').trim();
  if (!value || value.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters.');
  }
  return value;
}

function encodeSegment(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function signToken(payload, { secret, expiresInSeconds = 60 * 60 } = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new TypeError('Token payload must be an object.');
  }
  if (!Number.isInteger(expiresInSeconds) || expiresInSeconds <= 0) {
    throw new TypeError('Token expiry must be a positive number of seconds.');
  }

  const header = encodeSegment({ alg: 'HS256', typ: 'JWT' });
  const issuedAt = Math.floor(Date.now() / 1000);
  const claims = { ...payload, iat: issuedAt, exp: issuedAt + expiresInSeconds };
  const body = encodeSegment(claims);
  const content = `${header}.${body}`;
  const signature = crypto
    .createHmac('sha256', resolveSecret(secret))
    .update(content)
    .digest('base64url');

  return `${content}.${signature}`;
}

function verifyToken(token, secret) {
  if (typeof token !== 'string') throw new Error('Invalid token.');

  const segments = token.split('.');
  if (segments.length !== 3) throw new Error('Invalid token.');

  let header;
  let payload;
  try {
    header = JSON.parse(Buffer.from(segments[0], 'base64url').toString('utf8'));
    payload = JSON.parse(Buffer.from(segments[1], 'base64url').toString('utf8'));
  } catch {
    throw new Error('Invalid token.');
  }

  if (header.alg !== 'HS256' || typeof payload.sub !== 'string' || !payload.sub) {
    throw new Error('Invalid token.');
  }
  if (!Number.isInteger(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error('Token has expired or is missing an expiry.');
  }
  if (payload.nbf != null && (!Number.isInteger(payload.nbf) || payload.nbf > Math.floor(Date.now() / 1000))) {
    throw new Error('Token is not active.');
  }

  const expected = crypto
    .createHmac('sha256', resolveSecret(secret))
    .update(`${segments[0]}.${segments[1]}`)
    .digest();
  const actual = Buffer.from(segments[2], 'base64url');
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
    throw new Error('Invalid token.');
  }

  return payload;
}

module.exports = { signToken, verifyToken };
