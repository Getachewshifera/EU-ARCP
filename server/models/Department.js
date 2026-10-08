// Purpose: Departments belonging to colleges.
const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  college: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
  university: { type: mongoose.Schema.Types.ObjectId, ref: 'University' },
  description: { type: String, trim: true, maxlength: 2000 },
}, { timestamps: true });
schema.index({ name: 1, college: 1 }, { unique: true });
module.exports = mongoose.models.Department || mongoose.model('Department', schema);
