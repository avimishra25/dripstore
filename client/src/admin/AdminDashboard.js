import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import AdminLayout from './AdminLayout';
import { Loader } from '../components/Loader';
import './AdminDashboard.css';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const StatCard = ({ icon, label, value, sub, color }) => (
  <div className="stat-card" style={{ '--accent-color': color }}>
    <div className="stat-card-icon">{icon}</div>
    <div className="stat-card-body">
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then(({ data }) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminLayout><Loader /></AdminLayout>;

  const { stats: s, recentOrders, lowStock, monthlyRevenue } = stats || {};

  // Build bar chart data
  const maxRevenue = Math.max(...(monthlyRevenue?.map(m => m.revenue) || [1]));

  const STATUS_BADGE = {
    Placed: 'badge-yellow', Processing: 'badge-yellow',
    Shipped: 'badge-gray', Delivered: 'badge-green', Cancelled: 'badge-red',
  };

  return (
    <AdminLayout>
      <div className="admin-dashboard">
        <div className="admin-page-header">
          <h1 className="display-font">DASHBOARD</h1>
          <p className="text-muted">Welcome back, here's what's happening.</p>
        </div>

        {/* Stat Cards */}
        <div className="stats-grid">
          <StatCard icon="💰" label="Total Revenue" value={`₹${(s?.totalRevenue || 0).toLocaleString()}`} sub="From paid orders" color="#ff3333" />
          <StatCard icon="📦" label="Total Orders" value={s?.totalOrders || 0} sub="All time" color="#f59e0b" />
          <StatCard icon="👥" label="Total Users" value={s?.totalUsers || 0} sub="Registered accounts" color="#3b82f6" />
          <StatCard icon="🛍️" label="Low Stock" value={lowStock?.length || 0} sub="Products < 5 units" color="#8b5cf6" />
        </div>

        <div className="dashboard-grid">
          {/* Revenue Chart */}
          <div className="admin-card chart-card">
            <div className="admin-card-header">
              <h3>Revenue (Last 6 Months)</h3>
            </div>
            {monthlyRevenue?.length > 0 ? (
              <div className="bar-chart">
                {monthlyRevenue.map((m, i) => (
                  <div key={i} className="bar-group">
                    <div className="bar-wrap">
                      <div
                        className="bar"
                        style={{ height: `${(m.revenue / maxRevenue) * 100}%` }}
                        title={`₹${m.revenue.toLocaleString()}`}
                      >
                        <span className="bar-tooltip">₹{m.revenue.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="bar-label">{MONTHS[(m._id.month - 1)]}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="chart-empty">No revenue data yet</div>
            )}
          </div>

          {/* Low Stock */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>⚠️ Low Stock Alert</h3>
              <Link to="/admin/products" className="admin-card-link">Manage →</Link>
            </div>
            {lowStock?.length === 0 ? (
              <p className="text-muted" style={{ fontSize: '0.875rem' }}>All products are well stocked 🎉</p>
            ) : (
              <div className="low-stock-list">
                {lowStock?.map(p => (
                  <div key={p._id} className="low-stock-item">
                    <div className="low-stock-img">
                      {p.images?.[0] ? <img src={p.images[0]} alt={p.name} /> : <span>👟</span>}
                    </div>
                    <div className="low-stock-info">
                      <div className="low-stock-name">{p.name}</div>
                      <div className="low-stock-brand">{p.brand}</div>
                    </div>
                    <span className={`badge ${p.countInStock === 0 ? 'badge-red' : 'badge-yellow'}`}>
                      {p.countInStock} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="admin-card mt-3">
          <div className="admin-card-header">
            <h3>Recent Orders</h3>
            <Link to="/admin/orders" className="admin-card-link">View All →</Link>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders?.map(order => (
                  <tr key={order._id}>
                    <td><span className="mono">#{order._id?.slice(-8).toUpperCase()}</span></td>
                    <td>
                      <div>{order.user?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.user?.email}</div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions mt-3">
          <Link to="/admin/products/new" className="quick-action-btn">
            <span>➕</span> Add New Product
          </Link>
          <Link to="/admin/orders" className="quick-action-btn">
            <span>📦</span> Manage Orders
          </Link>
          <Link to="/admin/users" className="quick-action-btn">
            <span>👥</span> View Users
          </Link>
          <Link to="/" className="quick-action-btn" target="_blank">
            <span>🌐</span> View Storefront
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
