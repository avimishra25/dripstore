import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ProductsPage from './ProductsPage';
import api from '../utils/api';
vi.mock('../utils/api', () => ({ default: { get: vi.fn() } }));
vi.mock('../components/ProductCard', () => ({ default: ({ product }) => <div>{product.name}</div> }));
describe('catalog filters', () => {
  it('keeps page 2, forwards featured filter, and resets page only when another filter changes', async () => {
    api.get.mockResolvedValue({ data: { products: [{ _id: '1', name: 'Test Shoe' }], pages: 3, total: 30 } });
    render(<MemoryRouter initialEntries={['/products?featured=true']}><ProductsPage /></MemoryRouter>);
    await screen.findByText('Test Shoe');
    expect(api.get.mock.calls[0][0]).toContain('featured=true');
    await userEvent.click(screen.getByRole('button', { name: '2', exact: true }));
    await waitFor(() => expect(api.get.mock.lastCall[0]).toContain('page=2'));
    await screen.findByText('Test Shoe');
    await userEvent.click(screen.getByLabelText('Hoodies'));
    await waitFor(() => { expect(api.get.mock.lastCall[0]).toContain('page=1'); expect(api.get.mock.lastCall[0]).toContain('category=hoodies'); });
  });
});
