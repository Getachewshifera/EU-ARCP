const express = require('express');
const { contactRateLimit } = require('../middleware/rateLimitMiddleware');
const controller = require('../controllers/contactController');

const router = express.Router();
router.post('/', contactRateLimit, controller.create);

module.exports = router;