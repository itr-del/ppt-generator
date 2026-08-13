/**
 * Alipay — QR Code Payment Provider
 *
 * Uses alipay.trade.precreate to generate QR codes that users scan with Alipay.
 * Also supports alipay.trade.page.pay for web redirect payment.
 *
 * Required env vars:
 *   ALIPAY_APP_ID            — Alipay App ID
 *   ALIPAY_PRIVATE_KEY       — App private key PEM content (RSA2)
 *   ALIPAY_ALIPAY_PUBLIC_KEY — Alipay's public key PEM (for response verification)
 *   ALIPAY_NOTIFY_URL        — Webhook URL for payment notifications (publicly accessible)
 */
import crypto from 'crypto';
import axios from 'axios';
import QRCode from 'qrcode';
import { PaymentProvider } from './base.js';

export class AlipayProvider extends PaymentProvider {
  get name() {
    return 'alipay';
  }

  constructor(config = {}) {
    super();
    this.appId = config.appId || process.env.ALIPAY_APP_ID || '';
    this.privateKey = (config.privateKey || process.env.ALIPAY_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    this.alipayPublicKey = (config.alipayPublicKey || process.env.ALIPAY_ALIPAY_PUBLIC_KEY || '').replace(/\\n/g, '\n');
    this.notifyUrl = config.notifyUrl || process.env.ALIPAY_NOTIFY_URL || '';
    this.gatewayUrl = 'https://openapi.alipay.com/gateway.do';
  }

  isConfigured() {
    return !!(this.appId && this.privateKey && this.alipayPublicKey);
  }

  // ─── Signing ────────────────────────────────────────────

  /**
   * Sign parameters with RSA2 (SHA256-RSA)
   */
  _sign(params) {
    const sorted = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(sorted, 'utf-8');
    return signer.sign(this.privateKey, 'base64');
  }

  /**
   * Verify Alipay's response signature
   */
  _verifySign(params, sign) {
    const sorted = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(sorted, 'utf-8');
    return verify.verify(this.alipayPublicKey, sign, 'base64');
  }

  /**
   * Build common system parameters
   */
  _sysParams(method) {
    return {
      app_id: this.appId,
      method,
      charset: 'utf-8',
      sign_type: 'RSA2',
      format: 'JSON',
      timestamp: new Date().toISOString().replace(/\.\d{3}/, ''),
      version: '1.0',
    };
  }

  /**
   * Execute an Alipay API call
   */
  async _call(method, bizContent) {
    const params = {
      ...this._sysParams(method),
      biz_content: JSON.stringify(bizContent),
    };
    params.sign = this._sign(params);

    try {
      const response = await axios.post(this.gatewayUrl, null, {
        params,
        responseType: 'json',
      });

      const data = response.data;
      const respKey = method.replace(/\./g, '_') + '_response';

      if (!data[respKey]) {
        throw new Error(`[Alipay] Unexpected response: ${JSON.stringify(data)}`);
      }

      const resp = data[respKey];

      if (resp.code !== '10000') {
        throw new Error(`[Alipay] API error: ${resp.code} - ${resp.sub_msg || resp.msg}`);
      }

      // Verify response signature
      if (data.sign) {
        const verified = this._verifySign(resp, data.sign);
        if (!verified) {
          throw new Error('[Alipay] Response signature verification failed');
        }
      }

      return resp;
    } catch (e) {
      if (e.message.startsWith('[Alipay]')) throw e;
      throw new Error(`[Alipay] Network error: ${e.message}`);
    }
  }

  /**
   * Verify an async notification from Alipay
   * Returns the verified params, or throws on verification failure
   */
  verifyNotification(params) {
    const sign = params.sign;
    if (!sign) throw new Error('[Alipay] Missing sign in notification');

    const verifiedParams = {};
    for (const [k, v] of Object.entries(params)) {
      if (k !== 'sign' && k !== 'sign_type' && v !== undefined && v !== null) {
        verifiedParams[k] = v;
      }
    }

    const verified = this._verifySign(verifiedParams, sign);
    if (!verified) {
      throw new Error('[Alipay] Notification signature verification failed');
    }

    return verifiedParams;
  }

  // ─── API Methods ────────────────────────────────────────

  async createOrder({ orderId, amount, description }) {
    if (!this.isConfigured()) {
      throw new Error('[Alipay] Not configured. Check ALIPAY_* env vars.');
    }

    const bizContent = {
      out_trade_no: orderId,
      total_amount: amount.toFixed(2),
      subject: description || 'AI PPT 生成',
      timeout_express: '30m',
    };

    // Use precreate (QR code) as default
    try {
      const resp = await this._call('alipay.trade.precreate', {
        ...bizContent,
        notify_url: this.notifyUrl,
        qr_code_timeout_express: '30m',
      });

      const qrContent = resp.qr_code || '';

      // Generate QR code image
      let qrCode = '';
      if (qrContent) {
        try {
          qrCode = await QRCode.toDataURL(qrContent, {
            width: 300,
            margin: 1,
            color: { dark: '#1677ff', light: '#ffffff' },
          });
        } catch {
          qrCode = '';
        }
      }

      return {
        qrCode,
        qrContent,
        tradeNo: resp.out_trade_no || orderId,
        redirectUrl: '',
        method: 'alipay',
      };
    } catch (e) {
      // Fallback to page pay (redirect) if precreate fails
      const redirectUrl = this._buildPagePayUrl(bizContent);
      return {
        qrCode: '',
        qrContent: '',
        tradeNo: orderId,
        redirectUrl,
        method: 'alipay',
      };
    }
  }

  /**
   * Build alipay.trade.page.pay redirect URL (fallback)
   */
  _buildPagePayUrl(bizContent) {
    const params = {
      ...this._sysParams('alipay.trade.page.pay'),
      biz_content: JSON.stringify({
        ...bizContent,
        product_code: 'FAST_INSTANT_TRADE_PAY',
        notify_url: this.notifyUrl,
        return_url: process.env.ALIPAY_RETURN_URL || '',
      }),
    };
    params.sign = this._sign(params);

    const query = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    return `${this.gatewayUrl}?${query}`;
  }

  async queryOrder(orderId) {
    if (!this.isConfigured()) {
      throw new Error('[Alipay] Not configured');
    }

    const bizContent = { out_trade_no: orderId };
    const resp = await this._call('alipay.trade.query', bizContent);

    let status = 'pending';
    if (resp.trade_status === 'TRADE_SUCCESS' || resp.trade_status === 'TRADE_FINISHED') {
      status = 'paid';
    } else if (resp.trade_status === 'TRADE_CLOSED') {
      status = 'expired';
    }

    return {
      status,
      tradeNo: resp.out_trade_no || orderId,
      paidAt: resp.send_pay_date || resp.gmt_payment || null,
    };
  }

  async handleNotification(rawBody, headers) {
    if (!this.isConfigured()) {
      throw new Error('[Alipay] Not configured');
    }

    // Alipay sends notifications as URL-encoded form data
    const bodyStr = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf-8');
    const params = Object.fromEntries(new URLSearchParams(bodyStr));

    const verified = this.verifyNotification(params);

    let status = 'pending';
    if (verified.trade_status === 'TRADE_SUCCESS' || verified.trade_status === 'TRADE_FINISHED') {
      status = 'paid';
    }

    return {
      tradeNo: verified.out_trade_no,
      orderId: verified.out_trade_no,
      status,
      raw: verified,
    };
  }
}
