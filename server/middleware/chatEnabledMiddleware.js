// Purpose: Blocks chat API access when an administrator disables chat.
const { isChatEnabled } = require('../services/chatAvailability');

async function chatEnabledMiddleware(_request, response, next) {
  try {
    if (!(await isChatEnabled())) {
      return response.status(403).json({ message: 'Chat has been disabled by an administrator.' });
    }
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = chatEnabledMiddleware;
