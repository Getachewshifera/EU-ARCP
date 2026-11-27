// Purpose: Messages in private conversations.
const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  conversationId: { type: String, required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  body: { type: String, default: '', trim: true, maxlength: 5000 },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'PrivateMessage' },
  hiddenFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reactions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    emoji: { type: String, enum: ['👍', '❤️', '😂', '😮', '😢', '👏'], required: true },
  }],
  attachments: [{
    name: { type: String, required: true, maxlength: 255 },
    storagePath: { type: String, required: true, maxlength: 500 },
    mimeType: { type: String, required: true, maxlength: 120 },
    size: { type: Number, required: true, min: 1 },
  }],
  deliveredAt: { type: Date },
  readAt: { type: Date },
  deletedAt: { type: Date },
}, { timestamps: true });
schema.index({ conversationId: 1, createdAt: -1 });
module.exports = mongoose.models.PrivateMessage || mongoose.model('PrivateMessage', schema);
