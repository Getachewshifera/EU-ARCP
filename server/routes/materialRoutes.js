// Purpose: Maps material URLs to their handlers.
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const optionalAuthMiddleware = require('../middleware/optionalAuthMiddleware');
const { uploadMaterial } = require('../middleware/uploadMiddleware');
const { materialUploadRateLimit } = require('../middleware/rateLimitMiddleware');
const controller = require('../controllers/materialController');

const router = express.Router();
router.get('/', optionalAuthMiddleware, controller.list);
router.get('/mine', authMiddleware, controller.mine);
router.post('/', authMiddleware, materialUploadRateLimit, uploadMaterial.single('file'), controller.upload);
router.get('/:id/download', authMiddleware, controller.download);
router.get('/:id/file', authMiddleware, controller.downloadLegacyFile);
router.get('/:id', optionalAuthMiddleware, controller.get);
router.patch('/:id', authMiddleware, controller.update);
router.delete('/:id', authMiddleware, controller.remove);

module.exports = router;
