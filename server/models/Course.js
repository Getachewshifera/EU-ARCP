// Purpose: Courses in academic programs.
const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  code: { type: String, trim: true, uppercase: true, maxlength: 30 },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program' },
  semester: { type: String, trim: true, maxlength: 80 },
  year: { type: Number, min: 1, max: 20 },
  description: { type: String, trim: true, maxlength: 2000 },
}, { timestamps: true });
module.exports = mongoose.models.Course || mongoose.model('Course', schema);
