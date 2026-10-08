// Purpose: Configurable platform settings.
const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  key: { type: String, required: true, trim: true, unique: true, maxlength: 120 },
  value: { type: mongoose.Schema.Types.Mixed },
  description: { type: String, trim: true, maxlength: 1000 },
}, { timestamps: true });
module.exports = mongoose.models.SystemSetting || mongoose.model('SystemSetting', schema);
