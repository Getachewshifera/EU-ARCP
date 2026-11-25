// Purpose: Parses and constrains uploaded files.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { MIME_TYPES: materialTypes } = require('../services/fileService');

const uploadDirectory = path.resolve(__dirname, '../uploads');
const avatarDirectory = path.resolve(__dirname, '../uploads/avatars');
const postImageDirectory = path.resolve(__dirname, '../uploads/posts');
fs.mkdirSync(uploadDirectory, { recursive: true });
fs.mkdirSync(avatarDirectory, { recursive: true });
fs.mkdirSync(postImageDirectory, { recursive: true });

const uploadMaterial = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
  fileFilter: (_request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!materialTypes.get(extension)?.has(file.mimetype)) {
      const error = new Error('Unsupported file type. Upload a PDF, DOC, DOCX, PPT, or PPTX file.');
      error.status = 400;
      return callback(error);
    }
    return callback(null, true);
  },
});

const avatarStorage = multer.diskStorage({
  destination: (_request, _file, callback) => callback(null, avatarDirectory),
  filename: (_request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${crypto.randomUUID()}${extension}`);
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_request, file, callback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = new Set(['.jpg', '.jpeg', '.png', '.webp']);
    if (!allowed.has(ext)) {
      const error = new Error('Only JPEG, PNG, or WebP images are allowed for profile photos.');
      error.status = 400;
      return callback(error);
    }
    return callback(null, true);
  },
});

const postImageStorage = multer.diskStorage({
  destination: (_request, _file, callback) => callback(null, postImageDirectory),
  filename: (_request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${crypto.randomUUID()}${extension}`);
  },
});

const postImageTypes = new Map([
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.webp', 'image/webp'],
]);

const uploadPostImage = multer({
  storage: postImageStorage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (postImageTypes.get(extension) !== file.mimetype) {
      const error = new Error('Post images must be JPEG, PNG, or WebP files.');
      error.status = 400;
      return callback(error);
    }
    return callback(null, true);
  },
});

module.exports = {
  uploadMaterial,
  uploadAvatar,
  uploadPostImage,
  uploadDirectory,
  avatarDirectory,
  postImageDirectory,
};

