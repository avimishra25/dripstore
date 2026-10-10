const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, default: 1, min: 1, max: 100, validate: Number.isSafeInteger },
  size: { type: String, required: true },
});

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [cartItemSchema],
    revision: { type: Number, default: 0 },
    guestMergeIds: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cart', cartSchema);
