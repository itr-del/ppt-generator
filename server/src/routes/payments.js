import express from 'express';
import { getDb } from '../models/database.js';
import {
  createPayment,
  createOrderAsync,
  verifyPayment,
  queryRemotePayment,
  confirmPayment,
  getPaymentByProject,
  getPaymentStats,
  getMethods,
  processWebhook,
} from '../services/payment.js';

const router = express.Router();

// ─── Payment Methods ──────────────────────────────────────

/** GET /api/payments/methods — List available payment methods */
router.get('/methods', (_req, res) => {
  res.json(getMethods());
});

// ─── Create Payment Order ──────────────────────────────

/** POST /api/payments/create — Create a payment order */
router.post('/create', (req, res) => {
  try {
    const { project_id, method } = req.body || {};
    const order = createPayment({ projectId: project_id, method: method || 'auto' });
    res.json(order);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

/** POST /api/payments/create-async — Full order creation (async, with QR code) */
router.post('/create-async', async (req, res) => {
  try {
    const db = getDb();
    const { project_id, method } = req.body || {};

    // Create order record
    const order = createPayment({ projectId: project_id, method: method || 'auto' });

    // Get project info
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(project_id);

    // Generate QR / redirect info via provider
    const fullOrder = await createOrderAsync(order.id, project);

    res.json(fullOrder);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ─── Payment Verification ─────────────────────────────

/** GET /api/payments/verify/:id — Poll payment status */
router.get('/verify/:id', async (req, res) => {
  try {
    const result = verifyPayment(req.params.id);

    // If pending with a real provider, also check remote
    if (result.status === 'pending' && result.payment?.method !== 'mock') {
      const remote = await queryRemotePayment(req.params.id);
      res.json(remote);
      return;
    }

    res.json(result);
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

/** POST /api/payments/verify/:id — Same as GET but allows POST for convenience */
router.post('/verify/:id', async (req, res) => {
  try {
    const result = verifyPayment(req.params.id);

    if (result.status === 'pending' && result.payment?.method !== 'mock') {
      const remote = await queryRemotePayment(req.params.id);
      res.json(remote);
      return;
    }

    res.json(result);
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

/** POST /api/payments/confirm/:id — Admin manual confirmation */
router.post('/confirm/:id', (req, res) => {
  try {
    res.json(confirmPayment(req.params.id, req.body?.trade_no));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ─── Webhook Endpoints ────────────────────────────────

/**
 * POST /api/payments/notify/:provider — Payment gateway webhook
 * Supports: wechat (JSON), alipay (form-encoded)
 * Raw body is provided by express.raw() middleware (req.body is Buffer)
 */
router.post('/notify/:provider', async (req, res) => {
  const { provider } = req.params;

  if (!['wechat', 'alipay'].includes(provider)) {
    return res.status(400).send('Invalid provider');
  }

  try {
    // req.body is a Buffer from express.raw() middleware
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
    const contentType = req.headers['content-type'] || '';

    // Generate a deterministic event ID from request for idempotency
    const wechatEventId = req.headers['wechatpay-id'] || `${provider}_${Date.now()}`;
    const eventId = provider === 'wechat' ? wechatEventId : `${provider}_form_${Date.now()}`;

    const result = await processWebhook(provider, eventId, rawBody, req.headers);

    // Return provider-appropriate response
    if (provider === 'alipay') {
      res.type('text/plain').send('success');
    } else {
      res.json({ code: 'SUCCESS', message: '成功' });
    }
  } catch (e) {
    console.error(`[Webhook/${provider}] Error:`, e.message);
    if (provider === 'alipay') {
      res.type('text/plain').send('fail');
    } else {
      res.status(500).json({ code: 'FAIL', message: e.message });
    }
  }
});

/**
 * POST /api/payments/notify-raw/:provider — Deprecated, use /notify/:provider
 */
router.post('/notify-raw/:provider', (req, res) => {
  res.status(410).json({ error: 'Use POST /api/payments/notify/:provider instead' });
});

// ─── Payment Lookup ─────────────────────────────────────

/** GET /api/payments/project/:projectId — Get payment by project */
router.get('/project/:projectId', (req, res) => {
  res.json(getPaymentByProject(req.params.projectId) || null);
});

// ─── Admin Stats ──────────────────────────────────────────

/** GET /api/payments/stats — Payment statistics */
router.get('/stats', (_req, res) => {
  res.json(getPaymentStats());
});

// ─── Mock QR Code (Development) ───────────────────────────

/** GET /api/payments/qrcode/:id — Mock QR code for development */
router.get('/qrcode/:id', (req, res) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
    <rect width="300" height="300" fill="#f8fafc" rx="12"/>
    <rect x="20" y="20" width="260" height="260" fill="white" stroke="#e2e8f0" stroke-width="2" rx="8"/>
    <text x="150" y="130" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#64748b">Mock QR Code</text>
    <text x="150" y="160" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#94a3b8">${req.params.id}</text>
    <text x="150" y="190" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#94a3b8">开发模式 - 无需实际支付</text>
    <rect x="90" y="220" width="120" height="36" rx="18" fill="#22c55e"/>
    <text x="150" y="243" text-anchor="middle" font-family="sans-serif" font-size="13" fill="white" font-weight="bold">模拟支付成功</text>
  </svg>`;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(svg);
});

export default router;
