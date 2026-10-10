import { it, expect } from 'vitest';
import { mergeCarts, readGuestCart } from './cart';
const product = { _id: 'p', price: 10, countInStock: 5, sizes: ['M','L'] };
it('merges guest items, caps total stock across sizes and drops deleted products', () => {
  const result = mergeCarts([{ product, size: 'M', quantity: 2 }, { product: null, size: 'M', quantity: 1 }], [{ product, size: 'M', quantity: 2 }, { product, size: 'L', quantity: 3 }]);
  expect(result.map(i => i.quantity)).toEqual([4,1]);
});
it('malformed localStorage never crashes startup', () => {
  localStorage.setItem('dripstore_cart', '{bad');
  expect(readGuestCart()).toEqual([]);
  localStorage.setItem('dripstore_cart', '{}');
  expect(readGuestCart()).toEqual([]);
});
