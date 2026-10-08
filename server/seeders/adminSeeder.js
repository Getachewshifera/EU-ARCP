// Purpose: Creates the first administrator from private environment values.
const mongoose = require('mongoose');
const { connectDatabase } = require('../config/database');
const User = require('../models/User');
const { hashPassword } = require('../utils/password');

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  const name = (process.env.ADMIN_NAME || '').trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Set a valid ADMIN_EMAIL in server/.env.');
  }
  if (password.length < 12) throw new Error('ADMIN_PASSWORD must contain at least 12 characters.');
  if (!name) throw new Error('Set ADMIN_NAME in server/.env.');

  await connectDatabase();
  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== 'admin') throw new Error('ADMIN_EMAIL already belongs to a non-admin account.');
    existing.approvalStatus = 'approved';
    existing.emailVerified = true;
    existing.status = 'active';
    existing.isActive = true;
    await existing.save();
    console.log(`Administrator account already exists: ${email}`);
    return;
  }
  await User.create({
    name,
    firstName: name,
    email,
    password: await hashPassword(password),
    role: 'admin',
    status: 'active',
    approvalStatus: 'approved',
    emailVerified: true,
    isActive: true,
  });
  console.log(`Administrator account created: ${email}`);
}

if (require.main === module) {
  seedAdmin()
    .catch((error) => {
      console.error('Unable to seed administrator:', error.message);
      process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
}

module.exports = { seedAdmin };
