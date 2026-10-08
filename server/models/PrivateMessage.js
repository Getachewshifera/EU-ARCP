// Purpose: Messages in private conversations.
const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  conversationId: { type: String, required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  body: { type: String, required: true, trim: true, maxlength: 5000 },
  readAt: { type: Date },
}, { timestamps: true });
schema.index({ conversationId: 1, createdAt: -1 });
module.exports = mongoose.models.PrivateMessage || mongoose.model('PrivateMessage', schema);
