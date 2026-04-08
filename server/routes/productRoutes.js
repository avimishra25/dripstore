const express = require('express');
const router = express.Router();
const { getProducts, getProductById, addReview } = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/:id/reviews', protect, addReview);

module.exports = router;
