import crypto from 'node:crypto';
import { HttpError } from '../lib/errors.js';
import { safeEqual } from '../lib/crypto.js';

const hmacHex = (secret, data) => crypto.createHmac('sha256', secret).update(data).digest('hex');

// Razorpay via REST (no SDK). Amounts are in paise.
export function createPayments(config, { fetchImpl = fetch } = {}) {
  if (config.PAYMENTS_PROVIDER !== 'razorpay') {
    const off = () => { throw new HttpError(503, 'payments_unavailable', 'Online payments are not available right now. Please choose Cash on Delivery.'); };
    return { name: 'disabled', enabled: false, createOrder: off, refund: off, fetchOrderPayments: async () => [], verifyCheckoutSignature: () => false, verifyWebhookSignature: () => false };
  }
  const auth = Buffer.from(`${config.RAZORPAY_KEY_ID}:${config.RAZORPAY_KEY_SECRET}`).toString('base64');
  const call = async (path, body, method = 'POST') => {
    const res = await fetchImpl(`https://api.razorpay.com/v1${path}`, {
      method,
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new HttpError(502, 'payment_provider_error', json?.error?.description || `Razorpay error ${res.status}`);
    return json;
  };
  return {
    name: 'razorpay',
    enabled: true,
    keyId: config.RAZORPAY_KEY_ID,
    // Used to reconcile orders whose webhook never arrived.
    fetchOrderPayments: async (providerOrderId) => (await call(`/orders/${providerOrderId}/payments`, undefined, 'GET')).items || [],
    createOrder: ({ amountPaise, receipt, notes }) => call('/orders', { amount: amountPaise, currency: 'INR', receipt, notes }),
    refund: ({ providerPaymentId, amountPaise, notes }) => call(`/payments/${providerPaymentId}/refund`, { amount: amountPaise, notes }),
    // Checkout success callback: HMAC_SHA256(order_id + '|' + payment_id, key_secret)
    verifyCheckoutSignature: ({ orderId, paymentId, signature }) =>
      safeEqual(hmacHex(config.RAZORPAY_KEY_SECRET, `${orderId}|${paymentId}`), String(signature || '')),
    // Webhook: HMAC_SHA256(raw request body, webhook secret) in X-Razorpay-Signature
    verifyWebhookSignature: (rawBody, signature) =>
      safeEqual(hmacHex(config.RAZORPAY_WEBHOOK_SECRET, rawBody), String(signature || ''))
  };
}
