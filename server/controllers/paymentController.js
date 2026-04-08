const asyncHandler = require('express-async-handler');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create Razorpay order
// @route   POST /api/payment/create-order
// @access  Private
const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const options = {
    amount: Math.round(order.totalPrice * 100), // paise
    currency: 'INR',
    receipt: `receipt_${order._id}`,
    notes: {
      orderId: order._id.toString(),
      userId: req.user._id.toString(),
    },
  };

  const razorpayOrder = await razorpay.orders.create(options);

  order.paymentResult = {
    ...order.paymentResult,
    razorpay_order_id: razorpayOrder.id,
    status: 'created',
  };
  await order.save();

  res.json({
    success: true,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    key: process.env.RAZORPAY_KEY_ID,
  });
});

// @desc    Verify Razorpay payment — THIS is where the order is confirmed
// @route   POST /api/payment/verify
// @access  Private
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

  // 1. Verify signature
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    res.status(400);
    throw new Error('Payment verification failed: invalid signature');
  }

  // 2. Find and confirm order
  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // 3. Reduce stock NOW (only after confirmed payment)
  for (const item of order.orderItems) {
    const product = await Product.findById(item.product);
    if (product) {
      product.countInStock = Math.max(0, product.countInStock - item.quantity);
      await product.save();
    }
  }

  // 4. Mark order as paid and move to Processing
  order.isPaid = true;
  order.paidAt = new Date();
  order.orderStatus = 'Processing';
  order.paymentResult = {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    status: 'paid',
  };
  await order.save();

  // 5. Clear cart
  await Cart.findOneAndDelete({ user: order.user });

  res.json({ success: true, message: 'Payment verified successfully', order });
});

// @desc    Cancel a pending-payment order (called if user closes Razorpay modal)
// @route   DELETE /api/payment/cancel/:orderId
// @access  Private
const cancelPendingOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  // Only delete if still pending payment
  if (order.orderStatus === 'Pending Payment') {
    await order.deleteOne();
    return res.json({ success: true, message: 'Pending order cancelled' });
  }

  res.json({ success: true, message: 'Order already processed' });
});

module.exports = { createRazorpayOrder, verifyPayment, cancelPendingOrder };
