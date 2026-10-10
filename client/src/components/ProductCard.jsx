import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';
import RatingStars from './RatingStars';
import './ProductCard.css';
import { stockFor } from '../utils/cart';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (product.countInStock === 0) return;
    const defaultSize = product.sizes?.find(size => stockFor(product, size) > 0);
    if (!defaultSize) return;
    if (!await addToCart(product, defaultSize, 1)) return;
    toast.success(`${product.name} added to cart!`);
  };

  const discount = product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <article className="product-card">
      <div className="product-card-image">
        <Link to={`/products/${product._id}`} aria-label={`View ${product.name}`}>
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name} loading="lazy" />
        ) : (
          <div className="product-img-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="product-badges">
          {product.isFeatured && <span className="badge badge-red">HOT</span>}
          {discount > 0 && <span className="badge badge-yellow">-{discount}%</span>}
          {product.countInStock === 0 && <span className="badge badge-gray">SOLD OUT</span>}
        </div>

        </Link>
        {/* Quick Add */}
        <button
          className={`quick-add-btn ${product.countInStock === 0 ? 'disabled' : ''}`}
          onClick={handleQuickAdd}
          disabled={product.countInStock === 0}
        >
          {product.countInStock === 0 ? 'Sold Out' : 'Quick Add'}
        </button>
      </div>

      <div className="product-card-info">
        <div className="product-brand">{product.brand}</div>
        <h3 className="product-name"><Link to={`/products/${product._id}`}>{product.name}</Link></h3>
        <div className="product-meta">
          <RatingStars rating={product.rating} numReviews={product.numReviews} small />
        </div>
        <div className="product-price-row">
          <span className="product-price">₹{product.price.toLocaleString()}</span>
          {product.originalPrice > product.price && (
            <span className="product-original-price">₹{product.originalPrice.toLocaleString()}</span>
          )}
        </div>
        {product.sizes?.length > 0 && (
          <div className="product-sizes">
            {product.sizes.slice(0, 4).map(s => (
              <span key={s} className="size-chip">{s}</span>
            ))}
            {product.sizes.length > 4 && <span className="size-chip more">+{product.sizes.length - 4}</span>}
          </div>
        )}
      </div>
    </article>
  );
};

export default ProductCard;
