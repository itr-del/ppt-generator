/**
 * WeChat Pay v3 — Native Payment Provider
 *
 * Generates QR codes that users scan with WeChat to pay.
 * Uses the WeChat Pay v3 API with proper RSA-SHA256 signing.
 *
 * Required env vars:
 *   WECHAT_APP_ID          — WeChat Official Account / Mini Program AppId
 *   WECHAT_MCH_ID          — Merchant ID (商户号)
 *   WECHAT_API_V3_KEY      — API v3 Key (32 bytes, set in WeChat Merchant Platform)
 *   WECHAT_MCH_SERIAL_NO   — Merchant certificate serial number
 *   WECHAT_PRIVATE_KEY     — Merchant private key PEM content (or set WECHAT_PRIVATE_KEY_PATH)
 *   WECHAT_PRIVATE_KEY_PATH— Path to merchant private key PEM file
 *   WECHAT_NOTIFY_URL      — Webhook URL for payment notifications (publicly accessible)
 */
import crypto from 'crypto';
import fs from 'fs';
import axios from 'axios';
import QRCode from 'qrcode';
import { PaymentProvider } from './base.js';

export class WeChatPayProvider extends PaymentProvider {
  get name() {
    return 'wechat';
  }

  constructor(config = {}) {
    super();
    this.appId = config.appId || process.env.WECHAT_APP_ID || '';
    this.mchId = config.mchId || process.env.WECHAT_MCH_ID || '';
    this.apiV3Key = config.apiV3Key || process.env.WECHAT_API_V3_KEY || '';
    this.serialNo = config.serialNo || process.env.WECHAT_MCH_SERIAL_NO || '';
    this.notifyUrl = config.notifyUrl || process.env.WECHAT_NOTIFY_URL || '';

    // Load merchant private key
    const keyPem = config.privateKey
      || process.env.WECHAT_PRIVATE_KEY
      || '';
    const keyPath = config.privateKeyPath
      || process.env.WECHAT_PRIVATE_KEY_PATH
      || '';

    if (keyPem) {
      this.privateKey = keyPem.replace(/\\n/g, '\n');
    } else if (keyPath) {
      try {
        this.privateKey = fs.readFileSync(keyPath, 'utf-8');
      } catch (e) {
        console.warn('[WeChatPay] Failed to read private key file:', e.message);
        this.privateKey = '';
      }
    } else {
      this.privateKey = '';
    }

    // Platform certificates cache: { serial_no: certPEM }
    this.platformCerts = {};
    this._certsLoaded = false;
    this._certsLoading = null; // promise to avoid concurrent refreshes
  }

  isConfigured() {
    return !!(this.appId && this.mchId && this.apiV3Key && this.serialNo && this.privateKey);
  }

  // ─── Helpers ────────────────────────────────────────────

  _nonce() {
    return crypto.randomBytes(16).toString('hex');
  }

  _timestamp() {
    return Math.floor(Date.now() / 1000);
  }

  /**
   * Build the WeChat Pay v3 Authorization header
   */
  _authHeader(method, urlPath, bodyStr = '') {
    const timestamp = this._timestamp();
    const nonce = this._nonce();
    const message = `${method}\n${urlPath}\n${timestamp}\n${nonce}\n${bodyStr}\n`;

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(message);
    const signature = signer.sign(this.privateKey, 'base64');

    return `WECHATPAY2-SHA256-RSA2048 ` +
      `mchid="${this.mchId}",` +
      `serial="${this.serialNo}",` +
      `nonce_str="${nonce}",` +
      `timestamp="${timestamp}",` +
      `signature="${signature}"`;
  }

  /**
   * Make an authenticated request to the WeChat Pay API
   */
  async _request(method, path, body = undefined) {
    const bodyStr = body ? JSON.stringify(body) : '';
    const auth = this._authHeader(method, path, bodyStr);

    const response = await axios({
      method,
      url: `https://api.mch.weixin.qq.com/v3${path}`,
      data: body || undefined,
      headers: {
        'Authorization': auth,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'ppt-generator/1.0',
      },
      responseType: 'json',
    });

    // Verify response signature (skip for 204 No Content)
    if (response.status !== 204 && response.headers['wechatpay-signature']) {
      const respBody = JSON.stringify(response.data);
      const msg = `${response.headers['wechatpay-timestamp']}\n${response.headers['wechatpay-nonce']}\n${respBody}\n`;
      this._verifySign(response.headers['wechatpay-serial'], msg, response.headers['wechatpay-signature']);
    }

    return response.data;
  }

  /**
   * Verify a signature against a platform certificate
   */
  _verifySign(serial, message, signature) {
    const cert = this.platformCerts[serial];
    if (!cert) {
      throw new Error(`[WeChatPay] Platform cert not found for serial: ${serial}. Call refreshCertificates() first.`);
    }
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(message);
    if (!verify.verify(cert, signature, 'base64')) {
      throw new Error('[WeChatPay] Signature verification failed');
    }
  }

  /**
   * AEAD_AES_256_GCM decrypt (used for certificate & notification decryption)
   */
  _aeadDecrypt(ciphertextBase64, nonceBase64, additionalData) {
    const key = Buffer.from(this.apiV3Key, 'utf-8');
    const nonce = Buffer.from(nonceBase64, 'base64');
    const ciphertext = Buffer.from(ciphertextBase64, 'base64');

    // Auth tag is the last 16 bytes
    const tag = ciphertext.subarray(ciphertext.length - 16);
    const encrypted = ciphertext.subarray(0, ciphertext.length - 16);

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce);
    decipher.setAAD(Buffer.from(additionalData, 'utf-8'));
    decipher.setAuthTag(tag);

    const decrypted = decipher.update(encrypted) + decipher.final('utf-8');
    return decrypted;
  }

  /**
   * Refresh platform certificates (called on first use)
   */
  async refreshCertificates() {
    if (this._certsLoading) return this._certsLoading;
    if (this._certsLoaded) return;

    this._certsLoading = this._doRefreshCerts();
    try {
      await this._certsLoading;
      this._certsLoaded = true;
    } finally {
      this._certsLoading = null;
    }
  }

  async _doRefreshCerts() {
    try {
      const data = await this._request('GET', '/certificates');
      for (const item of data.data || []) {
        const { serial_no, encrypt_certificate } = item;
        const { algorithm, nonce, associated_data, ciphertext } = encrypt_certificate;
        if (algorithm !== 'AEAD_AES_256_GCM') {
          console.warn(`[WeChatPay] Unknown cert algorithm: ${algorithm}`);
          continue;
        }
        const certPem = this._aeadDecrypt(ciphertext, nonce, associated_data);
        this.platformCerts[serial_no] = certPem;
      }
    } catch (e) {
      // If we can't fetch certs, try loading from env
      const envCert = process.env.WECHAT_PLATFORM_CERT;
      if (envCert) {
        this.platformCerts[this.serialNo] = envCert.replace(/\\n/g, '\n');
        console.warn('[WeChatPay] Using platform cert from env (fallback)');
      } else {
        throw new Error(`[WeChatPay] Failed to fetch platform certs: ${e.message}`);
      }
    }
  }

  // ─── API Methods ────────────────────────────────────────

  async createOrder({ orderId, amount, description }) {
    if (!this.isConfigured()) {
      throw new Error('[WeChatPay] Not configured. Check WECHAT_* env vars.');
    }

    // Ensure platform certs are cached
    await this.refreshCertificates();

    const resp = await this._request('POST', '/pay/transactions/native', {
      appid: this.appId,
      mchid: this.mchId,
      description: description || 'AI PPT 生成',
      out_trade_no: orderId,
      notify_url: this.notifyUrl,
      amount: {
        total: Math.round(amount * 100), // convert to cents (分)
        currency: 'CNY',
      },
    });

    const qrContent = resp.code_url || '';

    // Generate QR code image
    let qrCode = '';
    if (qrContent) {
      try {
        qrCode = await QRCode.toDataURL(qrContent, {
          width: 300,
          margin: 1,
          color: { dark: '#1e293b', light: '#ffffff' },
        });
      } catch {
        qrCode = '';
      }
    }

    return {
      qrCode,
      qrContent,
      tradeNo: resp.prepay_id || orderId,
      redirectUrl: '',
      method: 'wechat',
    };
  }

  async queryOrder(orderId) {
    if (!this.isConfigured()) {
      throw new Error('[WeChatPay] Not configured');
    }

    await this.refreshCertificates();

    const resp = await this._request(
      'GET',
      `/pay/transactions/out-trade-no/${encodeURIComponent(orderId)}?mchid=${this.mchId}`,
    );

    let status = 'pending';
    if (resp.trade_state === 'SUCCESS') status = 'paid';
    else if (resp.trade_state === 'CLOSED' || resp.trade_state === 'REVOKED') status = 'expired';

    return {
      status,
      tradeNo: orderId,
      paidAt: resp.success_time || null,
    };
  }

  async handleNotification(rawBody, headers) {
    if (!this.isConfigured()) {
      throw new Error('[WeChatPay] Not configured');
    }

    const bodyStr = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf-8');

    // Verify notification signature
    const serial = headers['wechatpay-serial'];
    const signature = headers['wechatpay-signature'];
    const timestamp = headers['wechatpay-timestamp'];
    const nonce = headers['wechatpay-nonce'];

    if (!serial || !signature || !timestamp || !nonce) {
      throw new Error('[WeChatPay] Missing WeChat Pay signature headers');
    }

    await this.refreshCertificates();
    const msg = `${timestamp}\n${nonce}\n${bodyStr}\n`;
    this._verifySign(serial, msg, signature);

    // Decrypt the resource
    const parsed = JSON.parse(bodyStr);
    const resource = parsed.resource;
    if (!resource || resource.algorithm !== 'AEAD_AES_256_GCM') {
      throw new Error('[WeChatPay] Invalid resource in notification');
    }

    const decryptedJson = this._aeadDecrypt(resource.ciphertext, resource.nonce, resource.associated_data);
    const decrypted = JSON.parse(decryptedJson);

    return {
      tradeNo: decrypted.out_trade_no,
      orderId: decrypted.out_trade_no,
      status: decrypted.trade_state === 'SUCCESS' ? 'paid' : 'pending',
      raw: decrypted,
    };
  }
}
