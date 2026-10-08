// Purpose: Handles group, membership, and group chat operations.
const mongoose = require('mongoose');
const Group = require('../models/Group');
const Message = require('../models/Message');
const { createNotification } = require('../services/notificationService');

function isMember(group, userId) {
  return group.members.some((member) => String(member?._id ?? member) === String(userId));
}

function canManage(group, user) {
  return user.role === 'admin' || String(group.owner?._id ?? group.owner) === String(user._id);
}

async function list(request, response, next) {
  try {
    const filter = request.user.role === 'admin' ? {} : { $or: [{ isPrivate: false }, { members: request.user._id }] };
    if (request.query.mine === 'true') filter.owner = request.user._id;
    const search = typeof (request.query.search || request.query.q) === 'string'
      ? String(request.query.search || request.query.q).trim().slice(0, 100)
      : '';
    if (search) {
      const expression = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$and = [...(filter.$and || []), { $or: [{ name: expression }, { title: expression }, { description: expression }, { course: expression }] }];
    }
    const items = await Group.find(filter)
      .populate('owner', 'name email role')
      .populate('members', 'name email role')
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean();
    return response.json({ items });
  } catch (error) {
    return next(error);
  }
}

async function get(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ message: 'Group id is invalid.' });
  try {
    const group = await Group.findById(request.params.id)
      .populate('owner', 'name email role')
      .populate('members', 'name email role');
    if (!group || (group.isPrivate && request.user.role !== 'admin' && !isMember(group, request.user._id))) {
      return response.status(404).json({ message: 'Group was not found.' });
    }
    return response.json({ item: group });
  } catch (error) {
    return next(error);
  }
}

async function create(request, response, next) {
  const { name, title, description = '', course = '', isPrivate = false } = request.body || {};
  const groupName = typeof name === 'string' ? name.trim() : typeof title === 'string' ? title.trim() : '';
  if (!groupName || groupName.length > 160 || typeof description !== 'string' || description.length > 2000
    || typeof course !== 'string' || typeof isPrivate !== 'boolean') {
    return response.status(400).json({ message: 'A group name and valid description are required.' });
  }
  try {
    const group = await Group.create({
      name: groupName,
      title: groupName,
      description: description.trim(),
      course: typeof course === 'string' ? course.trim() : '',
      isPrivate: Boolean(isPrivate),
      owner: request.user._id,
      members: [request.user._id],
    });
    return response.status(201).json({ item: group });
  } catch (error) {
    return next(error);
  }
}

async function update(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ message: 'Group id is invalid.' });
  const allowed = ['name', 'title', 'description', 'course', 'isPrivate'];
  const body = request.body || {};
  if (typeof body !== 'object' || Array.isArray(body) || !Object.keys(body).length
    || Object.keys(body).some((key) => !allowed.includes(key))) {
    return response.status(400).json({ message: 'Request contains unsupported group fields.' });
  }
  try {
    const group = await Group.findById(request.params.id);
    if (!group) return response.status(404).json({ message: 'Group was not found.' });
    if (!canManage(group, request.user)) return response.status(403).json({ message: 'Only the group owner can edit this group.' });
    if (body.name || body.title) {
      const value = body.name ?? body.title;
      if (typeof value !== 'string' || !value.trim() || value.length > 160) {
        return response.status(400).json({ message: 'Group name must be 1 to 160 characters.' });
      }
      group.name = value.trim();
      group.title = value.trim();
    }
    if (body.description !== undefined && (typeof body.description !== 'string' || body.description.length > 2000)) {
      return response.status(400).json({ message: 'Group description must be at most 2000 characters.' });
    }
    if (body.course !== undefined && (typeof body.course !== 'string' || body.course.length > 160)) {
      return response.status(400).json({ message: 'Course must be at most 160 characters.' });
    }
    if (body.isPrivate !== undefined && typeof body.isPrivate !== 'boolean') {
      return response.status(400).json({ message: 'isPrivate must be a boolean.' });
    }
    if (body.description !== undefined) group.description = body.description;
    if (body.course !== undefined) group.course = body.course;
    if (body.isPrivate !== undefined) group.isPrivate = body.isPrivate;
    await group.save();
    return response.json({ item: group });
  } catch (error) {
    return next(error);
  }
}

async function remove(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ message: 'Group id is invalid.' });
  try {
    const group = await Group.findById(request.params.id);
    if (!group) return response.status(404).json({ message: 'Group was not found.' });
    if (!canManage(group, request.user)) return response.status(403).json({ message: 'Only the group owner can delete this group.' });
    await Promise.all([group.deleteOne(), Message.deleteMany({ group: group._id })]);
    return response.json({ message: 'Group deleted.' });
  } catch (error) {
    return next(error);
  }
}

async function join(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ message: 'Group id is invalid.' });
  try {
    const group = await Group.findById(request.params.id);
    if (!group || group.isPrivate) return response.status(404).json({ message: 'Group was not found.' });
    if (!isMember(group, request.user._id)) {
      if (group.members.length >= 250) return response.status(409).json({ message: 'This group has reached its member limit.' });
      group.members.push(request.user._id);
      await group.save();
      await createNotification(group.owner, 'New group member', `${request.user.name || request.user.email} joined ${group.name}.`, `/lecturer/groups/${group._id}`);
    }
    return response.json({ item: group });
  } catch (error) {
    return next(error);
  }
}

async function leave(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ message: 'Group id is invalid.' });
  try {
    const group = await Group.findById(request.params.id);
    if (!group) return response.status(404).json({ message: 'Group was not found.' });
    if (String(group.owner) === String(request.user._id)) {
      return response.status(400).json({ message: 'The group owner cannot leave; transfer ownership or delete the group.' });
    }
    group.members = group.members.filter((memberId) => String(memberId) !== String(request.user._id));
    await group.save();
    return response.json({ item: group });
  } catch (error) {
    return next(error);
  }
}

async function members(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ message: 'Group id is invalid.' });
  try {
    const group = await Group.findById(request.params.id).populate('members', 'name email role');
    if (!group) return response.status(404).json({ message: 'Group was not found.' });
    if (group.isPrivate && !canManage(group, request.user) && !isMember(group, request.user._id)) {
      return response.status(403).json({ message: 'You must be a group member to view this list.' });
    }
    return response.json({ items: group.members });
  } catch (error) {
    return next(error);
  }
}

async function listMessages(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ message: 'Group id is invalid.' });
  try {
    const group = await Group.findById(request.params.id);
    if (!group || !isMember(group, request.user._id)) {
      return response.status(403).json({ message: 'Join the group to view its messages.' });
    }
    const items = await Message.find({ group: group._id })
      .populate('sender', 'name email')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return response.json({ items: items.reverse() });
  } catch (error) {
    return next(error);
  }
}

async function sendMessage(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ message: 'Group id is invalid.' });
  const body = request.body?.body ?? request.body?.message ?? request.body?.content;
  if (typeof body !== 'string' || !body.trim() || body.length > 5000) {
    return response.status(400).json({ message: 'Message must contain 1 to 5000 characters.' });
  }
  try {
    const group = await Group.findById(request.params.id);
    if (!group || !isMember(group, request.user._id)) {
      return response.status(403).json({ message: 'Join the group to send messages.' });
    }
    const item = await Message.create({ group: group._id, sender: request.user._id, body: body.trim() });
    await item.populate('sender', 'name email');
    return response.status(201).json({ item });
  } catch (error) {
    return next(error);
  }
}

module.exports = { list, get, create, update, remove, join, leave, members, listMessages, sendMessage };
