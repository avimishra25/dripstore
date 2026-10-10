const Product = require('../models/Product');
const { fail, stockFor } = require('../utils/validation');
// Callers run inside a transaction; conflicting writes retry the entire operation.
async function allocate(items, session) {
  const products = await Product.find({ _id: { $in: items.map(i => i.product) } }).session(session);
  const byId = new Map(products.map(p => [String(p._id), p]));
  for (const item of items) {
    const product = byId.get(String(item.product));
    if (!product || !product.sizes.includes(item.size) || stockFor(product, item.size) < item.quantity || product.countInStock < item.quantity) return false;
    product.countInStock -= item.quantity;
    const variant = product.variantStock?.find(v => v.size === item.size);
    if (variant) variant.countInStock -= item.quantity;
  }
  for (const product of products) await product.save({ session });
  return true;
}
async function release(items, session) {
  for (const item of items) {
    const product = await Product.findById(item.product).session(session);
    if (!product) continue;
    product.countInStock += item.quantity;
    if (product.variantStock?.length) {
      const variant = product.variantStock.find(v => v.size === item.size);
      if (!variant) fail(409, 'Restore the ordered size before cancelling this order');
      variant.countInStock += item.quantity;
    }
    await product.save({ session });
  }
}
module.exports = { allocate, release };
