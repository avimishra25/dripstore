// Disposable local preview, always backed by its own ephemeral replica set.
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
process.env.JWT_SECRET = 'preview-only-not-for-deployment-123456789';
process.env.RAZORPAY_KEY_ID = 'rzp_test_preview';
process.env.RAZORPAY_KEY_SECRET = 'preview';
process.env.RAZORPAY_WEBHOOK_SECRET = 'preview';
process.env.CLIENT_URL = 'http://127.0.0.1:3001';
(async () => {
  const replica = await MongoMemoryReplSet.create({ replSet: { count: 1 }, binary: { version: '8.0.17' } });
  await mongoose.connect(replica.getUri());
  const Product = require('../models/Product'), User = require('../models/User');
  await User.create({ name: 'Preview Admin', email: 'admin@example.test', password: 'Preview-only-123', isAdmin: true });
  for (let n = 1; n <= 16; n++) await Product.create({ name: 'Preview Sneaker ' + n, brand: 'DripStore', description: 'Local preview product', price: 1000 + n, countInStock: 10, sizes: ['8', '9'], variantStock: [{ size: '8', countInStock: 5 }, { size: '9', countInStock: 5 }], category: 'sneakers', isFeatured: n <= 4 });
  const server = require('../app').listen(5001, '127.0.0.1', () => console.log('Disposable preview API ready on 5001'));
  const close = () => server.close(async () => { await mongoose.disconnect(); await replica.stop(); process.exit(0); });
  process.on('SIGTERM', close); process.on('SIGINT', close);
})().catch(error => { console.error(error); process.exit(1); });
