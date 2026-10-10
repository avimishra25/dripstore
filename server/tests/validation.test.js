const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { normalizeItems, shipping, pagination, quote } = require('../utils/validation');
const { errorHandler } = require('../middleware/errorMiddleware');
const { signatureMatches, validatePayment } = require('../services/payments');
const { transitionOrder } = require('../services/orderLifecycle');
const Order = require('../models/Order');
const id = '507f1f77bcf86cd799439011';
test('reject malformed quantities, IDs, addresses and unbounded pagination', () => {
  for (const quantity of [-1, 0, 1.5, '1', 101, NaN]) assert.throws(() => normalizeItems([{ product: id, size: 'M', quantity }]), { statusCode: 400 });
  assert.throws(() => normalizeItems([{ product: {}, size: 'M', quantity: 1 }]));
  assert.throws(() => shipping({ street: 'x', city: 'x', state: 'x', phone: '1', pincode: '2' }));
  for (const query of [{ limit: 0 }, { page: -1 }, { limit: 101 }, { page: 1.5 }]) assert.throws(() => pagination(query));
});
test('merge repeated variants and calculate monetary values in paise', () => {
  assert.deepEqual(normalizeItems([{ product: id, size: 'M', quantity: 2 }, { product: id, size: 'M', quantity: 3 }]), [{ product: id, size: 'M', quantity: 5 }]);
  assert.equal(quote([{ price: 10.25, quantity: 2 }]).amountPaise, 12319);
  assert.equal(quote([{ price: 1000, quantity: 1 }]).shippingPrice, 0);
});
test('order schema rejects negative and fractional quantities', () => {
  for (const quantity of [-1, 0, 0.5]) {
    const order = new Order({ user: id, orderItems: [{ product: id, size: 'M', name: 'Test', price: 1, quantity }], shippingAddress: { street: 'x', city: 'x', state: 'x', pincode: '123456', phone: '1234567890' } });
    assert.ok(order.validateSync().errors['orderItems.0.quantity']);
  }
});
test('signature validation binds raw bytes and rejects malformed signatures', () => {
  const body = Buffer.from('{"event":"payment.captured"}');
  const signature = crypto.createHmac('sha256', 'test').update(body).digest('hex');
  assert.equal(signatureMatches(body, signature, 'test'), true);
  assert.equal(signatureMatches(Buffer.from(body + ' '), signature, 'test'), false);
  for (const value of [null, '', 'zz'.repeat(32), '00']) assert.equal(signatureMatches(body, value, 'test'), false);
});
test('payment amount, currency, capture and provider order are enforced', () => {
  const order = { totalPrice: 120, paymentResult: { razorpay_order_id: 'order_A' } };
  const payment = { order_id: 'order_A', amount: 12000, currency: 'INR', status: 'captured', captured: true };
  assert.doesNotThrow(() => validatePayment(order, payment));
  for (const change of [{ order_id: 'order_B' }, { amount: 1 }, { currency: 'USD' }, { status: 'authorized' }, { captured: false }]) assert.throws(() => validatePayment(order, { ...payment, ...change }));
});
test('HTTP status survives thrown errors; internal errors remain private', () => {
  for (const statusCode of [400, 401, 403, 404]) {
    const res = { statusCode, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; } };
    errorHandler(new Error('Expected error'), {}, res, () => {});
    assert.equal(res.statusCode, statusCode);
  }
  const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; } };
  errorHandler(Object.assign(new Error('duplicate'), { code: 11000 }), {}, res, () => {});
  assert.equal(res.statusCode, 409);
});
test('cancellation restores stock only once and records refund requirement', async () => {
  const order = { orderStatus: 'Processing', isPaid: true, stockDeducted: true, orderItems: [], statusHistory: [] };
  let releases = 0;
  await transitionOrder(order, 'Cancelled', id, async () => releases++);
  await transitionOrder(order, 'Cancelled', id, async () => releases++);
  assert.equal(releases, 1);
  assert.equal(order.refundStatus, 'required');
  assert.equal(order.statusHistory.length, 1);
  await assert.rejects(transitionOrder(order, 'Shipped', id, async () => {}), { statusCode: 409 });
});
test('unpaid orders cannot enter fulfillment', async () => {
  await assert.rejects(transitionOrder({ orderStatus: 'Placed', isPaid: false }, 'Processing', id, async () => {}), { statusCode: 409 });
});
