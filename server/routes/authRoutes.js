// Purpose: Maps authentication URLs to their handlers.
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  register,
  login,
  activateAccount,
  verifyOtp,
  forgotPassword,
  resetPassword,
  logout,
} = require('../controllers/authController');
const { authRateLimit } = require('../middleware/rateLimitMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

const uploadDirectory = path.resolve(__dirname, '../uploads');
fs.mkdirSync(uploadDirectory, { recursive: true });

const profilePhotoUpload = multer({
  storage: multer.diskStorage({
    destination: (_request, _file, callback) => callback(null, uploadDirectory),
    filename: (_request, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      const safeName = `${Date.now()}-${Math.random().toString(16).slice(2)}${extension}`;
      callback(null, safeName);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    const allowed = ['image/jpeg', 'image/png'];
    if (!allowed.includes(file.mimetype)) {
      return callback(new Error('Profile photo must be a JPEG or PNG image.'));
    }
    return callback(null, true);
  },
});

const router = express.Router();

router.post('/login', authRateLimit, login);
router.post('/activate', authRateLimit, activateAccount);
router.post('/register/student', authRateLimit, profilePhotoUpload.single('profilePhoto'), (request, response, next) => {
  request.params.role = 'student';
  return register(request, response, next);
});
router.post('/register/lecturer', authRateLimit, profilePhotoUpload.single('profilePhoto'), (request, response, next) => {
  request.params.role = 'lecturer';
  return register(request, response, next);
});
router.post('/verify-otp', authRateLimit, verifyOtp);
router.post('/forgot-password', authRateLimit, forgotPassword);
router.post('/reset-password', authRateLimit, resetPassword);
router.post('/logout', authMiddleware, logout);

module.exports = router;
