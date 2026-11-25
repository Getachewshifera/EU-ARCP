// Purpose: Lists, moderates, and manages uploaded learning materials.
const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');
const Material = require('../models/Material');
const User = require('../models/User');
const Category = require('../models/Category');
const ActivityLog = require('../models/ActivityLog');
const { uploadDirectory } = require('../middleware/uploadMiddleware');
const { getStorageConfig, getSupabaseClient } = require('../config/storage');
const {
  createMaterialStoragePath,
  getSafeFileName,
  removeMaterialObject,
  STORAGE_PATH_PATTERN,
  validateMaterialFile,
} = require('../services/fileService');
const { validateMaterialInput } = require('../validators/materialValidator');

const SIGNED_URL_TTL_SECONDS = 60;

function isAdmin(user) {
  return user?.role === 'admin';
}

function idsMatch(left, right) {
  return left != null && right != null && String(left) === String(right);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getSearchFilter(request) {
  const queryValue = request.query.q || request.query.search;
  const text = typeof queryValue === 'string' ? queryValue.trim().slice(0, 100) : '';
  if (!text) return null;
  const expression = new RegExp(escapeRegex(text), 'i');
  return { $or: [{ title: expression }, { fileName: expression }, { subject: expression }, { course: expression }, { description: expression }] };
}

function applyMetadataFilters(request, filter) {
  for (const field of ['category', 'university', 'department']) {
    const value = request.query[field];
    if (value === undefined || value === '') continue;
    if (typeof value !== 'string' || !mongoose.isValidObjectId(value)) {
      return `${field[0].toUpperCase()}${field.slice(1)} filter is invalid.`;
    }
    filter[field] = value;
  }
  const searchFilter = getSearchFilter(request);
  if (searchFilter) Object.assign(filter, searchFilter);
  return '';
}

async function canAccessMaterial(user, item) {
  if (!user) return false;
  const uploaderId = item.uploader?._id ?? item.uploader;
  if (isAdmin(user) || idsMatch(uploaderId, user._id)) return true;
  if (item.status !== 'approved') return false;

  let university = item.university;
  let department = item.department;
  if (!university) {
    const uploader = await User.findById(uploaderId).select('university department').lean();
    university = uploader?.university;
    department = uploader?.department;
  }
  return idsMatch(university, user.university)
    && String(department || '') === String(user.department || '');
}

async function applyUserScope(user, filter) {
  if (!user?.university) {
    filter.uploader = user?._id;
    return;
  }
  const legacyUploaders = await User.find({
    university: user.university,
    department: user.department || null,
  }).distinct('_id');
  filter.$and = [{
    $or: [
      { university: user.university, department: user.department || null },
      { university: { $exists: false }, uploader: { $in: legacyUploaders } },
    ],
  }];
}

async function list(request, response, next) {
  try {
    const filter = {};
    if (!isAdmin(request.user)) {
      filter.status = 'approved';
      if (request.query.status && request.query.status !== 'approved') {
        return response.json({ items: [] });
      }
      await applyUserScope(request.user, filter);
    } else if (['pending', 'approved', 'rejected'].includes(request.query.status)) {
      filter.status = request.query.status;
    }
    const filterError = applyMetadataFilters(request, filter);
    if (filterError) return response.status(400).json({ message: filterError });

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
    const filter = { uploader: request.user._id };
    const filterError = applyMetadataFilters(request, filter);
    if (filterError) return response.status(400).json({ message: filterError });
    const items = await Material.find(filter)
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
    const owner = request.user && idsMatch(item.uploader?._id, request.user._id);
    if (item.status !== 'approved' && !owner && !isAdmin(request.user)) {
      return response.status(404).json({ message: 'Material was not found.' });
    }
    if (request.user && item.status === 'approved' && !await canAccessMaterial(request.user, item)) {
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
  const fileValidation = validateMaterialFile(request.file);
  if (fileValidation.error) return response.status(400).json({ message: fileValidation.error });
  const metadataValidation = validateMaterialInput(request.body);
  if (metadataValidation.error) return response.status(400).json({ message: metadataValidation.error });
  if (metadataValidation.value.title.length > 180) {
    return response.status(400).json({ message: 'Material title must be at most 180 characters.' });
  }

  try {
    if (metadataValidation.value.category && !await Category.exists({ _id: metadataValidation.value.category })) {
      return response.status(400).json({ message: 'Material category was not found.' });
    }

    const storagePath = createMaterialStoragePath({
      university: request.user.university,
      department: request.user.department,
      userId: request.user._id,
      extension: fileValidation.value.extension,
    });
    const { bucket } = getStorageConfig();
    const { error: uploadError } = await getSupabaseClient().storage.from(bucket).upload(
      storagePath,
      request.file.buffer,
      { cacheControl: '60', contentType: request.file.mimetype, upsert: false },
    );
    if (uploadError) {
      const error = new Error('The material file could not be uploaded to Storage.');
      error.status = uploadError.statusCode === '409' ? 409 : 502;
      return next(error);
    }

    const materialId = new mongoose.Types.ObjectId();
    let item;
    try {
      item = await Material.create({
        _id: materialId,
        ...metadataValidation.value,
        uploader: request.user._id,
        university: request.user.university,
        department: request.user.department || null,
        storagePath,
        fileName: fileValidation.value.fileName,
        mimeType: request.file.mimetype,
        fileSize: request.file.size,
        status: 'pending',
      });
      await ActivityLog.create({
        actor: request.user._id,
        action: 'material.uploaded',
        entity: 'Material',
        entityId: String(item._id),
        ip: request.ip,
      });
    } catch (error) {
      let metadataRolledBack = !item;
      if (item) {
        try {
          await item.deleteOne();
          metadataRolledBack = true;
        } catch {
          console.error('Unable to roll back material metadata after upload failure.');
        }
      }
      if (metadataRolledBack) {
        try {
          await removeMaterialObject(storagePath);
        } catch {
          console.error('Unable to clean up a material object after upload failure.');
        }
      }
      return next(error);
    }
    return response.status(201).json({ item });
  } catch (error) {
    return next(error);
  }
}

async function loadAccessibleMaterial(request, response) {
  if (!mongoose.isValidObjectId(request.params.id)) {
    response.status(400).json({ message: 'Material id is invalid.' });
    return null;
  }
  const item = await Material.findById(request.params.id).select('+storagePath +fileUrl');
  if (!item) {
    response.status(404).json({ message: 'Material was not found.' });
    return null;
  }
  if (!await canAccessMaterial(request.user, item)) {
    response.status(403).json({ message: 'You are not allowed to access this material.' });
    return null;
  }
  return item;
}

async function download(request, response, next) {
  try {
    const item = await loadAccessibleMaterial(request, response);
    if (!item) return;
    if (!item.storagePath) {
      if (item.fileUrl) return response.json({ legacy: true });
      return response.status(404).json({ message: 'Material file was not found.' });
    }
    if (!STORAGE_PATH_PATTERN.test(item.storagePath)) {
      return response.status(404).json({ message: 'Material file was not found.' });
    }
    const { bucket } = getStorageConfig();
    const { data, error } = await getSupabaseClient().storage.from(bucket).createSignedUrl(
      item.storagePath,
      SIGNED_URL_TTL_SECONDS,
      { download: item.fileName },
    );
    if (error?.statusCode === '404' || error?.status === 404) {
      return response.status(404).json({ message: 'Material file was not found in Storage.' });
    }
    if (error || !data?.signedUrl) {
      return response.status(502).json({ message: 'Unable to create a temporary download link.' });
    }
    response.set('Cache-Control', 'no-store');
    return response.json({ url: data.signedUrl, expiresIn: SIGNED_URL_TTL_SECONDS });
  } catch (error) {
    return next(error);
  }
}

async function downloadLegacyFile(request, response, next) {
  try {
    const item = await loadAccessibleMaterial(request, response);
    if (!item) return;
    if (item.storagePath || !item.fileUrl) {
      return response.status(404).json({ message: 'Legacy material file was not found.' });
    }

    let fileName = item.fileUrl;
    if (/^https?:\/\//i.test(fileName)) {
      try {
        fileName = new URL(fileName).pathname;
      } catch {
        return response.status(404).json({ message: 'Legacy material file was not found.' });
      }
    }
    fileName = path.basename(String(fileName).replace(/\\/g, '/'));
    if (!/^[\w.-]{1,255}$/.test(fileName) || fileName === '.' || fileName === '..') {
      return response.status(404).json({ message: 'Legacy material file was not found.' });
    }
    const filePath = path.resolve(uploadDirectory, fileName);
    if (!filePath.startsWith(`${path.resolve(uploadDirectory)}${path.sep}`)) {
      return response.status(404).json({ message: 'Legacy material file was not found.' });
    }
    await fsPromises.access(filePath);
    const safeName = getSafeFileName(item.fileName) || 'material';
    response.type('application/octet-stream');
    response.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(safeName)}`);
    const stream = fs.createReadStream(filePath);
    stream.on('error', (error) => {
      if (response.headersSent) response.destroy(error);
      else next(error);
    });
    return stream.pipe(response);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return response.status(404).json({ message: 'This legacy file is no longer available. Please ask its owner to upload it again.' });
    }
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
  if (body.title !== undefined && (typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 180)) {
    return response.status(400).json({ message: 'Material title must be between 1 and 180 characters.' });
  }
  if (body.category && !mongoose.isValidObjectId(body.category)) {
    return response.status(400).json({ message: 'Material category is invalid.' });
  }
  try {
    const item = await Material.findById(request.params.id);
    if (!item) return response.status(404).json({ message: 'Material was not found.' });
    if (!isAdmin(request.user) && !idsMatch(item.uploader, request.user._id)) {
      return response.status(403).json({ message: 'You can only edit your own materials.' });
    }
    if (body.category && !await Category.exists({ _id: body.category })) {
      return response.status(400).json({ message: 'Material category was not found.' });
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
    const item = await Material.findById(request.params.id).select('+storagePath +fileUrl');
    if (!item) return response.status(404).json({ message: 'Material was not found.' });
    if (!isAdmin(request.user) && !idsMatch(item.uploader, request.user._id)) {
      return response.status(403).json({ message: 'You can only delete your own materials.' });
    }
    const previousData = item.toObject();
    await item.deleteOne();
    try {
      if (item.storagePath) await removeMaterialObject(item.storagePath);
      else if (item.fileUrl) {
        let legacyName = item.fileUrl;
        if (/^https?:\/\//i.test(legacyName)) {
          try {
            legacyName = new URL(legacyName).pathname;
          } catch {
            legacyName = '';
          }
        }
        legacyName = path.basename(String(legacyName).replace(/\\/g, '/'));
        if (/^[\w.-]{1,255}$/.test(legacyName) && legacyName !== '.' && legacyName !== '..') {
          await fsPromises.unlink(path.resolve(uploadDirectory, legacyName)).catch((error) => {
            if (error.code !== 'ENOENT') throw error;
          });
        }
      }
    } catch (error) {
      try {
        await Material.create(previousData);
      } catch {
        console.error('Unable to restore material metadata after Storage deletion failed.');
      }
      return next(error);
    }
    return response.json({ message: 'Material deleted.' });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  list,
  mine,
  get,
  upload,
  download,
  downloadLegacyFile,
  update,
  remove,
  canAccessMaterial,
};
