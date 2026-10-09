// Purpose: Tests registration behavior.
const assert = require('node:assert/strict');
const test = require('node:test');
const { validateReviewDecision, validateRegistrationStatusQuery } = require('../validators/registrationValidator');

test('review validation requires an allowed status and a bounded note', () => {
  assert.match(validateReviewDecision({ status: 'approved', note: 'Looks good.' }).value.note, /Looks good\./i);
  assert.match(validateReviewDecision({ status: 'owner', note: 'invalid' }).error, /approved, rejected, or pending/i);
  assert.match(validateReviewDecision({ status: 'pending', note: 'x'.repeat(1001) }).error, /1000/i);
});

test('registration status checks require a valid email before lookup', () => {
  assert.deepEqual(validateRegistrationStatusQuery({ email: '  USER@EXAMPLE.COM  ' }).value, {
    email: 'user@example.com',
  });
  assert.match(validateRegistrationStatusQuery({ email: 'not-an-email' }).error, /valid email/i);
});
