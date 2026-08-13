/**
 * Mock Payment Provider
 *
 * Used as fallback when no real payment credentials are configured.
 * Simulates a QR code payment flow for development/testing.
 */
import { PaymentProvider } from './base.js';
import QRCode from 'qrcode';

export class MockPaymentProvider extends PaymentProvider {
  get name() {
    return 'mock';
  }

  isConfigured() {
    return true; // always available
  }

  async createOrder({ orderId, amount, description }) {
    // Generate a fake QR code that encodes the order info
    const qrContent = JSON.stringify({
      type: 'mock_payment',
      id: orderId,
      amount,
      ts: Date.now(),
    });

    let qrCode = '';
    try {
      qrCode = await QRCode.toDataURL(qrContent, {
        width: 300,
        margin: 1,
        color: { dark: '#1e293b', light: '#ffffff' },
      });
    } catch {
      // Fallback: return the raw content if QR generation fails
      qrCode = '';
    }

    return {
      qrCode,
      qrContent,
      tradeNo: orderId,
      redirectUrl: '',
      method: 'mock',
    };
  }

  async queryOrder(orderId) {
    // In mock mode, orders are never automatically paid via query
    return {
      status: 'pending',
      tradeNo: orderId,
      paidAt: null,
    };
  }

  async handleNotification(rawBody, headers) {
    // Mock notifications are not supported
    throw new Error('Mock provider does not support notifications');
  }
}
