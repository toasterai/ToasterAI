import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Use persistent disk path on Render, local path in development
const DB_PATH = process.env.NODE_ENV === 'production'
  ? '/var/data/toasterai.db'
  : path.join(__dirname, '..', 'toasterai.db');

let db;

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema();
  }
  return db;
}

function initializeSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      plan TEXT DEFAULT 'free',
      scans_used_today INTEGER DEFAULT 0,
      scans_limit INTEGER DEFAULT 3,
      last_scan_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS scans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      image_hash TEXT NOT NULL,
      freshness_score INTEGER NOT NULL,
      confidence TEXT NOT NULL,
      category TEXT NOT NULL,
      findings TEXT NOT NULL,
      analyzer_scores TEXT NOT NULL,
      is_gallery_scan BOOLEAN DEFAULT 0,
      gallery_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scan_id INTEGER NOT NULL,
      user_id INTEGER,
      was_correct BOOLEAN,
      actual_status TEXT,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (scan_id) REFERENCES scans(id)
    );

    CREATE INDEX IF NOT EXISTS idx_scans_user ON scans(user_id);
    CREATE INDEX IF NOT EXISTS idx_scans_hash ON scans(image_hash);
    CREATE INDEX IF NOT EXISTS idx_scans_gallery ON scans(gallery_id);
  `);
}
