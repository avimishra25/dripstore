import React from 'react';
import { it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DemoProvider, useDemo } from './DemoContext';
import api from '../utils/api';
const mocks = vi.hoisted(() => ({ saveAuth: vi.fn() }));
vi.mock('./AuthContext', () => ({ useAuth: () => ({ user: null, saveAuth: mocks.saveAuth }) }));
vi.mock('../utils/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
beforeEach(() => {
  api.get.mockResolvedValue({ data: { enabled: true } });
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
});
function Checkout({ onOutcome }) {
  const { chooseDemoOutcome } = useDemo();
  return <button onClick={async () => onOutcome(await chooseDemoOutcome())}>Simulate</button>;
}
it('shows demo shortcuts and saves the selected role session', async () => {
  api.post.mockResolvedValue({ data: { token: 'demo-token', user: { _id: 'demo', isAdmin: true } } });
  render(<MemoryRouter><DemoProvider>Store</DemoProvider></MemoryRouter>);
  fireEvent.click(await screen.findByRole('button', { name: 'Try admin' }));
  await waitFor(() => expect(mocks.saveAuth).toHaveBeenCalledWith('demo-token', expect.objectContaining({ isAdmin: true })));
  expect(api.post).toHaveBeenCalledWith('/demo/session', { role: 'admin' });
});
it.each([['Successful payment', 'success'], ['Failed payment', 'failure'], ['Cancel checkout', 'cancel']])('payment chooser resolves %s', async (label, outcome) => {
  const onOutcome = vi.fn();
  render(<MemoryRouter><DemoProvider><Checkout onOutcome={onOutcome} /></DemoProvider></MemoryRouter>);
  fireEvent.click(screen.getByText('Simulate'));
  fireEvent.click(await screen.findByRole('button', { name: new RegExp(label) }));
  await waitFor(() => expect(onOutcome).toHaveBeenCalledWith(outcome));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
it('normal mode hides the demo controls', async () => {
  api.get.mockResolvedValue({ data: { enabled: false } });
  render(<MemoryRouter><DemoProvider>Store</DemoProvider></MemoryRouter>);
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/demo/status'));
  expect(screen.queryByLabelText('Demo controls')).not.toBeInTheDocument();
});
