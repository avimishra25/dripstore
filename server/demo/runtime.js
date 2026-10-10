const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { quote } = require('../utils/validation');
const { confirmPayment } = require('../services/payments');
const state = { enabled: false, resetting: false, active: 0, users: {} };
const address = { street: '12 Sample Street', city: 'Bengaluru', state: 'Karnataka', pincode: '560001', country: 'India', phone: '9999999999' };
async function seed() {
  const users = {};
  await mongoose.connection.transaction(async session => {
    for (const Model of [Cart, Order, Product, User]) await Model.deleteMany({}).session(session);
    for (const role of ['customer', 'admin']) {
      const [user] = await User.create([{ name: 'Demo ' + role, email: role + '@demo.example', password: crypto.randomBytes(24).toString('hex'), isAdmin: role === 'admin' }], { session });
      users[role] = user._id;
    }
    const names = ['Orbit Runner', 'Midnight High', 'Cloud Low', 'Signal Runner', 'Oversized Essential', 'Afterhours Hoodie', 'Studio Hoodie', 'Campus Hoodie', 'Utility Tee', 'Denim Essential', 'Everyday Cap', 'Crossbody Mini'];
    for (let i = 0; i < names.length; i++) {
      const category = i < 4 ? 'sneakers' : i < 8 ? 'hoodies' : i < 10 ? 'streetwear' : 'accessories';
      const sizes = i < 4 ? ['7', '8', '9', '10'] : i < 10 ? ['S', 'M', 'L', 'XL'] : ['One Size'];
      await Product.create([{ name: names[i], brand: 'DRIP LAB', category, description: 'Sample collection for exploring DripStore. Choose a size, try checkout, then switch to admin to manage the order.',
        price: 799 + i * 200, originalPrice: 1299 + i * 200, sizes, variantStock: sizes.map(size => ({ size, countInStock: i === 0 ? 1 : 5 })),
        countInStock: sizes.length * (i === 0 ? 1 : 5), images: ['/demo/products/' + names[i].toLowerCase().replaceAll(' ', '-') + '.jpg'], isFeatured: i < 4, tags: ['demo', 'new'] }], { session });
    }
  });
  state.users = users;
  const products = await Product.find().sort({ createdAt: 1 });
  for (let i = 0; i < 3; i++) {
    const product = products[i + 1];
    const totals = quote([{ price: product.price, quantity: 1 }]);
    let order = await Order.create({ user: users.customer, orderItems: [{ product: product._id, name: product.name, image: product.images[0], price: product.price, quantity: 1, size: product.sizes[0] }],
      shippingAddress: address, paymentMethod: 'Demo simulation', ...totals,
      paymentResult: { razorpay_order_id: 'order_demo_seed_' + i } });
    if (i < 2) {
      order = await confirmPayment(order._id, { id: 'pay_demo_seed_' + i, order_id: order.paymentResult.razorpay_order_id, currency: 'INR', amount: order.amountPaise, captured: true, status: 'captured' });
      if (i === 1) { order.orderStatus = 'Delivered'; order.deliveredAt = new Date(); order.statusHistory.push({ status: 'Shipped', note: 'Sample history' }, { status: 'Delivered', note: 'Sample history' }); await order.save(); }
    }
  }
}
async function startDatabase() {
  const { MongoMemoryReplSet } = require('mongodb-memory-server');
  const replica = await MongoMemoryReplSet.create({ replSet: { count: 1 }, instanceOpts: [{ args: ['--wiredTigerCacheSizeGB', '0.25'] }], binary: { version: '8.0.17' } });
  try {
    await mongoose.connect(replica.getUri('dripstore_demo'));
    await Promise.all([User.init(), Product.init(), Order.init(), Cart.init()]);
    await seed();
    state.enabled = true;
    return replica;
  } catch (error) { await mongoose.disconnect(); await replica.stop(); throw error; }
}
module.exports = { state, seed, startDatabase };
