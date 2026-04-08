import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import AdminLayout from './AdminLayout';
import { Loader } from '../components/Loader';
import { toast } from 'react-toastify';
import './AdminOrders.css';

const ORDER_STATUSES = ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const STATUS_BADGE = {
  Placed: 'badge-yellow', Processing: 'badge-yellow',
  Shipped: 'badge-gray', Delivered: 'badge-green', Cancelled: 'badge-red',
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (filterStatus) params.set('status', filterStatus);
      const { data } = await api.get(`/admin/orders?${params}`);
      setOrders(data.orders);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await api.put(`/admin/orders/${orderId}/status`, { orderStatus: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch (err) {
      toast.error('Status update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-orders">
        <div className="admin-page-header">
          <h1 className="display-font">ORDERS</h1>
          <p className="text-muted">{total} total orders</p>
        </div>

        {/* Filter Tabs */}
        <div className="order-filter-tabs">
          <button
            className={`order-filter-tab ${filterStatus === '' ? 'active' : ''}`}
            onClick={() => { setFilterStatus(''); setPage(1); }}
          >All</button>
          {ORDER_STATUSES.map(s => (
            <button
              key={s}
              className={`order-filter-tab ${filterStatus === s ? 'active' : ''}`}
              onClick={() => { setFilterStatus(s); setPage(1); }}
            >{s}</button>
          ))}
        </div>

        {loading ? <Loader /> : (
          <>
            <div className="admin-card">
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th>Update Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <React.Fragment key={order._id}>
                        <tr
                          className={`order-row ${expandedOrder === order._id ? 'expanded' : ''}`}
                          onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                        >
                          <td><span className="mono">#{order._id?.slice(-8).toUpperCase()}</span></td>
                          <td>
                            <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{order.user?.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.user?.email}</div>
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                            {new Date(order.createdAt).toLocaleDateString('en-IN')}
                          </td>
                          <td style={{ fontSize: '0.875rem' }}>{order.orderItems?.length} item(s)</td>
                          <td><span className="mono">₹{order.totalPrice?.toLocaleString()}</span></td>
                          <td>
                            <span className={`badge ${order.isPaid ? 'badge-green' : 'badge-yellow'}`}>
                              {order.isPaid ? 'Paid' : 'Pending'}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${STATUS_BADGE[order.orderStatus] || 'badge-gray'}`}>
                              {order.orderStatus}
                            </span>
                          </td>
                          <td onClick={e => e.stopPropagation()}>
                            <select
                              className="status-select"
                              value={order.orderStatus}
                              disabled={updatingId === order._id}
                              onChange={e => handleStatusUpdate(order._id, e.target.value)}
                            >
                              {ORDER_STATUSES.map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </td>
                        </tr>

                        {/* Expanded Order Details */}
                        {expandedOrder === order._id && (
                          <tr className="order-detail-row">
                            <td colSpan={8}>
                              <div className="order-expand-content">
                                <div className="order-expand-items">
                                  <h4>Items</h4>
                                  {order.orderItems?.map((item, i) => (
                                    <div key={i} className="expand-item">
                                      <span>{item.name}</span>
                                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                        Size: {item.size} × {item.quantity}
                                      </span>
                                      <span className="mono">₹{(item.price * item.quantity).toLocaleString()}</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="order-expand-address">
                                  <h4>Shipping Address</h4>
                                  <p>{order.shippingAddress?.street}</p>
                                  <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
                                  <p>📞 {order.shippingAddress?.phone}</p>
                                </div>
                                {order.paymentResult?.razorpay_payment_id && (
                                  <div className="order-expand-payment">
                                    <h4>Payment</h4>
                                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                                      {order.paymentResult.razorpay_payment_id}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              {orders.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No orders found
                </div>
              )}
            </div>

            {pages > 1 && (
              <div className="admin-pagination">
                <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Page {page} of {pages}</span>
                <button className="btn btn-secondary btn-sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
