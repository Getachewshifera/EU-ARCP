// Purpose: Stores private chat files and creates short-lived download links.
const crypto = require('crypto');
const path = require('path');
const { getStorageConfig, getSupabaseClient } = require('../config/storage');
const { MAX_FILE_SIZE, getSafeFileName, validateMaterialFile } = require('./fileService');

const CHAT_ATTACHMENT_PATH = /^chats\/messages\/[a-f\d]{24}\/[a-f\d-]{36}\.(?:pdf|doc|docx|ppt|pptx)$/i;
const GROUP_IMAGE_PATH = /^chats\/groups\/[a-f\d]{24}\/[a-f\d-]{36}\.(?:jpg|jpeg|png|webp)$/i;
const GROUP_CHAT_ATTACHMENT_PATH = /^chats\/groups\/[a-f\d]{24}\/messages\/[a-f\d-]{36}\.(?:pdf|doc|docx|ppt|pptx|jpg|jpeg|png|webp)$/i;

function validateGroupImage(file) {
  const extension = path.extname(file?.originalname || '').toLowerCase();
  const expectedType = new Map([
    ['.jpg', 'image/jpeg'],
    ['.jpeg', 'image/jpeg'],
    ['.png', 'image/png'],
    ['.webp', 'image/webp'],
  ]).get(extension);
  if (!file || !expectedType || file.mimetype !== expectedType || !Buffer.isBuffer(file.buffer) || !file.buffer.length) {
    return { error: 'Upload a valid JPEG, PNG, or WebP group image.' };
  }
  const validSignature = extension === '.jpg' || extension === '.jpeg'
    ? file.buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
    : extension === '.png'
      ? file.buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
      : file.buffer.length >= 12
        && file.buffer.toString('ascii', 0, 4) === 'RIFF'
        && file.buffer.toString('ascii', 8, 12) === 'WEBP';
  return validSignature ? { value: { extension } } : { error: 'The group image signature is invalid.' };
}

function validateGroupChatAttachment(file) {
  const fileName = getSafeFileName(file?.originalname);
  if (!fileName) return { error: 'The file name is invalid.' };
  const extension = path.extname(fileName).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp'].includes(extension)) {
    if (file.buffer?.length > MAX_FILE_SIZE) return { error: 'Files must be 20 MB or smaller.' };
    const validation = validateGroupImage(file);
    return validation.error ? validation : { value: { fileName, extension } };
  }
  return validateMaterialFile(file);
}

async function uploadToStorage(storagePath, file) {
  const { bucket } = getStorageConfig();
  const { error } = await getSupabaseClient().storage.from(bucket).upload(storagePath, file.buffer, {
    contentType: file.mimetype,
    upsert: false,
  });
  if (error) {
    const uploadError = new Error('Unable to store the chat file.');
    uploadError.status = 502;
    throw uploadError;
  }
  return storagePath;
}

async function uploadChatAttachment(file, userId) {
  const validation = validateMaterialFile(file);
  if (validation.error) {
    const error = new Error(validation.error);
    error.status = 400;
    throw error;
  }
  const storagePath = `chats/messages/${userId}/${crypto.randomUUID()}${validation.value.extension}`;
  await uploadToStorage(storagePath, file);
  return {
    name: validation.value.fileName,
    storagePath,
    mimeType: file.mimetype,
    size: file.buffer.length,
  };
}

async function uploadGroupImage(file, groupId) {
  const validation = validateGroupImage(file);
  if (validation.error) {
    const error = new Error(validation.error);
    error.status = 400;
    throw error;
  }
  const storagePath = `chats/groups/${groupId}/${crypto.randomUUID()}${validation.value.extension}`;
  await uploadToStorage(storagePath, file);
  return storagePath;
}

async function uploadGroupChatAttachment(file, groupId) {
  const validation = validateGroupChatAttachment(file);
  if (validation.error) {
    const error = new Error(validation.error);
    error.status = 400;
    throw error;
  }
  if (!/^[a-f\d]{24}$/i.test(String(groupId || ''))) {
    const error = new Error('Group id is invalid.');
    error.status = 400;
    throw error;
  }
  const storagePath = `chats/groups/${groupId}/messages/${crypto.randomUUID()}${validation.value.extension}`;
  await uploadToStorage(storagePath, file);
  return {
    name: validation.value.fileName,
    storagePath,
    mimeType: file.mimetype,
    size: file.buffer.length,
  };
}

async function getSignedChatUrl(storagePath) {
  if (typeof storagePath !== 'string'
    || (!CHAT_ATTACHMENT_PATH.test(storagePath)
      && !GROUP_IMAGE_PATH.test(storagePath)
      && !GROUP_CHAT_ATTACHMENT_PATH.test(storagePath))) {
    const error = new Error('Stored chat file path is invalid.');
    error.status = 500;
    throw error;
  }
  const { bucket } = getStorageConfig();
  const { data, error } = await getSupabaseClient().storage.from(bucket).createSignedUrl(storagePath, 60);
  if (error || !data?.signedUrl) {
    const signingError = new Error('Unable to create a secure chat file link.');
    signingError.status = 502;
    throw signingError;
  }
  return data.signedUrl;
}

async function removeChatFile(storagePath) {
  if (typeof storagePath !== 'string'
    || (!CHAT_ATTACHMENT_PATH.test(storagePath)
      && !GROUP_IMAGE_PATH.test(storagePath)
      && !GROUP_CHAT_ATTACHMENT_PATH.test(storagePath))) {
    const error = new Error('Stored chat file path is invalid.');
    error.status = 500;
    throw error;
  }
  const { bucket } = getStorageConfig();
  const { error } = await getSupabaseClient().storage.from(bucket).remove([storagePath]);
  if (error) {
    const removeError = new Error('Unable to remove the chat file.');
    removeError.status = 502;
    throw removeError;
  }
}

module.exports = {
  getSignedChatUrl,
  removeChatFile,
  uploadChatAttachment,
  uploadGroupChatAttachment,
  uploadGroupImage,
  validateGroupChatAttachment,
};
