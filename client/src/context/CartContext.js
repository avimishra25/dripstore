import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch cart from server when user logs in
  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      // Load from localStorage for guests
      const saved = localStorage.getItem('dripstore_cart');
      setCartItems(saved ? JSON.parse(saved) : []);
    }
  }, [user]);

  // Persist guest cart to localStorage
  useEffect(() => {
    if (!user) {
      localStorage.setItem('dripstore_cart', JSON.stringify(cartItems));
    }
  }, [cartItems, user]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/orders/cart');
      setCartItems(data.cart?.items || []);
    } catch (err) {
      console.error('Failed to fetch cart:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const syncCartToServer = async (items) => {
    if (!user) return;
    try {
      await api.put('/orders/cart', { items: items.map(i => ({
        product: i.product._id || i.product,
        quantity: i.quantity,
        size: i.size,
      }))});
    } catch (err) {
      console.error('Cart sync error:', err.message);
    }
  };

  const addToCart = useCallback((product, size, quantity = 1) => {
    setCartItems((prev) => {
      const exists = prev.find(
        (i) => (i.product._id || i.product) === product._id && i.size === size
      );
      let updated;
      if (exists) {
        updated = prev.map((i) =>
          (i.product._id || i.product) === product._id && i.size === size
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      } else {
        updated = [...prev, { product, size, quantity }];
      }
      syncCartToServer(updated);
      return updated;
    });
  }, [user]);

  const removeFromCart = useCallback((productId, size) => {
    setCartItems((prev) => {
      const updated = prev.filter(
        (i) => !((i.product._id || i.product) === productId && i.size === size)
      );
      syncCartToServer(updated);
      return updated;
    });
  }, [user]);

  const updateQuantity = useCallback((productId, size, quantity) => {
    if (quantity < 1) return;
    setCartItems((prev) => {
      const updated = prev.map((i) =>
        (i.product._id || i.product) === productId && i.size === size
          ? { ...i, quantity }
          : i
      );
      syncCartToServer(updated);
      return updated;
    });
  }, [user]);

  const clearCart = useCallback(async () => {
    setCartItems([]);
    if (user) {
      try { await api.delete('/orders/cart'); } catch (e) {}
    }
  }, [user]);

  const cartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);
  const cartTotal = cartItems.reduce((acc, i) => {
    const price = i.product?.price || 0;
    return acc + price * i.quantity;
  }, 0);

  return (
    <CartContext.Provider value={{
      cartItems, cartCount, cartTotal, loading,
      addToCart, removeFromCart, updateQuantity, clearCart, fetchCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
