import React from 'react';
import { it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CheckoutPage from './CheckoutPage';
import api from '../utils/api';
vi.mock('../utils/api', () => ({ default: { post: vi.fn() } }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { name: 'Demo customer' } }) }));
vi.mock('../context/DemoContext', () => ({ useDemo: () => ({ enabled: true }) }));
vi.mock('../context/CartContext', () => ({ useCart: () => ({
  cartItems: [{ product: { _id: 'product-id', name: 'Photo product', price: 1000, images: ['data:image/jpeg;base64,' + 'A'.repeat(200000)] }, quantity: 1, size: 'M' }],
  cartTotal: 1000, loading: false, removePurchased: vi.fn(), fetchCart: vi.fn(),
}) }));
it('checkout with a large uploaded photo sends only product ID, quantity, and size', async () => {
  api.post.mockResolvedValue({ data: { order: { _id: 'order-id', totalPrice: 1180, itemsPrice: 1000, taxPrice: 180, shippingPrice: 0 } } });
  render(<MemoryRouter><CheckoutPage /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Continue →' }));
  fireEvent.click(screen.getByRole('button', { name: 'Place Order →' }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/orders', expect.objectContaining({
    orderItems: [{ product: 'product-id', quantity: 1, size: 'M' }],
  })));
  expect(JSON.stringify(api.post.mock.calls[0][1]).length).toBeLessThan(1000);
  expect(await screen.findByRole('button', { name: /Simulate/ })).toBeInTheDocument();
});
