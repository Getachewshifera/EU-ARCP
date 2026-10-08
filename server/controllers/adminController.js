// Purpose: Serves administrator dashboards and audit history.
const User = require('../models/User');
const Material = require('../models/Material');
const Group = require('../models/Group');
const RegistrationRequest = require('../models/RegistrationRequest');
const Report = require('../models/Report');
const ActivityLog = require('../models/ActivityLog');

async function dashboard(_request, response, next) {
  try {
    const [users, students, lecturers, materials, pendingMaterials, groups, registrations, reports] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'lecturer' }),
      Material.countDocuments(),
      Material.countDocuments({ status: 'pending' }),
      Group.countDocuments(),
      RegistrationRequest.countDocuments({ status: 'pending' }),
      Report.countDocuments({ status: { $in: ['open', 'reviewing'] } }),
    ]);
    return response.json({
      stats: {
        users,
        students,
        lecturers,
        materials,
        pendingMaterials,
        groups,
        pendingRegistrations: registrations,
        openReports: reports,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function activityLogs(_request, response, next) {
  try {
    const items = await ActivityLog.find()
      .populate('actor', 'name email')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();
    return response.json({ items });
  } catch (error) {
    return next(error);
  }
}

module.exports = { dashboard, activityLogs };
