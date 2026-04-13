import jwt from 'jsonwebtoken';
import { getDb } from '../db/setup.js';

const JWT_SECRET = process.env.JWT_SECRET || 'toasterai-dev-secret-change-in-production';

/**
 * Generate a signed JWT for a user
 */
export function signToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Required auth middleware — rejects unauthenticated requests
 */
export function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = getDb();
    const user = db.prepare('SELECT id, email, plan, scans_used_today, scans_limit, last_scan_date FROM users WHERE id = ?').get(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'User not found.' });
    }

    // Reset daily scan counter if new day
    const today = new Date().toISOString().split('T')[0];
    if (user.last_scan_date !== today) {
      db.prepare('UPDATE users SET scans_used_today = 0, last_scan_date = ? WHERE id = ?').run(today, user.id);
      user.scans_used_today = 0;
      user.last_scan_date = today;
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

/**
 * Optional auth — attaches user if token present, continues either way
 */
export function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = getDb();
    const user = db.prepare('SELECT id, email, plan, scans_used_today, scans_limit, last_scan_date FROM users WHERE id = ?').get(decoded.id);

    if (user) {
      const today = new Date().toISOString().split('T')[0];
      if (user.last_scan_date !== today) {
        db.prepare('UPDATE users SET scans_used_today = 0, last_scan_date = ? WHERE id = ?').run(today, user.id);
        user.scans_used_today = 0;
      }
      req.user = user;
    } else {
      req.user = null;
    }
  } catch {
    req.user = null;
  }

  next();
}

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
}
