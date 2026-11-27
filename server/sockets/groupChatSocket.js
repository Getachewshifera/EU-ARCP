// Purpose: Handles real-time group chat events.
const mongoose = require('mongoose');
const Group = require('../models/Group');
const { isChatEnabled } = require('../services/chatAvailability');

function isMember(group, userId) {
  return group.members.some((memberId) => String(memberId) === String(userId));
}

function registerGroupChatSocket(_io, socket) {
  socket.data.groupRooms = new Set();
  socket.on('group:join', async (payload, acknowledge) => {
    const groupId = String(payload?.groupId || '');
    try {
      if (!(await isChatEnabled())) {
        acknowledge?.({ error: 'Chat has been disabled by an administrator.' });
        return;
      }
    } catch {
      acknowledge?.({ error: 'Unable to verify chat availability.' });
      return;
    }
    if (!mongoose.isValidObjectId(groupId)) {
      acknowledge?.({ error: 'Group id is invalid.' });
      return;
    }
    try {
      const group = await Group.findById(groupId).select('members');
      if (!group || (!isMember(group, socket.data.user.id) && socket.data.user.role !== 'admin')) {
        acknowledge?.({ error: 'You must be a group member to join its chat.' });
        return;
      }
      const room = `group:${groupId}`;
      await socket.join(room);
      socket.data.groupRooms.add(groupId);
      acknowledge?.({ joined: true });
    } catch {
      acknowledge?.({ error: 'Unable to join this group chat.' });
    }
  });

  socket.on('group:leave', async (payload) => {
    const groupId = String(payload?.groupId || '');
    if (!mongoose.isValidObjectId(groupId)) return;
    await socket.leave(`group:${groupId}`);
    socket.data.groupRooms.delete(groupId);
  });

  socket.on('group:typing', async (payload) => {
    const groupId = String(payload?.groupId || '');
    if (!mongoose.isValidObjectId(groupId) || !socket.data.groupRooms.has(groupId)) return;
    try {
      if (!(await isChatEnabled())) return;
      const group = await Group.findById(groupId).select('members');
      if (!group || (!isMember(group, socket.data.user.id) && socket.data.user.role !== 'admin')) {
        await socket.leave(`group:${groupId}`);
        socket.data.groupRooms.delete(groupId);
        return;
      }
      socket.to(`group:${groupId}`).emit('group:typing', {
        groupId,
        userId: socket.data.user.id,
        name: socket.data.user.name,
        typing: payload?.typing === true,
      });
    } catch {
      socket.emit('chat:error', { message: 'Unable to update group typing status.' });
    }
  });
}

module.exports = registerGroupChatSocket;
