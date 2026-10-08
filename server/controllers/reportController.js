// Purpose: Lets users report content and lets administrators resolve reports.
const mongoose = require('mongoose');
const Report = require('../models/Report');
const Material = require('../models/Material');
const ActivityLog = require('../models/ActivityLog');

async function list(request, response, next) {
  try {
    const filter = request.user.role === 'admin' ? {} : { reporter: request.user._id };
    if (request.user.role === 'admin' && ['open', 'reviewing', 'resolved', 'dismissed'].includes(request.query.status)) {
      filter.status = request.query.status;
    }
    const items = await Report.find(filter)
      .populate('reporter', 'name email')
      .populate('material', 'title status')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();
    return response.json({ items });
  } catch (error) {
    return next(error);
  }
}

async function create(request, response, next) {
  const { materialId, material, reason, description = '' } = request.body || {};
  const targetId = materialId || material;
  if (!mongoose.isValidObjectId(targetId) || typeof reason !== 'string'
    || !reason.trim() || reason.length > 500
    || typeof description !== 'string' || description.length > 3000) {
    return response.status(400).json({ message: 'A valid material, reason, and description are required.' });
  }
  try {
    const exists = await Material.exists({ _id: targetId });
    if (!exists) return response.status(404).json({ message: 'Material was not found.' });
    const item = await Report.create({
      reporter: request.user._id,
      material: targetId,
      reason: reason.trim(),
      description: description.trim(),
    });
    return response.status(201).json({ item });
  } catch (error) {
    return next(error);
  }
}

async function get(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ message: 'Report id is invalid.' });
  try {
    const item = await Report.findById(request.params.id)
      .populate('reporter', 'name email')
      .populate('material', 'title status')
      .lean();
    if (!item) return response.status(404).json({ message: 'Report was not found.' });
    if (request.user.role !== 'admin' && String(item.reporter._id) !== String(request.user._id)) {
      return response.status(404).json({ message: 'Report was not found.' });
    }
    return response.json({ item });
  } catch (error) {
    return next(error);
  }
}

async function update(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ message: 'Report id is invalid.' });
  const { status, resolution = '' } = request.body || {};
  if (!['open', 'reviewing', 'resolved', 'dismissed'].includes(status)
    || typeof resolution !== 'string' || resolution.length > 1000) {
    return response.status(400).json({ message: 'Provide a valid report status and resolution.' });
  }
  try {
    const item = await Report.findById(request.params.id);
    if (!item) return response.status(404).json({ message: 'Report was not found.' });
    item.status = status;
    item.resolution = resolution.trim();
    item.reviewedBy = request.user._id;
    await item.save();
    await ActivityLog.create({
      actor: request.user._id,
      action: `report.${status}`,
      entity: 'Report',
      entityId: String(item._id),
      ip: request.ip,
    });
    return response.json({ item });
  } catch (error) {
    return next(error);
  }
}

module.exports = { list, create, get, update };
