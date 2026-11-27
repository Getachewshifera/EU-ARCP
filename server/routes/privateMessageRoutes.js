// Purpose: Maps private-message URLs to their handlers.
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const controller = require('../controllers/privateMessageController');
const chatEnabledMiddleware = require('../middleware/chatEnabledMiddleware');
const { chatMessageRateLimit } = require('../middleware/rateLimitMiddleware');
const { uploadChatAttachment } = require('../middleware/uploadMiddleware');

const router = express.Router();
router.use(authMiddleware, chatEnabledMiddleware);
router.get('/users', controller.searchUsers);
router.get('/conversations', controller.listConversations);
router.post('/conversations', controller.startConversation);
router.get('/conversations/:conversationId/attachments/:messageId/:attachmentIndex', controller.getMessageAttachment);
router.get('/conversations/:conversationId', controller.listMessages);
router.post('/conversations/:conversationId', chatMessageRateLimit, uploadChatAttachment.single('attachment'), controller.sendMessage);
router.patch('/conversations/:conversationId/preferences', controller.updateConversationPin);
router.patch('/conversations/:conversationId/block', controller.updateConversationBlock);
router.patch('/conversations/:conversationId/:messageId/reactions', controller.reactToMessage);
router.delete('/conversations/:conversationId', controller.deleteConversation);
router.delete('/conversations/:conversationId/:messageId', controller.deleteMessage);

module.exports = router;
