const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { state, startDatabase } = require('../demo/runtime');
const Product = require('../models/Product');
const Order = require('../models/Order');
process.env.JWT_SECRET = 'demo-tests-only-12345678901234567890';
process.env.MONGO_URI = 'mongodb://must-never-connect.invalid/real';
let replica, server, base, customer, admin;
async function request(path, body, token, method = body ? 'POST' : 'GET') {
  const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, body: await response.json() };
}
before(async () => {
  replica = await startDatabase();
  server = require('../app').listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = 'http://127.0.0.1:' + server.address().port;
  customer = (await request('/api/demo/session', { role: 'customer' })).body;
  admin = (await request('/api/demo/session', { role: 'admin' })).body;
}, { timeout: 180000 });
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  await mongoose.disconnect();
  if (replica) await replica.stop();
});
test('demo uses an isolated database and role shortcuts enforce admin access', async () => {
  assert.equal(mongoose.connection.name, 'dripstore_demo');
  assert.equal(await Product.countDocuments(), 12);
  assert.equal((await request('/api/demo/status')).body.enabled, true);
  assert.equal(customer.user.isAdmin, false);
  assert.equal(admin.user.isAdmin, true);
  assert.equal((await request('/api/admin/stats', undefined, customer.token)).status, 403);
  assert.equal((await request('/api/admin/stats', undefined, admin.token)).status, 200);
  assert.equal((await request('/api/demo/session', { role: 'owner' })).status, 400);
});
test('demo payment failures and cancellation preserve stock; success is idempotent', async () => {
  const order = await Order.findOne({ isPaid: false });
  const product = await Product.findById(order.orderItems[0].product);
  assert.equal((await request('/api/payment/create-order', { orderId: order.id }, customer.token)).body.demo, true);
  for (const outcome of ['failure', 'cancel']) {
    const result = await request('/api/demo/payment', { orderId: order.id, outcome }, customer.token);
    assert.equal(result.status, 200);
    assert.equal(result.body.order, null);
    assert.equal((await Order.findById(order.id)).isPaid, false);
    assert.equal((await Product.findById(product.id)).countInStock, product.countInStock);
  }
  assert.equal((await request('/api/demo/payment', { orderId: order.id, outcome: 'success' }, admin.token)).status, 403);
  const results = await Promise.all([1, 2].map(() => request('/api/demo/payment', { orderId: order.id, outcome: 'success' }, customer.token)));
  for (const result of results) { assert.equal(result.status, 200); assert.equal(result.body.order.orderStatus, 'Processing'); }
  assert.equal((await Product.findById(product.id)).countInStock, product.countInStock - 1);
  assert.equal((await request('/api/payment/reconcile/' + order.id, {}, customer.token)).body.order.isPaid, true);
});
test('real payment verification and webhooks are blocked in demo', async () => {
  for (const route of ['/api/payment/verify', '/api/payment/webhook']) assert.equal((await request(route, {}, customer.token)).status, 409);
});
test('uploaded demo images survive a later multipart product edit', async () => {
  const fs = require('node:fs');
  const path = require('node:path');
  let product = await Product.findOne({ name: 'Crossbody Mini' });
  const image = fs.readFileSync(path.resolve(__dirname, '../../client/public/demo/products/crossbody-mini.jpg'));
  for (const upload of [true, false]) {
    const form = new FormData();
    for (const key of ['name', 'brand', 'category', 'description', 'originalPrice', 'countInStock', 'isFeatured']) form.append(key, String(product[key]));
    form.append('price', upload ? '2899' : '2799');
    for (const key of ['sizes', 'tags', 'variantStock']) form.append(key, JSON.stringify(product[key]));
    form.append('existingImages', JSON.stringify(product.images));
    if (upload) form.append('images', new Blob([image], { type: 'image/jpeg' }), 'stock.jpg');
    const response = await fetch(base + '/api/admin/products/' + product.id, { method: 'PUT', headers: { Authorization: 'Bearer ' + admin.token }, body: form });
    const result = await response.json();
    assert.equal(response.status, 200, result.message);
    product = await Product.findById(product.id);
    assert.equal(product.images.length, 2);
    assert.ok(product.images[1].startsWith('data:image/jpeg;base64,'));
  }
  assert.equal(product.price, 2799);
});

test('reset restores catalog and sample orders and expires previous sessions', async () => {
  await Product.deleteOne({});
  const result = await request('/api/demo/reset', {}, admin.token);
  assert.equal(result.status, 200);
  assert.equal(result.body.user.isAdmin, true);
  assert.equal(await Product.countDocuments(), 12);
  assert.equal(await Order.countDocuments(), 3);
  assert.equal((await request('/api/auth/me', undefined, customer.token)).status, 401);
  assert.equal((await request('/api/auth/me', undefined, result.body.token)).status, 200);
});
test('normal server cannot use demo sessions, payments, or reset', async () => {
  state.enabled = false;
  try {
    assert.equal((await request('/api/demo/status')).body.enabled, false);
    for (const route of ['session', 'payment', 'reset']) assert.equal((await request('/api/demo/' + route, { role: 'admin' }, admin.token)).status, 404);
  } finally { state.enabled = true; }
});
