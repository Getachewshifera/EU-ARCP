// Purpose: Maps group URLs to their handlers.
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const requireRoles = require('../middleware/roleMiddleware');
const controller = require('../controllers/groupController');

const router = express.Router();
router.use(authMiddleware);
router.get('/', controller.list);
router.post('/', requireRoles('lecturer', 'admin'), controller.create);
router.get('/:id/members', controller.members);
router.post('/:id/members', controller.join);
router.delete('/:id/members/me', controller.leave);
router.get('/:id/messages', controller.listMessages);
router.post('/:id/messages', controller.sendMessage);
router.get('/:id', controller.get);
router.patch('/:id', controller.update);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
