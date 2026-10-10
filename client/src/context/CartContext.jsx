import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';
import { readGuestCart, mergeCarts, serializeCart, stockFor } from '../utils/cart';
const CartContext = createContext();
export const CartProvider = ({ children }) => {
  const { user, initializing } = useAuth();
  const userId = user?._id || null;
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const state = useRef({ items: [], revision: 0, epoch: 0, ready: false });
  const queue = useRef(Promise.resolve());
  const [reload, setReload] = useState(0);
  useEffect(() => {
    if (initializing) return;
    const epoch = ++state.current.epoch;
    const token = localStorage.getItem('dripstore_token');
    const options = { headers: { Authorization: token ? `Bearer ${token}` : '' } };
    state.current = { items: [], revision: 0, epoch, ready: false, userId, options };
    setCartItems([]); setLoading(true); setError('');
    const initialize = async () => {
      try {
        let items = readGuestCart(), revision = 0;
        if (userId) {
          const { data } = await api.get('/orders/cart', options);
          if (state.current.epoch !== epoch) return;
          revision = data.cart.revision || 0;
          const guest = items;
          items = data.cart.items.filter(i => i.product);
          if (guest.length) {
            const mergeId = localStorage.getItem('dripstore_guest_merge_id') || crypto.randomUUID();
            localStorage.setItem('dripstore_guest_merge_id', mergeId);
            const merged = mergeCarts(items, guest);
            try {
              const saved = await api.put('/orders/cart', { items: serializeCart(merged), revision, mergeId }, options);
              if (state.current.epoch !== epoch) return;
              items = saved.data.cart.items; revision = saved.data.cart.revision;
              localStorage.removeItem('dripstore_cart');
              localStorage.removeItem('dripstore_guest_merge_id');
            } catch {
              toast.error('Guest cart could not be merged. It remains saved; check stock and retry.');
            }
          }
        }
        if (state.current.epoch !== epoch) return;
        Object.assign(state.current, { items, revision, ready: true });
        setCartItems(items);
      } catch (err) {
        if (state.current.epoch === epoch) setError(err.response?.data?.message || 'Could not load cart. Please retry.');
      } finally { if (state.current.epoch === epoch) setLoading(false); }
    };
    queue.current = initialize();
    return () => { if (state.current.epoch === epoch) { state.current.epoch++; state.current.ready = false; } };
  }, [userId, initializing, reload]);
  const mutate = useCallback(reducer => {
    const epoch = state.current.epoch;
    const operation = queue.current.catch(() => {}).then(async () => {
      const current = state.current;
      if (current.epoch !== epoch || !current.ready) throw new Error('Cart is loading. Please retry.');
      const items = reducer(current.items);
      if (current.userId) {
        const { data } = await api.put('/orders/cart', { items: serializeCart(items), revision: current.revision }, current.options);
        if (state.current.epoch !== epoch) return false;
        current.items = data.cart.items.filter(i => i.product);
        current.revision = data.cart.revision;
      } else {
        current.items = items;
        localStorage.setItem('dripstore_cart', JSON.stringify(items));
        localStorage.setItem('dripstore_guest_merge_id', crypto.randomUUID());
      }
      setCartItems(current.items); setError('');
      return true;
    }).catch(err => {
      if (state.current.epoch === epoch) {
        toast.error(err.response?.data?.message || err.message || 'Cart update failed');
        if (err.response?.status === 409) setReload(n => n + 1);
      }
      return false;
    });
    queue.current = operation;
    return operation;
  }, []);
  const addToCart = useCallback((product, size, quantity = 1) => mutate(items => {
    if (!Number.isSafeInteger(quantity) || quantity < 1 || !product.sizes.includes(size)) throw new Error('Select a valid size and quantity');
    const existing = items.find(i => i.product._id === product._id && i.size === size);
    const total = items.filter(i => i.product._id === product._id).reduce((sum, i) => sum + i.quantity, 0);
    if (total + quantity > product.countInStock || (existing?.quantity || 0) + quantity > Math.min(100, stockFor(product, size))) throw new Error('Not enough stock');
    return existing ? items.map(i => i === existing ? { ...i, quantity: i.quantity + quantity } : i) : [...items, { product, size, quantity }];
  }), [mutate]);
  const updateQuantity = useCallback((id, size, quantity) => mutate(items => {
    const item = items.find(i => i.product._id === id && i.size === size);
    if (!item) throw new Error('Product is no longer in cart');
    const other = items.filter(i => i.product._id === id && i !== item).reduce((sum, i) => sum + i.quantity, 0);
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > Math.min(100, stockFor(item.product, size)) || other + quantity > item.product.countInStock) throw new Error('Not enough stock');
    return items.map(i => i === item ? { ...i, quantity } : i);
  }), [mutate]);
  const removeFromCart = useCallback((id, size) => mutate(items => items.filter(i => !(i.product._id === id && i.size === size))), [mutate]);
  const clearCart = useCallback(() => mutate(() => []), [mutate]);
  const removePurchased = useCallback(purchased => mutate(items => items.flatMap(item => {
    const bought = purchased.find(p => String(p.product?._id || p.product) === item.product._id && p.size === item.size);
    const quantity = item.quantity - (bought?.quantity || 0);
    return quantity > 0 ? [{ ...item, quantity }] : [];
  })), [mutate]);
  const fetchCart = useCallback(() => setReload(n => n + 1), []);
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = cartItems.reduce((sum, i) => sum + Math.round(i.product.price * 100) * i.quantity, 0) / 100;
  return <CartContext.Provider value={{ cartItems, cartCount, cartTotal, loading, error, addToCart, updateQuantity, removeFromCart, clearCart, removePurchased, fetchCart }}>{children}</CartContext.Provider>;
};
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
