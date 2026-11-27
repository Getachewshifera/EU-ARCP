// Purpose: Handles authenticated direct-message conversations.
const mongoose = require('mongoose');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const PrivateMessage = require('../models/PrivateMessage');
const { getSignedChatUrl, removeChatFile, uploadChatAttachment } = require('../services/chatAttachmentService');
const { emitToConversation, emitToUser } = require('../sockets/socket');

const USER_SUMMARY = 'name firstName middleName lastName username email role profilePhoto university department';
const ALLOWED_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '👏'];

function conversationKey(firstId, secondId) {
  return [String(firstId), String(secondId)].sort().join(':');
}

function safeMessage(message) {
  const record = message.toObject ? message.toObject() : { ...message };
  record.content = record.body;
  delete record.hiddenFor;
  record.attachments = (record.attachments || []).map(({ _id, name, mimeType, size }) => ({
    _id,
    name,
    mimeType,
    size,
  }));
  return record;
}

async function searchUsers(request, response, next) {
  const search = typeof request.query.search === 'string'
    ? request.query.search.trim().slice(0, 100)
    : '';
  if (!search) return response.json({ items: [] });

  try {
    const expression = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const items = await User.find({
      _id: { $ne: request.user._id },
      role: { $in: ['student', 'lecturer'] },
      status: 'ACTIVE',
      isActive: { $ne: false },
      $or: [
        { name: expression },
        { firstName: expression },
        { middleName: expression },
        { lastName: expression },
        { username: expression },
        { email: expression },
      ],
    })
      .select(USER_SUMMARY)
      .populate('university', 'name')
      .populate('department', 'name')
      .sort({ name: 1 })
      .limit(25)
      .lean();
    return response.json({ items });
  } catch (error) {
    return next(error);
  }
}

async function listConversations(request, response, next) {
  try {
    const userId = request.user._id;
    const [conversations, messages, unreadCounts] = await Promise.all([
      Conversation.find({ participants: userId })
        .populate('participants', USER_SUMMARY)
        .sort({ lastMessageAt: -1, updatedAt: -1 })
        .limit(100)
        .lean(),
      PrivateMessage.find({
        $or: [{ sender: userId }, { recipient: userId }],
        hiddenFor: { $ne: userId },
      })
        .populate('sender', USER_SUMMARY)
        .populate('recipient', USER_SUMMARY)
        .sort({ createdAt: -1, _id: -1 })
        .limit(2000)
        .lean(),
      PrivateMessage.aggregate([
        { $match: { recipient: userId, readAt: null, deletedAt: null, hiddenFor: { $ne: userId } } },
        { $group: { _id: '$conversationId', count: { $sum: 1 } } },
      ]),
    ]);
    const latestByConversation = new Map();
    for (const message of messages) {
      if (!latestByConversation.has(message.conversationId)) {
        latestByConversation.set(message.conversationId, message);
      }
    }
    const unreadByConversation = new Map(unreadCounts.map(({ _id, count }) => [_id, count]));
    const conversationById = new Map(conversations.map((conversation) => [conversation.conversationId, conversation]));
    for (const [conversationId, latestMessage] of latestByConversation) {
      if (!conversationById.has(conversationId)) {
        const participants = [latestMessage.sender, latestMessage.recipient];
        conversationById.set(conversationId, {
          conversationId,
          participants,
          createdAt: latestMessage.createdAt,
          lastMessageAt: latestMessage.createdAt,
        });
      }
    }
    const items = [...conversationById.values()].filter((conversation) => (
      !(conversation.hiddenFor || []).some((hiddenUserId) => String(hiddenUserId) === String(userId))
    )).map((conversation) => {
      const participant = conversation.participants.find((user) => String(user._id) !== String(userId));
      const lastMessage = latestByConversation.get(conversation.conversationId);
      const blockedBy = conversation.blockedBy || [];
      return {
        id: conversation.conversationId,
        _id: conversation.conversationId,
        participant,
        otherUser: participant,
        lastMessage: lastMessage?.body || lastMessage?.attachments?.[0]?.name || '',
        updatedAt: conversation.lastMessageAt || conversation.createdAt,
        unreadCount: unreadByConversation.get(conversation.conversationId) || 0,
        pinned: (conversation.pinnedBy || []).some((pinnedUserId) => String(pinnedUserId) === String(userId)),
        blocked: blockedBy.length > 0,
        blockedByMe: blockedBy.some((blockedUserId) => String(blockedUserId) === String(userId)),
      };
    }).sort((first, second) => Number(second.pinned) - Number(first.pinned)
      || new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime()).slice(0, 100);
    return response.json({ items });
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
    const recipient = await User.findOne({
      ...filter,
      status: 'ACTIVE',
      isActive: { $ne: false },
      role: { $in: ['student', 'lecturer', 'admin'] },
    }).select(USER_SUMMARY);
    if (!recipient) return response.status(404).json({ message: 'Recipient was not found.' });
    if (String(recipient._id) === String(request.user._id)) {
      return response.status(400).json({ message: 'You cannot start a conversation with yourself.' });
    }

    const id = conversationKey(request.user._id, recipient._id);
    const participantIds = [request.user._id, recipient._id]
      .sort((first, second) => String(first).localeCompare(String(second)));
    let conversation;
    try {
      conversation = await Conversation.findOneAndUpdate(
        { conversationId: id },
        {
          $setOnInsert: { conversationId: id, participants: participantIds, createdBy: request.user._id },
          $pull: { hiddenFor: request.user._id },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ).populate('participants', USER_SUMMARY);
    } catch (error) {
      if (error.code !== 11000) throw error;
      conversation = await Conversation.findOne({ conversationId: id }).populate('participants', USER_SUMMARY);
    }
    const participant = conversation.participants.find((user) => String(user._id) !== String(request.user._id));
    const blockedBy = conversation.blockedBy || [];
    return response.status(201).json({
      item: {
        id,
        _id: id,
        participant,
        otherUser: participant,
        lastMessage: '',
        updatedAt: conversation.updatedAt,
        pinned: (conversation.pinnedBy || []).some((userId) => String(userId) === String(request.user._id)),
        blocked: blockedBy.length > 0,
        blockedByMe: blockedBy.some((userId) => String(userId) === String(request.user._id)),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function ensureParticipant(request, response) {
  const id = request.params.conversationId;
  const parts = typeof id === 'string' ? id.split(':') : [];
  if (parts.length !== 2 || !parts.every((part) => mongoose.isValidObjectId(part))
    || !parts.includes(String(request.user._id))) {
    response.status(404).json({ message: 'Conversation was not found.' });
    return false;
  }
  const recipientId = parts.find((part) => part !== String(request.user._id));
  if (conversationKey(request.user._id, recipientId) !== id) {
    response.status(404).json({ message: 'Conversation was not found.' });
    return false;
  }

  let conversation = await Conversation.findOne({
    conversationId: id,
    participants: request.user._id,
  });
  if (!conversation) {
    const legacyMessage = await PrivateMessage.exists({
      conversationId: id,
      $or: [{ sender: request.user._id }, { recipient: request.user._id }],
    });
    if (!legacyMessage) {
      response.status(404).json({ message: 'Conversation was not found.' });
      return false;
    }
    conversation = await Conversation.findOneAndUpdate(
      { conversationId: id },
      {
        $setOnInsert: {
          conversationId: id,
          participants: parts,
          createdBy: request.user._id,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  const recipient = await User.findOne({
    _id: recipientId,
    status: 'ACTIVE',
    isActive: { $ne: false },
  }).select(USER_SUMMARY).populate('university department', 'name');
  if (!recipient) {
    response.status(404).json({ message: 'Conversation was not found.' });
    return false;
  }
  request.conversation = conversation;
  request.conversationRecipient = recipient;
  return true;
}

function pageSize(value) {
  const parsed = Number.parseInt(value, 10);
  return Math.min(100, Math.max(1, Number.isNaN(parsed) ? 50 : parsed));
}

async function listMessages(request, response, next) {
  try {
    if (!(await ensureParticipant(request, response))) return;
    const filter = {
      conversationId: request.params.conversationId,
      hiddenFor: { $ne: request.user._id },
    };
    if (request.query.beforeId) {
      if (!mongoose.isValidObjectId(request.query.beforeId)) {
        return response.status(400).json({ message: 'Message cursor is invalid.' });
      }
      filter._id = { $lt: request.query.beforeId };
    }
    const limit = pageSize(request.query.limit);
    const records = await PrivateMessage.find(filter)
      .populate('sender', USER_SUMMARY)
      .populate('recipient', USER_SUMMARY)
      .populate({
        path: 'replyTo',
        match: { hiddenFor: { $ne: request.user._id } },
        select: 'body sender createdAt deletedAt',
        populate: { path: 'sender', select: 'name firstName lastName profilePhoto' },
      })
      .populate({ path: 'reactions.user', select: 'name firstName lastName' })
      .sort({ _id: -1 })
      .limit(limit + 1);
    const hasMore = records.length > limit;
    const messages = records.slice(0, limit).reverse();
    const unreadIds = messages
      .filter((message) => String(message.recipient?._id ?? message.recipient) === String(request.user._id)
        && !message.readAt && !message.deletedAt)
      .map((message) => message._id);
    if (unreadIds.length) {
      const readAt = new Date();
      await PrivateMessage.updateMany(
        { _id: { $in: unreadIds }, deliveredAt: null },
        { $set: { deliveredAt: readAt } },
      );
      await PrivateMessage.updateMany({ _id: { $in: unreadIds }, readAt: null }, { $set: { readAt } });
      const senderIds = [...new Set(messages
        .filter((message) => unreadIds.some((id) => String(id) === String(message._id)))
        .map((message) => String(message.sender?._id ?? message.sender)))];
      for (const senderId of senderIds) {
        emitToUser(senderId, 'private:receipt', {
          conversationId: request.params.conversationId,
          messageIds: unreadIds.map(String),
          status: 'read',
          at: readAt,
        });
      }
    }
    return response.json({
      items: messages.map((message) => {
        if (unreadIds.some((id) => String(id) === String(message._id))) {
          message.readAt = new Date();
          message.deliveredAt ||= message.readAt;
        }
        return safeMessage(message);
      }),
      hasMore,
    });
  } catch (error) {
    return next(error);
  }
}

async function sendMessage(request, response, next) {
  const body = request.body?.body ?? request.body?.message ?? request.body?.content ?? '';
  const replyTo = request.body?.replyTo;
  if (typeof body !== 'string' || body.length > 5000) {
    return response.status(400).json({ message: 'Message must contain at most 5000 characters.' });
  }
  if (!body.trim() && !request.file) {
    return response.status(400).json({ message: 'Enter a message or attach a document.' });
  }
  if (replyTo && !mongoose.isValidObjectId(replyTo)) {
    return response.status(400).json({ message: 'Reply target is invalid.' });
  }

  let attachment;
  try {
    if (!(await ensureParticipant(request, response))) return;
    if ((request.conversation.blockedBy || []).length) {
      return response.status(403).json({ message: 'This conversation is blocked. Unblock the user to send messages.' });
    }
    if (replyTo) {
      const parent = await PrivateMessage.findOne({
        _id: replyTo,
        conversationId: request.params.conversationId,
        deletedAt: null,
        hiddenFor: { $ne: request.user._id },
      }).select('_id');
      if (!parent) return response.status(404).json({ message: 'Reply target was not found.' });
    }
    if (request.file) attachment = await uploadChatAttachment(request.file, String(request.user._id));
    const item = await PrivateMessage.create({
      conversationId: request.params.conversationId,
      sender: request.user._id,
      recipient: request.conversationRecipient._id,
      body: body.trim(),
      replyTo: replyTo || undefined,
      attachments: attachment ? [attachment] : [],
    });
    await Conversation.updateOne(
      { conversationId: request.params.conversationId },
      {
        $set: { lastMessageAt: item.createdAt },
        $pull: { hiddenFor: { $in: [request.user._id, request.conversationRecipient._id] } },
      },
    );
    await item.populate([
      { path: 'sender', select: USER_SUMMARY },
      { path: 'recipient', select: USER_SUMMARY },
      {
        path: 'replyTo',
        select: 'body sender createdAt deletedAt',
        populate: { path: 'sender', select: 'name firstName lastName profilePhoto' },
      },
    ]);
    const message = safeMessage(item);
    emitToUser(request.conversationRecipient._id, 'private:message', message);
    emitToUser(request.user._id, 'private:message', message);
    return response.status(201).json({ item: message });
  } catch (error) {
    if (attachment) await removeChatFile(attachment.storagePath);
    return next(error);
  }
}

async function getMessageAttachment(request, response, next) {
  try {
    if (!(await ensureParticipant(request, response))) return;
    if (!mongoose.isValidObjectId(request.params.messageId)) {
      return response.status(400).json({ message: 'Message id is invalid.' });
    }
    const index = Number.parseInt(request.params.attachmentIndex, 10);
    const message = await PrivateMessage.findOne({
      _id: request.params.messageId,
      conversationId: request.params.conversationId,
      deletedAt: null,
      hiddenFor: { $ne: request.user._id },
    }).select('attachments');
    const attachment = /^\d+$/.test(request.params.attachmentIndex) && Number.isInteger(index)
      ? message?.attachments[index]
      : null;
    if (!attachment) return response.status(404).json({ message: 'Attachment was not found.' });
    return response.json({ url: await getSignedChatUrl(attachment.storagePath) });
  } catch (error) {
    return next(error);
  }
}

async function deleteMessage(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.messageId)) {
    return response.status(400).json({ message: 'Message id is invalid.' });
  }
  const scope = request.query.scope || 'everyone';
  if (!['me', 'everyone'].includes(scope)) {
    return response.status(400).json({ message: 'Delete scope must be me or everyone.' });
  }
  try {
    if (!(await ensureParticipant(request, response))) return;
    const message = await PrivateMessage.findOne({
      _id: request.params.messageId,
      conversationId: request.params.conversationId,
    });
    if (!message) return response.status(404).json({ message: 'Message was not found.' });
    if (scope === 'me') {
      if (!(message.hiddenFor || []).some((userId) => String(userId) === String(request.user._id))) {
        message.hiddenFor.push(request.user._id);
        await message.save();
      }
      const item = {
        _id: String(message._id),
        messageId: String(message._id),
        conversationId: message.conversationId,
        removedFor: 'me',
      };
      emitToUser(request.user._id, 'private:message-hidden', item);
      return response.json({ item });
    }
    if (String(message.sender) !== String(request.user._id)) {
      return response.status(403).json({ message: 'You can only delete your own messages for everyone.' });
    }
    await Promise.all((message.attachments || []).map((attachment) => removeChatFile(attachment.storagePath)));
    message.body = '';
    message.attachments = [];
    message.reactions = [];
    message.deletedAt = new Date();
    await message.save();
    const item = { _id: String(message._id), conversationId: message.conversationId, deletedAt: message.deletedAt };
    emitToConversation(message.conversationId, 'private:deleted', item);
    return response.json({ item });
  } catch (error) {
    return next(error);
  }
}

async function deleteConversation(request, response, next) {
  try {
    if (!(await ensureParticipant(request, response))) return;
    await Conversation.updateOne(
      { conversationId: request.params.conversationId },
      { $addToSet: { hiddenFor: request.user._id } },
    );
    const item = { conversationId: request.params.conversationId, removedFor: 'me' };
    emitToUser(request.user._id, 'private:conversation-hidden', item);
    return response.json({ item });
  } catch (error) {
    return next(error);
  }
}

async function updateConversationPin(request, response, next) {
  if (typeof request.body?.pinned !== 'boolean') {
    return response.status(400).json({ message: 'Pinned state must be a boolean.' });
  }
  try {
    if (!(await ensureParticipant(request, response))) return;
    const update = request.body.pinned
      ? { $addToSet: { pinnedBy: request.user._id } }
      : { $pull: { pinnedBy: request.user._id } };
    await Conversation.updateOne({ conversationId: request.params.conversationId }, update);
    return response.json({ pinned: request.body.pinned });
  } catch (error) {
    return next(error);
  }
}

async function updateConversationBlock(request, response, next) {
  if (typeof request.body?.blocked !== 'boolean') {
    return response.status(400).json({ message: 'Blocked state must be a boolean.' });
  }
  try {
    if (!(await ensureParticipant(request, response))) return;
    const update = request.body.blocked
      ? { $addToSet: { blockedBy: request.user._id } }
      : { $pull: { blockedBy: request.user._id } };
    const conversation = await Conversation.findOneAndUpdate(
      { conversationId: request.params.conversationId },
      update,
      { new: true },
    );
    const blockedByMe = (conversation.blockedBy || [])
      .some((userId) => String(userId) === String(request.user._id));
    const blocked = (conversation.blockedBy || []).length > 0;
    const recipientBlockedByMe = (conversation.blockedBy || [])
      .some((userId) => String(userId) === String(request.conversationRecipient._id));
    const event = {
      conversationId: request.params.conversationId,
      changedBy: String(request.user._id),
    };
    emitToUser(request.user._id, 'private:blocked', { ...event, blocked, blockedByMe });
    emitToUser(request.conversationRecipient._id, 'private:blocked', {
      ...event,
      blocked,
      blockedByMe: recipientBlockedByMe,
    });
    return response.json({ blocked, blockedByMe });
  } catch (error) {
    return next(error);
  }
}

async function reactToMessage(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.messageId)) {
    return response.status(400).json({ message: 'Message id is invalid.' });
  }
  const emoji = request.body?.emoji;
  if (!ALLOWED_REACTIONS.includes(emoji)) {
    return response.status(400).json({ message: 'Reaction is not supported.' });
  }
  try {
    if (!(await ensureParticipant(request, response))) return;
    if ((request.conversation.blockedBy || []).length) {
      return response.status(403).json({ message: 'This conversation is blocked. Unblock the user to react.' });
    }
    const message = await PrivateMessage.findOne({
      _id: request.params.messageId,
      conversationId: request.params.conversationId,
      deletedAt: null,
      hiddenFor: { $ne: request.user._id },
    });
    if (!message) return response.status(404).json({ message: 'Message was not found.' });

    const existingIndex = message.reactions.findIndex(
      (reaction) => String(reaction.user) === String(request.user._id),
    );
    if (existingIndex >= 0 && message.reactions[existingIndex].emoji === emoji) {
      message.reactions.splice(existingIndex, 1);
    } else if (existingIndex >= 0) {
      message.reactions[existingIndex].emoji = emoji;
    } else {
      message.reactions.push({ user: request.user._id, emoji });
    }
    await message.save();
    await message.populate([
      { path: 'sender', select: USER_SUMMARY },
      { path: 'recipient', select: USER_SUMMARY },
      {
        path: 'replyTo',
        select: 'body sender createdAt deletedAt',
        populate: { path: 'sender', select: 'name firstName lastName profilePhoto' },
      },
      { path: 'reactions.user', select: 'name firstName lastName' },
    ]);
    const item = safeMessage(message);
    emitToConversation(message.conversationId, 'private:reaction', item);
    return response.json({ item });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listConversations,
  searchUsers,
  startConversation,
  listMessages,
  sendMessage,
  getMessageAttachment,
  deleteMessage,
  deleteConversation,
  updateConversationPin,
  updateConversationBlock,
  reactToMessage,
};
