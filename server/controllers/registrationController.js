// Purpose: Handles account application status and administrator review.
const mongoose = require('mongoose');
const RegistrationRequest = require('../models/RegistrationRequest');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

async function list(request, response, next) {
  try {
    const filter = {};
    if (['pending', 'approved', 'rejected'].includes(request.query.status)) filter.status = request.query.status;
    const items = await RegistrationRequest.find(filter)
      .populate('user', 'name email role status approvalStatus')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();
    return response.json({ items });
  } catch (error) {
    return next(error);
  }
}

async function getStatus(request, response, next) {
  const email = typeof request.query.email === 'string' ? request.query.email.trim().toLowerCase() : '';
  if (!email) return response.status(400).json({ message: 'Email is required.' });
  try {
    const application = await RegistrationRequest.findOne({ email }).sort({ createdAt: -1 }).lean();
    if (!application) return response.status(404).json({ message: 'No registration was found for this email.' });
    return response.json({
      email: application.email,
      status: application.status,
      note: application.note || '',
      role: application.role,
      createdAt: application.createdAt,
    });
  } catch (error) {
    return next(error);
  }
}

async function review(request, response, next) {
  const { id } = request.params;
  const { status, note = '' } = request.body || {};
  if (!mongoose.isValidObjectId(id)) return response.status(400).json({ message: 'Registration id is invalid.' });
  if (!['approved', 'rejected', 'pending'].includes(status)
    || typeof note !== 'string' || note.length > 1000) {
    return response.status(400).json({ message: 'Provide a valid status and a note of at most 1000 characters.' });
  }
  try {
    const application = await RegistrationRequest.findById(id);
    if (!application) return response.status(404).json({ message: 'Registration was not found.' });
    const user = await User.findById(application.user);
    if (!user) return response.status(409).json({ message: 'The applicant account no longer exists.' });

    application.status = status;
    application.note = note.trim();
    application.reviewedBy = request.user._id;
    application.reviewedAt = new Date();
    user.approvalStatus = status;
    user.isActive = status !== 'rejected' && user.status !== 'suspended';
    await Promise.all([application.save(), user.save()]);
    await ActivityLog.create({
      actor: request.user._id,
      action: `registration.${status}`,
      entity: 'RegistrationRequest',
      entityId: String(application._id),
      metadata: { email: application.email, note: application.note },
      ip: request.ip,
    });
    return response.json({ item: application });
  } catch (error) {
    return next(error);
  }
}

module.exports = { list, getStatus, review };
