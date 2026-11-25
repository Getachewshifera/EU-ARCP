// Purpose: Validates academic document bytes and manages Storage object keys.
const crypto = require('crypto');
const path = require('path');

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MIME_TYPES = new Map([
  ['.pdf', new Set(['application/pdf'])],
  ['.doc', new Set(['application/msword', 'application/vnd.ms-word'])],
  ['.docx', new Set(['application/vnd.openxmlformats-officedocument.wordprocessingml.document'])],
  ['.ppt', new Set(['application/vnd.ms-powerpoint', 'application/vnd.ms-powerpoint.presentation'])],
  ['.pptx', new Set(['application/vnd.openxmlformats-officedocument.presentationml.presentation'])],
]);
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;
const STORAGE_PATH_PATTERN = /^universities\/[a-f\d]{24}\/departments\/(?:[a-f\d]{24}|unassigned)\/users\/[a-f\d]{24}\/[a-f\d]{8}-[a-f\d]{4}-[1-8][a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}\.(?:pdf|doc|docx|ppt|pptx)$/i;

function getSafeFileName(originalName) {
  if (typeof originalName !== 'string' || /[\u0000-\u001f\u007f]/.test(originalName)) return '';
  const fileName = path.posix.basename(originalName.replace(/\\/g, '/')).trim();
  if (!fileName || fileName.length > 255 || fileName === '.' || fileName === '..') return '';
  return fileName;
}

function zipContainsRequiredEntries(buffer, requiredEntries) {
  const start = Math.max(0, buffer.length - 65557);
  let endRecord = -1;
  for (let offset = buffer.length - 22; offset >= start; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      endRecord = offset;
      break;
    }
  }
  if (endRecord < 0) return false;

  const entryCount = buffer.readUInt16LE(endRecord + 10);
  let offset = buffer.readUInt32LE(endRecord + 16);
  const entries = new Set();
  for (let index = 0; index < entryCount; index += 1) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== 0x02014b50) return false;
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const nameStart = offset + 46;
    const nameEnd = nameStart + nameLength;
    if (nameEnd > buffer.length) return false;
    entries.add(buffer.subarray(nameStart, nameEnd).toString('utf8'));
    offset = nameEnd + extraLength + commentLength;
    if (offset > buffer.length) return false;
  }
  return requiredEntries.every((entry) => entries.has(entry));
}

function validateMaterialFile(file) {
  const fileName = getSafeFileName(file?.originalname);
  if (!fileName) return { error: 'The file name is invalid.' };
  const extension = path.posix.extname(fileName).toLowerCase();
  const supportedMimes = MIME_TYPES.get(extension);
  if (!supportedMimes) return { error: 'Upload a PDF, DOC, DOCX, PPT, or PPTX file.' };
  if (!supportedMimes.has(file.mimetype)) return { error: 'The file type does not match its extension.' };
  if (!Buffer.isBuffer(file.buffer) || file.buffer.length === 0) return { error: 'The uploaded file is empty or invalid.' };
  if (file.buffer.length > MAX_FILE_SIZE) return { error: 'Files must be 20 MB or smaller.' };

  const signatureValid = extension === '.pdf'
    ? file.buffer.subarray(0, 5).toString('ascii') === '%PDF-'
    : extension === '.doc' || extension === '.ppt'
      ? file.buffer.length >= 8
        && file.buffer.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))
      : extension === '.docx'
        ? file.buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))
          && zipContainsRequiredEntries(file.buffer, ['[Content_Types].xml', 'word/document.xml'])
        : file.buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))
          && zipContainsRequiredEntries(file.buffer, ['[Content_Types].xml', 'ppt/presentation.xml']);

  if (!signatureValid) return { error: 'The uploaded file signature is invalid for the selected document type.' };
  return { value: { fileName, extension } };
}

function createMaterialStoragePath({ university, department, userId, extension }) {
  const universityId = String(university || '');
  const departmentId = department ? String(department) : 'unassigned';
  const uploaderId = String(userId || '');
  if (!OBJECT_ID_PATTERN.test(universityId) || !OBJECT_ID_PATTERN.test(uploaderId)
    || (department !== null && department !== undefined && !OBJECT_ID_PATTERN.test(departmentId))) {
    const error = new Error('Your academic profile is missing a valid university or department.');
    error.status = 400;
    throw error;
  }
  return `universities/${universityId}/departments/${departmentId}/users/${uploaderId}/${crypto.randomUUID()}${extension}`;
}

async function removeMaterialObject(storagePath) {
  if (typeof storagePath !== 'string' || !STORAGE_PATH_PATTERN.test(storagePath)) {
    const error = new Error('Stored material path is invalid.');
    error.status = 500;
    throw error;
  }
  const { getStorageConfig, getSupabaseClient } = require('../config/storage');
  const { bucket } = getStorageConfig();
  const { error } = await getSupabaseClient().storage.from(bucket).remove([storagePath]);
  if (error) {
    const storageError = new Error('Unable to remove the stored material file.');
    storageError.status = 502;
    throw storageError;
  }
}

module.exports = {
  MAX_FILE_SIZE,
  MIME_TYPES,
  createMaterialStoragePath,
  getSafeFileName,
  STORAGE_PATH_PATTERN,
  removeMaterialObject,
  validateMaterialFile,
};
