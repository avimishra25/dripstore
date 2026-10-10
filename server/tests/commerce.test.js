const { test, before, after, beforeEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
process.env.JWT_SECRET = 'isolated-test-secret-never-use-in-production';
process.env.RAZORPAY_KEY_ID = 'rzp_test_isolated';
process.env.RAZORPAY_KEY_SECRET = 'isolated-secret';
process.env.RAZORPAY_WEBHOOK_SECRET = 'isolated-webhook';
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Cart = require('../models/Cart');
const { confirmPayment } = require('../services/payments');
const { getProvider } = require('../controllers/paymentController');
const jwt = require('jsonwebtoken');
let replica, server, base, user, token;
const address = { street: 'Test Street', city: 'Test', state: 'Test', pincode: '123456', phone: '1234567890' };
before(async () => {
  replica = await MongoMemoryReplSet.create({ replSet: { count: 1 }, binary: { version: '8.0.17' } });
  await mongoose.connect(replica.getUri());
  await Promise.all([Order.init(), Product.init(), User.init(), Cart.init()]);
  server = require('../app').listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
}, { timeout: 180000 });
after(async () => {
  mock.restoreAll();
  if (server) await new Promise(resolve => server.close(resolve));
  await mongoose.disconnect();
  if (replica) await replica.stop();
});
beforeEach(async () => {
  mock.restoreAll();
  await Promise.all([Order.deleteMany({}), Product.deleteMany({}), User.deleteMany({}), Cart.deleteMany({})]);
  user = await User.create({ name: 'Buyer', email: 'buyer@example.test', password: 'test-password' });
  token = jwt.sign({ id: user.id, version: 0 }, process.env.JWT_SECRET);
});
async function request(path, method = 'GET', body, auth = token) {
  const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: `Bearer ${auth}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, body: await response.json() };
}
async function product(stock = 10) {
  return Product.create({ name: 'Test Shoe', brand: 'Test', category: 'sneakers', description: 'Test product', price: 100, countInStock: stock, sizes: ['8', '9'], images: [] });
}
async function order(p, suffix = 'A', quantity = 1) {
  return Order.create({ user: user._id, orderItems: [{ product: p._id, name: p.name, price: p.price, quantity, size: '8' }], shippingAddress: address, totalPrice: 100, paymentResult: { razorpay_order_id: `order_${suffix}` } });
}
const payment = suffix => ({ id: `pay_${suffix}`, order_id: `order_${suffix}`, amount: 10000, currency: 'INR', status: 'captured', captured: true });
test('concurrent duplicate confirmations decrement inventory exactly once', async () => {
  const p = await product(), o = await order(p, 'A', 2);
  await Promise.all([confirmPayment(o._id, payment('A')), confirmPayment(o._id, payment('A'))]);
  assert.equal((await Product.findById(p._id)).countInStock, 8);
  assert.equal((await Order.findById(o._id)).statusHistory.length, 1);
  await Order.updateOne({ _id: o._id }, { $set: { orderStatus: 'Shipped' } });
  await confirmPayment(o._id, payment('A'));
  assert.equal((await Order.findById(o._id)).orderStatus, 'Shipped');
});
test('two captured orders competing for last unit produce one refund review', async () => {
  const p = await product(1), a = await order(p, 'A'), b = await order(p, 'B');
  const results = await Promise.all([confirmPayment(a._id, payment('A')), confirmPayment(b._id, payment('B'))]);
  assert.deepEqual(results.map(o => o.orderStatus).sort(), ['Payment Review', 'Processing']);
  assert.equal((await Product.findById(p._id)).countInStock, 0);
  assert.equal(await Order.countDocuments({ refundStatus: 'required' }), 1);
});
test('unavailable second line leaves every product unchanged', async () => {
  const p = await product(2), missing = await product(0), o = await order(p);
  o.orderItems.push({ product: missing._id, name: missing.name, price: 100, quantity: 1, size: '8' }); await o.save();
  const result = await confirmPayment(o._id, payment('A'));
  assert.equal(result.orderStatus, 'Payment Review');
  assert.equal((await Product.findById(p._id)).countInStock, 2);
});
test('payment endpoints enforce ownership and binding before contacting provider', async () => {
  const p = await product(), o = await order(p);
  o.user = new mongoose.Types.ObjectId(); await o.save();
  assert.equal((await request('/api/payment/create-order', 'POST', { orderId: o.id })).status, 403);
  assert.equal((await request('/api/payment/verify', 'POST', { orderId: o.id })).status, 403);
  o.user = user._id; await o.save();
  assert.equal((await request('/api/payment/verify', 'POST', { orderId: o.id, razorpay_order_id: 'order_other', razorpay_payment_id: 'pay_A' })).status, 400);
});
test('new order snapshots ignore client prices and reject duplicate oversell', async () => {
  const p = await product(2);
  const item = { product: p.id, size: '8', quantity: 1, name: 'forged', price: 1, image: 'forged' };
  const created = await request('/api/orders', 'POST', { orderItems: [item], shippingAddress: address });
  assert.equal(created.status, 201);
  assert.equal(created.body.order.orderItems[0].price, 100);
  assert.equal(created.body.order.orderItems[0].name, p.name);
  assert.equal((await request('/api/orders', 'POST', { orderItems: [item, { ...item, size: '9', quantity: 2 }], shippingAddress: address })).status, 409);
  assert.equal((await request('/api/orders', 'POST', { orderItems: [{ ...item, quantity: -1 }], shippingAddress: address })).status, 400);
});
test('cart revision prevents stale tab overwrites', async () => {
  const p = await product();
  const body = { items: [{ product: p.id, size: '8', quantity: 1 }], revision: 0 };
  assert.equal((await request('/api/orders/cart', 'PUT', body)).status, 200);
  assert.equal((await request('/api/orders/cart', 'PUT', body)).status, 409);
  assert.equal((await Cart.findOne()).revision, 1);
});
test('checkout dismissal preserves retryable order and provider ID', async () => {
  const p = await product(), o = await order(p);
  assert.equal((await request(`/api/payment/cancel/${o.id}`, 'DELETE')).status, 200);
  assert.ok(await Order.findById(o._id));
  const retry = await request('/api/payment/create-order', 'POST', { orderId: o.id });
  assert.equal(retry.status, 200); assert.equal(retry.body.razorpayOrderId, 'order_A');
});
test('signed webhook confirms once; tampered raw body is rejected', async () => {
  const p = await product(), o = await order(p);
  mock.method(getProvider().payments, 'fetch', async () => payment('A'));
  const body = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_A', order_id: 'order_A' } } } });
  const signature = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET).update(body).digest('hex');
  const send = value => fetch(base + '/api/payment/webhook', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': signature }, body: value });
  assert.equal((await send(body)).status, 200); assert.equal((await send(body)).status, 200);
  assert.equal((await send(body + ' ')).status, 400);
  assert.equal((await Product.findById(p._id)).countInStock, 9);
  assert.equal((await Order.findById(o._id)).isPaid, true);
});
test('password change and logout invalidate previous tokens', async () => {
  const updated = await request('/api/auth/profile', 'PUT', { password: 'new-test-password', currentPassword: 'test-password' });
  assert.equal(updated.status, 200);
  assert.equal((await request('/api/auth/me')).status, 401);
  token = updated.body.token;
  assert.equal((await request('/api/auth/me')).status, 200);
  assert.equal((await request('/api/auth/logout', 'POST', {})).status, 200);
  assert.equal((await request('/api/auth/me')).status, 401);
});
test('public routes reject unbounded queries and admin routes reject regular users', async () => {
  assert.equal((await request('/api/products?limit=0')).status, 400);
  assert.equal((await request('/api/admin/users')).status, 403);
  assert.equal((await request('/api/orders/myorders', 'GET', null, '')).status, 401);
  assert.equal((await request('/api/does-not-exist')).status, 404);
});

test('guest merge retries are idempotent even after its revision becomes stale', async () => {
  const p = await product();
  const body = { items: [{ product: p.id, size: '8', quantity: 2 }], revision: 0, mergeId: '12345678-1234-1234-1234-123456789012' };
  assert.equal((await request('/api/orders/cart', 'PUT', body)).status, 200);
  assert.equal((await request('/api/orders/cart', 'PUT', body)).status, 200);
  const cart = await Cart.findOne();
  assert.equal(cart.revision, 1); assert.equal(cart.items[0].quantity, 2);
});
test('per-size inventory and admin cancellation restore stock exactly once', async () => {
  const p = await product(3); p.variantStock = [{ size: '8', countInStock: 1 }, { size: '9', countInStock: 2 }]; await p.save();
  const o = await order(p); await confirmPayment(o._id, payment('A'));
  assert.equal((await Product.findById(p._id)).variantStock[0].countInStock, 0);
  await User.updateOne({ _id: user._id }, { $set: { isAdmin: true } });
  for (let i = 0; i < 2; i++) assert.equal((await request('/api/admin/orders/' + o.id + '/status', 'PUT', { orderStatus: 'Cancelled' })).status, 200);
  const restored = await Product.findById(p._id);
  assert.equal(restored.countInStock, 3); assert.equal(restored.variantStock[0].countInStock, 1);
  assert.equal((await Order.findById(o._id)).refundStatus, 'required');
});
test('late capture of a cancelled order enters refund review without taking stock', async () => {
  const p = await product(), o = await order(p); o.orderStatus = 'Cancelled'; await o.save();
  const result = await confirmPayment(o._id, payment('A'));
  assert.equal(result.orderStatus, 'Payment Review'); assert.equal(result.refundStatus, 'required');
  assert.equal((await Product.findById(p._id)).countInStock, 10);
});
