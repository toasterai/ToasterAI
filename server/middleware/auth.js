import admin from 'firebase-admin';
import { getDb } from '../db/setup.js';

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : undefined;

  admin.initializeApp(
    serviceAccount
      ? { credential: admin.credential.cert(serviceAccount) }
      : { projectId: process.env.FIREBASE_PROJECT_ID || 'toasterai-b9c65' }
  );
}

/**
 * Ensure user exists in our database, create if not
 */
function ensureUser(firebaseUid, email) {
  const db = getDb();
  let user = db.prepare('SELECT * FROM users WHERE firebase_uid = ?').get(firebaseUid);

  if (!user) {
    const result = db.prepare(
      'INSERT INTO users (firebase_uid, email) VALUES (?, ?)'
    ).run(firebaseUid, email);

    user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  }

  // Reset daily scan counter if new day
  const today = new Date().toISOString().split('T')[0];
  if (user.last_scan_date !== today) {
    db.prepare('UPDATE users SET scans_used_today = 0, last_scan_date = ? WHERE id = ?').run(today, user.id);
    user.scans_used_today = 0;
    user.last_scan_date = today;
  }

  return user;
}

/**
 * Required auth middleware — verifies Firebase ID token
 */
export async function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = ensureUser(decoded.uid, decoded.email);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

/**
 * Optional auth — attaches user if token present, continues either way
 */
export async function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = ensureUser(decoded.uid, decoded.email);
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
