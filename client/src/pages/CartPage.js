import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';
import './CartPage.css';

const CartPage = () => {
  const { cartItems, cartTotal, removeFromCart, updateQuantity, clearCart } = useCart();
  const navigate = useNavigate();

  const shippingPrice = cartTotal > 999 ? 0 : 99;
  const taxPrice = Math.round(cartTotal * 0.18);
  const orderTotal = cartTotal + shippingPrice + taxPrice;

  if (cartItems.length === 0) {
    return (
      <div className="page-padding">
        <div className="empty-cart">
          <div className="empty-cart-icon">🛒</div>
          <h2 className="display-font">YOUR CART IS EMPTY</h2>
          <p>Looks like you haven't added anything yet.</p>
          <Link to="/products" className="btn btn-primary btn-lg mt-2">Start Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page page-padding">
      <div className="page-header">
        <h1 className="display-font">YOUR CART ({cartItems.length})</h1>
      </div>

      <div className="cart-layout">
        {/* Cart Items */}
        <div className="cart-items">
          <div className="cart-items-header">
            <span>Product</span><span>Size</span><span>Qty</span><span>Price</span><span></span>
          </div>
          {cartItems.map((item, idx) => {
            const product = item.product;
            const price = product?.price || 0;
            const name = product?.name || 'Product';
            const image = product?.images?.[0];
            const productId = product?._id || product;

            return (
              <div key={`${productId}-${item.size}-${idx}`} className="cart-item">
                <div className="cart-item-product">
                  <div className="cart-item-img">
                    {image ? <img src={image} alt={name} /> : <span>👟</span>}
                  </div>
                  <div className="cart-item-details">
                    <Link to={`/products/${productId}`} className="cart-item-name">{name}</Link>
                    <span className="cart-item-brand">{product?.brand}</span>
                  </div>
                </div>
                <span className="cart-item-size">{item.size}</span>
                <div className="cart-qty-control">
                  <button onClick={() => updateQuantity(productId, item.size, item.quantity - 1)} disabled={item.quantity <= 1}>−</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(productId, item.size, item.quantity + 1)}>+</button>
                </div>
                <span className="cart-item-price">₹{(price * item.quantity).toLocaleString()}</span>
                <button
                  className="cart-remove-btn"
                  onClick={() => { removeFromCart(productId, item.size); toast.info('Item removed'); }}
                  aria-label="Remove"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </button>
              </div>
            );
          })}

          <div className="cart-actions">
            <Link to="/products" className="btn btn-secondary">← Continue Shopping</Link>
            <button className="btn btn-ghost" onClick={() => { clearCart(); toast.info('Cart cleared'); }}>
              Clear Cart
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="order-summary">
          <h3>Order Summary</h3>
          <div className="summary-rows">
            <div className="summary-row"><span>Subtotal</span><span>₹{cartTotal.toLocaleString()}</span></div>
            <div className="summary-row">
              <span>Shipping</span>
              <span>{shippingPrice === 0 ? <span className="text-accent">FREE</span> : `₹${shippingPrice}`}</span>
            </div>
            <div className="summary-row"><span>GST (18%)</span><span>₹{taxPrice.toLocaleString()}</span></div>
            <hr className="divider" style={{ margin: '0.75rem 0' }} />
            <div className="summary-row total"><span>Total</span><span>₹{orderTotal.toLocaleString()}</span></div>
          </div>
          {cartTotal <= 999 && (
            <div className="free-shipping-notice">
              Add ₹{(999 - cartTotal + 1).toLocaleString()} more for <strong>FREE shipping</strong>
            </div>
          )}
          <button className="btn btn-primary btn-lg btn-full mt-2" onClick={() => navigate('/checkout')}>
            Proceed to Checkout →
          </button>
          <div className="secure-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Secure Razorpay Checkout
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
