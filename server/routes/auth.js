import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/auth/me
 * Get current user info + remaining scans
 * User is auto-created in the database on first request via requireAuth middleware
 */
router.get('/me', requireAuth, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      plan: req.user.plan,
      scansUsed: req.user.scans_used_today,
      scansLimit: req.user.plan === 'premium' ? Infinity : req.user.scans_limit
    }
  });
});

export default router;
