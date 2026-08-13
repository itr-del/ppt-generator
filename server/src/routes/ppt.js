import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from '../models/database.js';
import { generatePptx } from '../services/ppt.js';
import { generatePPTContent } from '../services/llm.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const router = express.Router();

router.post('/generate', async (req, res) => {
  try {
    const { project_id } = req.body || {};
    const db = getDb();
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(project_id);
    if (!project) return res.status(404).json({ error: '项目不存在' });

    db.prepare("UPDATE projects SET status = 'generating', updated_at = datetime('now','localtime') WHERE id = ?").run(project_id);

    // If raw_content not yet populated, call LLM to generate it first
    if (!project.raw_content) {
      try {
        const slideData = await generatePPTContent(project);
        const rawJson = JSON.stringify(slideData);
        db.prepare("UPDATE projects SET raw_content = ?, updated_at = datetime('now','localtime') WHERE id = ?")
          .run(rawJson, project_id);
        project.raw_content = rawJson;
      } catch (llmErr) {
        console.warn('LLM generation failed, using fallback content:', llmErr.message);
      }
    }

    const { filePath, filename } = await generatePptx(project);

    // Store accessible URL paths
    const previewUrl = `/previews/${filename}`;

    db.prepare("UPDATE projects SET file_path = ?, preview_images = ?, status = 'preview', updated_at = datetime('now','localtime') WHERE id = ?")
      .run(previewUrl, previewUrl, project_id);

    res.json({ ok: true, file_path: previewUrl, filename, preview_url: previewUrl });
  } catch (e) {
    console.error('PPT generate error:', e);
    res.status(500).json({ error: e.message || '生成失败' });
  }
});

router.get('/download/:projectId', (req, res) => {
  const db = getDb();
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.projectId);
  if (!project) return res.status(404).json({ error: '项目不存在' });

  // Convert URL path back to absolute filesystem path
  const dataDir = path.join(__dirname, '..', '..', 'data');
  const fileName = project.file_path ? path.basename(project.file_path) : '';
  const absolutePath = fileName ? path.join(dataDir, fileName) : '';

  if (!absolutePath || !fs.existsSync(absolutePath)) return res.status(404).json({ error: '文件不存在' });

  const payment = db.prepare('SELECT * FROM payments WHERE project_id = ? ORDER BY created_at DESC LIMIT 1').get(req.params.projectId);
  if (!payment || payment.status !== 'paid') return res.status(403).json({ error: '请先完成支付' });

  res.download(absolutePath, `${project.title || 'presentation'}.html`);
});

export default router;
