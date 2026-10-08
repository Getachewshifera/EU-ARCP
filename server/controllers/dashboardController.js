// Purpose: Builds role-specific dashboard summaries for authenticated users.
const Material = require('../models/Material');
const Group = require('../models/Group');
const Notification = require('../models/Notification');
const PrivateMessage = require('../models/PrivateMessage');

async function studentDashboard(request, response, next) {
  try {
    const userId = request.user._id;
    const [materials, myMaterials, groups, unreadNotifications, recentMaterials, recentGroups] = await Promise.all([
      Material.countDocuments({ status: 'approved' }),
      Material.countDocuments({ uploader: userId }),
      Group.countDocuments({ members: userId }),
      Notification.countDocuments({ user: userId, read: false }),
      Material.find({ status: 'approved' }).sort({ createdAt: -1 }).limit(5).lean(),
      Group.find({ members: userId }).sort({ updatedAt: -1 }).limit(5).lean(),
    ]);
    return response.json({
      dashboard: {
        student: request.user,
        stats: { materials, myMaterials, groups, unreadNotifications },
        recentMaterials,
        recentGroups,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function lecturerDashboard(request, response, next) {
  try {
    const userId = request.user._id;
    const [materials, groups, unreadNotifications, unreadMessages, recentMaterials, recentNotifications] = await Promise.all([
      Material.countDocuments({ uploader: userId }),
      Group.countDocuments({ $or: [{ owner: userId }, { members: userId }] }),
      Notification.countDocuments({ user: userId, read: false }),
      PrivateMessage.countDocuments({ recipient: userId, readAt: null }),
      Material.find({ uploader: userId }).sort({ createdAt: -1 }).limit(5).lean(),
      Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(5).lean(),
    ]);
    return response.json({
      dashboard: {
        lecturer: request.user,
        stats: { materials, groups, unreadNotifications, unreadMessages },
        recentMaterials,
        recentNotifications,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { studentDashboard, lecturerDashboard };
