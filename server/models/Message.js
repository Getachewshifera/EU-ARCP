// Purpose: Group chat messages.
const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true, trim: true, maxlength: 5000 },
}, { timestamps: true });
module.exports = mongoose.models.Message || mongoose.model('Message', schema);
