// Purpose: Group chat messages.
const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, default: '', trim: true, maxlength: 5000 },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
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
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
module.exports = mongoose.models.Message || mongoose.model('Message', schema);
