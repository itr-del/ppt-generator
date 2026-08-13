import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import { initDb } from './models/database.js';
import chatRoutes from './routes/chat.js';
import projectRoutes from './routes/projects.js';
import paymentRoutes from './routes/payments.js';
import pptRoutes from './routes/ppt.js';
import adminRoutes from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(cookieParser());

// Raw body parser for payment webhooks (must be before JSON parser)
app.use('/api/payments/notify', express.raw({ type: '*/*', limit: '100kb' }));

app.use(express.json({ limit: '10mb' }));

// API routes first (before SPA fallback)
app.use('/api/chat', chatRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ppt', pptRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/api/settings/public', (_req, res) => res.json({ site_name: 'AI PPT 生成器' }));

// Serve uploads from public/
app.use('/uploads', express.static(path.join(__dirname, '../../public')));

// Serve generated preview images and files from data/
app.use('/previews', express.static(path.join(__dirname, '..', 'data')));

// Serve Vue admin panel from build output (must be before frontend SPA catch-all)
const adminDist = path.join(__dirname, '../../admin/dist');
app.use('/admin', express.static(adminDist));
app.get('/admin/*', (_req, res) => {
  res.sendFile(path.join(adminDist, 'index.html'));
});

// Serve React frontend from build output (SPA fallback for non-API, non-admin routes)
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

initDb()
  .then((db) => {
    app.set('db', db);
    app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://0.0.0.0:${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message || '服务器内部错误' });
});

export default app;
