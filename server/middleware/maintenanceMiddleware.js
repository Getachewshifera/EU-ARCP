// Purpose: Blocks non-admin API requests while maintenance mode is enabled.
const mongoose = require('mongoose');
const optionalAuthMiddleware = require('./optionalAuthMiddleware');
const { getMaintenanceState } = require('../services/maintenanceService');

const availableDuringMaintenance = new Set([
  '/health',
  '/site/appearance',
  '/site/maintenance',
  '/auth/login',
]);

function createMaintenanceMiddleware({
  connection = mongoose.connection,
  getState = getMaintenanceState,
  authenticate = optionalAuthMiddleware,
} = {}) {
  return async function maintenanceMiddleware(request, response, next) {
    if (connection.readyState !== 1 || availableDuringMaintenance.has(request.path)) {
      return next();
    }

    let state;
    try {
      state = await getState();
    } catch (error) {
      return next(error);
    }
    if (!state.enabled) return next();

    return authenticate(request, response, () => {
      if (request.user?.role === 'admin') return next();
      return response.status(503).json({ maintenance: true, message: state.message });
    });
  };
}

module.exports = createMaintenanceMiddleware();
module.exports.createMaintenanceMiddleware = createMaintenanceMiddleware;
