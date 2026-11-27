// Purpose: Persists direct conversations even before the first message.
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  conversationId: { type: String, required: true, unique: true, index: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  hiddenFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  pinnedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  blockedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lastMessageAt: { type: Date, default: null },
}, { timestamps: true });

schema.index({ participants: 1, lastMessageAt: -1 });

module.exports = mongoose.models.Conversation || mongoose.model('Conversation', schema);
