const rateLimit = require("express-rate-limit");

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:
    process.env.NODE_ENV === "production"
      ? 100
      : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many requests. Please try again later.",
  },
});

// Authentication limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:
    process.env.NODE_ENV === "production"
      ? 10
      : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many login attempts. Please try again later.",
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
};