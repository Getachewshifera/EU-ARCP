// Purpose: Handles user and profile requests.
const mongoose = require('mongoose');
const fs = require('fs/promises');
const path = require('path');
const User = require('../models/User');
const University = require('../models/University');
const College = require('../models/College');
const Department = require('../models/Department');
const Program = require('../models/Program');
const ActivityLog = require('../models/ActivityLog');
const Group = require('../models/Group');
const Message = require('../models/Message');
const PrivateMessage = require('../models/PrivateMessage');
const Notification = require('../models/Notification');
const Material = require('../models/Material');
const Report = require('../models/Report');
const RegistrationRequest = require('../models/RegistrationRequest');
const { validateUserUpdate } = require('../validators/userValidator');
const { normalizeUserProfileUpdate } = require('../validators/userProfileValidator');
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

async function deleteUser(request, response, next) {
  const { id } = request.params;
  if (!mongoose.isValidObjectId(id)) {
    return response.status(400).json({ message: 'User id is invalid.' });
  }

  try {
    const user = await User.findById(id);
    if (!user) return response.status(404).json({ message: 'User was not found.' });
    if (String(user._id) === String(request.user._id)) {
      return response.status(400).json({ message: 'You cannot delete your own administrator account.' });
    }

    const isActiveAdmin = user.role === 'admin'
      && ['active', 'ACTIVE'].includes(user.status)
      && user.isActive !== false
      && user.approvalStatus === 'approved'
      && user.emailVerified === true;
    if (isActiveAdmin) {
      const activeAdminCount = await User.countDocuments({
        role: 'admin',
        status: { $in: ['active', 'ACTIVE'] },
        isActive: { $ne: false },
        approvalStatus: 'approved',
        emailVerified: true,
      });
      if (activeAdminCount <= 1) {
        return response.status(400).json({ message: 'At least one active administrator must remain.' });
      }
    }

    const userId = user._id;
    const groups = await Group.find({ owner: userId }).select('_id').lean();
    const groupIds = groups.map((group) => group._id);
    const materials = await Material.find({ uploader: userId }).select('_id fileUrl').lean();
    const materialIds = materials.map((material) => material._id);

    for (const material of materials) {
      const filename = path.basename(material.fileUrl);
      await fs.unlink(path.resolve(__dirname, '../uploads', filename)).catch((error) => {
        if (error.code !== 'ENOENT') throw error;
      });
    }

    if (groupIds.length) {
      await Promise.all([
        Group.deleteMany({ _id: { $in: groupIds } }),
        Message.deleteMany({ group: { $in: groupIds } }),
      ]);
    }
    if (materialIds.length) {
      await Report.updateMany({ material: { $in: materialIds } }, { $unset: { material: '' } });
    }
    await Promise.all([
      Group.updateMany({ members: userId }, { $pull: { members: userId } }),
      Message.deleteMany({ sender: userId }),
      PrivateMessage.deleteMany({ $or: [{ sender: userId }, { recipient: userId }] }),
      Notification.deleteMany({ user: userId }),
      Material.deleteMany({ uploader: userId }),
      Report.deleteMany({ reporter: userId }),
      Report.updateMany({ reviewedBy: userId }, { $unset: { reviewedBy: '' } }),
      RegistrationRequest.deleteMany({ user: userId }),
      RegistrationRequest.updateMany({ reviewedBy: userId }, { $unset: { reviewedBy: '' } }),
    ]);
    await user.deleteOne();
    await ActivityLog.create({
      actor: request.user._id,
      action: 'user.deleted',
      entity: 'User',
      entityId: String(userId),
      metadata: { username: user.username, email: user.email, role: user.role },
      ip: request.ip,
    });

    return response.json({ message: 'User and associated account data deleted.' });
  } catch (error) {
    return next(error);
  }
}

async function getCurrentUser(request, response, next) {
  try {
    const user = await User.findById(request.user._id)
      .populate('university', 'name')
      .populate('college', 'name')
      .populate('department', 'name')
      .populate('program', 'name');
    if (!user) return response.status(404).json({ message: 'User was not found.' });
    return response.json({ user: safeUser(user) });
  } catch (error) {
    return next(error);
  }
}

async function updateCurrentUser(request, response, next) {
  const validation = normalizeUserProfileUpdate(request.body);
  if (validation.error) return response.status(400).json({ message: validation.error });
  const body = validation.value;
  try {
    const user = await User.findById(request.user._id);
    if (!user) return response.status(404).json({ message: 'User was not found.' });
    for (const key of Object.keys(body)) {
      if (key === 'email') {
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
          return response.status(400).json({ message: 'Enter a valid email address.' });
        }
        const existingEmail = await User.exists({ email, _id: { $ne: user._id } });
        if (existingEmail) return response.status(409).json({ message: 'That email address is already in use.' });
        user.email = email;
        continue;
      }
      const maxLength = ['firstName', 'middleName', 'lastName'].includes(key) ? 80
        : key === 'phone' ? 40
          : key === 'bio' ? 2000
            : key === 'profilePhoto' ? 500
            : key === 'academicYear' ? 50
              : 24;
      if (typeof body[key] !== 'string' || body[key].length > maxLength) {
        return response.status(400).json({ message: `Invalid value for ${key}.` });
      }
      const value = body[key].trim();
      if (['university', 'college', 'department', 'program'].includes(key)) {
        if (value && !mongoose.isValidObjectId(value)) {
          return response.status(400).json({ message: `Selected ${key} is invalid.` });
        }
        user[key] = value || undefined;
      } else {
        user[key] = value;
      }
    }
    if (!user.firstName || !user.lastName) {
      return response.status(400).json({ message: 'First name and last name cannot be empty.' });
    }
    if (body.firstName !== undefined || body.middleName !== undefined || body.lastName !== undefined) {
      user.name = [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ');
      if (user.name.length > 160) {
        return response.status(400).json({ message: 'Full name must be 160 characters or fewer.' });
      }
    }

    const university = await University.findById(user.university).select('_id');
    if (!university) return response.status(400).json({ message: 'Select a valid university.' });

    if (user.college) {
      const college = await College.findById(user.college).select('university');
      if (!college || String(college.university) !== String(user.university)) {
        return response.status(400).json({ message: 'Select a college belonging to the selected university.' });
      }
    }
    if (user.department) {
      const department = await Department.findById(user.department).select('college');
      if (!department || !user.college || String(department.college) !== String(user.college)) {
        return response.status(400).json({ message: 'Select a department belonging to the selected college.' });
      }
    }
    if (user.program) {
      const program = await Program.findById(user.program).select('department');
      if (!program || !user.department || String(program.department) !== String(user.department)) {
        return response.status(400).json({ message: 'Select a program belonging to the selected department.' });
      }
    }

    await user.save();
    await user.populate([
      { path: 'university', select: 'name' },
      { path: 'college', select: 'name' },
      { path: 'department', select: 'name' },
      { path: 'program', select: 'name' },
    ]);
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

module.exports = { listUsers, updateUser, deleteUser, getCurrentUser, updateCurrentUser, changePassword };
