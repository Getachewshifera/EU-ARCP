// Purpose: Lists, moderates, and manages uploaded learning materials.
const fs = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');
const Material = require('../models/Material');
const ActivityLog = require('../models/ActivityLog');
const { PUBLIC_API_URL } = require('../config/environment');

function isAdmin(user) {
  return user?.role === 'admin';
}

function materialData(request) {
  return {
    title: request.body.title,
    subject: request.body.subject || '',
    course: request.body.course || '',
    description: request.body.description || '',
    category: request.body.category || undefined,
    uploader: request.user._id,
    fileUrl: `${PUBLIC_API_URL}/api/materials/${request.materialId}/file`,
    fileName: request.file.originalname,
    mimeType: request.file.mimetype,
    fileSize: request.file.size,
    status: 'pending',
  };
}

async function list(request, response, next) {
  try {
    const filter = {};
    if (!isAdmin(request.user)) filter.status = 'approved';
    else if (['pending', 'approved', 'rejected'].includes(request.query.status)) filter.status = request.query.status;
    if (!isAdmin(request.user) && request.query.status && request.query.status !== 'approved') {
      return response.json({ items: [] });
    }
    if (request.query.category && mongoose.isValidObjectId(request.query.category)) filter.category = request.query.category;
    const queryValue = request.query.q || request.query.search;
    const text = typeof queryValue === 'string' ? queryValue.trim().slice(0, 100) : '';
    if (text) {
      const expression = new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ title: expression }, { subject: expression }, { course: expression }, { description: expression }];
    }
    const items = await Material.find(filter)
      .populate('uploader', 'name email role')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(Math.min(100, Math.max(1, Number.parseInt(request.query.limit, 10) || 100)))
      .lean();
    return response.json({ items });
  } catch (error) {
    return next(error);
  }
}

async function mine(request, response, next) {
  try {
    const items = await Material.find({ uploader: request.user._id })
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return response.json({ items });
  } catch (error) {
    return next(error);
  }
}

async function get(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ message: 'Material id is invalid.' });
  try {
    const item = await Material.findById(request.params.id)
      .populate('uploader', 'name email role')
      .populate('category', 'name')
      .lean();
    if (!item) return response.status(404).json({ message: 'Material was not found.' });
    const owner = request.user && item.uploader && String(item.uploader._id) === String(request.user._id);
    if (item.status !== 'approved' && !owner && !isAdmin(request.user)) {
      return response.status(404).json({ message: 'Material was not found.' });
    }
    if (item.status === 'approved') await Material.updateOne({ _id: item._id }, { $inc: { views: 1 } });
    return response.json({ item });
  } catch (error) {
    return next(error);
  }
}

async function upload(request, response, next) {
  if (!request.file) return response.status(400).json({ message: 'A material file is required.' });
  if (typeof request.body.title !== 'string' || !request.body.title.trim()) {
    try {
      await fs.unlink(request.file.path);
    } catch (error) {
      return next(error);
    }
    return response.status(400).json({ message: 'A material title is required.' });
  }
  try {
    request.materialId = new mongoose.Types.ObjectId();
    const item = await Material.create({ _id: request.materialId, ...materialData(request) });
    await ActivityLog.create({
      actor: request.user._id,
      action: 'material.uploaded',
      entity: 'Material',
      entityId: String(item._id),
      ip: request.ip,
    });
    return response.status(201).json({ item });
  } catch (error) {
    try {
      await fs.unlink(request.file.path);
    } catch (cleanupError) {
      if (cleanupError.code !== 'ENOENT') console.error('Unable to remove failed material upload:', cleanupError);
    }
    return next(error);
  }
}

async function download(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ message: 'Material id is invalid.' });
  try {
    const item = await Material.findById(request.params.id);
    if (!item) return response.status(404).json({ message: 'Material was not found.' });
    const owner = request.user && String(item.uploader) === String(request.user._id);
    if (item.status !== 'approved' && !owner && !isAdmin(request.user)) {
      return response.status(404).json({ message: 'Material was not found.' });
    }
    const filename = path.basename(new URL(item.fileUrl, PUBLIC_API_URL).pathname);
    const filePath = path.resolve(__dirname, '../uploads', filename);
    response.type(item.mimeType);
    response.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(item.fileName)}`);
    const stream = require('fs').createReadStream(filePath);
    stream.on('error', (error) => {
      if (response.headersSent) response.destroy(error);
      else next(error);
    });
    return stream.pipe(response);
  } catch (error) {
    return next(error);
  }
}

async function update(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ message: 'Material id is invalid.' });
  const allowed = isAdmin(request.user)
    ? ['title', 'subject', 'course', 'description', 'category', 'status', 'rejectionReason']
    : ['title', 'subject', 'course', 'description'];
  const body = request.body || {};
  if (typeof body !== 'object' || Array.isArray(body)
    || !Object.keys(body).length || Object.keys(body).some((key) => !allowed.includes(key))) {
    return response.status(400).json({ message: 'Request contains unsupported material fields.' });
  }
  if (body.status && !['pending', 'approved', 'rejected'].includes(body.status)) {
    return response.status(400).json({ message: 'Material status is invalid.' });
  }
  try {
    const item = await Material.findById(request.params.id);
    if (!item) return response.status(404).json({ message: 'Material was not found.' });
    if (!isAdmin(request.user) && String(item.uploader) !== String(request.user._id)) {
      return response.status(403).json({ message: 'You can only edit your own materials.' });
    }
    Object.assign(item, body);
    await item.save();
    if (body.status) {
      await ActivityLog.create({
        actor: request.user._id,
        action: `material.${body.status}`,
        entity: 'Material',
        entityId: String(item._id),
        ip: request.ip,
      });
    }
    return response.json({ item });
  } catch (error) {
    return next(error);
  }
}

async function remove(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ message: 'Material id is invalid.' });
  try {
    const item = await Material.findById(request.params.id);
    if (!item) return response.status(404).json({ message: 'Material was not found.' });
    if (!isAdmin(request.user) && String(item.uploader) !== String(request.user._id)) {
      return response.status(403).json({ message: 'You can only delete your own materials.' });
    }
    await item.deleteOne();
    const filename = path.basename(item.fileUrl);
    await fs.unlink(path.resolve(__dirname, '../uploads', filename)).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
    });
    return response.json({ message: 'Material deleted.' });
  } catch (error) {
    return next(error);
  }
}

module.exports = { list, mine, get, upload, download, update, remove };
