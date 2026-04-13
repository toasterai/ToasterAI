import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db/setup.js';
import { signToken, requireAuth } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/auth/register
 * Create a new user account
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    if (typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const db = getDb();

    // Check if user exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists. Try logging in.' });
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 12);
    const today = new Date().toISOString().split('T')[0];

    const result = db.prepare(
      'INSERT INTO users (email, password_hash, last_scan_date) VALUES (?, ?, ?)'
    ).run(email.toLowerCase().trim(), passwordHash, today);

    const token = signToken(result.lastInsertRowid);

    res.status(201).json({
      token,
      user: {
        id: result.lastInsertRowid,
        email: email.toLowerCase().trim(),
        plan: 'free',
        scansUsed: 0,
        scansLimit: 3
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate and return JWT
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Reset daily counter if needed
    const today = new Date().toISOString().split('T')[0];
    if (user.last_scan_date !== today) {
      db.prepare('UPDATE users SET scans_used_today = 0, last_scan_date = ? WHERE id = ?').run(today, user.id);
      user.scans_used_today = 0;
    }

    const token = signToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        scansUsed: user.scans_used_today,
        scansLimit: user.scans_limit
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

/**
 * GET /api/auth/me
 * Get current user info + remaining scans
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
