const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const { cloudinary } = require('../config/cloudinary');

// ============ DASHBOARD ============

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Admin
const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalOrders, revenueData, recentOrders, lowStock] = await Promise.all([
    User.countDocuments({ isAdmin: false }),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]),
    Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name email'),
    Product.find({ countInStock: { $lt: 5 } }).limit(5),
  ]);

  const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

  // Monthly revenue for chart (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyRevenue = await Order.aggregate([
    { $match: { isPaid: true, createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        revenue: { $sum: '$totalPrice' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  res.json({
    success: true,
    stats: { totalUsers, totalOrders, totalRevenue },
    recentOrders,
    lowStock,
    monthlyRevenue,
  });
});

// ============ PRODUCTS ============

// @desc    Admin get all products
// @route   GET /api/admin/products
// @access  Admin
const adminGetProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, keyword } = req.query;
  const filter = keyword ? { $text: { $search: keyword } } : {};
  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({ success: true, products, total, pages: Math.ceil(total / limit) });
});

// @desc    Create product
// @route   POST /api/admin/products
// @access  Admin
const createProduct = asyncHandler(async (req, res) => {
  const { name, brand, category, description, price, originalPrice, countInStock, sizes, tags, isFeatured } = req.body;

  // Handle uploaded images
  const images = req.files ? req.files.map((f) => f.path) : [];

  // Parse JSON arrays from form-data
  const parsedSizes = typeof sizes === 'string' ? JSON.parse(sizes) : sizes || [];
  const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags || [];

  const product = await Product.create({
    name, brand, category, description,
    price: Number(price),
    originalPrice: Number(originalPrice) || 0,
    countInStock: Number(countInStock),
    sizes: parsedSizes,
    tags: parsedTags,
    images,
    isFeatured: isFeatured === 'true',
  });

  res.status(201).json({ success: true, product });
});

// @desc    Update product
// @route   PUT /api/admin/products/:id
// @access  Admin
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const { name, brand, category, description, price, originalPrice, countInStock, sizes, tags, isFeatured, existingImages } = req.body;

  // New uploaded images
  const newImages = req.files ? req.files.map((f) => f.path) : [];
  const keepImages = existingImages ? (typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages) : [];

  const parsedSizes = typeof sizes === 'string' ? JSON.parse(sizes) : sizes || product.sizes;
  const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags || product.tags;

  product.name = name || product.name;
  product.brand = brand || product.brand;
  product.category = category || product.category;
  product.description = description || product.description;
  product.price = price ? Number(price) : product.price;
  product.originalPrice = originalPrice ? Number(originalPrice) : product.originalPrice;
  product.countInStock = countInStock !== undefined ? Number(countInStock) : product.countInStock;
  product.sizes = parsedSizes;
  product.tags = parsedTags;
  product.isFeatured = isFeatured !== undefined ? isFeatured === 'true' : product.isFeatured;
  product.images = [...keepImages, ...newImages];

  const updated = await product.save();
  res.json({ success: true, product: updated });
});

// @desc    Delete product
// @route   DELETE /api/admin/products/:id
// @access  Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Delete images from Cloudinary
  for (const imageUrl of product.images) {
    try {
      const publicId = imageUrl.split('/').slice(-2).join('/').split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.error('Cloudinary delete error:', err.message);
    }
  }

  await product.deleteOne();
  res.json({ success: true, message: 'Product deleted successfully' });
});

// ============ ORDERS ============

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Admin
const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  // Exclude ghost 'Pending Payment' orders unless explicitly filtered
  const filter = status ? { orderStatus: status } : { orderStatus: { $ne: 'Pending Payment' } };
  const total = await Order.countDocuments(filter);
  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .populate('user', 'name email');

  res.json({ success: true, orders, total, pages: Math.ceil(total / limit) });
});

// @desc    Update order status
// @route   PUT /api/admin/orders/:id/status
// @access  Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  order.orderStatus = orderStatus;
  if (orderStatus === 'Delivered') {
    order.deliveredAt = new Date();
  }
  await order.save();

  res.json({ success: true, order });
});

// ============ USERS ============

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).sort({ createdAt: -1 });
  res.json({ success: true, users });
});

module.exports = {
  getDashboardStats,
  adminGetProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllOrders,
  updateOrderStatus,
  getAllUsers,
};
