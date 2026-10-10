export function readGuestCart() {
  try {
    const items = JSON.parse(localStorage.getItem('dripstore_cart') || '[]');
    return Array.isArray(items) ? items.filter(i => i?.product?._id && Number.isSafeInteger(i.quantity) && i.quantity > 0 && typeof i.size === 'string') : [];
  } catch { return []; }
}
export const stockFor = (product, size) => product?.variantStock?.length ? (product.variantStock.find(v => v.size === size)?.countInStock || 0) : (product?.countInStock || 0);
export function mergeCarts(server, guest) {
  const merged = new Map();
  for (const item of [...server, ...guest]) {
    if (!item.product?._id) continue;
    const key = `${item.product._id}:${item.size}`;
    const existing = merged.get(key);
    const product = existing?.product || item.product;
    const quantity = Math.min(100, stockFor(product, item.size), (existing?.quantity || 0) + item.quantity);
    if (quantity > 0) merged.set(key, { product, size: item.size, quantity });
  }
  const totals = new Map();
  return [...merged.values()].map(item => {
    const available = Math.max(0, item.product.countInStock - (totals.get(item.product._id) || 0));
    const quantity = Math.min(item.quantity, available);
    totals.set(item.product._id, (totals.get(item.product._id) || 0) + quantity);
    return { ...item, quantity };
  }).filter(i => i.quantity > 0);
}
export const serializeCart = items => items.filter(i => i.product?._id).map(i => ({ product: i.product._id, quantity: i.quantity, size: i.size }));
