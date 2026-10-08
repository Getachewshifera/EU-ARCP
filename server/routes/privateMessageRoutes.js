// Purpose: Maps private-message URLs to their handlers.
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const controller = require('../controllers/privateMessageController');

const router = express.Router();
router.use(authMiddleware);
router.get('/conversations', controller.listConversations);
router.post('/conversations', controller.startConversation);
router.get('/conversations/:conversationId', controller.listMessages);
router.post('/conversations/:conversationId', controller.sendMessage);

module.exports = router;
