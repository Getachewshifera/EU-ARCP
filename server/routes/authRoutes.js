// Purpose: Maps authentication URLs to their handlers.
const express = require('express');
const {
  register,
  login,
  verifyOtp,
  forgotPassword,
  resetPassword,
  logout,
} = require('../controllers/authController');
const { authRateLimit } = require('../middleware/rateLimitMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', authRateLimit, login);
router.post('/register/student', authRateLimit, (request, response, next) => {
  request.params.role = 'student';
  return register(request, response, next);
});
router.post('/register/lecturer', authRateLimit, (request, response, next) => {
  request.params.role = 'lecturer';
  return register(request, response, next);
});
router.post('/verify-otp', authRateLimit, verifyOtp);
router.post('/forgot-password', authRateLimit, forgotPassword);
router.post('/reset-password', authRateLimit, resetPassword);
router.post('/logout', authMiddleware, logout);

module.exports = router;
