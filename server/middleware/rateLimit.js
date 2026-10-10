// Per-process limiter. Use a shared gateway limiter when running multiple API instances.
function rateLimit(max, windowMs = 60000) {
  const clients = new Map();
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of clients) if (value.reset <= now) clients.delete(key);
  }, windowMs);
  timer.unref();
  return (req, res, next) => {
    const now = Date.now(), key = req.ip;
    let entry = clients.get(key);
    if (!entry || entry.reset <= now) { entry = { count: 0, reset: now + windowMs }; clients.set(key, entry); }
    if (++entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.reset - now) / 1000)));
      return res.status(429).json({ success: false, message: 'Too many requests. Please try again shortly.' });
    }
    next();
  };
}
module.exports = rateLimit;
