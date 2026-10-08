// Purpose: Maps registration request URLs to their handlers.
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { list, getStatus, review } = require('../controllers/registrationController');

const router = express.Router();
router.get('/status', getStatus);
router.get('/', authMiddleware, adminMiddleware, list);
router.patch('/:id', authMiddleware, adminMiddleware, review);

module.exports = router;
