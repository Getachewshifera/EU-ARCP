// Purpose: Colleges belonging to universities.
const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  university: { type: mongoose.Schema.Types.ObjectId, ref: 'University', required: true },
  description: { type: String, trim: true, maxlength: 2000 },
}, { timestamps: true });
schema.index({ name: 1, university: 1 }, { unique: true });
module.exports = mongoose.models.College || mongoose.model('College', schema);
