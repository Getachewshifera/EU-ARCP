// Purpose: Universities.
const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true, maxlength: 160 },
  code: { type: String, trim: true, uppercase: true, maxlength: 30 },
  country: { type: String, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 2000 },
}, { timestamps: true });
module.exports = mongoose.models.University || mongoose.model('University', schema);
