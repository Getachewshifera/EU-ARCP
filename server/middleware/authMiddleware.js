// Purpose: Authenticates requests before protected handlers run.
const User = require('../models/User');
const { verifyToken } = require('../utils/token');

async function authMiddleware(request, response, next) {
  const authorization = request.get('authorization') || '';
  const match = authorization.match(/^Bearer\s+(\S+)$/i);
  if (!match) {
    return response.status(401).json({ message: 'Authentication is required.' });
  }

  if ((process.env.JWT_SECRET || '').trim().length < 32) {
    return response.status(500).json({ message: 'Server authentication is not configured.' });
  }

  let claims;
  try {
    claims = verifyToken(match[1]);
  } catch {
    return response.status(401).json({ message: 'The authentication token is invalid or expired.' });
  }

  const user = await User.findById(claims.sub)
    .select('_id name email role status isActive approvalStatus emailVerified');
  if (!user) {
    return response.status(401).json({ message: 'The account for this token no longer exists.' });
  }
  if (user.isActive === false || user.status === 'suspended') {
    return response.status(403).json({ message: 'This account is suspended.' });
  }
  if (user.approvalStatus !== 'approved' || user.emailVerified === false) {
    return response.status(403).json({ message: 'This account is not approved and verified.' });
  }

  request.user = user;
  return next();
}

module.exports = authMiddleware;
