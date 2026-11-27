// Purpose: Handles real-time private chat events.
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const PrivateMessage = require('../models/PrivateMessage');
const User = require('../models/User');
const { isChatEnabled } = require('../services/chatAvailability');

async function registerPrivateChatSocket(io, socket) {
  socket.data.conversations = new Set();

  socket.on('conversation:join', async (payload, acknowledge) => {
    const conversationId = String(payload?.conversationId || '');
    try {
      if (!(await isChatEnabled())) {
        acknowledge?.({ error: 'Chat has been disabled by an administrator.' });
        return;
      }
      const participants = conversationId.split(':');
      const canonicalId = participants.length === 2
        ? [...participants].sort().join(':')
        : '';
      const isValidConversationId = participants.length === 2
        && participants.every(mongoose.isValidObjectId)
        && participants.includes(socket.data.user.id)
        && canonicalId === conversationId;
      const recipientId = isValidConversationId
        ? participants.find((participantId) => participantId !== socket.data.user.id)
        : null;
      const activeRecipient = recipientId
        ? await User.exists({ _id: recipientId, status: 'ACTIVE', isActive: { $ne: false } })
        : null;
      if (!activeRecipient) {
        acknowledge?.({ error: 'Conversation was not found.' });
        return;
      }

      let conversation = await Conversation.findOne({
        conversationId,
        participants: socket.data.user.id,
      }).select('conversationId');
      if (!conversation) {
        const legacyMessage = await PrivateMessage.exists({
            conversationId,
            $or: [{ sender: socket.data.user.id }, { recipient: socket.data.user.id }],
          });
        if (legacyMessage) {
          try {
            conversation = await Conversation.findOneAndUpdate(
              { conversationId },
              { $setOnInsert: { conversationId, participants, createdBy: socket.data.user.id } },
              { upsert: true, new: true, setDefaultsOnInsert: true },
            ).select('conversationId');
          } catch (error) {
            if (error.code !== 11000) throw error;
            conversation = await Conversation.findOne({
              conversationId,
              participants: socket.data.user.id,
            }).select('conversationId');
          }
        }
      }
      if (!conversation) {
        acknowledge?.({ error: 'Conversation was not found.' });
        return;
      }

      await socket.join(`conversation:${conversationId}`);
      socket.data.conversations.add(conversationId);
      const pending = await PrivateMessage.find({
        conversationId,
        recipient: socket.data.user.id,
        deliveredAt: null,
      }).select('_id sender').lean();
      if (pending.length) {
        const deliveredAt = new Date();
        await PrivateMessage.updateMany(
          { _id: { $in: pending.map((message) => message._id) } },
          { $set: { deliveredAt } },
        );
        const bySender = new Map();
        for (const message of pending) {
          const senderId = String(message.sender);
          const ids = bySender.get(senderId) || [];
          ids.push(String(message._id));
          bySender.set(senderId, ids);
        }
        for (const [senderId, messageIds] of bySender) {
          io.to(`user:${senderId}`).emit('private:receipt', { conversationId, messageIds, status: 'delivered', at: deliveredAt });
        }
      }
      acknowledge?.({ joined: true });
    } catch {
      acknowledge?.({ error: 'Unable to join this conversation.' });
    }
  });

  socket.on('conversation:leave', async (payload) => {
    const conversationId = String(payload?.conversationId || '');
    await socket.leave(`conversation:${conversationId}`);
    socket.data.conversations.delete(conversationId);
  });

  socket.on('private:delivered', async (payload) => {
    const conversationId = String(payload?.conversationId || '');
    const messageId = payload?.messageId;
    if (!mongoose.isValidObjectId(messageId)) return;
    try {
      if (!(await isChatEnabled())) return;
      const deliveredAt = new Date();
      const message = await PrivateMessage.findOneAndUpdate(
        {
          _id: messageId,
          conversationId,
          recipient: socket.data.user.id,
          deliveredAt: null,
          deletedAt: null,
        },
        { $set: { deliveredAt } },
        { new: true },
      ).select('sender');
      if (message) {
        io.to(`user:${message.sender}`).emit('private:receipt', {
          conversationId,
          messageIds: [String(message._id)],
          status: 'delivered',
          at: deliveredAt,
        });
      }
    } catch {
      socket.emit('chat:error', { message: 'Unable to update delivery status.' });
    }
  });

  socket.on('private:typing', async (payload) => {
    const conversationId = String(payload?.conversationId || '');
    if (!socket.data.conversations.has(conversationId)) return;
    try {
      if (!(await isChatEnabled())) return;
      const conversation = await Conversation.findOne({
        conversationId,
        participants: socket.data.user.id,
      }).select('participants blockedBy');
      if (!conversation) return;
      if ((conversation.blockedBy || []).length) {
        socket.to(`conversation:${conversationId}`).emit('private:typing', {
          conversationId,
          userId: socket.data.user.id,
          name: socket.data.user.name,
          typing: false,
        });
        return;
      }
      socket.to(`conversation:${conversationId}`).emit('private:typing', {
        conversationId,
        userId: socket.data.user.id,
        name: socket.data.user.name,
        typing: payload?.typing === true,
      });
    } catch {
      socket.emit('chat:error', { message: 'Unable to update typing status.' });
    }
  });
}

module.exports = registerPrivateChatSocket;
