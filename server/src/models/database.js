import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'ppt-generator.db');

let db;

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

export async function initDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  await initSchema();
  return db;
}

async function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft','generating','preview','paid','completed','expired')),
      pages INTEGER DEFAULT 10,
      style TEXT,
      direction TEXT,
      research_needed INTEGER DEFAULT 0,
      use_case TEXT,
      additional_info TEXT,
      raw_content TEXT,
      slide_data TEXT,
      file_path TEXT,
      preview_images TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      currency TEXT DEFAULT 'CNY',
      method TEXT CHECK(method IN ('wechat','alipay','mock')),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','paid','expired','refunded')),
      qr_code TEXT,
      trade_no TEXT,
      paid_at TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS conversation_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user','assistant','system')),
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    CREATE INDEX IF NOT EXISTS idx_projects_created ON projects(created_at);
    CREATE INDEX IF NOT EXISTS idx_payments_project ON payments(project_id);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

    CREATE TABLE IF NOT EXISTS webhook_events (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      event_type TEXT,
      trade_no TEXT,
      order_id TEXT,
      raw_body TEXT,
      processed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_idempotent ON webhook_events(provider, id);
    CREATE INDEX IF NOT EXISTS idx_webhook_order ON webhook_events(order_id);
  `);

  // ── Migration: update payments table to allow 'mock' method ──
  // SQLite can't ALTER CHECK, so we recreate the table
  const tableInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='payments'").get();
  if (tableInfo && tableInfo.sql && !tableInfo.sql.includes("'mock'")) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS payments_new (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        amount REAL NOT NULL DEFAULT 0,
        currency TEXT DEFAULT 'CNY',
        method TEXT CHECK(method IN ('wechat','alipay','mock')),
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending','paid','expired','refunded')),
        qr_code TEXT,
        trade_no TEXT,
        paid_at TEXT,
        created_at TEXT DEFAULT (datetime('now','localtime')),
        FOREIGN KEY (project_id) REFERENCES projects(id)
      );
      INSERT INTO payments_new SELECT * FROM payments;
      DROP TABLE payments;
      ALTER TABLE payments_new RENAME TO payments;
      CREATE INDEX IF NOT EXISTS idx_payments_project ON payments(project_id);
      CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
    `);
    console.log('[DB] Migrated payments table to support mock method');
  }

  // Seed default admin if not exists
  const adminExists = db.prepare('SELECT id FROM admin_users WHERE username = ?').get('admin');
  if (!adminExists) {
    const bcryptModule = await import('bcryptjs');
    const hash = (bcryptModule.default || bcryptModule).hashSync('admin123', 10);
    db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run('admin', hash);
  }

  // Seed default settings
  const defaults = [
    ['ppt_price', '9.90'],
    ['llm_model', 'deepseek-chat'],
    ['llm_base_url', 'https://api.deepseek.com/v1'],
    ['llm_api_key', ''],
    ['site_name', 'AI PPT 生成器'],
    ['wechat_qr_path', ''],
    ['alipay_qr_path', ''],
  ];
  const upsertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  for (const [k, v] of defaults) {
    upsertSetting.run(k, v);
  }
}

export default { getDb, initDb };
