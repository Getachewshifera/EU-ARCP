// Purpose: Hashes and verifies account passwords with scrypt.
const crypto = require('crypto');
const { promisify } = require('util');

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scrypt(password, salt, KEY_LENGTH);
  return `${salt}:${derivedKey.toString('hex')}`;
}

async function verifyPassword(password, storedHash) {
  if (typeof storedHash !== 'string') return false;
  const [salt, key] = storedHash.split(':');
  if (!salt || !/^[a-f0-9]{128}$/i.test(key || '')) return false;
  const actual = await scrypt(password, salt, KEY_LENGTH);
  const expected = Buffer.from(key, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function hashSecret(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

module.exports = { hashPassword, verifyPassword, hashSecret };
