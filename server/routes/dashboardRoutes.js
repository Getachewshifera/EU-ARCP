// Purpose: Provides authenticated student and lecturer dashboard APIs.
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const requireRoles = require('../middleware/roleMiddleware');
const { studentDashboard, lecturerDashboard } = require('../controllers/dashboardController');

const router = express.Router();
router.get('/student/dashboard', authMiddleware, requireRoles('student', 'admin'), studentDashboard);
router.get('/lecturer/dashboard', authMiddleware, requireRoles('lecturer', 'admin'), lecturerDashboard);

module.exports = router;
