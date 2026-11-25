// Purpose: Stores the global public appearance selected by an administrator.
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  key: { type: String, default: 'main', unique: true, immutable: true },
  primaryColor: { type: String, required: true },
  backgroundColor: { type: String, required: true },
  maintenanceMode: { type: Boolean, default: false },
  maintenanceMessage: {
    type: String,
    default: 'The platform is temporarily unavailable while scheduled maintenance is in progress. Please try again later.',
    maxlength: 500,
  },
}, { timestamps: true });

module.exports = mongoose.models.SiteAppearance || mongoose.model('SiteAppearance', schema);
