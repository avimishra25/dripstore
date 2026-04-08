import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './CheckoutPage.css';

const STEPS = ['Address', 'Review', 'Payment'];

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [address, setAddress] = useState({
    street: '', city: '', state: '', pincode: '', country: 'India', phone: '',
  });
  const [errors, setErrors] = useState({});
  const [createdOrder, setCreatedOrder] = useState(null);

  const shippingPrice = cartTotal > 999 ? 0 : 99;
  const taxPrice = Math.round(cartTotal * 0.18);
  const orderTotal = cartTotal + shippingPrice + taxPrice;

  const validateAddress = () => {
    const newErrors = {};
    if (!address.street.trim()) newErrors.street = 'Street is required';
    if (!address.city.trim()) newErrors.city = 'City is required';
    if (!address.state.trim()) newErrors.state = 'State is required';
    if (!address.pincode.trim()) newErrors.pincode = 'Pincode is required';
    if (!/^\d{6}$/.test(address.pincode)) newErrors.pincode = 'Enter valid 6-digit pincode';
    if (!address.phone.trim()) newErrors.phone = 'Phone is required';
    if (!/^\d{10}$/.test(address.phone)) newErrors.phone = 'Enter valid 10-digit phone';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = async () => {
    if (step === 0) {
      if (!validateAddress()) return;
      setStep(1);
    } else if (step === 1) {
      // Create order
      setLoading(true);
      try {
        const orderItems = cartItems.map(item => ({
          product: item.product._id || item.product,
          name: item.product?.name || 'Product',
          image: item.product?.images?.[0] || '',
          price: item.product?.price || 0,
          quantity: item.quantity,
          size: item.size,
        }));

        const { data } = await api.post('/orders', {
          orderItems,
          shippingAddress: address,
          paymentMethod: 'Razorpay',
        });

        setCreatedOrder(data.order);
        setStep(2);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to create order');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRazorpayPayment = async () => {
    setLoading(true);
    try {
      // Create Razorpay order
      const { data } = await api.post('/payment/create-order', { orderId: createdOrder._id });

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: 'DripStore',
        description: `Order #${createdOrder._id}`,
        order_id: data.razorpayOrderId,
        prefill: {
          name: user.name,
          email: user.email,
          contact: address.phone,
        },
        theme: { color: '#ff3333' },
        handler: async (response) => {
          try {
            // Verify payment
            await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: createdOrder._id,
            });
            clearCart();
            navigate(`/order-success/${createdOrder._id}`);
          } catch (err) {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        modal: {
          ondismiss: async () => {
            try { await api.delete(`/payment/cancel/${createdOrder._id}`); } catch (e) {}
            setLoading(false);
            toast.info('Payment cancelled — your cart is still saved');
          }
        }
      };

      // Load Razorpay script dynamically
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          const rzp = new window.Razorpay(options);
          rzp.open();
        };
        document.body.appendChild(script);
      } else {
        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment initiation failed');
      setLoading(false);
    }
  };

  if (cartItems.length === 0 && !createdOrder) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="checkout-page page-padding">
      <h1 className="display-font">CHECKOUT</h1>

      {/* Steps Indicator */}
      <div className="checkout-steps">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`checkout-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
              <div className="step-num">{i < step ? '✓' : i + 1}</div>
              <span>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`step-line ${i < step ? 'done' : ''}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="checkout-layout">
        {/* Main Panel */}
        <div className="checkout-main">
          {/* Step 0: Address */}
          {step === 0 && (
            <div className="checkout-card">
              <h2>Shipping Address</h2>
              <div className="form-group">
                <label className="form-label">Street Address</label>
                <input
                  type="text"
                  placeholder="123 Main Street, Apt 4"
                  value={address.street}
                  onChange={e => setAddress({...address, street: e.target.value})}
                />
                {errors.street && <p className="form-error">{errors.street}</p>}
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input type="text" placeholder="Mumbai" value={address.city} onChange={e => setAddress({...address, city: e.target.value})} />
                  {errors.city && <p className="form-error">{errors.city}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input type="text" placeholder="Maharashtra" value={address.state} onChange={e => setAddress({...address, state: e.target.value})} />
                  {errors.state && <p className="form-error">{errors.state}</p>}
                </div>
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Pincode</label>
                  <input type="text" placeholder="400001" value={address.pincode} onChange={e => setAddress({...address, pincode: e.target.value})} maxLength={6} />
                  {errors.pincode && <p className="form-error">{errors.pincode}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input type="tel" placeholder="9876543210" value={address.phone} onChange={e => setAddress({...address, phone: e.target.value})} maxLength={10} />
                  {errors.phone && <p className="form-error">{errors.phone}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Review Order */}
          {step === 1 && (
            <div className="checkout-card">
              <h2>Review Your Order</h2>
              <div className="review-items">
                {cartItems.map((item, i) => (
                  <div key={i} className="review-item">
                    <div className="review-item-img">
                      {item.product?.images?.[0] ? (
                        <img src={item.product.images[0]} alt={item.product.name} />
                      ) : <span>👟</span>}
                    </div>
                    <div className="review-item-info">
                      <span className="review-item-name">{item.product?.name}</span>
                      <span className="review-item-meta">Size: {item.size} × {item.quantity}</span>
                    </div>
                    <span className="review-item-price">₹{((item.product?.price || 0) * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="review-address">
                <h3>Delivering to:</h3>
                <p>{address.street}, {address.city}, {address.state} - {address.pincode}</p>
                <p>📞 {address.phone}</p>
              </div>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div className="checkout-card">
              <h2>Payment</h2>
              <div className="payment-method">
                <div className="payment-option selected">
                  <div className="payment-option-left">
                    <div className="payment-radio active" />
                    <div>
                      <div className="payment-name">Razorpay</div>
                      <div className="payment-desc">UPI, Cards, Net Banking, Wallets</div>
                    </div>
                  </div>
                  <div className="razorpay-logo">Razorpay</div>
                </div>
              </div>
              <button
                className="btn btn-primary btn-lg btn-full mt-2"
                onClick={handleRazorpayPayment}
                disabled={loading}
              >
                {loading ? 'Processing...' : `Pay ₹${orderTotal.toLocaleString()}`}
              </button>
              <p className="payment-note">
                🔒 Your payment is secured by Razorpay. We never store your card details.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="checkout-nav">
            {step > 0 && (
              <button className="btn btn-secondary" onClick={() => setStep(step - 1)} disabled={loading}>
                ← Back
              </button>
            )}
            {step < 2 && (
              <button className="btn btn-primary" onClick={handleNextStep} disabled={loading}>
                {loading ? 'Please wait...' : step === 1 ? 'Place Order →' : 'Continue →'}
              </button>
            )}
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="checkout-summary">
          <h3>Order Summary</h3>
          <div className="summary-rows">
            <div className="summary-row"><span>Subtotal ({cartItems.length} items)</span><span>₹{cartTotal.toLocaleString()}</span></div>
            <div className="summary-row"><span>Shipping</span><span>{shippingPrice === 0 ? 'FREE' : `₹${shippingPrice}`}</span></div>
            <div className="summary-row"><span>GST (18%)</span><span>₹{taxPrice.toLocaleString()}</span></div>
            <hr className="divider" style={{ margin: '0.5rem 0' }} />
            <div className="summary-row total"><span>Total</span><span>₹{orderTotal.toLocaleString()}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
