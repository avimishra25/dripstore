const express = require('express');
const router = express.Router();
const { createRazorpayOrder, verifyPayment, reconcilePayment, cancelPendingOrder } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create-order', protect, createRazorpayOrder);
router.post('/verify', protect, verifyPayment);
router.post('/reconcile/:orderId', protect, reconcilePayment);
router.delete('/cancel/:orderId', protect, cancelPendingOrder);

module.exports = router;
