// Purpose: Handles requests that do not match an API route.
function notFoundMiddleware(request, response) {
  return response.status(404).json({ message: `Route not found: ${request.method} ${request.originalUrl}` });
}

module.exports = notFoundMiddleware;
