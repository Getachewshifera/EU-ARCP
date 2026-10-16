const mongoose = require('mongoose');
const ContactMessage = require('../models/ContactMessage');

async function create(request, response, next) {
  const { name, email, subject, message } = request.body || {};
  if (typeof name !== 'string' || !name.trim() || name.length > 120
    || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.length > 254
    || typeof subject !== 'string' || !subject.trim() || subject.length > 160
    || typeof message !== 'string' || !message.trim() || message.length > 4000) {
    return response.status(400).json({ message: 'Provide a valid name, email, subject, and message.' });
  }
  try {
    await ContactMessage.create({ name: name.trim(), email: email.trim().toLowerCase(), subject: subject.trim(), message: message.trim() });
    return response.status(201).json({ message: 'Your message was sent to the administration team.' });
  } catch (error) {
    return next(error);
  }
}

async function list(_request, response, next) {
  try {
    const items = await ContactMessage.find().sort({ createdAt: -1 }).limit(200).lean();
    return response.json({ items });
  } catch (error) {
    return next(error);
  }
}

async function update(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ message: 'Message id is invalid.' });
  const { status } = request.body || {};
  if (!['open', 'read', 'closed'].includes(status)) return response.status(400).json({ message: 'Choose a valid message status.' });
  try {
    const item = await ContactMessage.findByIdAndUpdate(request.params.id, { status }, { new: true, runValidators: true });
    if (!item) return response.status(404).json({ message: 'Contact message was not found.' });
    return response.json({ item });
  } catch (error) {
    return next(error);
  }
}

module.exports = { create, list, update };