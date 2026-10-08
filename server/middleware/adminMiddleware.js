// Purpose: Restricts requests to administrators.
function adminMiddleware(request, response, next) {
  if (request.user?.role !== 'admin') {
    return response.status(403).json({ message: 'Administrator access is required.' });
  }
  return next();
}

module.exports = adminMiddleware;
