// Purpose: Universities.
const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true, maxlength: 160 },
  code: { type: String, trim: true, uppercase: true, maxlength: 30 },
  country: { type: String, trim: true, maxlength: 100 },
  website: {
    type: String,
    trim: true,
    maxlength: 2048,
    validate: {
      validator(value) {
        if (!value) return true;
        try {
          const url = new URL(value);
          return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
          return false;
        }
      },
      message: 'Website must be a valid HTTP or HTTPS URL.',
    },
  },
  description: { type: String, trim: true, maxlength: 2000 },
}, { timestamps: true });
module.exports = mongoose.models.University || mongoose.model('University', schema);
