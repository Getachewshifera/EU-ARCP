// Purpose: Handles authenticated direct-message conversations.
const mongoose = require('mongoose');
const User = require('../models/User');
const PrivateMessage = require('../models/PrivateMessage');

function conversationKey(firstId, secondId) {
  return [String(firstId), String(secondId)].sort().join(':');
}

async function listConversations(request, response, next) {
  try {
    const userId = request.user._id;
    const messages = await PrivateMessage.find({ $or: [{ sender: userId }, { recipient: userId }] })
      .populate('sender', 'name email role')
      .populate('recipient', 'name email role')
      .sort({ createdAt: -1 })
      .limit(1000)
      .lean();
    const latestByConversation = new Map();
    for (const message of messages) {
      const key = message.conversationId;
      if (!latestByConversation.has(key)) {
        const otherUser = String(message.sender._id) === String(userId) ? message.recipient : message.sender;
        latestByConversation.set(key, {
          id: key,
          _id: key,
          participant: otherUser,
          otherUser,
          lastMessage: message.body,
          updatedAt: message.createdAt,
          unreadCount: 0,
        });
      }
      const conversation = latestByConversation.get(key);
      if (String(message.recipient._id) === String(userId) && !message.readAt) conversation.unreadCount += 1;
    }
    return response.json({ items: [...latestByConversation.values()] });
  } catch (error) {
    return next(error);
  }
}

async function startConversation(request, response, next) {
  const recipientId = request.body?.recipientId || request.body?.userId;
  const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : '';
  if (!recipientId && !email) return response.status(400).json({ message: 'A recipient id or email is required.' });
  try {
    const filter = recipientId && mongoose.isValidObjectId(recipientId)
      ? { _id: recipientId }
      : email ? { email } : null;
    if (!filter) return response.status(400).json({ message: 'Recipient id is invalid.' });
    const recipient = await User.findOne({ ...filter, status: 'active', isActive: true }).select('_id name email role');
    if (!recipient) return response.status(404).json({ message: 'Recipient was not found.' });
    if (String(recipient._id) === String(request.user._id)) {
      return response.status(400).json({ message: 'You cannot start a conversation with yourself.' });
    }
    const id = conversationKey(request.user._id, recipient._id);
    return response.status(201).json({
      item: { id, _id: id, participant: recipient, otherUser: recipient, lastMessage: '' },
    });
  } catch (error) {
    return next(error);
  }
}

async function ensureParticipant(request, response) {
  const id = request.params.conversationId;
  const parts = id.split(':');
  if (parts.length !== 2 || !parts.every((part) => mongoose.isValidObjectId(part))
    || !parts.includes(String(request.user._id))) {
    response.status(404).json({ message: 'Conversation was not found.' });
    return false;
  }
  const recipientId = parts.find((part) => part !== String(request.user._id));
  const recipient = await User.findById(recipientId).select('_id name email role');
  if (!recipient) {
    response.status(404).json({ message: 'Conversation was not found.' });
    return false;
  }
  request.conversationRecipient = recipient;
  return true;
}

async function listMessages(request, response, next) {
  try {
    if (!(await ensureParticipant(request, response))) return;
    const items = await PrivateMessage.find({ conversationId: request.params.conversationId })
      .populate('sender', 'name email role')
      .populate('recipient', 'name email role')
      .sort({ createdAt: 1 })
      .limit(500)
      .lean();
    await PrivateMessage.updateMany({
      conversationId: request.params.conversationId,
      recipient: request.user._id,
      readAt: null,
    }, { $set: { readAt: new Date() } });
    return response.json({ items });
  } catch (error) {
    return next(error);
  }
}

async function sendMessage(request, response, next) {
  const body = request.body?.body ?? request.body?.message ?? request.body?.content;
  if (typeof body !== 'string' || !body.trim() || body.length > 5000) {
    return response.status(400).json({ message: 'Message must contain 1 to 5000 characters.' });
  }
  try {
    if (!(await ensureParticipant(request, response))) return;
    const item = await PrivateMessage.create({
      conversationId: request.params.conversationId,
      sender: request.user._id,
      recipient: request.conversationRecipient._id,
      body: body.trim(),
    });
    await item.populate('sender recipient', 'name email role');
    return response.status(201).json({ item: { ...item.toObject(), content: item.body } });
  } catch (error) {
    return next(error);
  }
}

module.exports = { listConversations, startConversation, listMessages, sendMessage };
