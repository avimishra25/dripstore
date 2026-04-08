import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import { Loader } from '../components/Loader';
import './HomePage.css';

const CATEGORIES = [
  { key: 'sneakers', label: 'Sneakers', icon: '👟', desc: 'Heat from every label' },
  { key: 'hoodies', label: 'Hoodies', icon: '🧥', desc: 'Layer up in style' },
  { key: 'streetwear', label: 'Streetwear', icon: '🧢', desc: 'Wear the culture' },
  { key: 'accessories', label: 'Accessories', icon: '⌚', desc: 'Finish the fit' },
];

const HomePage = () => {
  const [featured, setFeatured] = useState([]);
  const [latest, setLatest] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [featuredRes, latestRes] = await Promise.all([
          api.get('/products?featured=true&limit=4'),
          api.get('/products?sort=latest&limit=8'),
        ]);
        setFeatured(featuredRes.data.products);
        setLatest(latestRes.data.products);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="home-page">
      {/* HERO */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-grid-overlay" />
        </div>
        <div className="hero-content">
          <div className="hero-tag">NEW DROP 2025</div>
          <h1 className="hero-title">
            <span className="hero-title-line">WEAR</span>
            <span className="hero-title-line accent">THE</span>
            <span className="hero-title-line">CULTURE</span>
          </h1>
          <p className="hero-sub">
            Premium sneakers & streetwear.<br />
            Cop what's fire. Flex what's rare.
          </p>
          <div className="hero-actions">
            <Link to="/products" className="btn btn-primary btn-lg">Shop All Drops</Link>
            <Link to="/products?featured=true" className="btn btn-secondary btn-lg">Featured Picks</Link>
          </div>
          <div className="hero-stats">
            <div className="stat"><span className="stat-num">500+</span><span className="stat-label">Products</span></div>
            <div className="stat-divider" />
            <div className="stat"><span className="stat-num">50K+</span><span className="stat-label">Happy Drippers</span></div>
            <div className="stat-divider" />
            <div className="stat"><span className="stat-num">100+</span><span className="stat-label">Brands</span></div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-card-stack">
            <div className="hero-card card-1">
              <div className="hero-card-inner">
                <span className="hero-card-emoji">👟</span>
                <div>
                  <div className="hero-card-brand">Nike</div>
                  <div className="hero-card-name">Air Max 97</div>
                  <div className="hero-card-price">₹12,999</div>
                </div>
              </div>
            </div>
            <div className="hero-card card-2">
              <div className="hero-card-inner">
                <span className="hero-card-emoji">🔥</span>
                <div>
                  <div className="hero-card-brand">Jordan</div>
                  <div className="hero-card-name">Retro 1 High</div>
                  <div className="hero-card-price">₹18,500</div>
                </div>
              </div>
            </div>
            <div className="hero-badge">JUST DROPPED</div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title display-font">SHOP BY CATEGORY</h2>
            <Link to="/products" className="section-link">View All →</Link>
          </div>
          <div className="categories-grid">
            {CATEGORIES.map((cat) => (
              <Link key={cat.key} to={`/products?category=${cat.key}`} className="category-card">
                <div className="category-icon">{cat.icon}</div>
                <div className="category-info">
                  <h3>{cat.label}</h3>
                  <p>{cat.desc}</p>
                </div>
                <svg className="category-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED */}
      
        <section className="section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title display-font">🔥 HOT PICKS</h2>
              <Link to="/products?featured=true" className="section-link">See All →</Link>
            </div>
            {loading ? <Loader /> : (
              <div className="grid products-grid">
                {featured.map(p => <ProductCard key={p._id} product={p} />)}
              </div>
            )}
          </div>
        </section>


      {/* BANNER */}
      <section className="promo-banner">
        <div className="container">
          <div className="banner-inner">
            <div className="banner-text">
              <h2 className="display-font">FREE SHIPPING</h2>
              <p>On all orders above ₹999. Nationwide delivery in 3–5 days.</p>
            </div>
            <Link to="/products" className="btn btn-primary btn-lg">Start Shopping</Link>
          </div>
        </div>
      </section>

      {/* LATEST DROPS */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title display-font">LATEST DROPS</h2>
            <Link to="/products?sort=latest" className="section-link">View All →</Link>
          </div>
          {loading ? <Loader /> : (
            <div className="grid products-grid">
              {latest.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* WHY US */}
      <section className="section why-us">
        <div className="container">
          <h2 className="section-title display-font text-center mb-3">WHY DRIPSTORE?</h2>
          <div className="features-grid">
            {[
              { icon: '✅', title: '100% Authentic', desc: 'Every product verified & sourced from authorized distributors.' },
              { icon: '🚚', title: 'Fast Delivery', desc: 'Pan-India shipping in 3–5 business days, tracked end to end.' },
              { icon: '↩️', title: 'Easy Returns', desc: '7-day hassle-free returns. No questions asked.' },
              { icon: '🔒', title: 'Secure Payments', desc: 'Razorpay-powered checkout. Your data stays safe.' },
            ].map(f => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
