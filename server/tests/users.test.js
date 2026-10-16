const assert = require('node:assert/strict');
const test = require('node:test');
const { signToken, verifyToken } = require('../utils/token');
const { validateUserUpdate } = require('../validators/userValidator');
const { normalizeUserProfileUpdate } = require('../validators/userProfileValidator');

const secret = 'test-secret-that-is-at-least-thirty-two-characters';

test('signed bearer tokens retain claims and reject tampering', () => {
  const token = signToken({ sub: 'user-123', role: 'admin' }, { secret });
  const claims = verifyToken(token, secret);

  assert.equal(claims.sub, 'user-123');
  assert.equal(claims.role, 'admin');
  const [header, , signature] = token.split('.');
  const modifiedPayload = Buffer.from(JSON.stringify({ ...claims, role: 'student' })).toString('base64url');
  assert.throws(() => verifyToken(`${header}.${modifiedPayload}.${signature}`, secret), /Invalid token/);
});

test('user updates accept only supported role and status fields', () => {
  assert.deepEqual(validateUserUpdate({ role: 'lecturer' }), {
    value: { role: 'lecturer' },
  });
  assert.deepEqual(validateUserUpdate({ status: 'suspended' }), {
    value: { status: 'suspended' },
  });
  assert.match(validateUserUpdate({ role: 'owner' }).error, /Role must be/);
  assert.match(validateUserUpdate({ password: 'new-password' }).error, /Only role and status/);
  assert.match(validateUserUpdate({}).error, /Only role and status/);
});

test('profile updates normalize form aliases and ignore immutable IDs and usernames', () => {
  assert.deepEqual(normalizeUserProfileUpdate({
    universityId: { _id: 'university-id', name: 'University' },
    departmentId: 'department-id',
    email: 'student@example.com',
    username: 'unchangeable',
    studentId: 'unchangeable-id',
    _id: 'record-id',
    role: 'admin',
    name: 'Read-only derived name',
  }), {
    value: {
      university: 'university-id',
      department: 'department-id',
      email: 'student@example.com',
    },
  });
});

test('profile updates reject unsupported account fields', () => {
  assert.match(normalizeUserProfileUpdate({ unknownProfileField: 'value' }).error, /Only profile fields/i);
  assert.match(normalizeUserProfileUpdate({ username: 'student' }).error, /Provide profile fields/i);
});
