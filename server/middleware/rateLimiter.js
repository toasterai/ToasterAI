import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter — 30 requests/minute per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please slow down and try again in a minute.'
  }
});

/**
 * Scan-specific rate limiter — checks user's daily quota from the database
 * Must be used AFTER auth middleware (req.user must exist)
 */
export function scanLimiter(req, res, next) {
  const user = req.user;

  // Anonymous users get no scans (must register)
  if (!user) {
    return res.status(401).json({
      error: 'Please create a free account to start toasting! It only takes 10 seconds.'
    });
  }

  // Premium users get unlimited scans
  if (user.plan === 'premium') {
    return next();
  }

  // Free users: check daily limit
  if (user.scans_used_today >= user.scans_limit) {
    return res.status(429).json({
      error: `You've used your ${user.scans_limit} free toasts today! Come back tomorrow, or upgrade to Premium Crispy for unlimited scans.`,
      scansUsed: user.scans_used_today,
      scansLimit: user.scans_limit,
      upgradeAvailable: true
    });
  }

  next();
}
