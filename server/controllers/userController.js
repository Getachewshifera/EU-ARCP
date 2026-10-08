// Purpose: Handles user and profile requests.
const mongoose = require('mongoose');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { validateUserUpdate } = require('../validators/userValidator');
const { hashPassword, verifyPassword } = require('../utils/password');

function safeUser(user) {
  const record = user.toObject ? user.toObject() : { ...user };
  delete record.password;
  delete record.otpHash;
  delete record.otpExpiresAt;
  delete record.resetTokenHash;
  delete record.resetTokenExpiresAt;
  return record;
}

async function listUsers(request, response, next) {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(Math.min(500, Math.max(1, Number.parseInt(request.query.limit, 10) || 500)))
      .lean();
    return response.json({ items: users });
  } catch (error) {
    return next(error);
  }
}

async function updateUser(request, response, next) {
  const { id } = request.params;
  if (!mongoose.isValidObjectId(id)) {
    return response.status(400).json({ message: 'User id is invalid.' });
  }

  const validation = validateUserUpdate(request.body);
  if (validation.error) {
    return response.status(400).json({ message: validation.error });
  }

  try {
    const user = await User.findById(id).select('-password');
    if (!user) return response.status(404).json({ message: 'User was not found.' });

    const changes = validation.value;
    const deactivatesCurrentAdmin = String(user._id) === String(request.user._id)
      && ((changes.role !== undefined && changes.role !== 'admin')
        || changes.status === 'suspended');
    if (deactivatesCurrentAdmin) {
      return response.status(400).json({ message: 'You cannot remove your own administrator access.' });
    }

    const removesActiveAdmin = user.role === 'admin'
      && user.status !== 'suspended'
      && user.isActive !== false
      && ((changes.role !== undefined && changes.role !== 'admin')
        || changes.status === 'suspended');
    if (removesActiveAdmin) {
      const activeAdminCount = await User.countDocuments({
        role: 'admin',
        status: 'active',
        isActive: true,
        approvalStatus: 'approved',
        emailVerified: true,
      });
      if (activeAdminCount <= 1) {
        return response.status(400).json({ message: 'At least one active administrator must remain.' });
      }
    }

    if (changes.role !== undefined) user.role = changes.role;
    if (changes.status !== undefined) {
      user.status = changes.status;
      user.isActive = changes.status === 'active';
    }
    await user.save();
    if (changes.role !== undefined || changes.status !== undefined) {
      await ActivityLog.create({
        actor: request.user._id,
        action: changes.role !== undefined ? 'user.role_updated' : `user.${changes.status}`,
        entity: 'User',
        entityId: String(user._id),
        metadata: changes,
        ip: request.ip,
      });
    }
    return response.json({ item: safeUser(user) });
  } catch (error) {
    return next(error);
  }
}

async function getCurrentUser(request, response, next) {
  try {
    const user = await User.findById(request.user._id);
    if (!user) return response.status(404).json({ message: 'User was not found.' });
    return response.json({ user: safeUser(user) });
  } catch (error) {
    return next(error);
  }
}

async function updateCurrentUser(request, response, next) {
  const allowed = ['firstName', 'lastName', 'name', 'bio', 'profilePicture', 'university', 'college', 'department', 'program', 'studentId', 'employeeId', 'phone', 'email'];
  const body = request.body || {};
  if (!body || typeof body !== 'object' || Array.isArray(body)
    || Object.keys(body).length === 0 || Object.keys(body).some((key) => !allowed.includes(key))) {
    return response.status(400).json({ message: 'Only profile fields can be updated.' });
  }
  try {
    const user = await User.findById(request.user._id);
    if (!user) return response.status(404).json({ message: 'User was not found.' });
    for (const key of Object.keys(body)) {
      if (key === 'email') {
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        if (email !== user.email) {
          return response.status(400).json({ message: 'Email address changes require a separate verification flow.' });
        }
        continue;
      }
      if (typeof body[key] !== 'string' || body[key].length > 2000) {
        return response.status(400).json({ message: `Invalid value for ${key}.` });
      }
      user[key] = body[key].trim();
    }
    if (body.firstName !== undefined || body.lastName !== undefined) {
      user.name = [user.firstName, user.lastName].filter(Boolean).join(' ');
    }
    await user.save();
    return response.json({ user: safeUser(user) });
  } catch (error) {
    return next(error);
  }
}

async function changePassword(request, response, next) {
  const { currentPassword, newPassword } = request.body || {};
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string'
    || newPassword.length < 8 || newPassword.length > 200) {
    return response.status(400).json({ message: 'Current password and a new password of at least 8 characters are required.' });
  }
  try {
    const user = await User.findById(request.user._id).select('+password');
    if (!user) return response.status(404).json({ message: 'User was not found.' });
    if (!(await verifyPassword(currentPassword, user.password))) {
      return response.status(400).json({ message: 'Current password is incorrect.' });
    }
    user.password = await hashPassword(newPassword);
    await user.save();
    return response.json({ message: 'Password changed successfully.' });
  } catch (error) {
    return next(error);
  }
}

module.exports = { listUsers, updateUser, getCurrentUser, updateCurrentUser, changePassword };
