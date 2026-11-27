// Purpose: Maps group URLs to their handlers.
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const requireRoles = require('../middleware/roleMiddleware');
const controller = require('../controllers/groupController');
const chatEnabledMiddleware = require('../middleware/chatEnabledMiddleware');
const { chatMessageRateLimit } = require('../middleware/rateLimitMiddleware');
const { uploadGroupChatAttachment, uploadGroupImage } = require('../middleware/uploadMiddleware');

const router = express.Router();
router.use(authMiddleware, chatEnabledMiddleware);
router.get('/', controller.list);
router.post('/', requireRoles('student', 'lecturer', 'admin'), controller.create);
router.post('/:id/members/invite', controller.inviteMember);
router.delete('/:id/members/:userId', controller.removeMember);
router.patch('/:id/admins', controller.updateAdmin);
router.get('/:id/members', controller.members);
router.post('/:id/members', controller.join);
router.delete('/:id/members/me', controller.leave);
router.get('/:id/messages/:messageId/attachments/:attachmentIndex', controller.getMessageAttachment);
router.get('/:id/messages', controller.listMessages);
router.post('/:id/messages', chatMessageRateLimit, uploadGroupChatAttachment.single('attachment'), controller.sendMessage);
router.patch('/:id/messages/:messageId/reactions', controller.reactToMessage);
router.delete('/:id/messages/:messageId', controller.deleteMessage);
router.patch('/:id/image', uploadGroupImage.single('image'), controller.uploadImage);
router.get('/:id', controller.get);
router.patch('/:id', controller.update);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
