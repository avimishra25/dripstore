import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import { Loader, ErrorMessage } from '../components/Loader';
import './ProductsPage.css';

const CATEGORIES = ['all', 'sneakers', 'hoodies', 'streetwear', 'accessories'];
const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'rating', label: 'Top Rated' },
];

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filter state from URL params
  const keyword = searchParams.get('keyword') || '';
  const category = searchParams.get('category') || 'all';
  const sort = searchParams.get('sort') || 'latest';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const page = Number(searchParams.get('page')) || 1;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (keyword) params.set('keyword', keyword);
      if (category && category !== 'all') params.set('category', category);
      if (sort) params.set('sort', sort);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      params.set('page', page);
      params.set('limit', 12);

      const { data } = await api.get(`/products?${params.toString()}`);
      setProducts(data.products);
      setTotalPages(data.pages);
      setTotal(data.total);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [keyword, category, sort, minPrice, maxPrice, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    newParams.delete('page'); // reset to page 1
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const hasActiveFilters = keyword || category !== 'all' || sort !== 'latest' || minPrice || maxPrice;

  return (
    <div className="products-page page-padding">
      {/* Header */}
      <div className="products-header">
        <div>
          <h1 className="display-font">
            {keyword ? `Search: "${keyword}"` : category !== 'all' ? category.toUpperCase() : 'ALL DROPS'}
          </h1>
          {!loading && <p className="text-muted">{total} products found</p>}
        </div>
        <button className="filter-toggle-btn" onClick={() => setFiltersOpen(!filtersOpen)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/>
            <line x1="11" y1="18" x2="13" y2="18"/>
          </svg>
          Filters {hasActiveFilters && <span className="filter-active-dot" />}
        </button>
      </div>

      <div className="products-layout">
        {/* Sidebar Filters */}
        <aside className={`filters-sidebar ${filtersOpen ? 'open' : ''}`}>
          <div className="filters-header">
            <h3>Filters</h3>
            {hasActiveFilters && (
              <button className="clear-filters-btn" onClick={clearFilters}>Clear All</button>
            )}
          </div>

          {/* Category */}
          <div className="filter-group">
            <h4 className="filter-label">Category</h4>
            {CATEGORIES.map(cat => (
              <label key={cat} className={`filter-radio ${category === cat ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="category"
                  value={cat}
                  checked={category === cat}
                  onChange={() => updateFilter('category', cat === 'all' ? '' : cat)}
                />
                <span>{cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
              </label>
            ))}
          </div>

          {/* Price Range */}
          <div className="filter-group">
            <h4 className="filter-label">Price Range</h4>
            <div className="price-inputs">
              <input
                type="number"
                placeholder="Min ₹"
                value={minPrice}
                onChange={e => updateFilter('minPrice', e.target.value)}
              />
              <span>—</span>
              <input
                type="number"
                placeholder="Max ₹"
                value={maxPrice}
                onChange={e => updateFilter('maxPrice', e.target.value)}
              />
            </div>
          </div>

          {/* Sort */}
          <div className="filter-group">
            <h4 className="filter-label">Sort By</h4>
            {SORT_OPTIONS.map(opt => (
              <label key={opt.value} className={`filter-radio ${sort === opt.value ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="sort"
                  value={opt.value}
                  checked={sort === opt.value}
                  onChange={() => updateFilter('sort', opt.value)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </aside>

        {/* Products Grid */}
        <div className="products-main">
          {/* Active Filter Tags */}
          {hasActiveFilters && (
            <div className="active-filters">
              {keyword && <span className="filter-tag">Search: {keyword} <button onClick={() => updateFilter('keyword', '')}>×</button></span>}
              {category !== 'all' && <span className="filter-tag">{category} <button onClick={() => updateFilter('category', '')}>×</button></span>}
              {minPrice && <span className="filter-tag">Min: ₹{minPrice} <button onClick={() => updateFilter('minPrice', '')}>×</button></span>}
              {maxPrice && <span className="filter-tag">Max: ₹{maxPrice} <button onClick={() => updateFilter('maxPrice', '')}>×</button></span>}
            </div>
          )}

          {loading ? (
            <Loader text="Loading drops..." />
          ) : error ? (
            <ErrorMessage message={error} />
          ) : products.length === 0 ? (
            <div className="empty-products">
              <div className="empty-icon">👟</div>
              <h3>No products found</h3>
              <p>Try adjusting your filters or search term</p>
              <button className="btn btn-primary mt-2" onClick={clearFilters}>Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="grid products-grid">
                {products.map(p => <ProductCard key={p._id} product={p} />)}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={page <= 1}
                    onClick={() => updateFilter('page', page - 1)}
                  >← Prev</button>
                  <div className="page-numbers">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        className={`page-btn ${page === p ? 'active' : ''}`}
                        onClick={() => updateFilter('page', p)}
                      >{p}</button>
                    ))}
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={page >= totalPages}
                    onClick={() => updateFilter('page', page + 1)}
                  >Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
