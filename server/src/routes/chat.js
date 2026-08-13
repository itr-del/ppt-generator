import express from 'express';
import { getDb } from '../models/database.js';
import { nanoid } from 'nanoid';
import { getGuideStep, buildSummary, continueConversation } from '../services/llm.js';

const router = express.Router();

router.get('/step', (req, res) => {
  const projectId = String(req.query.project_id || '');
  const stepIndex = Number(req.query.step_index || 0);
  const db = getDb();

  let project = null;
  if (projectId) {
    project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId) || null;
  }

  if (!project) {
    project = {
      id: nanoid(16),
      title: '',
      pages: 10,
      style: '',
      direction: '',
      research_needed: 0,
      use_case: '',
      additional_info: '',
      status: 'draft',
    };
    db.prepare(
      `INSERT INTO projects (id, title, pages, style, direction, research_needed, use_case, additional_info, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(project.id, project.title, project.pages, project.style, project.direction, project.research_needed, project.use_case, project.additional_info, project.status);
  }

  const step = getGuideStep(stepIndex);
  if (!step) {
    return res.json({ done: true, project, summary: buildSummary(project) });
  }

  res.json({ step, project });
});

router.post('/answer', (req, res) => {
  const { project_id, step_index, answer } = req.body || {};
  const db = getDb();

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(project_id);
  if (!project) return res.status(404).json({ error: '项目不存在' });

  const step = getGuideStep(step_index);
  if (!step) return res.json({ done: true, project, summary: buildSummary(project) });

  const updates = {};
  if (step.key === 'pages') updates.pages = Number(answer) || project.pages || 10;
  else if (step.key === 'research') updates.research_needed = answer === '需要' ? 1 : 0;
  else if (step.key === 'confirm') {
    if (!String(answer).includes('确认')) {
      return res.json({ needs_revision: true, message: '好的，请告诉我需要修改的地方。' });
    }
  } else if (step.field) updates[step.field] = answer;

  if (Object.keys(updates).length) {
    const setClause = Object.keys(updates).map((k) => `${k} = ?`).join(', ');
    const values = Object.keys(updates).map((k) => updates[k]);
    values.push(project_id);
    db.prepare(`UPDATE projects SET ${setClause}, updated_at = datetime('now','localtime') WHERE id = ?`).run(...values);
  }

  const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(project_id);
  const nextStepIndex = (step.key === 'confirm' && !String(answer).includes('确认'))
    ? Number(step_index)
    : Number(step_index) + 1;
  const nextStep = getGuideStep(nextStepIndex);
  if (!nextStep) return res.json({ done: true, project: updated, summary: buildSummary(updated) });

  res.json({ step: nextStep, project: updated });
});

router.post('/message', async (req, res) => {
  const { project_id, message } = req.body || {};
  const db = getDb();
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(project_id);
  if (!project) return res.status(404).json({ error: '项目不存在' });

  db.prepare('INSERT INTO conversation_history (project_id, role, content) VALUES (?, ?, ?)').run(project_id, 'user', message);

  const history = db.prepare('SELECT role, content FROM conversation_history WHERE project_id = ? ORDER BY id ASC').all(project_id);
  const reply = await continueConversation(project_id, history);
  db.prepare('INSERT INTO conversation_history (project_id, role, content) VALUES (?, ?, ?)').run(project_id, 'assistant', reply);

  res.json({ reply });
});

export default router;
