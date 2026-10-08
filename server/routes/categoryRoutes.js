// Purpose: Maps category URLs to their handlers.
const Category = require('../models/Category');
const createResourceRouter = require('./resourceRoutes');

module.exports = createResourceRouter(Category);
