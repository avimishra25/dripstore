const express = require('express');
const router = express.Router();
const { createRazorpayOrder, verifyPayment, cancelPendingOrder } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create-order', protect, createRazorpayOrder);
router.post('/verify', protect, verifyPayment);
router.delete('/cancel/:orderId', protect, cancelPendingOrder);

module.exports = router;
