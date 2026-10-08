// Purpose: User notifications.
const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 180 },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  link: { type: String, trim: true, maxlength: 500 },
  read: { type: Boolean, default: false, index: true },
}, { timestamps: true });
module.exports = mongoose.models.Notification || mongoose.model('Notification', schema);
