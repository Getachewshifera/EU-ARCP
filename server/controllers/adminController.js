// Purpose: Serves administrator dashboards and audit history.
const User = require('../models/User');
const Material = require('../models/Material');
const Group = require('../models/Group');
const RegistrationRequest = require('../models/RegistrationRequest');
const Report = require('../models/Report');
const ActivityLog = require('../models/ActivityLog');
const { saveAndSendOtp } = require('../services/otpService');

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

async function requestUserPasswordReset(request, response, next) {
  const username = typeof request.body?.username === 'string'
    ? request.body.username.trim().toLowerCase()
    : '';
  if (!username || username.length > 60) {
    return response.status(400).json({ message: 'Enter a valid username.' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) return response.status(404).json({ message: 'No user was found with that username.' });
    if (user.status === 'suspended') {
      return response.status(400).json({ message: 'A password reset cannot be sent for a suspended account.' });
    }

    await saveAndSendOtp(user, 'password-reset');
    await ActivityLog.create({
      actor: request.user._id,
      action: 'user.password_reset_requested',
      entity: 'User',
      entityId: String(user._id),
      metadata: { username: user.username },
      ip: request.ip,
    });
    return response.json({ message: 'Password reset instructions were sent to the user’s registered email.' });
  } catch (error) {
    return next(error);
  }
}

module.exports = { dashboard, activityLogs, requestUserPasswordReset };
