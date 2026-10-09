// Purpose: Maps academic structure URLs to their handlers.
const express = require('express');
const College = require('../models/College');
const Department = require('../models/Department');
const Program = require('../models/Program');
const Course = require('../models/Course');
const createResourceRouter = require('./resourceRoutes');

const router = express.Router();
router.use('/colleges', createResourceRouter(College));
router.use('/departments', createResourceRouter(Department));
router.use('/programs', createResourceRouter(Program));
router.use('/courses', createResourceRouter(Course));

module.exports = router;
