const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { fail, objectId, pagination, normalizeItems, shipping, quote, stockFor } = require('../utils/validation');
const cartFields = 'name images price countInStock sizes brand variantStock';
async function resolveItems(input, allowEmpty = false) {
  const items = normalizeItems(input, allowEmpty);
  const products = await Product.find({ _id: { $in: items.map(i => i.product) } });
  const byId = new Map(products.map(p => [String(p._id), p]));
  const totals = new Map();
  return items.map(item => {
    const product = byId.get(item.product);
    if (!product) fail(409, 'A product is no longer available. Update your cart.');
    if (!product.sizes.includes(item.size)) fail(400, 'Selected size is unavailable');
    const total = (totals.get(item.product) || 0) + item.quantity;
    totals.set(item.product, total);
    if (stockFor(product, item.size) < item.quantity || product.countInStock < total) fail(409, `Not enough stock for ${product.name}`);
    return { ...item, name: product.name, image: product.images[0] || '', price: product.price };
  });
}
const createOrder = asyncHandler(async (req, res) => {
  const orderItems = await resolveItems(req.body.orderItems);
  const order = await Order.create({ user: req.user._id, orderItems, shippingAddress: shipping(req.body.shippingAddress), ...quote(orderItems), paymentMethod: 'Razorpay', orderStatus: 'Pending Payment', statusHistory: [{ status: 'Pending Payment', actor: req.user._id }] });
  res.status(201).json({ success: true, order });
});
const getMyOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query, 20);
  const filter = { user: req.user._id };
  const [orders, total] = await Promise.all([Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit), Order.countDocuments(filter)]);
  res.json({ success: true, orders, page, pages: Math.ceil(total / limit), total });
});
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(objectId(req.params.id)).populate('user', 'name email');
  if (!order) fail(404, 'Order not found');
  if (String(order.user?._id) !== String(req.user._id) && !req.user.isAdmin) fail(403, 'Not authorized');
  res.json({ success: true, order });
});
const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product', cartFields);
  res.json({ success: true, cart: cart ? { items: cart.items.filter(i => i.product), revision: cart.revision || 0 } : { items: [], revision: 0 } });
});
const updateCart = asyncHandler(async (req, res) => {
  const mergeId = req.body.mergeId;
  if (mergeId !== undefined) {
    if (typeof mergeId !== 'string' || !/^[a-z\d-]{36}$/i.test(mergeId)) fail(400, 'Invalid cart merge ID');
    const previous = await Cart.findOne({ user: req.user._id, guestMergeIds: mergeId }).populate('items.product', cartFields);
    if (previous) return res.json({ success: true, cart: previous });
  }
  const items = await resolveItems(req.body.items, true);
  const revision = req.body.revision;
  if (!Number.isSafeInteger(revision) || revision < 0) fail(400, 'Cart revision is required');
  const cart = await Cart.findOneAndUpdate({ user: req.user._id, ...(revision === 0 ? { $or: [{ revision: 0 }, { revision: { $exists: false } }] } : { revision }) }, { $set: { items }, $inc: { revision: 1 }, ...(mergeId ? { $push: { guestMergeIds: { $each: [mergeId], $slice: -100 } } } : {}) }, { new: true, upsert: revision === 0, runValidators: true });
  if (!cart) fail(409, 'Cart changed in another tab. Refresh and retry.');
  await cart.populate('items.product', cartFields);
  res.json({ success: true, cart });
});
const clearCart = asyncHandler(async (req, res) => {
  const revision = Number(req.query.revision);
  if (!Number.isSafeInteger(revision) || revision < 0) fail(400, 'Cart revision is required');
  const cart = await Cart.findOneAndUpdate({ user: req.user._id, revision }, { $set: { items: [] }, $inc: { revision: 1 } }, { new: true });
  if (!cart) fail(409, 'Cart changed. Refresh and retry.');
  res.json({ success: true, cart });
});
module.exports = { createOrder, getMyOrders, getOrderById, getCart, updateCart, clearCart, resolveItems };
