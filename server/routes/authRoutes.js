// Purpose: Maps authentication URLs to their handlers.
const express = require('express');
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
const { uploadAvatar } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post('/login', authRateLimit, login);
router.post('/activate', authRateLimit, activateAccount);
router.post('/register/student', authRateLimit, uploadAvatar.single('profilePhoto'), (request, response, next) => {
  request.params.role = 'student';
  return register(request, response, next);
});
router.post('/register/lecturer', authRateLimit, uploadAvatar.single('profilePhoto'), (request, response, next) => {
  request.params.role = 'lecturer';
  return register(request, response, next);
});
router.post('/verify-otp', authRateLimit, verifyOtp);
router.post('/forgot-password', authRateLimit, forgotPassword);
router.post('/reset-password', authRateLimit, resetPassword);
router.post('/logout', authMiddleware, logout);

module.exports = router;
