// Purpose: Manages notifications for the authenticated account.
const mongoose = require('mongoose');
const Notification = require('../models/Notification');

async function list(request, response, next) {
  try {
    const items = await Notification.find({ user: request.user._id })
      .sort({ createdAt: -1 })
      .limit(Math.min(100, Math.max(1, Number.parseInt(request.query.limit, 10) || 100)))
      .lean();
    return response.json({ items });
  } catch (error) {
    return next(error);
  }
}

async function markRead(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ message: 'Notification id is invalid.' });
  try {
    const item = await Notification.findOneAndUpdate(
      { _id: request.params.id, user: request.user._id },
      { $set: { read: request.body?.read !== false } },
      { new: true, runValidators: true },
    );
    if (!item) return response.status(404).json({ message: 'Notification was not found.' });
    return response.json({ item });
  } catch (error) {
    return next(error);
  }
}

async function markAllRead(request, response, next) {
  try {
    const result = await Notification.updateMany({ user: request.user._id, read: false }, { $set: { read: true } });
    return response.json({ modifiedCount: result.modifiedCount });
  } catch (error) {
    return next(error);
  }
}

async function remove(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ message: 'Notification id is invalid.' });
  try {
    const item = await Notification.findOneAndDelete({ _id: request.params.id, user: request.user._id });
    if (!item) return response.status(404).json({ message: 'Notification was not found.' });
    return response.json({ message: 'Notification deleted.' });
  } catch (error) {
    return next(error);
  }
}

module.exports = { list, markRead, markAllRead, remove };
