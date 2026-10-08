// Purpose: Auditable platform activity records.
const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true, trim: true, maxlength: 120 },
  entity: { type: String, trim: true, maxlength: 120 },
  entityId: { type: String, trim: true, maxlength: 120 },
  metadata: { type: mongoose.Schema.Types.Mixed },
  ip: { type: String, trim: true, maxlength: 80 },
}, { timestamps: true });
module.exports = mongoose.models.ActivityLog || mongoose.model('ActivityLog', schema);
