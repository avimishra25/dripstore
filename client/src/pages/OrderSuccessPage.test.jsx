import React from 'react';
import { it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import OrderSuccessPage from './OrderSuccessPage';
import api from '../utils/api';
vi.mock('../utils/api', () => ({ default: { get: vi.fn() } }));
it('does not show success for an unpaid order', async () => {
  api.get.mockResolvedValue({ data: { order: { _id: '1', isPaid: false } } });
  render(<MemoryRouter initialEntries={['/order-success/1']}><Routes><Route path="/order-success/:id" element={<OrderSuccessPage />} /><Route path="/orders/:id" element={<div>Payment pending</div>} /></Routes></MemoryRouter>);
  await screen.findByText('Payment pending');
  expect(screen.queryByText('ORDER PLACED!')).not.toBeInTheDocument();
});
it('fetch failure shows an error instead of success', async () => {
  api.get.mockRejectedValue(new Error('offline'));
  render(<MemoryRouter><OrderSuccessPage /></MemoryRouter>);
  await screen.findByText(/Could not confirm order/);
  expect(screen.queryByText('ORDER PLACED!')).not.toBeInTheDocument();
});
