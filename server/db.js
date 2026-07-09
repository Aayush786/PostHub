import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if Render persistent disk mount exists, otherwise fallback to local data folder
const DB_DIR = fs.existsSync('/opt/posthub-data') 
  ? '/opt/posthub-data' 
  : path.join(__dirname, '..', 'data');

const DB_PATH = path.join(DB_DIR, 'posthub.db');

// Ensure the data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * Initialize the database schema.
 * Creates all required tables if they don't already exist.
 */
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL CHECK(platform IN ('facebook', 'youtube', 'tiktok')),
      platform_user_id TEXT NOT NULL,
      username TEXT,
      display_name TEXT,
      avatar_url TEXT,
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      token_expiry TEXT,
      page_id TEXT,
      channel_id TEXT,
      connected_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      description TEXT,
      media_path TEXT,
      media_type TEXT CHECK(media_type IN ('image', 'video', 'text', NULL)),
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'publishing', 'published', 'failed')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS post_targets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      account_id INTEGER NOT NULL,
      platform TEXT NOT NULL CHECK(platform IN ('facebook', 'youtube', 'tiktok')),
      platform_post_id TEXT,
      custom_title TEXT,
      custom_description TEXT,
      custom_tags TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'publishing', 'published', 'failed')),
      error_message TEXT,
      published_at TEXT,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS analytics_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      platform TEXT NOT NULL CHECK(platform IN ('facebook', 'youtube', 'tiktok')),
      metric_type TEXT NOT NULL,
      metric_value TEXT NOT NULL,
      metric_date TEXT NOT NULL,
      fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );

    -- Indices for common queries
    CREATE INDEX IF NOT EXISTS idx_accounts_platform ON accounts(platform);
    CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
    CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at);
    CREATE INDEX IF NOT EXISTS idx_post_targets_post ON post_targets(post_id);
    CREATE INDEX IF NOT EXISTS idx_post_targets_account ON post_targets(account_id);
    CREATE INDEX IF NOT EXISTS idx_analytics_account ON analytics_cache(account_id);
    CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics_cache(metric_date);
    CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_cache(metric_type);
  `);

  console.log('[DB] Database initialized successfully');
}

export default db;
