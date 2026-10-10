import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => (
  <footer className="footer">
    <div className="footer-inner">
      <div className="footer-brand">
        <Link to="/" className="footer-logo">
          <span className="logo-drip">DRIP</span><span className="logo-store">STORE</span>
        </Link>
        <p>Premium sneakers & streetwear.<br />Cop what's fire. Flex what's rare.</p>

      </div>

      <div className="footer-links">
        <div className="footer-col">
          <h4>Shop</h4>
          <Link to="/products?category=sneakers">Sneakers</Link>
          <Link to="/products?category=hoodies">Hoodies</Link>
          <Link to="/products?category=streetwear">Streetwear</Link>
          <Link to="/products?category=accessories">Accessories</Link>
        </div>
        <div className="footer-col">
          <h4>Account</h4>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
          <Link to="/profile">Orders</Link>
          <Link to="/cart">Cart</Link>
        </div>
        <div className="footer-col">
          <h4>Support</h4>
          <Link to="/help/sizing">Sizing Guide</Link>

          <Link to="/profile">Track Order</Link>
          <Link to="/help/support">Order Help</Link>
        </div>
      </div>
    </div>
    <div className="footer-bottom">
      <p>© {new Date().getFullYear()} DripStore. All rights reserved.</p>
      <div className="footer-legal">
        {process.env.REACT_APP_PRIVACY_URL && <a href={process.env.REACT_APP_PRIVACY_URL}>Privacy</a>}
        {process.env.REACT_APP_TERMS_URL && <a href={process.env.REACT_APP_TERMS_URL}>Terms</a>}
      </div>
    </div>
  </footer>
);

export default Footer;
