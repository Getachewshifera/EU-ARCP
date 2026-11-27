// Purpose: Handles group, membership, and group chat operations.
const mongoose = require("mongoose");
const Group = require("../models/Group");
const Message = require("../models/Message");
const User = require("../models/User");
const { createNotification } = require("../services/notificationService");
const { getSignedChatUrl, removeChatFile, uploadGroupChatAttachment, uploadGroupImage } = require("../services/chatAttachmentService");
const { emitToGroup, removeUserFromRoom } = require("../sockets/socket");

const ALLOWED_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "👏"];

function isMember(group, userId) {
  return group.members.some(
    (member) => String(member?._id ?? member) === String(userId),
  );
}

function isGroupAdmin(group, userId) {
  return (group.admins || []).some(
    (admin) => String(admin?._id ?? admin) === String(userId),
  );
}

function canManage(group, user) {
  return (
    user.role === "admin" ||
    String(group.owner?._id ?? group.owner) === String(user._id) ||
    isGroupAdmin(group, user._id)
  );
}

function canDelete(group, user) {
  return (
    user.role === "admin" ||
    String(group.owner?._id ?? group.owner) === String(user._id)
  );
}

async function withPermissions(group, user) {
  const item = typeof group.toObject === "function" ? group.toObject() : group;
  const owner = String(item.owner?._id ?? item.owner) === String(user._id);
  const imageUrl = item.imagePath ? await getSignedChatUrl(item.imagePath) : "";
  return {
    ...item,
    imageUrl,
    isMember: isMember(item, user._id),
    permissions: {
      canEdit: canManage(item, user),
      canDelete: canDelete(item, user),
      canManageAdmins: owner || user.role === "admin",
      canLeave: isMember(item, user._id) && !owner,
    },
  };
}

async function list(request, response, next) {
  try {
    const filter =
      request.user.role === "admin"
        ? {}
        : { $or: [{ isPrivate: false }, { members: request.user._id }] };
    if (request.query.mine === "true") filter.owner = request.user._id;
    const search =
      typeof (request.query.search || request.query.q) === "string"
        ? String(request.query.search || request.query.q)
            .trim()
            .slice(0, 100)
        : "";
    if (search) {
      const expression = new RegExp(
        search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            { name: expression },
            { title: expression },
            { description: expression },
            { course: expression },
          ],
        },
      ];
    }
    const items = await Group.find(filter)
      .populate("owner", "name email role")
      .populate("members", "name email role")
      .populate("admins", "name email role")
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean();
    return response.json({
      items: await Promise.all(items.map((item) => withPermissions(item, request.user))),
    });
  } catch (error) {
    return next(error);
  }
}

async function get(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.id))
    return response.status(400).json({ message: "Group id is invalid." });
  try {
    const group = await Group.findById(request.params.id)
      .populate("owner", "name email role")
      .populate("members", "name email role")
      .populate("admins", "name email role");
    if (
      !group ||
      (group.isPrivate &&
        request.user.role !== "admin" &&
        !isMember(group, request.user._id))
    ) {
      return response.status(404).json({ message: "Group was not found." });
    }
    return response.json({ item: await withPermissions(group, request.user) });
  } catch (error) {
    return next(error);
  }
}

async function create(request, response, next) {
  const {
    name,
    title,
    description = "",
    course = "",
    groupType = "custom",
    isPrivate = false,
  } = request.body || {};
  const groupName =
    typeof name === "string"
      ? name.trim()
      : typeof title === "string"
        ? title.trim()
        : "";
  if (
    !groupName ||
    groupName.length > 160 ||
    typeof description !== "string" ||
    description.length > 2000 ||
    typeof course !== "string" ||
    !["university", "department", "course", "class", "custom"].includes(groupType) ||
    typeof isPrivate !== "boolean"
  ) {
    return response
      .status(400)
      .json({ message: "A group name and valid description are required." });
  }
  try {
    const group = await Group.create({
      name: groupName,
      title: groupName,
      description: description.trim(),
      course: typeof course === "string" ? course.trim() : "",
      groupType,
      isPrivate: Boolean(isPrivate),
      owner: request.user._id,
      members: [request.user._id],
    });
    return response
      .status(201)
      .json({ item: await withPermissions(group, request.user) });
  } catch (error) {
    return next(error);
  }
}

async function update(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.id))
    return response.status(400).json({ message: "Group id is invalid." });
  const allowed = ["name", "title", "description", "course", "groupType", "isPrivate"];
  const body = request.body || {};
  if (
    typeof body !== "object" ||
    Array.isArray(body) ||
    !Object.keys(body).length ||
    Object.keys(body).some((key) => !allowed.includes(key))
  ) {
    return response
      .status(400)
      .json({ message: "Request contains unsupported group fields." });
  }
  try {
    const group = await Group.findById(request.params.id);
    if (!group)
      return response.status(404).json({ message: "Group was not found." });
    if (!canManage(group, request.user))
      return response
        .status(403)
        .json({ message: "Only a group admin can edit this group." });
    if (body.name || body.title) {
      const value = body.name ?? body.title;
      if (typeof value !== "string" || !value.trim() || value.length > 160) {
        return response
          .status(400)
          .json({ message: "Group name must be 1 to 160 characters." });
      }
      group.name = value.trim();
      group.title = value.trim();
    }
    if (
      body.description !== undefined &&
      (typeof body.description !== "string" || body.description.length > 2000)
    ) {
      return response
        .status(400)
        .json({
          message: "Group description must be at most 2000 characters.",
        });
    }
    if (
      body.course !== undefined &&
      (typeof body.course !== "string" || body.course.length > 160)
    ) {
      return response
        .status(400)
        .json({ message: "Course must be at most 160 characters." });
    }
    if (body.isPrivate !== undefined && typeof body.isPrivate !== "boolean") {
      return response
        .status(400)
        .json({ message: "isPrivate must be a boolean." });
    }
    if (body.groupType !== undefined
      && !["university", "department", "course", "class", "custom"].includes(body.groupType)) {
      return response.status(400).json({ message: "Group type is invalid." });
    }
    if (body.description !== undefined) group.description = body.description;
    if (body.course !== undefined) group.course = body.course;
    if (body.isPrivate !== undefined) group.isPrivate = body.isPrivate;
    if (body.groupType !== undefined) group.groupType = body.groupType;
    await group.save();
    return response.json({ item: await withPermissions(group, request.user) });
  } catch (error) {
    return next(error);
  }
}

async function remove(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.id))
    return response.status(400).json({ message: "Group id is invalid." });
  try {
    const group = await Group.findById(request.params.id);
    if (!group)
      return response.status(404).json({ message: "Group was not found." });
    if (!canDelete(group, request.user))
      return response
        .status(403)
        .json({ message: "Only the group owner can delete this group." });
    const messages = await Message.find({ group: group._id }).select("attachments").lean();
    const filePaths = messages.flatMap((message) => (message.attachments || [])
      .map((attachment) => attachment.storagePath));
    if (group.imagePath) filePaths.push(group.imagePath);
    await Promise.all(filePaths.map((storagePath) => removeChatFile(storagePath)));
    await Promise.all([group.deleteOne(), Message.deleteMany({ group: group._id })]);
    emitToGroup(group._id, "group:deleted", { groupId: String(group._id) });
    return response.json({ message: "Group deleted." });
  } catch (error) {
    return next(error);
  }
}

async function updateAdmin(request, response, next) {
  if (
    !mongoose.isValidObjectId(request.params.id) ||
    !mongoose.isValidObjectId(request.body?.userId)
  ) {
    return response
      .status(400)
      .json({ message: "Group and user ids must be valid." });
  }
  if (typeof request.body.isAdmin !== "boolean") {
    return response.status(400).json({ message: "isAdmin must be a boolean." });
  }
  try {
    const group = await Group.findById(request.params.id);
    if (!group)
      return response.status(404).json({ message: "Group was not found." });
    if (
      request.user.role !== "admin" &&
      String(group.owner) !== String(request.user._id)
    ) {
      return response
        .status(403)
        .json({ message: "Only the group owner can assign group admins." });
    }
    const userId = String(request.body.userId);
    if (userId === String(group.owner))
      return response
        .status(400)
        .json({ message: "The group owner is already an admin." });
    if (!group.members.some((memberId) => String(memberId) === userId)) {
      return response
        .status(400)
        .json({ message: "Only group members can be assigned as admins." });
    }
    const existingIndex = group.admins.findIndex(
      (adminId) => String(adminId) === userId,
    );
    if (request.body.isAdmin && existingIndex === -1)
      group.admins.push(request.body.userId);
    if (!request.body.isAdmin && existingIndex !== -1)
      group.admins.splice(existingIndex, 1);
    await group.save();
    await group.populate(["owner", "members", "admins"]);
    return response.json({ item: await withPermissions(group, request.user) });
  } catch (error) {
    return next(error);
  }
}

async function inviteMember(request, response, next) {
  const email =
    typeof request.body?.email === "string"
      ? request.body.email.trim().toLowerCase()
      : "";
  if (!email || email.length > 254)
    return response
      .status(400)
      .json({ message: "A valid member email is required." });
  try {
    const group = await Group.findById(request.params.id);
    if (!group)
      return response.status(404).json({ message: "Group was not found." });
    if (!canManage(group, request.user))
      return response
        .status(403)
        .json({ message: "Only a group admin can add members." });
    const user = await User.findOne({
      email,
      status: "ACTIVE",
      isActive: { $ne: false },
    }).select("_id");
    if (!user)
      return response
        .status(404)
        .json({ message: "No active account was found for that email." });
    if (
      !group.members.some((memberId) => String(memberId) === String(user._id))
    ) {
      if (group.members.length >= 250)
        return response
          .status(409)
          .json({ message: "This group has reached its member limit." });
      group.members.push(user._id);
      await group.save();
    }
    emitToGroup(group._id, "group:member-added", {
      groupId: String(group._id),
      userId: String(user._id),
    });
    await group.populate(["owner", "members", "admins"]);
    return response.json({ item: await withPermissions(group, request.user) });
  } catch (error) {
    return next(error);
  }
}

async function removeMember(request, response, next) {
  const { id, userId } = request.params;
  if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(userId)) {
    return response.status(400).json({ message: "Group and user ids must be valid." });
  }
  try {
    const group = await Group.findById(id);
    if (!group) return response.status(404).json({ message: "Group was not found." });
    if (!canManage(group, request.user)) {
      return response.status(403).json({ message: "Only a group admin can remove members." });
    }
    if (String(group.owner) === userId) {
      return response.status(400).json({ message: "The group owner cannot be removed." });
    }
    if (!isMember(group, userId)) {
      return response.status(404).json({ message: "Group member was not found." });
    }
    group.members = group.members.filter((memberId) => String(memberId) !== userId);
    group.admins = group.admins.filter((adminId) => String(adminId) !== userId);
    await group.save();
    await removeUserFromRoom(userId, `group:${group._id}`);
    emitToGroup(group._id, "group:member-removed", { groupId: String(group._id), userId });
    return response.json({ item: await withPermissions(group, request.user) });
  } catch (error) {
    return next(error);
  }
}

async function join(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.id))
    return response.status(400).json({ message: "Group id is invalid." });
  try {
    const group = await Group.findById(request.params.id);
    if (!group || group.isPrivate)
      return response.status(404).json({ message: "Group was not found." });
    if (!isMember(group, request.user._id)) {
      if (group.members.length >= 250)
        return response
          .status(409)
          .json({ message: "This group has reached its member limit." });
      group.members.push(request.user._id);
      await group.save();
      await createNotification(
        group.owner,
        "New group member",
        `${request.user.name || request.user.email} joined ${group.name}.`,
        `/lecturer/groups/${group._id}`,
      );
      emitToGroup(group._id, "group:member-added", {
        groupId: String(group._id),
        userId: String(request.user._id),
      });
    }
    return response.json({ item: await withPermissions(group, request.user) });
  } catch (error) {
    return next(error);
  }
}

async function leave(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.id))
    return response.status(400).json({ message: "Group id is invalid." });
  try {
    const group = await Group.findById(request.params.id);
    if (!group)
      return response.status(404).json({ message: "Group was not found." });
    if (String(group.owner) === String(request.user._id)) {
      return response
        .status(400)
        .json({
          message:
            "The group owner cannot leave; transfer ownership or delete the group.",
        });
    }
    group.members = group.members.filter(
      (memberId) => String(memberId) !== String(request.user._id),
    );
    group.admins = group.admins.filter(
      (adminId) => String(adminId) !== String(request.user._id),
    );
    await group.save();
    await removeUserFromRoom(request.user._id, `group:${group._id}`);
    emitToGroup(group._id, "group:member-removed", {
      groupId: String(group._id),
      userId: String(request.user._id),
    });
    return response.json({ item: await withPermissions(group, request.user) });
  } catch (error) {
    return next(error);
  }
}

async function members(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.id))
    return response.status(400).json({ message: "Group id is invalid." });
  try {
    const group = await Group.findById(request.params.id).populate(
      "members",
      "name email role",
    );
    if (!group)
      return response.status(404).json({ message: "Group was not found." });
    if (
      group.isPrivate &&
      !canManage(group, request.user) &&
      !isMember(group, request.user._id)
    ) {
      return response
        .status(403)
        .json({ message: "You must be a group member to view this list." });
    }
    return response.json({ items: group.members });
  } catch (error) {
    return next(error);
  }
}

async function listMessages(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.id))
    return response.status(400).json({ message: "Group id is invalid." });
  try {
    const group = await Group.findById(request.params.id);
    if (!group || (!isMember(group, request.user._id) && request.user.role !== "admin")) {
      return response
        .status(403)
        .json({ message: "Join the group to view its messages." });
    }
    const filter = { group: group._id };
    if (request.query.beforeId) {
      if (!mongoose.isValidObjectId(request.query.beforeId)) {
        return response.status(400).json({ message: "Message cursor is invalid." });
      }
      filter._id = { $lt: request.query.beforeId };
    }
    const parsedLimit = Number.parseInt(request.query.limit, 10);
    const limit = Math.min(100, Math.max(1, Number.isNaN(parsedLimit) ? 50 : parsedLimit));
    const records = await Message.find(filter)
      .populate("sender", "name email role profilePhoto")
      .populate({ path: "reactions.user", select: "name firstName lastName" })
      .populate({
        path: "replyTo",
        select: "body sender createdAt deletedAt attachments.name attachments.mimeType attachments.size",
        populate: { path: "sender", select: "name email role profilePhoto" },
      })
      .sort({ _id: -1 })
      .limit(limit + 1);
    const hasMore = records.length > limit;
    return response.json({ items: records.slice(0, limit).reverse().map(safeGroupMessage), hasMore });
  } catch (error) {
    return next(error);
  }
}

function safeGroupMessage(message) {
  const record = message.toObject ? message.toObject() : { ...message };
  record.attachments = (record.attachments || []).map(({ _id, name, mimeType, size }) => ({
    _id,
    name,
    mimeType,
    size,
  }));
  if (record.replyTo?.attachments) {
    record.replyTo.attachments = record.replyTo.attachments.map(({ _id, name, mimeType, size }) => ({
      _id,
      name,
      mimeType,
      size,
    }));
  }
  return record;
}

async function sendMessage(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.id))
    return response.status(400).json({ message: "Group id is invalid." });
  const body = request.body?.body ?? request.body?.message ?? request.body?.content ?? "";
  const replyTo = request.body?.replyTo;
  if (typeof body !== "string" || body.length > 5000) {
    return response
      .status(400)
      .json({ message: "Message must contain at most 5000 characters." });
  }
  if (!body.trim() && !request.file) {
    return response.status(400).json({ message: "Enter a message or attach a document." });
  }
  if (replyTo && !mongoose.isValidObjectId(replyTo)) {
    return response.status(400).json({ message: "Reply target is invalid." });
  }
  let attachment;
  try {
    const group = await Group.findById(request.params.id);
    if (!group || (!isMember(group, request.user._id) && request.user.role !== "admin")) {
      return response
        .status(403)
        .json({ message: "Join the group to send messages." });
    }
    if (replyTo) {
      const parent = await Message.findOne({ _id: replyTo, group: group._id, deletedAt: null }).select("_id");
      if (!parent) return response.status(404).json({ message: "Reply target was not found." });
    }
    if (request.file) attachment = await uploadGroupChatAttachment(request.file, String(group._id));
    const item = await Message.create({
      group: group._id,
      sender: request.user._id,
      body: body.trim(),
      replyTo: replyTo || undefined,
      attachments: attachment ? [attachment] : [],
    });
    await item.populate([
      { path: "sender", select: "name email role profilePhoto" },
      {
        path: "replyTo",
        select: "body sender createdAt deletedAt attachments.name attachments.mimeType attachments.size",
        populate: { path: "sender", select: "name email role profilePhoto" },
      },
    ]);
    const message = safeGroupMessage(item);
    emitToGroup(group._id, "group:message", message);
    return response.status(201).json({ item: message });
  } catch (error) {
    if (attachment) await removeChatFile(attachment.storagePath);
    return next(error);
  }
}

async function getMessageAttachment(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.id) || !mongoose.isValidObjectId(request.params.messageId)) {
    return response.status(400).json({ message: "Group or message id is invalid." });
  }
  if (!/^\d+$/.test(request.params.attachmentIndex)) {
    return response.status(400).json({ message: "Attachment index is invalid." });
  }
  try {
    const group = await Group.findById(request.params.id).select("members");
    if (!group || (!isMember(group, request.user._id) && request.user.role !== "admin")) {
      return response.status(403).json({ message: "Join the group to access its attachments." });
    }
    const message = await Message.findOne({
      _id: request.params.messageId,
      group: group._id,
      deletedAt: null,
    }).select("attachments");
    const attachment = message?.attachments[Number(request.params.attachmentIndex)];
    if (!attachment) return response.status(404).json({ message: "Attachment was not found." });
    return response.json({ url: await getSignedChatUrl(attachment.storagePath) });
  } catch (error) {
    return next(error);
  }
}

async function deleteMessage(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.id) || !mongoose.isValidObjectId(request.params.messageId)) {
    return response.status(400).json({ message: "Group or message id is invalid." });
  }
  try {
    const group = await Group.findById(request.params.id);
    if (!group || (!isMember(group, request.user._id) && request.user.role !== "admin")) {
      return response.status(403).json({ message: "Join the group to manage its messages." });
    }
    const message = await Message.findOne({ _id: request.params.messageId, group: group._id });
    if (!message) return response.status(404).json({ message: "Message was not found." });
    if (String(message.sender) !== String(request.user._id) && !canManage(group, request.user)) {
      return response.status(403).json({ message: "You can only delete your own messages." });
    }
    await Promise.all((message.attachments || []).map((attachment) => removeChatFile(attachment.storagePath)));
    message.body = "";
    message.attachments = [];
    message.deletedAt = new Date();
    message.deletedBy = request.user._id;
    await message.save();
    const item = { _id: String(message._id), group: String(group._id), deletedAt: message.deletedAt };
    emitToGroup(group._id, "group:message-deleted", item);
    return response.json({ item });
  } catch (error) {
    return next(error);
  }
}

async function reactToMessage(request, response, next) {
  const { id, messageId } = request.params;
  const emoji = request.body?.emoji;
  if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(messageId)) {
    return response.status(400).json({ message: "Group or message id is invalid." });
  }
  if (!ALLOWED_REACTIONS.includes(emoji)) {
    return response.status(400).json({ message: "Reaction is not supported." });
  }
  try {
    const group = await Group.findById(id);
    if (!group || (!isMember(group, request.user._id) && request.user.role !== "admin")) {
      return response.status(403).json({ message: "Join the group to react to messages." });
    }
    const message = await Message.findOne({ _id: messageId, group: group._id, deletedAt: null });
    if (!message) return response.status(404).json({ message: "Message was not found." });

    const existingIndex = message.reactions.findIndex(
      (reaction) => String(reaction.user) === String(request.user._id),
    );
    if (existingIndex >= 0 && message.reactions[existingIndex].emoji === emoji) {
      message.reactions.splice(existingIndex, 1);
    } else if (existingIndex >= 0) {
      message.reactions[existingIndex].emoji = emoji;
    } else {
      message.reactions.push({ user: request.user._id, emoji });
    }
    await message.save();
    await message.populate([
      { path: "sender", select: "name email role profilePhoto" },
      {
        path: "replyTo",
        select: "body sender createdAt deletedAt attachments.name attachments.mimeType attachments.size",
        populate: { path: "sender", select: "name email role profilePhoto" },
      },
      { path: "reactions.user", select: "name firstName lastName" },
    ]);
    const item = safeGroupMessage(message);
    emitToGroup(group._id, "group:message-reaction", item);
    return response.json({ item });
  } catch (error) {
    return next(error);
  }
}

async function uploadImage(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.id)) {
    return response.status(400).json({ message: "Group id is invalid." });
  }
  if (!request.file) return response.status(400).json({ message: "A group image is required." });
  try {
    const group = await Group.findById(request.params.id);
    if (!group) return response.status(404).json({ message: "Group was not found." });
    if (!canManage(group, request.user)) {
      return response.status(403).json({ message: "Only a group admin can update its image." });
    }
    const previousPath = group.imagePath;
    group.imagePath = await uploadGroupImage(request.file, String(group._id));
    await group.save();
    if (previousPath) await removeChatFile(previousPath);
    return response.json({ item: await withPermissions(group, request.user) });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  list,
  get,
  create,
  update,
  remove,
  updateAdmin,
  inviteMember,
  removeMember,
  join,
  leave,
  members,
  listMessages,
  sendMessage,
  getMessageAttachment,
  deleteMessage,
  reactToMessage,
  uploadImage,
};
