// Purpose: Tests authentication behavior.
const assert = require('node:assert/strict');
const test = require('node:test');
const { signToken, verifyToken } = require('../utils/token');
const { validateLogin, validateOtpRequest, validateForgotPassword } = require('../validators/authValidator');

const secret = 'test-secret-that-is-at-least-thirty-two-characters';

test('signToken and verifyToken round-trip claims securely', () => {
  const token = signToken({ sub: 'user-42', role: 'student' }, { secret, expiresInSeconds: 60 });
  const claims = verifyToken(token, secret);

  assert.equal(claims.sub, 'user-42');
  assert.equal(claims.role, 'student');
  assert.equal(typeof claims.iat, 'number');
  assert.equal(typeof claims.exp, 'number');
});

test('login validation rejects invalid credentials', () => {
  assert.match(validateLogin({ email: 'bad-email', password: 'pass' }).error, /valid email/i);
  assert.match(validateLogin({ email: 'user@example.com', password: 'short' }).error, /at least 8/i);
  assert.deepEqual(validateLogin({ email: 'user@example.com', password: 'long-enough-password' }).value, {
    email: 'user@example.com',
    password: 'long-enough-password',
  });
});

test('OTP validation enforces a six-digit code and supported purpose', () => {
  assert.match(validateOtpRequest({ email: 'user@example.com', otp: '12345', purpose: 'registration' }).error, /six-digit/i);
  assert.match(validateOtpRequest({ email: 'user@example.com', otp: '123456', purpose: 'unknown' }).error, /registration or password-reset/i);
  assert.deepEqual(validateForgotPassword({ email: ' USER@EXAMPLE.COM ' }).value, { email: 'user@example.com' });
});
