import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useDemo } from '../context/DemoContext';
import ProductCard from '../components/ProductCard';
import { Loader, ErrorMessage } from '../components/Loader';
import './HomePage.css';

const CATEGORIES = [
  { key: 'sneakers', label: 'Sneakers', icon: '👟', desc: 'Heat from every label' },
  { key: 'hoodies', label: 'Hoodies', icon: '🧥', desc: 'Layer up in style' },
  { key: 'streetwear', label: 'Streetwear', icon: '🧢', desc: 'Wear the culture' },
  { key: 'accessories', label: 'Accessories', icon: '⌚', desc: 'Finish the fit' },
];

const HomePage = () => {
  const { enabled: demo } = useDemo();
  const [featured, setFeatured] = useState([]);
  const [latest, setLatest] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true); setError('');
      try {
        const [featuredRes, latestRes] = await Promise.all([
          api.get('/products?featured=true&limit=4'),
          api.get('/products?sort=latest&limit=8'),
        ]);
        setFeatured(featuredRes.data.products);
        setLatest(latestRes.data.products);
      } catch (err) {
        setError('Products could not load. Please retry.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [retry]);

  return (
    <div className="home-page">
      {error && <div className="page-padding"><ErrorMessage message={error} /><button className="btn btn-primary" onClick={() => setRetry(n => n + 1)}>Retry</button></div>}
      {/* HERO */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-grid-overlay" />
        </div>
        <div className="hero-content">
          <div className="hero-tag">NEW DROPS</div>
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
              <p>On all orders above ₹999. Delivery details are confirmed with your order.</p>
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
              { icon: '👟', title: 'Find Your Style', desc: 'Browse sneakers, hoodies, streetwear and accessories.' },
              { icon: '🚚', title: 'Fast Delivery', desc: 'View fulfillment updates in My Orders.' },
              { icon: '📦', title: 'Order History', desc: 'Track payment and fulfillment from your account.' },
              { icon: '🔒', title: demo ? 'Payment Simulator' : 'Secure Payments', desc: demo ? 'Try payment outcomes with sample orders. No money charged.' : 'Razorpay-powered checkout. Your data stays safe.' },
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
