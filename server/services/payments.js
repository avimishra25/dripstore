const mongoose = require('mongoose');
const crypto = require('crypto');
const Order = require('../models/Order');
const inventory = require('./inventory');
const { fail } = require('../utils/validation');
function signatureMatches(body, signature, secret) {
  if (!secret || typeof signature !== 'string' || !/^[a-f\d]{64}$/i.test(signature)) return false;
  const expected = crypto.createHmac('sha256', secret).update(body).digest();
  return crypto.timingSafeEqual(expected, Buffer.from(signature, 'hex'));
}
function validatePayment(order, payment, requireCaptured = true) {
  if (payment.order_id !== order.paymentResult?.razorpay_order_id || payment.currency !== 'INR' || payment.amount !== Math.round(order.totalPrice * 100)) fail(400, 'Payment does not match this order');
  if (requireCaptured && (payment.status !== 'captured' || payment.captured !== true)) fail(409, 'Payment is awaiting capture. Check order status shortly.');
}
async function confirmPayment(orderId, payment) {
  return mongoose.connection.transaction(async session => {
    const order = await Order.findById(orderId).session(session);
    if (!order) fail(404, 'Order not found');
    validatePayment(order, payment, !order.isPaid);
    if (order.isPaid) {
      if (order.paymentResult.razorpay_payment_id !== payment.id) fail(409, 'Order already paid with another payment');
      return order;
    }
    if (await Order.exists({ 'paymentResult.razorpay_payment_id': payment.id, _id: { $ne: order._id } }).session(session)) fail(409, 'Payment already used');
    const canFulfill = order.orderStatus === 'Pending Payment' && await inventory.allocate(order.orderItems, session);
    order.isPaid = true;
    order.paidAt = new Date();
    order.stockDeducted = Boolean(canFulfill);
    order.orderStatus = canFulfill ? 'Processing' : 'Payment Review';
    order.refundStatus = canFulfill ? 'none' : 'required';
    order.paymentResult = { razorpay_order_id: payment.order_id, razorpay_payment_id: payment.id, status: 'captured' };
    order.statusHistory.push({ status: order.orderStatus, note: canFulfill ? 'Captured payment confirmed' : 'Inventory unavailable or order cancelled; refund required' });
    await order.save({ session });
    // Webhooks must never erase a customer's later shopping.
    return order;
  });
}
module.exports = { signatureMatches, validatePayment, confirmPayment };
