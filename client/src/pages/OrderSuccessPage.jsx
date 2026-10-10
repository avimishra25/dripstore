// ============ OrderSuccessPage ============
import React, { useEffect, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import api from '../utils/api';
import { Loader, ErrorMessage } from '../components/Loader';

export const OrderSuccessPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/orders/${id}`).then(({ data }) => setOrder(data.order)).catch(() => setError('Could not confirm order. Check My Orders.')).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader />;
  if (error) return <div className="page-padding"><ErrorMessage message={error} /><Link to="/profile">My Orders</Link></div>;
  if (!order?.isPaid || ['Cancelled', 'Payment Review'].includes(order.orderStatus)) return <Navigate to={`/orders/${id}`} replace />;

  return (
    <div className="page-padding" style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
      <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🎉</div>
      <h1 className="display-font" style={{ fontSize: '3rem', color: 'var(--success)', marginBottom: '1rem' }}>ORDER PLACED!</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.05rem' }}>
        Payment confirmed. View your order for fulfillment updates.
      </p>
      {order && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', textAlign: 'left', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Order ID</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>#{order._id?.slice(-8).toUpperCase()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>₹{order.totalPrice?.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Status</span>
            <span className="badge badge-green">{order.orderStatus}</span>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/profile" className="btn btn-primary">View My Orders</Link>
        <Link to="/products" className="btn btn-secondary">Keep Shopping</Link>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
