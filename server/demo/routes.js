const express = require('express');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const { state, seed } = require('./runtime');
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Order = require('../models/Order');
const { objectId, fail } = require('../utils/validation');
const { confirmPayment } = require('../services/payments');
const router = express.Router();
router.get('/status', (req, res) => res.json({ enabled: state.enabled }));
router.use((req, res, next) => state.enabled ? next() : res.status(404).json({ message: 'Demo mode is disabled' }));
async function sessionFor(role) {
  if (!['customer', 'admin'].includes(role)) fail(400, 'Choose customer or admin');
  const user = await User.findById(state.users[role]);
  if (!user) fail(409, 'Reset the demo to restore sample accounts');
  return { user, token: jwt.sign({ id: user._id, version: user.tokenVersion }, process.env.JWT_SECRET, { expiresIn: '2h' }) };
}
router.post('/session', asyncHandler(async (req, res) => res.json(await sessionFor(req.body.role))));
router.post('/reset', protect, asyncHandler(async (req, res) => {
  if (state.active > 1) fail(409, 'Another demo request is running. Try reset again shortly.');
  state.resetting = true;
  try { await seed(); res.json(await sessionFor(req.user.isAdmin ? 'admin' : 'customer')); }
  finally { state.resetting = false; }
}));
router.post('/payment', protect, asyncHandler(async (req, res) => {
  objectId(req.body.orderId, 'Order ID');
  let order = await Order.findById(req.body.orderId);
  if (!order) fail(404, 'Order not found');
  if (String(order.user) !== String(req.user._id)) fail(403, 'Not your order');
  if (!['success', 'failure', 'cancel'].includes(req.body.outcome)) fail(400, 'Invalid demo outcome');
  if (req.body.outcome !== 'success') return res.json({ outcome: req.body.outcome, order: null });
  if (!order.isPaid && order.orderStatus !== 'Pending Payment') fail(409, 'Order is no longer payable');
  const providerId = order.paymentResult?.razorpay_order_id || 'order_demo_' + order._id;
  await Order.updateOne({ _id: order._id, isPaid: false }, { $set: { 'paymentResult.razorpay_order_id': providerId, paymentMethod: 'Demo simulation' } });
  order = await confirmPayment(order._id, { id: order.paymentResult?.razorpay_payment_id || 'pay_demo_' + order._id, order_id: order.paymentResult?.razorpay_order_id || providerId, amount: Math.round(order.totalPrice * 100), currency: 'INR', status: 'captured', captured: true });
  res.json({ outcome: 'success', order });
}));
router.get('/art/:category', (req, res) => {
  const categories = { sneakers: ['#ffd184', 'ORBIT', '<path d="M110 230l85-90 60 70 105 35q40 10 40 45H105q-25-35 5-60z" fill="#f2eee5"/><path d="M100 295h305M204 193l44 10m-56 7l44 10" stroke="#222" stroke-width="12"/>'], hoodies: ['#b6b7ed', 'STUDIO', '<path d="M195 125q55-55 110 0l75 55-40 70-35-20v145H195V230l-35 20-40-70z" fill="#393348"/><path d="M220 110q30 55 60 0M220 295h60" fill="none" stroke="#b6b7ed" stroke-width="10"/>'], streetwear: ['#aecbb3', 'UTILITY', '<path d="M185 135l40-20q25 30 50 0l40 20 70 65-50 55-30-30v140H195V225l-30 30-50-55z" fill="#eee9d9"/><text x="250" y="240" text-anchor="middle" font-size="28" fill="#263d31">DRIP</text>'], accessories: ['#eca6a1', 'EVERYDAY', '<rect x="150" y="175" width="200" height="160" rx="35" fill="#453536"/><path d="M195 180v-35q55-65 110 0v35M175 245h150" fill="none" stroke="#453536" stroke-width="16"/>'] };
  const [color, label, art] = categories[req.params.category] || categories.sneakers;
  res.type('svg').send('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><rect width="500" height="500" fill="' + color + '"/><text x="35" y="55" font-family="sans-serif" font-weight="bold" font-size="20">DRIP LAB / DEMO</text>' + art + '<text x="35" y="460" font-family="sans-serif" font-weight="bold" font-size="32">' + label + '</text></svg>');
});
module.exports = router;
