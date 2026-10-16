// Purpose: Maps user/profile URLs to their handlers.
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { uploadAvatar } = require('../middleware/uploadMiddleware');
const {
  listUsers,
  updateUser,
  deleteUser,
  getCurrentUser,
  updateCurrentUser,
  changePassword,
  uploadProfilePhoto,
} = require('../controllers/userController');

const router = express.Router();

router.use(authMiddleware);
router.get('/me', getCurrentUser);
router.patch('/me', updateCurrentUser);
router.patch('/me/password', changePassword);
router.patch('/me/photo', uploadAvatar.single('photo'), uploadProfilePhoto);
router.get('/', adminMiddleware, listUsers);
router.patch('/:id', adminMiddleware, updateUser);
router.delete('/:id', adminMiddleware, deleteUser);

module.exports = router;

