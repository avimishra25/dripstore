const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const { cloudinary } = require('../config/cloudinary');
const { fail, text, objectId, pagination } = require('../utils/validation');
const { release } = require('../services/inventory');
const { transitionOrder } = require('../services/orderLifecycle');
const confirmed = { orderStatus: { $ne: 'Pending Payment' } };
const revenueFilter = { isPaid: true, orderStatus: { $nin: ['Cancelled', 'Payment Review'] }, refundStatus: { $nin: ['required', 'processed'] } };
const getDashboardStats = asyncHandler(async (req, res) => {
  const since = new Date(); since.setUTCDate(1); since.setUTCHours(0,0,0,0); since.setUTCMonth(since.getUTCMonth() - 5);
  const [totalUsers, totalOrders, revenue, recentOrders, lowStock, lowStockCount, monthlyRevenue, refundRequired] = await Promise.all([
    User.countDocuments({ isAdmin: false }), Order.countDocuments(confirmed),
    Order.aggregate([{ $match: revenueFilter }, { $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
    Order.find(confirmed).sort({ createdAt: -1 }).limit(5).populate('user', 'name email'),
    Product.find({ countInStock: { $lt: 5 } }).limit(5),
    Product.countDocuments({ countInStock: { $lt: 5 } }),
    Order.aggregate([{ $match: { ...revenueFilter, paidAt: { $gte: since } } }, { $group: { _id: { year: { $year: '$paidAt' }, month: { $month: '$paidAt' } }, revenue: { $sum: '$totalPrice' }, orders: { $sum: 1 } } }, { $sort: { '_id.year': 1, '_id.month': 1 } }]),
    Order.countDocuments({ refundStatus: 'required' }),
  ]);
  res.json({ success: true, stats: { totalUsers, totalOrders, totalRevenue: revenue[0]?.total || 0, lowStockCount, refundRequired }, recentOrders, lowStock, monthlyRevenue });
});
const adminGetProducts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query, 20);
  const filter = req.query.keyword ? { $text: { $search: text(req.query.keyword, 'search', 100) } } : {};
  const [total, products] = await Promise.all([Product.countDocuments(filter), Product.find(filter).select('-reviews').sort({ createdAt: -1 }).skip(skip).limit(limit)]);
  res.json({ success: true, products, total, page, pages: Math.ceil(total / limit) });
});
const parseArray = (value, name) => {
  let array;
  try { array = typeof value === 'string' ? JSON.parse(value) : value; } catch { fail(400, `Invalid ${name}`); }
  if (!Array.isArray(array) || array.length > 50) fail(400, `Invalid ${name}`);
  return array;
};
function productFields(body) {
  const sizes = [...new Set(parseArray(body.sizes, 'sizes').map(s => text(s, 'size', 30)))];
  if (!sizes.length) fail(400, 'At least one size is required');
  const price = Number(body.price), originalPrice = Number(body.originalPrice || 0);
  const countInStock = Number(body.countInStock);
  if (!Number.isFinite(price) || price <= 0 || price > 1000000 || !Number.isFinite(originalPrice) || originalPrice < 0) fail(400, 'Invalid price');
  if (!Number.isSafeInteger(countInStock) || countInStock < 0) fail(400, 'Invalid stock');
  const variantStock = body.variantStock === undefined ? undefined : parseArray(body.variantStock, 'size stock');
  if (variantStock?.length) {
    if (variantStock.length !== sizes.length || new Set(variantStock.map(v => v.size)).size !== sizes.length || variantStock.some(v => !sizes.includes(v.size) || !Number.isSafeInteger(v.countInStock) || v.countInStock < 0) || variantStock.reduce((sum, v) => sum + v.countInStock, 0) !== countInStock) fail(400, 'Size stock must match selected sizes and total stock');
  }
  return { name: text(body.name, 'name', 150), brand: text(body.brand, 'brand', 100), category: text(body.category, 'category', 30), description: text(body.description, 'description', 10000), price: Math.round(price * 100) / 100, originalPrice: Math.round(originalPrice * 100) / 100, countInStock, sizes, tags: parseArray(body.tags || [], 'tags').map(t => text(t, 'tag', 50)), isFeatured: body.isFeatured === 'true' || body.isFeatured === true, ...(variantStock !== undefined ? { variantStock } : {}) };
}
async function deleteAssets(assets) {
  await Promise.all(assets.filter(a => a.publicId).map(a => cloudinary.uploader.destroy(a.publicId).catch(error => console.error(JSON.stringify({ event: 'media_cleanup_failed', publicId: a.publicId, message: error.message })))));
}
const saveProduct = isNew => asyncHandler(async (req, res) => {
  const uploads = (req.files || []).map(f => ({ url: f.path, publicId: f.filename }));
  let committed = false;
  try {
    const product = isNew ? new Product() : await Product.findById(objectId(req.params.id));
    if (!product) fail(404, 'Product not found');
    const keep = isNew ? [] : req.body.existingImages === undefined ? product.images : parseArray(req.body.existingImages, 'images');
    if (keep.some(url => typeof url !== 'string' || !product.images.includes(url)) || new Set(keep).size !== keep.length) fail(400, 'Invalid existing images');
    if (keep.length + uploads.length < 1 || keep.length + uploads.length > 5) fail(400, 'Use between 1 and 5 images');
    const removed = (product.imageAssets || []).filter(a => !keep.includes(a.url));
    Object.assign(product, productFields(req.body));
    if (product.variantStock?.length && product.variantStock.reduce((sum, v) => sum + v.countInStock, 0) !== product.countInStock) fail(400, 'Update size stock to match total');
    product.images = [...keep, ...uploads.map(a => a.url)];
    product.imageAssets = [...(product.imageAssets || []).filter(a => keep.includes(a.url)), ...uploads];
    await product.save(); committed = true;
    await deleteAssets(removed);
    res.status(isNew ? 201 : 200).json({ success: true, product });
  } finally { if (!committed) await deleteAssets(uploads); }
});
const createProduct = saveProduct(true), updateProduct = saveProduct(false);
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(objectId(req.params.id));
  if (!product) fail(404, 'Product not found');
  await product.deleteOne();
  await deleteAssets(product.imageAssets || []);
  res.json({ success: true, message: 'Product deleted' });
});
const getAllOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query, 20);
  const filter = req.query.status ? { orderStatus: text(req.query.status, 'status', 30) } : confirmed;
  if (req.query.refund === 'required') filter.refundStatus = 'required';
  const [total, orders] = await Promise.all([Order.countDocuments(filter), Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('user', 'name email')]);
  res.json({ success: true, orders, total, page, pages: Math.ceil(total / limit) });
});
const updateOrderStatus = asyncHandler(async (req, res) => {
  const id = objectId(req.params.id);
  const order = await mongoose.connection.transaction(async session => {
    const current = await Order.findById(id).session(session);
    if (!current) fail(404, 'Order not found');
    await transitionOrder(current, req.body.orderStatus, req.user._id, items => release(items, session));
    await current.save({ session });
    return current;
  });
  res.json({ success: true, order });
});
const getAllUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query, 20);
  const filter = {};
  if (req.query.keyword) {
    const escaped = text(req.query.keyword, 'search', 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [{ name: { $regex: escaped, $options: 'i' } }, { email: { $regex: escaped, $options: 'i' } }];
  }
  const [users, total] = await Promise.all([User.find(filter).select('name email phone isAdmin createdAt').sort({ createdAt: -1 }).skip(skip).limit(limit), User.countDocuments(filter)]);
  res.json({ success: true, users, total, page, pages: Math.ceil(total / limit) });
});
module.exports = { getDashboardStats, adminGetProducts, createProduct, updateProduct, deleteProduct, getAllOrders, updateOrderStatus, getAllUsers, productFields };
