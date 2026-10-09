// Purpose: Tests material behavior.
const assert = require('node:assert/strict');
const test = require('node:test');
const { validateMaterialInput } = require('../validators/materialValidator');

test('material validation accepts valid metadata and rejects oversize values', () => {
  assert.deepEqual(validateMaterialInput({
    title: 'Database Design',
    subject: 'Information Systems',
    course: 'ICS 101',
    description: 'Helpful notes for the course.',
    category: 'CS',
  }).value, {
    title: 'Database Design',
    subject: 'Information Systems',
    course: 'ICS 101',
    description: 'Helpful notes for the course.',
    category: 'CS',
  });

  assert.match(validateMaterialInput({ title: '', subject: 'Math', course: 'MTH' }).error, /title/i);
  assert.match(validateMaterialInput({ title: 'x'.repeat(201), subject: 'Math', course: 'MTH' }).error, /title/i);
});
