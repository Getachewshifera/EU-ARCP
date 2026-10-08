// Purpose: Maps system setting URLs to their handlers.
const SystemSetting = require('../models/SystemSetting');
const createResourceRouter = require('./resourceRoutes');

module.exports = createResourceRouter(SystemSetting, { adminRead: true });
