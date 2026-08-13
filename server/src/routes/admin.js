import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../models/database.js';
import { getPaymentStats } from '../services/payment.js';
import { clearClient } from '../services/llm.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'pptx-admin-secret';
const SESSION_COOKIE = 'pptx_admin_session';

function requireAdmin(req, res, next) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return res.status(401).json({ error: '未登录' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.admin = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: '登录已过期' });
  }
}

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const db = getDb();
  const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '12h' });
  res.cookie(SESSION_COOKIE, token, { httpOnly: true, maxAge: 12 * 60 * 60 * 1000 });
  res.json({ ok: true, user: { id: user.id, username: user.username, role: user.role } });
});

router.post('/logout', (_req, res) => {
  res.clearCookie(SESSION_COOKIE);
  res.json({ ok: true });
});

router.get('/me', requireAdmin, (req, res) => {
  res.json({ user: req.admin });
});

router.get('/stats', requireAdmin, (_req, res) => {
  const stats = getPaymentStats();
  res.json(stats);
});

router.get('/projects', requireAdmin, (req, res) => {
  const db = getDb();
  const status = String(req.query.status || '');
  let sql = 'SELECT id, title, status, pages, style, created_at, updated_at FROM projects';
  const params = [];
  if (status) {
    sql += ' WHERE status = ?';
    params.push(status);
  }
  sql += ' ORDER BY created_at DESC';
  const list = db.prepare(sql).all(...params);
  res.json(list);
});

router.delete('/projects/:id', requireAdmin, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.get('/payments', requireAdmin, (req, res) => {
  const db = getDb();
  const list = db.prepare('SELECT p.*, pr.title FROM payments p LEFT JOIN projects pr ON pr.id = p.project_id ORDER BY p.created_at DESC').all();
  res.json(list);
});

router.post('/payments/:id/confirm', requireAdmin, (req, res) => {
  const { trade_no } = req.body || {};
  const { confirmPayment } = require('../services/payment.js');
  const result = confirmPayment(req.params.id, trade_no);
  res.json(result);
});

// ── Settings ──
router.get('/settings/:key', requireAdmin, (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(req.params.key);
  res.json({ key: req.params.key, value: row?.value ?? '' });
});

router.post('/settings', requireAdmin, (req, res) => {
  const { key, value } = req.body || {};
  if (!key) return res.status(400).json({ error: 'key 是必填的' });
  const db = getDb();
  db.prepare(`INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now','localtime'))
              ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`).run(key, String(value ?? ''));
  // Clear LLM client cache if relevant setting changed
  if (['llm_api_key', 'llm_base_url', 'llm_model'].includes(key)) {
    clearClient();
  }
  res.json({ ok: true });
});

export default router;
