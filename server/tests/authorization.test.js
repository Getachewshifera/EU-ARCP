// Purpose: Tests access control and role authorization.
const assert = require('node:assert/strict');
const test = require('node:test');
const adminMiddleware = require('../middleware/adminMiddleware');

test('admin middleware allows administrators and blocks non-admins', () => {
  let nextCalled = false;
  const request = { user: { role: 'admin' } };
  const response = { statusCode: null, payload: null, status(code) { this.statusCode = code; return this; }, json(body) { this.payload = body; return this; } };

  adminMiddleware(request, response, () => {
    nextCalled = true;
  });

  assert.equal(response.statusCode, null);
  assert.equal(nextCalled, true);

  const forbidden = { user: { role: 'student' } };
  let blocked = false;
  adminMiddleware(forbidden, response, () => { blocked = true; });
  assert.equal(response.payload.message, 'Administrator access is required.');
  assert.equal(blocked, false);
});
