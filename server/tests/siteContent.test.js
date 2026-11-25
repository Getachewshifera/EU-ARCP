const assert = require('node:assert/strict');
const test = require('node:test');
const { validateAppearance } = require('../validators/siteSettingsValidator');
const { validatePostInput } = require('../validators/postValidator');
const { validateMaintenance } = require('../validators/maintenanceValidator');
const University = require('../models/University');

test('appearance validation accepts only six-digit hex colors', () => {
  assert.deepEqual(validateAppearance({
    primaryColor: '#1A2b3C',
    backgroundColor: '#f4f7fb',
  }).value, {
    primaryColor: '#1a2b3c',
    backgroundColor: '#f4f7fb',
  });

  assert.match(validateAppearance({
    primaryColor: 'blue',
    backgroundColor: '#ffffff',
  }).error, /hexadecimal/);
  assert.match(validateAppearance({
    primaryColor: '#ffffff',
    backgroundColor: '#000000',
    customCss: 'body {}',
  }).error, /only/);
})

test('university records accept HTTP(S) websites and reject invalid URLs', async () => {
  const valid = new University({ name: 'Example University', website: 'https://example.edu' });
  await assert.doesNotReject(valid.validate());

  const invalid = new University({ name: 'Example University', website: 'ftp://example.edu' });
  await assert.rejects(invalid.validate(), (error) => {
    assert.equal(error.errors.website.message, 'Website must be a valid HTTP or HTTPS URL.');
    return true;
  });
});

test('maintenance settings require an explicit boolean and bounded user message', () => {
  assert.deepEqual(validateMaintenance({ enabled: true, message: 'We will be right back.' }).value, {
    enabled: true,
    message: 'We will be right back.',
  });
  assert.match(validateMaintenance({ enabled: 'true', message: 'Please wait.' }).error, /boolean/);
  assert.match(validateMaintenance({ enabled: true, message: '  ' }).error, /message/);
});

test('post validation requires bounded text and supported publication states', () => {
  assert.deepEqual(validatePostInput({
    title: '  Platform update  ',
    content: '  New resources are available.  ',
    status: 'published',
  }, { creating: true }).value, {
    title: 'Platform update',
    content: 'New resources are available.',
    status: 'published',
  });

  assert.match(validatePostInput({ title: '', content: 'Post content' }, { creating: true }).error, /title/);
  assert.match(validatePostInput({ title: 'Post', content: 'Content', status: 'private' }).error, /status/);
  assert.match(validatePostInput({ title: 'Post', content: 'x'.repeat(10001) }, { creating: true }).error, /10,000/);
});
