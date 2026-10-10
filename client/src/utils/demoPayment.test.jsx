import { it, expect, vi } from 'vitest';
import { payOrder } from './payment';
import api from './api';
vi.mock('./api', () => ({ default: { post: vi.fn() } }));
it.each(['success', 'failure', 'cancel'])('demo %s never loads the real payment SDK', async outcome => {
  api.post.mockResolvedValueOnce({ data: { demo: true } }).mockResolvedValueOnce({ data: { order: outcome === 'success' ? { isPaid: true } : null } });
  const request = payOrder({ _id: 'demo-order' }, {}, vi.fn().mockResolvedValue(outcome));
  if (outcome === 'failure') await expect(request).rejects.toThrow('Simulated payment failed');
  else expect(await request).toEqual(outcome === 'success' ? { isPaid: true } : null);
  expect(document.querySelector('script[src*="razorpay"]')).toBeNull();
  expect(api.post).toHaveBeenLastCalledWith('/demo/payment', { orderId: 'demo-order', outcome });
});
