const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  adminGetProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllOrders,
  updateOrderStatus,
  getAllUsers,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

// All admin routes require auth + admin role
router.use(protect, adminOnly);

// Dashboard
router.get('/stats', getDashboardStats);

// Products
router.get('/products', adminGetProducts);
router.post('/products', upload.array('images', 5), createProduct);
router.put('/products/:id', upload.array('images', 5), updateProduct);
router.delete('/products/:id', deleteProduct);

// Orders
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);

// Users
router.get('/users', getAllUsers);

module.exports = router;
