const createHttpError = require("http-errors");

/**
 * Lightweight in-memory rate limiter (no extra dependency required).
 * Good enough for a single-instance POS server. If you scale to multiple
 * instances/processes, swap this for a shared store (e.g. Redis) or the
 * `express-rate-limit` package with a Redis store.
 *
 * @param {Object} options
 * @param {number} options.windowMs - time window in milliseconds
 * @param {number} options.max - max requests allowed per key within the window
 * @param {string} options.message - error message returned once limit is hit
 * @param {boolean} options.skipSuccessfulRequests - when true, only failed
 *        responses (status >= 400) count toward the limit. Right for login:
 *        staff signing in successfully shouldn't burn through the quota.
 */
const rateLimit = ({
  windowMs = 15 * 60 * 1000,
  max = 5,
  message = "Too many requests, please try again later.",
  skipSuccessfulRequests = false,
} = {}) => {
  const hits = new Map(); // key -> { count, resetAt }

  // Periodic cleanup so the map doesn't grow unbounded
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits.entries()) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }, windowMs).unref();

  return (req, res, next) => {
    // `trust proxy` is enabled in app.js, so req.ip is the real client IP.
    const key = req.ip || "unknown";
    const now = Date.now();

    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }

    if (entry.count >= max) {
      const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
      res.set("Retry-After", String(retryAfterSec));
      return next(createHttpError(429, message));
    }

    if (skipSuccessfulRequests) {
      // Count only once we know the attempt failed.
      res.on("finish", () => {
        if (res.statusCode >= 400) entry.count += 1;
      });
    } else {
      entry.count += 1;
    }

    next();
  };
};

module.exports = rateLimit;
