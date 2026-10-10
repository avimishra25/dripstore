import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './CheckoutPage.css';
import { useDemo } from '../context/DemoContext';
import { payOrder } from '../utils/payment';
import { Loader, ErrorMessage } from '../components/Loader';

const STEPS = ['Address', 'Review', 'Payment'];

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, cartTotal, removePurchased, loading: cartLoading, error: cartError, fetchCart } = useCart();
  const { user } = useAuth();
  const { enabled: demo, chooseDemoOutcome } = useDemo();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [address, setAddress] = useState({
    street: demo ? '12 Sample Street' : '', city: demo ? 'Bengaluru' : '', state: demo ? 'Karnataka' : '', pincode: demo ? '560001' : '', country: 'India', phone: demo ? '9999999999' : '',
  });
  const [errors, setErrors] = useState({});
  const [createdOrder, setCreatedOrder] = useState(null);

  const shippingPrice = createdOrder?.shippingPrice ?? (cartTotal > 999 ? 0 : 99);
  const taxPrice = createdOrder?.taxPrice ?? Math.round(cartTotal * 18) / 100;
  const orderTotal = createdOrder?.totalPrice ?? cartTotal + shippingPrice + taxPrice;

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
          quantity: item.quantity,
          size: item.size,
        }));

        const { data } = await api.post('/orders', {
          orderItems,
          shippingAddress: address,
          paymentMethod: demo ? 'Demo simulation' : 'Razorpay',
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
      const order = await payOrder(createdOrder, user, chooseDemoOutcome);
      if (order) {
        if (order.orderStatus !== 'Payment Review') await removePurchased(order.orderItems);
        navigate(order.orderStatus === 'Payment Review' ? `/orders/${order._id}` : `/order-success/${order._id}`);
      } else toast.info('Payment closed. Your order is saved in My Orders for retry.');
    } catch (error) { toast.error(error.message); }
    finally { setLoading(false); }
  };
  if (cartLoading) return <Loader text="Loading cart..." />;
  if (cartError) return <div className="page-padding"><ErrorMessage message={cartError} /><button className="btn btn-primary" onClick={fetchCart}>Retry</button></div>;
  if (cartItems.length === 0 && !createdOrder) return <Navigate to="/cart" replace />;
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
              {demo && <button className="btn btn-secondary" onClick={() => { setAddress({ street: '12 Sample Street', city: 'Bengaluru', state: 'Karnataka', pincode: '560001', country: 'India', phone: '9999999999' }); setErrors({}); }}>Use sample address</button>}
              <div className="form-group">
                <label className="form-label" htmlFor="checkoutpage-1">Street Address</label>
                <input id="checkoutpage-1"
                  type="text"
                  placeholder="123 Main Street, Apt 4"
                  value={address.street} aria-invalid={Boolean(errors.street)} aria-describedby={errors.street ? 'checkout-street-error' : undefined}
                  onChange={e => setAddress({...address, street: e.target.value})}
                />
                {errors.street && <p className="form-error" id="checkout-street-error">{errors.street}</p>}
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="checkoutpage-2">City</label>
                  <input id="checkoutpage-2" type="text" placeholder="Mumbai" value={address.city} aria-invalid={Boolean(errors.city)} aria-describedby={errors.city ? 'checkout-city-error' : undefined} onChange={e => setAddress({...address, city: e.target.value})} />
                  {errors.city && <p className="form-error" id="checkout-city-error">{errors.city}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="checkoutpage-3">State</label>
                  <input id="checkoutpage-3" type="text" placeholder="Maharashtra" value={address.state} aria-invalid={Boolean(errors.state)} aria-describedby={errors.state ? 'checkout-state-error' : undefined} onChange={e => setAddress({...address, state: e.target.value})} />
                  {errors.state && <p className="form-error" id="checkout-state-error">{errors.state}</p>}
                </div>
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="checkoutpage-4">Pincode</label>
                  <input id="checkoutpage-4" type="text" placeholder="400001" value={address.pincode} aria-invalid={Boolean(errors.pincode)} aria-describedby={errors.pincode ? 'checkout-pincode-error' : undefined} onChange={e => setAddress({...address, pincode: e.target.value})} maxLength={6} />
                  {errors.pincode && <p className="form-error" id="checkout-pincode-error">{errors.pincode}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="checkoutpage-5">Phone</label>
                  <input id="checkoutpage-5" type="tel" placeholder="9876543210" value={address.phone} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'checkout-phone-error' : undefined} onChange={e => setAddress({...address, phone: e.target.value})} maxLength={10} />
                  {errors.phone && <p className="form-error" id="checkout-phone-error">{errors.phone}</p>}
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
                      <div className="payment-name">{demo ? 'Demo simulator' : 'Razorpay'}</div>
                      <div className="payment-desc">{demo ? 'Success, failure, or cancellation' : 'UPI, Cards, Net Banking, Wallets'}</div>
                    </div>
                  </div>
                  <div className="razorpay-logo">{demo ? 'DEMO' : 'Razorpay'}</div>
                </div>
              </div>
              <button
                className="btn btn-primary btn-lg btn-full mt-2"
                onClick={handleRazorpayPayment}
                disabled={loading}
              >
                {loading ? 'Processing...' : `${demo ? 'Simulate' : 'Pay'} ₹${orderTotal.toLocaleString()}`}
              </button>
              <p className="payment-note">
                {demo ? 'Demo only. Choose success, failure, or cancellation. No money is charged.' : '🔒 Your payment is secured by Razorpay. We never store your card details.'}
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="checkout-nav">
            {step > 0 && (
              <button className="btn btn-secondary" onClick={() => { setStep(step - 1); setCreatedOrder(null); }} disabled={loading}>
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
            <div className="summary-row"><span>Subtotal ({cartItems.length} items)</span><span>₹{(createdOrder?.itemsPrice ?? cartTotal).toLocaleString()}</span></div>
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
