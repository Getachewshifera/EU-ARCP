// Purpose: Converts application errors into consistent HTTP responses.
function errorMiddleware(error, _request, response, _next) {
  if (response.headersSent) return;
  if (error.name === 'ValidationError') return response.status(400).json({ message: error.message });
  if (error.code === 11000) return response.status(409).json({ message: 'A record with this value already exists.' });
  if (error.name === 'CastError') return response.status(400).json({ message: 'A supplied identifier or value is invalid.' });
  if (error.name === 'MulterError') {
    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return response.status(status).json({ message: error.message });
  }
  const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 600
    ? error.status
    : 500;
  if (status >= 500) console.error('API request failed:', error);
  return response.status(status).json({
    message: status === 500 && process.env.NODE_ENV === 'production'
      ? 'An unexpected server error occurred.'
      : error.message || 'An unexpected server error occurred.',
  });
}

module.exports = errorMiddleware;
