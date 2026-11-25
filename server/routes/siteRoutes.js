// Purpose: Public site appearance read and admin-only updates.
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const controller = require('../controllers/siteController');

const router = express.Router();
router.get('/appearance', controller.getAppearance);
router.put('/appearance', authMiddleware, adminMiddleware, controller.updateAppearance);
router.get('/maintenance', controller.getMaintenance);
router.put('/maintenance', authMiddleware, adminMiddleware, controller.updateMaintenance);

module.exports = router;
