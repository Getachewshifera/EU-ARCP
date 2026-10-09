// Purpose: Authentication business logic.
const { hashPassword, verifyPassword } = require('../utils/password');
const { signToken } = require('../utils/token');

async function createSession(user) {
  return {
    token: signToken({ sub: String(user._id), role: user.role }),
    user: {
      _id: String(user._id),
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      university: user.university,
      college: user.college,
      department: user.department,
      program: user.program,
      academicYear: user.academicYear,
      profilePhoto: user.profilePhoto,
    },
  };
}

async function hashAndStorePassword(password) {
  return hashPassword(password);
}

module.exports = { createSession, hashAndStorePassword, verifyPassword };
