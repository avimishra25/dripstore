const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true },
    brand: { type: String, required: [true, 'Brand is required'], trim: true },
    category: {
      type: String,
      required: true,
      enum: ['sneakers', 'hoodies', 'streetwear', 'accessories'],
    },
    description: { type: String, required: [true, 'Description is required'] },
    price: { type: Number, required: [true, 'Price is required'], min: 0 },
    originalPrice: { type: Number, default: 0 }, // for showing discounts
    countInStock: { type: Number, required: true, default: 0, min: 0 },
    images: [{ type: String }], // Cloudinary URLs
    sizes: [{ type: String }], // e.g. ['S','M','L','XL'] or ['7','8','9','10']
    tags: [{ type: String }],
    isFeatured: { type: Boolean, default: false },
    reviews: [reviewSchema],
    numReviews: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto-compute average rating on save
productSchema.methods.calculateRating = function () {
  if (this.reviews.length === 0) {
    this.rating = 0;
    this.numReviews = 0;
  } else {
    this.numReviews = this.reviews.length;
    this.rating =
      this.reviews.reduce((acc, r) => acc + r.rating, 0) / this.reviews.length;
  }
};

// Text index for search
productSchema.index({ name: 'text', brand: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
