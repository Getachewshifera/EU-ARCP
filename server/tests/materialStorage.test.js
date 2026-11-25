const assert = require('node:assert/strict');
const test = require('node:test');
const {
  MAX_FILE_SIZE,
  createMaterialStoragePath,
  getSafeFileName,
  validateMaterialFile,
} = require('../services/fileService');

function makeZip(entries) {
  const names = entries.map((entry) => Buffer.from(entry));
  const directorySize = names.reduce((size, name) => size + 46 + name.length, 0);
  const buffer = Buffer.alloc(4 + directorySize + 22);
  buffer.set([0x50, 0x4b, 0x03, 0x04], 0);
  let offset = 4;
  for (const name of names) {
    buffer.writeUInt32LE(0x02014b50, offset);
    buffer.writeUInt16LE(name.length, offset + 28);
    name.copy(buffer, offset + 46);
    offset += 46 + name.length;
  }
  buffer.writeUInt32LE(0x06054b50, offset);
  buffer.writeUInt16LE(names.length, offset + 10);
  buffer.writeUInt32LE(4, offset + 16);
  return buffer;
}

test('validates document extension, MIME type, and file signature', () => {
  assert.deepEqual(validateMaterialFile({
    originalname: 'notes.PDF',
    mimetype: 'application/pdf',
    buffer: Buffer.from('%PDF-1.7 document'),
  }).value, { fileName: 'notes.PDF', extension: '.pdf' });

  assert.match(validateMaterialFile({
    originalname: 'notes.pdf',
    mimetype: 'application/pdf',
    buffer: Buffer.from('not a PDF'),
  }).error, /signature/i);
  assert.match(validateMaterialFile({
    originalname: 'notes.pdf',
    mimetype: 'text/plain',
    buffer: Buffer.from('%PDF-1.7 document'),
  }).error, /extension/i);
});

test('validates OOXML archives contain their expected document parts', () => {
  const docx = validateMaterialFile({
    originalname: 'notes.docx',
    mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: makeZip(['[Content_Types].xml', 'word/document.xml']),
  });
  assert.equal(docx.error, undefined);

  const disguisedArchive = validateMaterialFile({
    originalname: 'notes.docx',
    mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: makeZip(['[Content_Types].xml', 'ppt/presentation.xml']),
  });
  assert.match(disguisedArchive.error, /signature/i);
});

test('normalizes unsafe original names and builds isolated UUID object paths', () => {
  assert.equal(getSafeFileName('../../notes.pdf'), 'notes.pdf');
  assert.equal(getSafeFileName('..\\..\\notes.pdf'), 'notes.pdf');

  const first = createMaterialStoragePath({
    university: '507f1f77bcf86cd799439011',
    department: '507f1f77bcf86cd799439012',
    userId: '507f1f77bcf86cd799439013',
    extension: '.pdf',
  });
  const second = createMaterialStoragePath({
    university: '507f1f77bcf86cd799439011',
    department: '507f1f77bcf86cd799439012',
    userId: '507f1f77bcf86cd799439013',
    extension: '.pdf',
  });
  assert.match(first, /^universities\/507f1f77bcf86cd799439011\/departments\/507f1f77bcf86cd799439012\/users\/507f1f77bcf86cd799439013\/[0-9a-f-]+\.pdf$/i);
  assert.notEqual(first, second);
  assert.throws(() => createMaterialStoragePath({
    university: '../../other',
    department: null,
    userId: '507f1f77bcf86cd799439013',
    extension: '.pdf',
  }), /valid university or department/i);
});

test('uses the 20 MB upload cap', () => {
  const buffer = Buffer.alloc(MAX_FILE_SIZE + 1);
  buffer.write('%PDF-');
  assert.match(validateMaterialFile({
    originalname: 'oversized.pdf',
    mimetype: 'application/pdf',
    buffer,
  }).error, /20 MB/i);
});
