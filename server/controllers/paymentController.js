const asyncHandler = require('express-async-handler');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const { fail, objectId } = require('../utils/validation');
const { signatureMatches, confirmPayment } = require('../services/payments');
const { state: demo } = require('../demo/runtime');
let provider;
const getProvider = () => provider || (provider = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET }));
async function ownedOrder(id, user) {
  const order = await Order.findById(objectId(id));
  if (!order) fail(404, 'Order not found');
  if (String(order.user) !== String(user._id)) fail(403, 'Not authorized');
  return order;
}
const createRazorpayOrder = asyncHandler(async (req, res) => {
  const order = await ownedOrder(req.body.orderId, req.user);
  if (order.isPaid || order.orderStatus !== 'Pending Payment') fail(409, 'Order cannot accept payment');
  if (demo.enabled) return res.json({ demo: true });
  let providerId = order.paymentResult?.razorpay_order_id;
  if (!providerId) {
    const paymentOrder = await getProvider().orders.create({ amount: Math.round(order.totalPrice * 100), currency: 'INR', receipt: `receipt_${order._id}` });
    const stored = await Order.findOneAndUpdate({ _id: order._id, isPaid: false, orderStatus: 'Pending Payment', 'paymentResult.razorpay_order_id': { $exists: false } }, { $set: { paymentResult: { razorpay_order_id: paymentOrder.id, status: 'created' } } }, { new: true });
    const current = stored || await Order.findById(order._id);
    if (!current || current.isPaid || current.orderStatus !== 'Pending Payment') fail(409, 'Order cannot accept payment');
    providerId = current.paymentResult?.razorpay_order_id;
    if (!providerId) fail(409, 'Please retry payment');
  }
  res.json({ success: true, razorpayOrderId: providerId, amount: Math.round(order.totalPrice * 100), currency: 'INR', key: process.env.RAZORPAY_KEY_ID });
});
const verifyPayment = asyncHandler(async (req, res) => {
  const order = await ownedOrder(req.body.orderId, req.user);
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (typeof razorpay_payment_id !== 'string' || !/^pay_[a-z\d]+$/i.test(razorpay_payment_id) || razorpay_order_id !== order.paymentResult?.razorpay_order_id) fail(400, 'Payment does not match this order');
  if (!signatureMatches(`${order.paymentResult.razorpay_order_id}|${razorpay_payment_id}`, razorpay_signature, process.env.RAZORPAY_KEY_SECRET)) fail(400, 'Invalid payment signature');
  res.json({ success: true, order: await confirmPayment(order._id, await getProvider().payments.fetch(razorpay_payment_id)) });
});
const reconcilePayment = asyncHandler(async (req, res) => {
  const order = await ownedOrder(req.params.orderId, req.user);
  if (demo.enabled || order.isPaid || !order.paymentResult?.razorpay_order_id) return res.json({ success: true, order });
  const payments = await getProvider().orders.fetchPayments(order.paymentResult.razorpay_order_id);
  const captured = payments.items.find(payment => payment.status === 'captured');
  res.json({ success: true, order: captured ? await confirmPayment(order._id, captured) : order });
});
const paymentWebhook = asyncHandler(async (req, res) => {
  if (!signatureMatches(req.body, req.get('x-razorpay-signature'), process.env.RAZORPAY_WEBHOOK_SECRET)) fail(400, 'Invalid webhook signature');
  const event = JSON.parse(req.body.toString('utf8'));
  if (event.event === 'payment.captured' || event.event === 'order.paid') {
    const entity = event.payload?.payment?.entity;
    if (!entity?.id || !entity?.order_id) fail(400, 'Missing payment');
    const order = await Order.findOne({ 'paymentResult.razorpay_order_id': entity.order_id });
    if (order) await confirmPayment(order._id, await getProvider().payments.fetch(entity.id));
  }
  if (event.event === 'refund.processed') {
    const refund = event.payload?.refund?.entity;
    if (!refund?.payment_id) fail(400, 'Missing refund');
    const payment = await getProvider().payments.fetch(refund.payment_id);
    if ((payment.status === 'refunded' || payment.refund_status === 'full') && payment.amount_refunded === payment.amount) {
      await Order.updateOne({ 'paymentResult.razorpay_payment_id': payment.id, refundStatus: 'required' }, { $set: { refundStatus: 'processed', refundedAt: new Date() } });
    }
  }
  res.json({ success: true });
});
const cancelPendingOrder = asyncHandler(async (req, res) => {
  const order = await ownedOrder(req.params.orderId, req.user);
  res.json({ success: true, order, message: 'Payment can be retried from your order history' });
});
module.exports = { createRazorpayOrder, verifyPayment, reconcilePayment, paymentWebhook, cancelPendingOrder, getProvider };
