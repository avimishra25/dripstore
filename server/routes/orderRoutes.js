const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getCart,
  updateCart,
  clearCart,
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

// Cart routes
router.get('/cart', protect, getCart);
router.put('/cart', protect, updateCart);
router.delete('/cart', protect, clearCart);

// Order routes
router.post('/', protect, createOrder);
router.get('/myorders', protect, getMyOrders);
router.get('/:id', protect, getOrderById);

module.exports = router;
