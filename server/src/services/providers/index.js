/**
 * Payment Provider Registry
 *
 * Auto-detects configured providers and provides a unified interface.
 * Priority: wechat > alipay > mock (mock always available as fallback)
 */
import { MockPaymentProvider } from './mock.js';
import { WeChatPayProvider } from './wechat.js';
import { AlipayProvider } from './alipay.js';

let providers = null;
let activeProvider = null;

/**
 * Initialize all providers
 */
export function initProviders() {
  const mock = new MockPaymentProvider();
  const wechat = new WeChatPayProvider();
  const alipay = new AlipayProvider();

  providers = { mock, wechat, alipay };

  // Determine active provider based on PAYMENT_MODE env var
  const mode = (process.env.PAYMENT_MODE || 'auto').toLowerCase();

  if (mode === 'wechat' && wechat.isConfigured()) {
    activeProvider = wechat;
  } else if (mode === 'alipay' && alipay.isConfigured()) {
    activeProvider = alipay;
  } else if (mode === 'mock') {
    activeProvider = mock;
  } else if (mode === 'auto') {
    // Auto-detect: prefer real providers in order
    if (wechat.isConfigured()) {
      activeProvider = wechat;
    } else if (alipay.isConfigured()) {
      activeProvider = alipay;
    } else {
      activeProvider = mock;
    }
  } else {
    // Unknown mode, fall back to mock
    console.warn(`[Payment] Unknown PAYMENT_MODE "${mode}". Falling back to mock.`);
    activeProvider = mock;
  }

  console.log(`[Payment] Active provider: ${activeProvider.name}`);
  return { providers, activeProvider };
}

/**
 * Get the current active payment provider
 */
export function getProvider() {
  if (!activeProvider) {
    initProviders();
  }
  return activeProvider;
}

/**
 * Get a specific provider by name
 */
export function getProviderByName(name) {
  if (!providers) initProviders();
  return providers[name] || null;
}

/**
 * Check if a specific payment method is available
 */
export function isMethodAvailable(method) {
  if (!providers) initProviders();
  const p = providers[method];
  return p ? p.isConfigured() : false;
}

/**
 * Get list of all available payment methods
 */
export function getAvailableMethods() {
  if (!providers) initProviders();
  const methods = [];
  if (providers.wechat.isConfigured()) methods.push({ method: 'wechat', label: '微信支付' });
  if (providers.alipay.isConfigured()) methods.push({ method: 'alipay', label: '支付宝' });
  methods.push({ method: 'mock', label: '模拟支付（开发）' });
  return methods;
}

export default { initProviders, getProvider, getProviderByName, isMethodAvailable, getAvailableMethods };
