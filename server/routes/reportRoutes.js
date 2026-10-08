// Purpose: Maps report URLs to their handlers.
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const controller = require('../controllers/reportController');

const router = express.Router();
router.use(authMiddleware);
router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.get);
router.patch('/:id', adminMiddleware, controller.update);

module.exports = router;
