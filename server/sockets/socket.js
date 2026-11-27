// Purpose: Creates and configures the real-time socket server.
const { Server } = require('socket.io');
const User = require('../models/User');
const { verifyToken } = require('../utils/token');
const { CLIENT_ORIGIN } = require('../config/environment');
const registerGroupChatSocket = require('./groupChatSocket');
const registerPrivateChatSocket = require('./privateChatSocket');

let io;
const onlineSockets = new Map();

function userRoom(userId) {
  return `user:${userId}`;
}

function groupRoom(groupId) {
  return `group:${groupId}`;
}

function conversationRoom(conversationId) {
  return `conversation:${conversationId}`;
}

function getIO() {
  if (!io) throw new Error('Socket.IO has not been initialized.');
  return io;
}

function emitToUser(userId, event, payload) {
  if (io) io.to(userRoom(userId)).emit(event, payload);
}

function emitToGroup(groupId, event, payload) {
  if (io) io.to(groupRoom(groupId)).emit(event, payload);
}

function emitToConversation(conversationId, event, payload) {
  if (io) io.to(conversationRoom(conversationId)).emit(event, payload);
}

async function removeUserFromRoom(userId, room) {
  if (io) await io.in(userRoom(userId)).socketsLeave(room);
}

function attachSocketServer(httpServer) {
  const allowedOrigins = CLIENT_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean);
  io = new Server(httpServer, {
    cors: {
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        const error = new Error('Origin is not allowed by CORS.');
        error.status = 403;
        return callback(error);
      },
    },
    maxHttpBufferSize: 1e6,
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (typeof token !== 'string' || !token) return next(new Error('Authentication is required.'));
    try {
      const claims = verifyToken(token);
      const user = await User.findById(claims.sub).select('_id name email role status isActive');
      if (!user || user.status !== 'ACTIVE' || user.isActive === false) {
        return next(new Error('This account is not active.'));
      }
      socket.data.user = {
        id: String(user._id),
        name: user.name || user.email,
        role: user.role,
      };
      return next();
    } catch {
      return next(new Error('The authentication token is invalid or expired.'));
    }
  });

  io.on('connection', (socket) => {
    const { id: userId } = socket.data.user;
    const connections = onlineSockets.get(userId) || new Set();
    const wasOffline = connections.size === 0;
    connections.add(socket.id);
    onlineSockets.set(userId, connections);
    socket.join(userRoom(userId));
    socket.emit('presence:initial', { onlineUserIds: [...onlineSockets.keys()] });
    if (wasOffline) socket.broadcast.emit('presence:update', { userId, online: true });

    socket.on('presence:check', (userIds, acknowledge) => {
      if (typeof acknowledge !== 'function') return;
      const ids = Array.isArray(userIds) ? userIds.slice(0, 100).map(String) : [];
      acknowledge({ onlineUserIds: ids.filter((id) => onlineSockets.has(id)) });
    });

    registerGroupChatSocket(io, socket);
    registerPrivateChatSocket(io, socket);

    socket.on('disconnect', () => {
      const activeConnections = onlineSockets.get(userId);
      if (!activeConnections) return;
      activeConnections.delete(socket.id);
      if (activeConnections.size === 0) {
        onlineSockets.delete(userId);
        socket.broadcast.emit('presence:update', { userId, online: false });
      }
    });
  });
  return io;
}

module.exports = {
  attachSocketServer,
  conversationRoom,
  emitToConversation,
  emitToGroup,
  emitToUser,
  getIO,
  groupRoom,
  removeUserFromRoom,
  userRoom,
};
