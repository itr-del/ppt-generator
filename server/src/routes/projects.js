import express from 'express';
import { getDb } from '../models/database.js';
import { nanoid } from 'nanoid';

const router = express.Router();

router.get('/', (_req, res) => {
  const list = getDb().prepare('SELECT id, title, status, pages, style, created_at, updated_at FROM projects ORDER BY created_at DESC').all();
  res.json(list);
});

router.get('/:id', (req, res) => {
  const project = getDb().prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: '项目不存在' });
  res.json(project);
});

router.post('/', (req, res) => {
  const { title, pages, style, direction, research_needed, use_case, additional_info } = req.body || {};
  const id = nanoid(16);
  getDb().prepare(
    `INSERT INTO projects (id, title, pages, style, direction, research_needed, use_case, additional_info, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft')`
  ).run(id, title || '', pages || 10, style || '', direction || '', research_needed ? 1 : 0, use_case || '', additional_info || '');
  res.status(201).json({ id });
});

router.patch('/:id', (req, res) => {
  const db = getDb();
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: '项目不存在' });

  const allowed = ['title', 'pages', 'style', 'direction', 'research_needed', 'use_case', 'additional_info', 'raw_content', 'slide_data', 'file_path', 'preview_images', 'status'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  if (Object.keys(updates).length) {
    const setClause = Object.keys(updates).map((k) => `${k} = ?`).join(', ');
    const values = Object.keys(updates).map((k) => updates[k]);
    values.push(req.params.id);
    db.prepare(`UPDATE projects SET ${setClause}, updated_at = datetime('now','localtime') WHERE id = ?`).run(...values);
  }

  res.json(getDb().prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  getDb().prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
