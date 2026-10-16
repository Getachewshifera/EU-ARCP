// Purpose: Creates the first administrator from private environment values.
const mongoose = require('mongoose');
const { connectDatabase } = require('../config/database');
const User = require('../models/User');
const University = require('../models/University');
const { hashPassword } = require('../utils/password');

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  const name = (process.env.ADMIN_NAME || '').trim();
  const username = (process.env.ADMIN_USERNAME || email.split('@')[0]).trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Set a valid ADMIN_EMAIL in server/.env.');
  }
  if (password.length < 8 || password.length > 200) {
    throw new Error('ADMIN_PASSWORD must contain between 8 and 200 characters.');
  }
  if (!name) throw new Error('Set ADMIN_NAME in server/.env.');
  if (!username || username.length > 50) throw new Error('ADMIN_USERNAME must contain 1 to 50 characters.');

  await connectDatabase();
  const university = await University.findOne({ name: 'Addis Ababa University' });
  if (!university) throw new Error('Addis Ababa University must exist before seeding the administrator.');
  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== 'admin') throw new Error('ADMIN_EMAIL already belongs to a non-admin account.');
    existing.approvalStatus = 'approved';
    existing.emailVerified = true;
    existing.status = 'ACTIVE';
    existing.isActive = true;
    await existing.save();
    return;
  }
  await User.create({
    name,
    firstName: name,
    username,
    identityId: username.toUpperCase(),
    email,
    password: await hashPassword(password),
    role: 'admin',
    status: 'ACTIVE',
    approvalStatus: 'approved',
    emailVerified: true,
    isActive: true,
    university: university._id,
  });
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
