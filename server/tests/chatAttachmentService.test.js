const assert = require('node:assert/strict');
const test = require('node:test');
const { validateGroupChatAttachment } = require('../services/chatAttachmentService');

test('group chat accepts image attachments with matching signatures', () => {
  const result = validateGroupChatAttachment({
    originalname: 'campus.png',
    mimetype: 'image/png',
    buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  });

  assert.deepEqual(result.value, { fileName: 'campus.png', extension: '.png' });
});

test('group chat rejects image attachments with a mismatched type or signature', () => {
  assert.match(validateGroupChatAttachment({
    originalname: 'campus.png',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('not an image'),
  }).error, /valid JPEG, PNG, or WebP/i);

  assert.match(validateGroupChatAttachment({
    originalname: 'campus.png',
    mimetype: 'image/png',
    buffer: Buffer.from('not an image'),
  }).error, /image signature/i);
});
