import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { Loader, ErrorMessage } from '../components/Loader';
import './OrderDetailPage.css';

const STATUS_STEPS = ['Placed', 'Processing', 'Shipped', 'Delivered'];
const STATUS_COLORS = {
  Placed: 'badge-yellow', Processing: 'badge-yellow',
  Shipped: 'badge-gray', Delivered: 'badge-green', Cancelled: 'badge-red',
};

const OrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then(({ data }) => setOrder(data.order))
      .catch(err => setError(err.response?.data?.message || 'Order not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader />;
  if (error) return <div className="page-padding"><ErrorMessage message={error} /></div>;
  if (!order) return null;

  const currentStep = STATUS_STEPS.indexOf(order.orderStatus);

  return (
    <div className="order-detail page-padding">
      <div className="order-detail-header">
        <div>
          <Link to="/profile" className="back-link">← My Orders</Link>
          <h1 className="display-font">ORDER #{order._id?.slice(-8).toUpperCase()}</h1>
          <p className="text-muted">Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <span className={`badge ${STATUS_COLORS[order.orderStatus] || 'badge-gray'}`} style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
          {order.orderStatus}
        </span>
      </div>

      {/* Order Status Track */}
      {order.orderStatus !== 'Cancelled' && (
        <div className="status-tracker">
          {STATUS_STEPS.map((status, i) => (
            <React.Fragment key={status}>
              <div className={`status-step ${i <= currentStep ? 'done' : ''} ${i === currentStep ? 'current' : ''}`}>
                <div className="status-dot">{i < currentStep ? '✓' : i + 1}</div>
                <span>{status}</span>
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div className={`status-connector ${i < currentStep ? 'done' : ''}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      <div className="order-detail-grid">
        {/* Items */}
        <div className="order-detail-main">
          <div className="order-detail-card">
            <h3>Order Items</h3>
            {order.orderItems?.map((item, i) => (
              <div key={i} className="order-detail-item">
                <div className="odi-img">
                  {item.image ? <img src={item.image} alt={item.name} /> : <span>👟</span>}
                </div>
                <div className="odi-info">
                  <div className="odi-name">{item.name}</div>
                  <div className="odi-meta">Size: {item.size} × {item.quantity}</div>
                </div>
                <div className="odi-price">₹{(item.price * item.quantity).toLocaleString()}</div>
              </div>
            ))}
          </div>

          <div className="order-detail-card">
            <h3>Shipping Address</h3>
            <p>{order.shippingAddress?.street}</p>
            <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
            <p>{order.shippingAddress?.country}</p>
            <p>📞 {order.shippingAddress?.phone}</p>
          </div>
        </div>

        {/* Summary */}
        <div className="order-detail-summary">
          <div className="order-detail-card">
            <h3>Payment Summary</h3>
            <div className="od-summary-rows">
              <div className="od-row"><span>Subtotal</span><span>₹{order.itemsPrice?.toLocaleString()}</span></div>
              <div className="od-row"><span>Shipping</span><span>{order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice}`}</span></div>
              <div className="od-row"><span>GST</span><span>₹{order.taxPrice?.toLocaleString()}</span></div>
              <hr className="divider" style={{ margin: '0.5rem 0' }} />
              <div className="od-row total"><span>Total</span><span>₹{order.totalPrice?.toLocaleString()}</span></div>
            </div>
            <div className="payment-status">
              <span>{order.isPaid ? '✅ Paid' : '⏳ Pending'}</span>
              {order.isPaid && <span>{new Date(order.paidAt).toLocaleDateString()}</span>}
            </div>
            {order.paymentResult?.razorpay_payment_id && (
              <div className="payment-id">
                <span className="text-muted">Payment ID:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                  {order.paymentResult.razorpay_payment_id}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
