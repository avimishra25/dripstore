const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @desc    Create new order (PENDING — not confirmed until payment)
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items provided');
  }

  // Verify stock availability (do NOT reduce stock yet — wait for payment)
  let itemsPrice = 0;
  for (const item of orderItems) {
    const product = await Product.findById(item.product);
    if (!product) {
      res.status(404);
      throw new Error(`Product not found`);
    }
    if (product.countInStock < item.quantity) {
      res.status(400);
      throw new Error(`"${product.name}" doesn't have enough stock`);
    }
    itemsPrice += product.price * item.quantity;
  }

  const shippingPrice = itemsPrice > 999 ? 0 : 99;
  const taxPrice = Math.round(itemsPrice * 0.18);
  const totalPrice = itemsPrice + shippingPrice + taxPrice;

  // Create order as PENDING — not confirmed until Razorpay payment succeeds
  const order = await Order.create({
    user: req.user._id,
    orderItems,
    shippingAddress,
    paymentMethod: paymentMethod || 'Razorpay',
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
    isPaid: false,
    orderStatus: 'Pending Payment',
  });

  res.status(201).json({ success: true, order });
});

// @desc    Get logged-in user's orders — only CONFIRMED (paid) orders shown
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    user: req.user._id,
    orderStatus: { $ne: 'Pending Payment' },
  })
    .sort({ createdAt: -1 })
    .populate('orderItems.product', 'name images');

  res.json({ success: true, orders });
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
    res.status(403);
    throw new Error('Not authorized to view this order');
  }

  res.json({ success: true, order });
});

// @desc    Get user cart
// @route   GET /api/orders/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate(
    'items.product',
    'name images price countInStock sizes brand'
  );
  res.json({ success: true, cart: cart || { items: [] } });
});

// @desc    Sync/update cart
// @route   PUT /api/orders/cart
// @access  Private
const updateCart = asyncHandler(async (req, res) => {
  const { items } = req.body;

  let cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = items;
    await cart.save();
  } else {
    cart = await Cart.create({ user: req.user._id, items });
  }

  const populated = await Cart.findById(cart._id).populate(
    'items.product',
    'name images price countInStock sizes brand'
  );

  res.json({ success: true, cart: populated });
});

// @desc    Clear cart
// @route   DELETE /api/orders/cart
// @access  Private
const clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndDelete({ user: req.user._id });
  res.json({ success: true, message: 'Cart cleared' });
});

module.exports = { createOrder, getMyOrders, getOrderById, getCart, updateCart, clearCart };
