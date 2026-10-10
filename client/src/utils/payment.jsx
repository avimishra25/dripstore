import api from './api';
let scriptPromise;
export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  if (!scriptPromise) scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const timer = setTimeout(() => { script.remove(); scriptPromise = null; reject(new Error('Payment gateway timed out. Please retry.')); }, 15000);
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => { clearTimeout(timer); if (window.Razorpay) resolve(); else { scriptPromise = null; reject(new Error('Payment gateway unavailable')); } };
    script.onerror = () => { clearTimeout(timer); script.remove(); scriptPromise = null; reject(new Error('Payment gateway could not load. Please retry.')); };
    document.body.appendChild(script);
  });
  return scriptPromise;
}
export async function payOrder(order, user, chooseDemoOutcome) {
  const { data } = await api.post('/payment/create-order', { orderId: order._id });
  if (data.demo) {
    if (!chooseDemoOutcome) throw new Error('Open this order in demo mode to simulate payment.');
    const outcome = await chooseDemoOutcome();
    const result = await api.post('/demo/payment', { orderId: order._id, outcome });
    if (outcome === 'failure') throw new Error('Simulated payment failed. Retry this order to try success.');
    return result.data.order;
  }
  await loadRazorpay();
  return new Promise((resolve, reject) => {
    let verifying = false;
    const gateway = new window.Razorpay({
      key: data.key, amount: data.amount, currency: data.currency, order_id: data.razorpayOrderId,
      name: 'DripStore', description: `Order #${order._id}`,
      prefill: { name: user.name, email: user.email, contact: order.shippingAddress.phone },
      theme: { color: '#ff3333' },
      handler: async response => {
        verifying = true;
        try { const result = await api.post('/payment/verify', { ...response, orderId: order._id }); resolve(result.data.order); }
        catch (error) { reject(new Error(error.response?.data?.message || 'Payment confirmation pending. Check payment status in My Orders before retrying.')); }
      },
      modal: { ondismiss: () => { if (!verifying) resolve(null); } },
    });
    gateway.on('payment.failed', response => { verifying = true; gateway.close(); reject(new Error(response.error?.description || 'Payment failed. Please retry.')); });
    gateway.open();
  });
}
