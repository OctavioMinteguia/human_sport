// In-memory limiter for failed attempts per client IP (e.g. logins).
// Each request counts up front, so parallel requests cannot slip past the limit;
// requests that do not end in a 4xx are taken back off the count.
// State lives in this process only and is lost on restart, which is fine for one server.
function rateLimitFailures({ windowMs, max, message, now = Date.now }) {
  const hits = new Map(); // ip -> { count, resetAt }
  let nextPruneAt = 0;

  function prune(time) {
    // At most once per minute, so a flood of distinct IPs does not scan the map on every request.
    if (time < nextPruneAt) return;
    nextPruneAt = time + 60 * 1000;
    for (const [key, entry] of hits) {
      if (entry.resetAt <= time) hits.delete(key);
    }
  }

  return function limitFailures(req, res, next) {
    const time = now();
    if (hits.size > 1000) prune(time);

    const key = req.ip;
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= time) {
      entry = { count: 0, resetAt: time + windowMs };
      hits.set(key, entry);
    }

    if (entry.count >= max) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - time) / 1000)));
      return res.status(429).json({ success: false, error: message });
    }

    entry.count += 1;
    res.on('finish', () => {
      // Only client errors (4xx, e.g. a wrong password) count; server errors are not the visitor's fault.
      const failed = res.statusCode >= 400 && res.statusCode < 500;
      if (!failed && hits.get(key) === entry) entry.count -= 1;
    });
    next();
  };
}

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const TOO_MANY = 'Demasiados intentos fallidos. Esperá unos minutos y volvé a intentar.';

module.exports = {
  rateLimitFailures,
  adminLoginLimiter:    rateLimitFailures({ windowMs: FIFTEEN_MINUTES, max: 5,  message: TOO_MANY }),
  customerLoginLimiter: rateLimitFailures({ windowMs: FIFTEEN_MINUTES, max: 10, message: TOO_MANY })
};
