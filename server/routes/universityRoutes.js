// Purpose: Maps university management URLs to their handlers.
const University = require('../models/University');
const createResourceRouter = require('./resourceRoutes');

module.exports = createResourceRouter(University);
