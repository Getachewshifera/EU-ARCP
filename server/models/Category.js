// Purpose: Material categories.
const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true, maxlength: 100 },
  slug: { type: String, trim: true, lowercase: true, unique: true, sparse: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 1000 },
}, { timestamps: true });
schema.pre('validate', function makeSlug() {
  if (!this.slug && this.name) this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
});
module.exports = mongoose.models.Category || mongoose.model('Category', schema);
