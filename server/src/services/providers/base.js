/**
 * Payment Provider Base Class
 *
 * All payment providers (WeChat, Alipay, Mock) should extend this class
 * and implement the following methods.
 */
export class PaymentProvider {
  /**
   * Provider name identifier
   */
  get name() {
    throw new Error('Provider must implement name getter');
  }

  /**
   * Create a payment order
   *
   * @param {object} params
   * @param {string} params.orderId     - Internal order ID (e.g. pay_xxx)
   * @param {number} params.amount      - Amount in CNY (e.g. 9.90)
   * @param {string} params.description - Order description
   * @returns {Promise<{qrCode:string, qrContent:string, tradeNo:string, redirectUrl:string, method:string}>}
   *   qrCode:     Data URL of QR code image (for display)
   *   qrContent:  Raw content to encode as QR (for custom rendering)
   *   tradeNo:    Provider-side trade number
   *   redirectUrl: Redirect URL for gateway-based payments (Alipay page pay)
   *   method:     'wechat' | 'alipay' | 'mock'
   */
  async createOrder({ orderId, amount, description }) {
    throw new Error('Provider must implement createOrder()');
  }

  /**
   * Query order status from the payment provider
   *
   * @param {string} orderId - Internal order ID
   * @returns {Promise<{status:string, tradeNo:string, paidAt:string|null}>}
   *   status: 'pending' | 'paid' | 'expired'
   */
  async queryOrder(orderId) {
    throw new Error('Provider must implement queryOrder()');
  }

  /**
   * Handle payment gateway callback notification
   *
   * @param {Buffer|string} rawBody - Raw request body from gateway
   * @param {object} headers        - Request headers
   * @returns {Promise<{tradeNo:string, orderId:string, status:string, raw:object}>}
   */
  async handleNotification(rawBody, headers) {
    throw new Error('Provider must implement handleNotification()');
  }

  /**
   * Verify that the provider has valid credentials configured
   *
   * @returns {boolean}
   */
  isConfigured() {
    return false;
  }
}
