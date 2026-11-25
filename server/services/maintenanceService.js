// Purpose: Reads and caches the current public maintenance state.
const SiteAppearance = require('../models/SiteAppearance');

const DEFAULT_MESSAGE = 'The platform is temporarily unavailable while scheduled maintenance is in progress. Please try again later.';
const CACHE_DURATION_MS = 3000;
let cachedState = null;
let cacheExpiresAt = 0;

async function getMaintenanceState() {
  if (cachedState && Date.now() < cacheExpiresAt) return cachedState;
  const settings = await SiteAppearance.findOne({ key: 'main' })
    .select('maintenanceMode maintenanceMessage')
    .lean();
  cachedState = {
    enabled: settings?.maintenanceMode === true,
    message: typeof settings?.maintenanceMessage === 'string' && settings.maintenanceMessage.trim()
      ? settings.maintenanceMessage
      : DEFAULT_MESSAGE,
  };
  cacheExpiresAt = Date.now() + CACHE_DURATION_MS;
  return cachedState;
}

function cacheMaintenanceState(state) {
  cachedState = { enabled: state.enabled, message: state.message };
  cacheExpiresAt = Date.now() + CACHE_DURATION_MS;
}

module.exports = { getMaintenanceState, cacheMaintenanceState, DEFAULT_MESSAGE };
