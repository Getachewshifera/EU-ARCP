// Purpose: Parses and constrains uploaded files.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDirectory = path.resolve(__dirname, '../uploads');
const avatarDirectory = path.resolve(__dirname, '../uploads/avatars');
fs.mkdirSync(uploadDirectory, { recursive: true });
fs.mkdirSync(avatarDirectory, { recursive: true });

const allowedTypes = new Map([
  ['.pdf', 'application/pdf'],
  ['.doc', 'application/msword'],
  ['.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ['.ppt', 'application/vnd.ms-powerpoint'],
  ['.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  ['.xls', 'application/vnd.ms-excel'],
  ['.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  ['.txt', 'text/plain'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
]);

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => callback(null, uploadDirectory),
  filename: (_request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${crypto.randomUUID()}${extension}`);
  },
});

const uploadMaterial = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
  fileFilter: (_request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.get(extension) !== file.mimetype) {
      const error = new Error('Unsupported file type. Upload a PDF, office document, text file, or JPEG/PNG image.');
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

module.exports = { uploadMaterial, uploadAvatar, uploadDirectory, avatarDirectory };

