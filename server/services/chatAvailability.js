// Purpose: Central check for the administrator-controlled global chat switch.
const SiteAppearance = require('../models/SiteAppearance');

async function isChatEnabled() {
  const settings = await SiteAppearance.findOne({ key: 'main' }).select('chatEnabled').lean();
  return settings?.chatEnabled !== false;
}

module.exports = { isChatEnabled };
