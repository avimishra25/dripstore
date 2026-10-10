import React from 'react';
import { it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { CartProvider, useCart } from './CartContext';
import api from '../utils/api';
const auth = vi.hoisted(() => ({ user: { _id: 'buyer' }, initializing: false }));
vi.mock('./AuthContext', () => ({ useAuth: () => auth }));
vi.mock('../utils/api', () => ({ default: { get: vi.fn(), put: vi.fn() } }));
vi.mock('react-toastify', () => ({ toast: { error: vi.fn() } }));
const product = { _id: '507f1f77bcf86cd799439011', name: 'Shoe', price: 100, sizes: ['8'], countInStock: 10 };
function Cart() {
  const { loading, cartCount, addToCart } = useCart();
  return <><span>{loading ? 'Loading' : `Count ${cartCount}`}</span><button onClick={() => addToCart(product, '8')}>Add</button></>;
}
beforeEach(() => { vi.clearAllMocks(); auth.user = { _id: 'buyer' }; });
it('serializes rapid cart changes and uses the acknowledged revision', async () => {
  api.get.mockResolvedValue({ data: { cart: { items: [], revision: 0 } } });
  let finish;
  api.put.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }))
    .mockResolvedValueOnce({ data: { cart: { items: [{ product, size: '8', quantity: 2 }], revision: 2 } } });
  render(<CartProvider><Cart /></CartProvider>);
  await screen.findByText('Count 0');
  fireEvent.click(screen.getByText('Add')); fireEvent.click(screen.getByText('Add'));
  await waitFor(() => expect(api.put).toHaveBeenCalledTimes(1));
  await act(async () => finish({ data: { cart: { items: [{ product, size: '8', quantity: 1 }], revision: 1 } } }));
  await screen.findByText('Count 2');
  expect(api.put.mock.calls[1][1]).toEqual({ items: [{ product: product._id, size: '8', quantity: 2 }], revision: 1 });
});
it('merges a guest cart on login and removes local data only after acknowledgement', async () => {
  localStorage.setItem('dripstore_cart', JSON.stringify([{ product, size: '8', quantity: 1 }]));
  api.get.mockResolvedValue({ data: { cart: { items: [{ product, size: '8', quantity: 1 }], revision: 2 } } });
  api.put.mockResolvedValue({ data: { cart: { items: [{ product, size: '8', quantity: 2 }], revision: 3 } } });
  render(<React.StrictMode><CartProvider><Cart /></CartProvider></React.StrictMode>);
  await screen.findByText('Count 2');
  expect(api.put).toHaveBeenCalledTimes(1);
  expect(api.put.mock.calls[0][1].mergeId).toMatch(/^[a-z0-9-]{36}$/);
  expect(localStorage.getItem('dripstore_cart')).toBeNull();
});
