// Purpose: Creates in-app user notifications.
const Notification = require('../models/Notification');

async function createNotification(user, title, message, link = '') {
  return Notification.create({ user, title, message, link });
}

module.exports = { createNotification };
