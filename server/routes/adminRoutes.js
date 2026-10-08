// Purpose: Maps administrative URLs to their handlers.
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { dashboard, activityLogs } = require('../controllers/adminController');

const router = express.Router();
router.use(authMiddleware, adminMiddleware);
router.get('/dashboard', dashboard);
router.get('/activity-logs', activityLogs);

module.exports = router;
