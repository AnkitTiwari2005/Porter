import { api } from './api';

let scriptPromise;
function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = resolve;
      s.onerror = () => { scriptPromise = null; reject(new Error('Could not load the payment window. Check your connection.')); };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

// Opens Razorpay Checkout for an order the server already created, then asks the server to verify the signature.
// Resolves with the updated order; rejects with { dismissed: true } if the customer closes the window.
export async function payForOrder({ order, payment, user, brand }) {
  await loadRazorpay();
  const response = await new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: payment.keyId,
      order_id: payment.providerOrderId,
      amount: payment.amountPaise,
      currency: payment.currency,
      name: brand,
      description: `Order ${order.id}`,
      prefill: { name: user?.name || undefined, contact: user?.phone ? `+91${user.phone}` : undefined },
      theme: { color: '#4338ca' },
      handler: resolve,
      modal: { ondismiss: () => reject(Object.assign(new Error('Payment window closed'), { dismissed: true })) }
    });
    rzp.on('payment.failed', (r) => reject(Object.assign(new Error(r?.error?.description || 'Payment failed'), { failed: true })));
    rzp.open();
  });
  const out = await api.post(`/orders/${order.id}/payment/confirm`, {
    razorpay_order_id: response.razorpay_order_id,
    razorpay_payment_id: response.razorpay_payment_id,
    razorpay_signature: response.razorpay_signature
  });
  return out.order;
}
