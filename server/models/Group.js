// Purpose: Study groups and membership data.
const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  title: { type: String, trim: true, maxlength: 160 },
  description: { type: String, trim: true, maxlength: 2000 },
  course: { type: String, trim: true, maxlength: 160 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isPrivate: { type: Boolean, default: false },
}, { timestamps: true });
module.exports = mongoose.models.Group || mongoose.model('Group', schema);
