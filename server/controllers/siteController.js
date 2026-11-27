// Purpose: Provides safe public site appearance settings and admin updates.
const SiteAppearance = require('../models/SiteAppearance');
const { validateAppearance } = require('../validators/siteSettingsValidator');
const { validateMaintenance } = require('../validators/maintenanceValidator');
const { cacheMaintenanceState, DEFAULT_MESSAGE, getMaintenanceState } = require('../services/maintenanceService');

const DEFAULT_APPEARANCE = {
  primaryColor: '#2563eb',
  backgroundColor: '#f4f7fb',
};

async function getAppearance(_request, response, next) {
  try {
    const appearance = await SiteAppearance.findOne({ key: 'main' })
      .select('primaryColor backgroundColor chatEnabled')
      .lean();
    return response.json({ appearance: appearance || DEFAULT_APPEARANCE });
  } catch (error) {
    return next(error);
  }
}

async function getChatStatus(_request, response, next) {
  try {
    const settings = await SiteAppearance.findOne({ key: 'main' }).select('chatEnabled').lean();
    return response.json({ enabled: settings?.chatEnabled !== false });
  } catch (error) {
    return next(error);
  }
}

async function updateChatStatus(request, response, next) {
  if (typeof request.body?.enabled !== 'boolean') {
    return response.status(400).json({ message: 'Chat enabled state must be a boolean.' });
  }
  try {
    const settings = await SiteAppearance.findOneAndUpdate(
      { key: 'main' },
      {
        $set: { chatEnabled: request.body.enabled },
        $setOnInsert: { key: 'main', ...DEFAULT_APPEARANCE },
      },
      { returnDocument: 'after', upsert: true, runValidators: true, setDefaultsOnInsert: true },
    ).select('chatEnabled').lean();
    return response.json({ enabled: settings.chatEnabled !== false });
  } catch (error) {
    return next(error);
  }
}

async function updateAppearance(request, response, next) {
  const result = validateAppearance(request.body)
  if (result.error) return response.status(400).json({ message: result.error });

  try {
    const appearance = await SiteAppearance.findOneAndUpdate(
      { key: 'main' },
      { $set: result.value, $setOnInsert: { key: 'main' } },
      { returnDocument: 'after', upsert: true, runValidators: true },
    ).lean();
    return response.json({ appearance });
  } catch (error) {
    return next(error);
  }
}

async function getMaintenance(_request, response, next) {
  try {
    const maintenance = await getMaintenanceState();
    return response.json({ maintenance });
  } catch (error) {
    return next(error);
  }
}

async function updateMaintenance(request, response, next) {
  const result = validateMaintenance(request.body);
  if (result.error) return response.status(400).json({ message: result.error });

  try {
    const settings = await SiteAppearance.findOneAndUpdate(
      { key: 'main' },
      {
        $set: {
          maintenanceMode: result.value.enabled,
          maintenanceMessage: result.value.message,
        },
        $setOnInsert: {
          key: 'main',
          primaryColor: '#2563eb',
          backgroundColor: '#f4f7fb',
        },
      },
      { returnDocument: 'after', upsert: true, runValidators: true, setDefaultsOnInsert: true },
    ).select('maintenanceMode maintenanceMessage').lean();
    const maintenance = {
      enabled: settings.maintenanceMode === true,
      message: settings.maintenanceMessage || DEFAULT_MESSAGE,
    };
    cacheMaintenanceState(maintenance);
    return response.json({ maintenance });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getAppearance,
  updateAppearance,
  getChatStatus,
  updateChatStatus,
  getMaintenance,
  updateMaintenance,
};
