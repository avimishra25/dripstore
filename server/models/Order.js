const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  image: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1, max: 100, validate: Number.isSafeInteger },
  size: { type: String, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderItems: [orderItemSchema],
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: 'India' },
      phone: { type: String, required: true },
    },
    paymentMethod: { type: String, default: 'Razorpay' },
    amountPaise: { type: Number, min: 1, validate: Number.isSafeInteger },
    stockDeducted: { type: Boolean },
    refundStatus: { type: String, enum: ['none', 'required', 'processed'], default: 'none' },
    refundedAt: Date,
    statusHistory: [{ status: String, at: { type: Date, default: Date.now }, actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, note: String }],
    paymentResult: {
      razorpay_order_id: String,
      razorpay_payment_id: String,
      razorpay_signature: String,
      status: String,
    },
    itemsPrice: { type: Number, required: true, default: 0 },
    shippingPrice: { type: Number, required: true, default: 0 },
    taxPrice: { type: Number, required: true, default: 0 },
    totalPrice: { type: Number, required: true, default: 0 },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    orderStatus: {
      type: String,
      enum: ['Pending Payment', 'Payment Review', 'Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending Payment',
    },
    deliveredAt: { type: Date },
  },
  { timestamps: true, optimisticConcurrency: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ 'paymentResult.razorpay_order_id': 1 }, { unique: true, partialFilterExpression: { 'paymentResult.razorpay_order_id': { $type: 'string' } } });
orderSchema.index({ 'paymentResult.razorpay_payment_id': 1 }, { unique: true, partialFilterExpression: { 'paymentResult.razorpay_payment_id': { $type: 'string' } } });

module.exports = mongoose.model('Order', orderSchema);
