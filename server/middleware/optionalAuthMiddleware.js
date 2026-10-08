// Purpose: Attaches an authenticated user when a bearer token is provided.
const User = require('../models/User');
const { verifyToken } = require('../utils/token');

async function optionalAuthMiddleware(request, response, next) {
  const authorization = request.get('authorization') || '';
  const match = authorization.match(/^Bearer\s+(\S+)$/i);
  if (!match) return next();
  try {
    const claims = verifyToken(match[1]);
    const user = await User.findById(claims.sub).select('_id name email role status isActive approvalStatus emailVerified');
    if (user && user.isActive !== false && user.status !== 'suspended'
      && user.approvalStatus === 'approved' && user.emailVerified !== false) request.user = user;
    return next();
  } catch (error) {
    return response.status(401).json({ message: 'The authentication token is invalid or expired.' });
  }
}

module.exports = optionalAuthMiddleware;
