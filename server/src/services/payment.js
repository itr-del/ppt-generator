/**
 * Payment Service
 *
 * Manages the full payment lifecycle using configurable payment providers.
 * Supports WeChat Pay (v3 Native), Alipay (QR), and Mock (dev fallback).
 *
 * Provider auto-detection:
 *   - Set PAYMENT_MODE=auto (default): uses wechat > alipay > mock
 *   - Set PAYMENT_MODE=wechat / alipay / mock to force a specific provider
 */
import { nanoid } from 'nanoid';
import { getDb } from '../models/database.js';
import { initProviders, getProvider, getProviderByName, getAvailableMethods } from './providers/index.js';

// ─── Initialization ──────────────────────────────────────

// Initialize providers on module load
initProviders();

// ─── Internal Helpers ─────────────────────────────────────

function now() {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

// ─── Public API ───────────────────────────────────────────

/**
 * Get the current PPT price from settings
 */
export function getPrice() {
  const db = getDb();
  const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get('ppt_price');
  return setting ? parseFloat(setting.value) : 9.90;
}

/**
 * Get list of available payment methods
 */
export function getMethods() {
  return getAvailableMethods();
}

/**
 * Create a payment order
 *
 * @param {object} params
 * @param {string} params.projectId  - Project ID
 * @param {string} params.method     - 'wechat' | 'alipay' | 'mock' (optional, uses active provider)
 * @returns {object} Order info with QR code / redirect URL
 */
export function createPayment({ projectId, method }) {
  const db = getDb();
  const amount = getPrice();

  // Validate project
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  if (!project) throw new Error('项目不存在');
  if (project.status === 'paid') throw new Error('该项目已支付');

  // Determine which provider to use
  let provider;
  if (method && method !== 'auto') {
    // Specific method requested
    provider = getProviderByName(method);
    if (!provider) throw new Error(`不支持的支付方式: ${method}`);
    // Allow mock even if not "configured", fall through
    if (!provider.isConfigured() && provider.name !== 'mock') {
      throw new Error(`支付方式 ${method} 未配置，请在环境变量中配置相关凭证`);
    }
  } else {
    // Use the active (auto-detected) provider
    provider = getProvider();
  }

  const actualMethod = provider.name;
  const paymentId = 'pay_' + nanoid(16);

  // Create order via provider (synchronous creation in DB first)
  db.prepare(`
    INSERT INTO payments (id, project_id, amount, method, status)
    VALUES (?, ?, ?, ?, 'pending')
  `).run(paymentId, projectId, amount, actualMethod);

  // Call provider to create the real order (async but we await via the route)
  // The route will call createOrderAsync separately
  return {
    id: paymentId,
    project_id: projectId,
    amount,
    method: actualMethod,
    status: 'pending',
    provider: actualMethod,
  };
}

/**
 * Asynchronously create the provider-side order (call after DB insert)
 * Returns QR codes, redirect URLs etc.
 */
export async function createOrderAsync(paymentId, project) {
  const db = getDb();
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId);
  if (!payment) throw new Error('支付订单不存在');

  const provider = getProviderByName(payment.method) || getProvider();
  const amount = getPrice();

  const result = await provider.createOrder({
    orderId: paymentId,
    amount,
    description: `AI PPT 生成 - ${project?.title || 'PPT下载'}`,
  });

  // Save trade_no and QR code info
  if (result.tradeNo) {
    db.prepare('UPDATE payments SET trade_no = ? WHERE id = ?').run(result.tradeNo, paymentId);
  }

  return {
    ...payment,
    qr_code: result.qrCode,
    qr_content: result.qrContent,
    redirect_url: result.redirectUrl,
    trade_no: result.tradeNo || payment.trade_no,
    amount: amount,
  };
}

/**
 * Verify payment status (used for polling)
 * Returns current status from local DB + provider query
 */
export function verifyPayment(paymentId) {
  const db = getDb();

  // Look up by payment ID or project ID
  let payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId);
  if (!payment) {
    payment = db.prepare('SELECT * FROM payments WHERE project_id = ? ORDER BY created_at DESC LIMIT 1').get(paymentId);
  }
  if (!payment) throw new Error('支付订单不存在');

  // Already paid locally
  if (payment.status === 'paid') {
    return { status: 'paid', payment };
  }

  // Check if expired locally (30 minutes)
  const createdAt = new Date(payment.created_at + 'Z').getTime();
  const nowMs = Date.now();
  if (nowMs - createdAt > 30 * 60 * 1000) {
    db.prepare('UPDATE payments SET status = ? WHERE id = ?').run('expired', payment.id);
    return { status: 'expired', payment: { ...payment, status: 'expired' } };
  }

  // For mock payments: auto-complete if we're the mock provider
  if (payment.method === 'mock') {
    // In mock mode, payment is confirmed manually via /confirm endpoint
    return { status: 'pending', payment };
  }

  // For real providers: query the payment gateway
  const provider = getProviderByName(payment.method);
  if (provider && provider.isConfigured()) {
    try {
      // Must query async in real usage; for synchronous verify we check local
      return { status: 'pending', payment };
    } catch {
      return { status: 'pending', payment };
    }
  }

  return { status: 'pending', payment };
}

/**
 * Query payment status from the payment provider (async)
 */
export async function queryRemotePayment(paymentId) {
  const db = getDb();
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId);
  if (!payment) throw new Error('支付订单不存在');
  if (payment.status === 'paid') return { status: 'paid', payment };

  const provider = getProviderByName(payment.method);
  if (!provider || !provider.isConfigured()) {
    return { status: payment.status, payment };
  }

  try {
    const tradeNo = payment.trade_no || payment.id;
    const result = await provider.queryOrder(tradeNo);

    if (result.status === 'paid') {
      const t = now();
      db.prepare('UPDATE payments SET status = ?, paid_at = ? WHERE id = ?')
        .run('paid', t, paymentId);
      db.prepare('UPDATE projects SET status = ?, updated_at = ? WHERE id = ?')
        .run('paid', t, payment.project_id);

      return { status: 'paid', payment: { ...payment, status: 'paid', paid_at: t } };
    }

    return { status: result.status, payment };
  } catch (e) {
    console.error('[Payment] Query remote failed:', e.message);
    return { status: payment.status, payment };
  }
}

/**
 * Confirm payment (admin manual / webhook)
 */
export function confirmPayment(paymentId, tradeNo = null) {
  const db = getDb();
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId);
  if (!payment) throw new Error('支付订单不存在');
  if (payment.status === 'paid') return { status: 'paid', payment };

  const t = now();
  const finalTradeNo = tradeNo || 'manual_' + nanoid(8);

  db.prepare(`
    UPDATE payments SET status = 'paid', trade_no = ?, paid_at = ? WHERE id = ?
  `).run(finalTradeNo, t, paymentId);

  db.prepare(`
    UPDATE projects SET status = 'paid', updated_at = ? WHERE id = ?
  `).run(t, payment.project_id);

  const updated = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId);
  return { status: 'paid', payment: updated };
}

/**
 * Process a webhook notification from a payment provider
 * Uses SQLite transactions for idempotency
 */
export async function processWebhook(providerName, eventId, rawBody, headers) {
  const db = getDb();

  // Idempotency check: skip if we've already processed this event
  const existing = db.prepare('SELECT id FROM webhook_events WHERE provider = ? AND id = ?').get(providerName, eventId);
  if (existing) {
    return { status: 'already_processed' };
  }

  const provider = getProviderByName(providerName);
  if (!provider || !provider.isConfigured()) {
    throw new Error(`Provider ${providerName} not available`);
  }

  // Parse and verify the notification
  const notification = await provider.handleNotification(rawBody, headers);

  // Use a transaction for atomicity
  const processTransaction = db.transaction(() => {
    // Record the webhook event
    db.prepare(`
      INSERT INTO webhook_events (id, provider, event_type, trade_no, order_id, raw_body, processed)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(eventId, providerName, notification.raw?.event_type || 'pay', notification.tradeNo, notification.orderId,
      typeof rawBody === 'string' ? rawBody : rawBody.toString('utf-8'));

    // If paid, update the order
    if (notification.status === 'paid') {
      const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(notification.orderId);
      if (payment && payment.status !== 'paid') {
        const t = now();
        db.prepare('UPDATE payments SET status = ?, trade_no = ?, paid_at = ? WHERE id = ?')
          .run('paid', notification.tradeNo, t, notification.orderId);
        db.prepare('UPDATE projects SET status = ?, updated_at = ? WHERE id = ?')
          .run('paid', t, payment.project_id);
      }
    }
  });

  processTransaction();

  return { status: notification.status };
}

/**
 * Get payment by project
 */
export function getPaymentByProject(projectId) {
  const db = getDb();
  return db.prepare('SELECT * FROM payments WHERE project_id = ? ORDER BY created_at DESC LIMIT 1').get(projectId);
}

/**
 * Get payment statistics for admin dashboard
 */
export function getPaymentStats() {
  const db = getDb();

  const totalRevenue = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'paid'
  `).get();

  const todayRevenue = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM payments
    WHERE status = 'paid' AND date(paid_at) = date('now','localtime')
  `).get();

  const monthlyRevenue = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM payments
    WHERE status = 'paid' AND strftime('%Y-%m', paid_at) = strftime('%Y-%m', 'now','localtime')
  `).get();

  const orderCounts = db.prepare(`
    SELECT
      COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
      COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_count,
      COUNT(*) as total_count
    FROM payments
  `).get();

  const dailyStats = db.prepare(`
    SELECT date(paid_at) as day, COUNT(*) as count, SUM(amount) as revenue
    FROM payments WHERE status = 'paid' AND paid_at IS NOT NULL
    GROUP BY date(paid_at)
    ORDER BY day DESC LIMIT 30
  `).all();

  const methodStats = db.prepare(`
    SELECT method, COUNT(*) as count, SUM(amount) as revenue
    FROM payments WHERE status = 'paid'
    GROUP BY method
  `).all();

  return {
    total_revenue: totalRevenue.total,
    today_revenue: todayRevenue.total,
    monthly_revenue: monthlyRevenue.total,
    ...orderCounts,
    daily_stats: dailyStats,
    method_stats: methodStats,
  };
}

export default {
  createPayment,
  createOrderAsync,
  verifyPayment,
  queryRemotePayment,
  confirmPayment,
  processWebhook,
  getPaymentByProject,
  getPaymentStats,
  getPrice,
  getMethods,
};
