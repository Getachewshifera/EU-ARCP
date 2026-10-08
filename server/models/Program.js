// Purpose: Academic programs belonging to departments.
const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  degree: { type: String, trim: true, maxlength: 80 },
  duration: { type: Number, min: 1, max: 20 },
  description: { type: String, trim: true, maxlength: 2000 },
}, { timestamps: true });
schema.index({ name: 1, department: 1 }, { unique: true });
module.exports = mongoose.models.Program || mongoose.model('Program', schema);
