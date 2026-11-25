// Purpose: Exposes published posts publicly and restricts post management to admins.
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { uploadPostImage } = require('../middleware/uploadMiddleware');
const controller = require('../controllers/postController');

const router = express.Router();
router.get('/admin/:id/image', authMiddleware, adminMiddleware, controller.adminImage);
router.get('/admin', authMiddleware, adminMiddleware, controller.listAdmin);
router.get('/:id/image', controller.image);
router.get('/', controller.listPublished);
router.post('/', authMiddleware, adminMiddleware, uploadPostImage.single('image'), controller.create);
router.put('/:id', authMiddleware, adminMiddleware, uploadPostImage.single('image'), controller.update);
router.delete('/:id', authMiddleware, adminMiddleware, controller.remove);

module.exports = router;
