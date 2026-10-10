import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Loader, ErrorMessage } from '../components/Loader';
import { toast } from 'react-toastify';
import './ProfilePage.css';

const STATUS_COLORS = {
  Placed: 'badge-yellow', Processing: 'badge-yellow',
  Shipped: 'badge-gray', Delivered: 'badge-green', Cancelled: 'badge-red',
};

const ProfilePage = () => {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Profile form state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoadingOrders(true); setError('');
      try {
        const { data } = await api.get(`/orders/myorders?page=${page}`);
        setOrders(data.orders); setPages(data.pages);
      } catch (err) {
        setError('Could not load orders');
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchOrders();
  }, [page, retry]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    const payload = { name, email, phone };
    if (newPassword) { payload.password = newPassword; payload.currentPassword = currentPassword; }
    const result = await updateProfile(payload);
    if (result.success) {
      toast.success('Profile updated!');
      setNewPassword(''); setCurrentPassword('');
    } else {
      toast.error(result.message);
    }
    setSavingProfile(false);
  };

  return (
    <div className="profile-page page-padding">
      {/* Header */}
      <div className="profile-header">
        <div className="profile-avatar">{user?.name?.[0]?.toUpperCase()}</div>
        <div>
          <h1 className="display-font">{user?.name?.toUpperCase()}</h1>
          <p className="text-muted">{user?.email}</p>
          {user?.isAdmin && <span className="badge badge-red" style={{ marginTop: '0.5rem' }}>Admin</span>}
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button className={`tab-btn ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}>My Orders</button>
        <button className={`tab-btn ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>Edit Profile</button>
        <button className="tab-btn logout-tab" onClick={async () => { await logout(); navigate('/'); }}>Logout</button>
      </div>

      {/* Orders Tab */}
      {tab === 'orders' && (
        <div className="orders-tab">
          {error && <><ErrorMessage message={error} /><button className="btn btn-secondary" onClick={() => setRetry(n => n + 1)}>Retry</button></>}
          {loadingOrders ? <Loader /> : error ? null : orders.length === 0 ? (
            <div className="no-orders">
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
              <h3>No orders yet</h3>
              <p>Time to cop some heat!</p>
              <Link to="/products" className="btn btn-primary mt-2">Shop Now</Link>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map(order => (
                <Link key={order._id} to={`/orders/${order._id}`} className="order-card">
                  <div className="order-card-top">
                    <div>
                      <div className="order-id">#{order._id?.slice(-8).toUpperCase()}</div>
                      <div className="order-date">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    </div>
                    <span className={`badge ${STATUS_COLORS[order.orderStatus] || 'badge-gray'}`}>{order.orderStatus}</span>
                  </div>
                  <div className="order-card-items">
                    {order.orderItems?.slice(0, 3).map((item, i) => (
                      <div key={i} className="order-mini-item">
                        {item.image ? <img src={item.image} alt={item.name} /> : <span>👟</span>}
                      </div>
                    ))}
                    {order.orderItems?.length > 3 && (
                      <div className="order-mini-more">+{order.orderItems.length - 3}</div>
                    )}
                  </div>
                  <div className="order-card-bottom">
                    <span className="order-items-count">{order.orderItems?.length} item(s)</span>
                    <span className="order-total">₹{order.totalPrice?.toLocaleString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'orders' && pages > 1 && <div className="pagination"><button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button><span>Page {page} of {pages}</span><button disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next</button></div>}
      {/* Profile Edit Tab */}
      {tab === 'profile' && (
        <div className="profile-tab">
          <form onSubmit={handleSaveProfile} className="profile-form">
            <div className="form-group">
              <label className="form-label" htmlFor="profilepage-1">Full Name</label>
              <input id="profilepage-1" type="text" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="profilepage-2">Email</label>
              <input id="profilepage-2" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="profilepage-3">Phone</label>
              <input id="profilepage-3" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="10-digit phone number" />
            </div>
            <hr className="divider" />
            <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Change Password (optional)</h3>
            <div className="form-group">
              <label className="form-label" htmlFor="profilepage-4">Current Password</label>
              <input id="profilepage-4" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="profilepage-5">New Password</label>
              <input id="profilepage-5" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={8} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingProfile}>
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
