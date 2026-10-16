// Purpose: Limits repeated requests to protect API endpoints.
const buckets = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 30;

const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.expiresAt <= now) buckets.delete(key);
  }
}, WINDOW_MS);
cleanupTimer.unref();

function rateLimit(request, response, next, message) {
  const now = Date.now();
  const key = request.ip || request.socket.remoteAddress || 'unknown';
  let bucket = buckets.get(key);
  if (!bucket || bucket.expiresAt <= now) {
    bucket = { count: 0, expiresAt: now + WINDOW_MS };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count > MAX_REQUESTS) {
    response.set('Retry-After', String(Math.ceil((bucket.expiresAt - now) / 1000)));
    return response.status(429).json({ message });
  }
  return next();
}

function authRateLimit(request, response, next) {
  return rateLimit(request, response, next, 'Too many authentication requests. Please try again later.');
}

function contactRateLimit(request, response, next) {
  return rateLimit(request, response, next, 'Too many messages sent. Please try again later.');
}

module.exports = { authRateLimit, contactRateLimit };
