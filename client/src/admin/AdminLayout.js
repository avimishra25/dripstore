import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminLayout.css';

const NAV_ITEMS = [
  { path: '/admin', label: 'Dashboard', icon: '📊' },
  { path: '/admin/products', label: 'Products', icon: '👟' },
  { path: '/admin/orders', label: 'Orders', icon: '📦' },
  { path: '/admin/users', label: 'Users', icon: '👥' },
];

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link to="/" className="admin-logo">
          <span className="logo-drip">DRIP</span><span className="logo-store">STORE</span>
          <span className="admin-tag">ADMIN</span>
        </Link>
        <nav className="admin-nav">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`admin-nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <button className="admin-logout" onClick={() => { logout(); navigate('/'); }}>
          🚪 Logout
        </button>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
};

export default AdminLayout;
