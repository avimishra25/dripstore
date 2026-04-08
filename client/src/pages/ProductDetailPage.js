import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Loader, ErrorMessage } from '../components/Loader';
import RatingStars from '../components/RatingStars';
import { toast } from 'react-toastify';
import './ProductDetailPage.css';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  // Review state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/products/${id}`);
        setProduct(data.product);
        if (data.product.sizes?.length > 0) setSelectedSize(data.product.sizes[0]);
      } catch (err) {
        setError(err.response?.data?.message || 'Product not found');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!selectedSize) { toast.error('Please select a size'); return; }
    if (!user) { navigate('/login'); return; }
    setAddingToCart(true);
    addToCart(product, selectedSize, quantity);
    toast.success(`${product.name} added to cart! 🔥`);
    setTimeout(() => setAddingToCart(false), 600);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    if (!reviewComment.trim()) { toast.error('Please write a comment'); return; }
    setSubmittingReview(true);
    try {
      await api.post(`/products/${id}/reviews`, { rating: reviewRating, comment: reviewComment });
      toast.success('Review submitted!');
      setReviewComment('');
      // Refresh product
      const { data } = await api.get(`/products/${id}`);
      setProduct(data.product);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <Loader text="Loading product..." />;
  if (error) return <div className="page-padding"><ErrorMessage message={error} /></div>;
  if (!product) return null;

  const discount = product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const alreadyReviewed = user && product.reviews?.some(r => r.user === user._id || r.user?._id === user._id);

  return (
    <div className="product-detail page-padding">
      <div className="product-detail-grid">
        {/* Images */}
        <div className="product-images">
          <div className="main-image">
            {product.images?.[selectedImage] ? (
              <img src={product.images[selectedImage]} alt={product.name} />
            ) : (
              <div className="image-placeholder">
                <span>👟</span>
              </div>
            )}
            {discount > 0 && <div className="discount-badge">-{discount}%</div>}
          </div>
          {product.images?.length > 1 && (
            <div className="image-thumbs">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  className={`thumb ${selectedImage === i ? 'active' : ''}`}
                  onClick={() => setSelectedImage(i)}
                >
                  <img src={img} alt={`${product.name} ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="product-info">
          <div className="product-info-top">
            <span className="detail-brand">{product.brand}</span>
            <span className={`stock-badge ${product.countInStock > 0 ? 'in-stock' : 'out-stock'}`}>
              {product.countInStock > 0 ? `${product.countInStock} in stock` : 'Sold Out'}
            </span>
          </div>

          <h1 className="detail-name">{product.name}</h1>

          <div className="detail-rating">
            <RatingStars rating={product.rating} numReviews={product.numReviews} />
          </div>

          <div className="detail-price-row">
            <span className="detail-price">₹{product.price.toLocaleString()}</span>
            {product.originalPrice > product.price && (
              <span className="detail-original">₹{product.originalPrice.toLocaleString()}</span>
            )}
            {discount > 0 && <span className="badge badge-red">{discount}% OFF</span>}
          </div>

          <p className="detail-description">{product.description}</p>

          {/* Size Selector */}
          {product.sizes?.length > 0 && (
            <div className="size-section">
              <div className="size-header">
                <span className="size-label">Size</span>
                <span className="selected-size">{selectedSize || 'Select'}</span>
              </div>
              <div className="size-grid">
                {product.sizes.map(size => (
                  <button
                    key={size}
                    className={`size-btn ${selectedSize === size ? 'active' : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="quantity-section">
            <span className="size-label">Quantity</span>
            <div className="qty-control">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1}>−</button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(q => Math.min(product.countInStock, q + 1))} disabled={quantity >= product.countInStock}>+</button>
            </div>
          </div>

          {/* CTA */}
          <div className="detail-cta">
            <button
              className="btn btn-primary btn-lg btn-full"
              onClick={handleAddToCart}
              disabled={product.countInStock === 0 || addingToCart}
            >
              {addingToCart ? 'Added! 🔥' : product.countInStock === 0 ? 'Sold Out' : 'Add to Cart'}
            </button>
            {user && product.countInStock > 0 && (
              <button
                className="btn btn-secondary btn-lg btn-full"
                onClick={() => { handleAddToCart(); navigate('/cart'); }}
              >
                Buy Now
              </button>
            )}
          </div>

          {/* Meta */}
          <div className="product-meta-info">
            <div className="meta-row"><span>Category</span><span>{product.category}</span></div>
            <div className="meta-row"><span>Brand</span><span>{product.brand}</span></div>
            {product.tags?.length > 0 && (
              <div className="meta-row">
                <span>Tags</span>
                <div className="tags">{product.tags.map(t => <span key={t} className="tag">#{t}</span>)}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="reviews-section">
        <h2 className="display-font">REVIEWS ({product.numReviews})</h2>
        <div className="reviews-layout">
          {/* Review List */}
          <div className="reviews-list">
            {product.reviews?.length === 0 ? (
              <div className="no-reviews">
                <p>No reviews yet. Be the first to drop a review!</p>
              </div>
            ) : (
              product.reviews.map(review => (
                <div key={review._id} className="review-card">
                  <div className="review-header">
                    <div className="reviewer-avatar">{review.name?.[0]?.toUpperCase()}</div>
                    <div>
                      <div className="reviewer-name">{review.name}</div>
                      <RatingStars rating={review.rating} small />
                    </div>
                    <span className="review-date">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="review-comment">{review.comment}</p>
                </div>
              ))
            )}
          </div>

          {/* Write Review */}
          <div className="write-review">
            <h3>Write a Review</h3>
            {!user ? (
              <p className="text-muted">Please <button className="link-btn" onClick={() => navigate('/login')}>login</button> to write a review.</p>
            ) : alreadyReviewed ? (
              <p className="text-muted">You've already reviewed this product.</p>
            ) : (
              <form onSubmit={handleSubmitReview}>
                <div className="form-group">
                  <label className="form-label">Rating</label>
                  <RatingStars rating={reviewRating} interactive onRate={setReviewRating} />
                </div>
                <div className="form-group">
                  <label className="form-label">Comment</label>
                  <textarea
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    rows={4}
                    placeholder="Share your thoughts..."
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={submittingReview}>
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
