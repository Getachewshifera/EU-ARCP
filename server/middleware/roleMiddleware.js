// Purpose: Authorizes requests according to user role.
function requireRoles(...roles) {
  return (request, response, next) => {
    if (!request.user || !roles.includes(request.user.role)) {
      return response.status(403).json({ message: 'You do not have permission to perform this action.' });
    }
    return next();
  };
}

module.exports = requireRoles;
