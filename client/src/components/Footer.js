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
        <div className="footer-social">
          {['instagram', 'twitter', 'youtube'].map(s => (
            <a key={s} href="#!" aria-label={s} className="social-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </a>
          ))}
        </div>
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
          <a href="#!">Sizing Guide</a>
          <a href="#!">Returns</a>
          <a href="#!">Track Order</a>
          <a href="#!">Contact</a>
        </div>
      </div>
    </div>
    <div className="footer-bottom">
      <p>© {new Date().getFullYear()} DripStore. All rights reserved.</p>
      <div className="footer-legal">
        <a href="#!">Privacy</a>
        <a href="#!">Terms</a>
      </div>
    </div>
  </footer>
);

export default Footer;
