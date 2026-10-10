const fail = (status, message) => { throw Object.assign(new Error(message), { statusCode: status }); };
const text = (value, name, max = 200) => {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) fail(400, `Invalid ${name}`);
  return value.trim();
};
const objectId = value => {
  if (typeof value !== 'string' || !/^[a-f\d]{24}$/i.test(value)) fail(400, 'Invalid ID');
  return value;
};
const pagination = (query, defaultLimit = 12) => {
  const page = Number(query.page ?? 1), limit = Number(query.limit ?? defaultLimit);
  if (!Number.isSafeInteger(page) || page < 1 || page > 100000 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) fail(400, 'Invalid pagination');
  return { page, limit, skip: (page - 1) * limit };
};
const normalizeItems = (items, allowEmpty = false) => {
  if (!Array.isArray(items) || (!allowEmpty && !items.length) || items.length > 100) fail(400, 'Provide between 1 and 100 items');
  const merged = new Map();
  for (const item of items) {
    if (!item || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) fail(400, 'Quantity must be an integer between 1 and 100');
    const product = objectId(item.product), size = text(item.size, 'size', 30);
    const key = `${product}:${size}`;
    const quantity = (merged.get(key)?.quantity || 0) + item.quantity;
    if (quantity > 100) fail(400, 'Maximum quantity is 100 per size');
    merged.set(key, { product, size, quantity });
  }
  return [...merged.values()];
};
const shipping = value => {
  if (!value || typeof value !== 'object') fail(400, 'Shipping address is required');
  const address = Object.fromEntries(['street', 'city', 'state', 'pincode', 'phone'].map(key => [key, text(value[key], key)]));
  if (!/^\d{6}$/.test(address.pincode) || !/^\d{10}$/.test(address.phone)) fail(400, 'Invalid pincode or phone');
  if (value.country && value.country !== 'India') fail(400, 'Shipping is currently available within India');
  return { ...address, country: 'India' };
};
const quote = items => {
  const subtotal = items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0);
  const delivery = subtotal > 99900 ? 0 : 9900;
  const tax = Math.round(subtotal * 18 / 100);
  if (!Number.isSafeInteger(subtotal) || subtotal < 0 || subtotal > 100000000) fail(400, 'Invalid order total');
  return { itemsPrice: subtotal / 100, shippingPrice: delivery / 100, taxPrice: tax / 100, totalPrice: (subtotal + delivery + tax) / 100, amountPaise: subtotal + delivery + tax };
};
const stockFor = (product, size) => product.variantStock?.length ? (product.variantStock.find(v => v.size === size)?.countInStock || 0) : product.countInStock;
module.exports = { fail, text, objectId, pagination, normalizeItems, shipping, quote, stockFor };
