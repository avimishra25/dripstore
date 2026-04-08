import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import AdminLayout from './AdminLayout';
import { Loader } from '../components/Loader';
import { toast } from 'react-toastify';
import './AdminProducts.css';

const AdminProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [deleting, setDeleting] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (keyword) params.set('keyword', keyword);
      const { data } = await api.get(`/admin/products?${params}`);
      setProducts(data.products);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, keyword]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/products/${id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-products">
        <div className="admin-page-header flex-between">
          <div>
            <h1 className="display-font">PRODUCTS</h1>
            <p className="text-muted">{total} total products</p>
          </div>
          <Link to="/admin/products/new" className="btn btn-primary">
            + Add Product
          </Link>
        </div>

        {/* Search */}
        <div className="admin-search-bar">
          <input
            type="text"
            placeholder="Search products..."
            value={keyword}
            onChange={e => { setKeyword(e.target.value); setPage(1); }}
          />
        </div>

        {loading ? <Loader /> : (
          <>
            <div className="admin-card">
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Rating</th>
                      <th>Featured</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p._id}>
                        <td>
                          <div className="product-cell">
                            <div className="product-cell-img">
                              {p.images?.[0] ? <img src={p.images[0]} alt={p.name} /> : <span>👟</span>}
                            </div>
                            <div>
                              <div className="product-cell-name">{p.name}</div>
                              <div className="product-cell-brand">{p.brand}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-gray">{p.category}</span>
                        </td>
                        <td>
                          <div className="mono">₹{p.price.toLocaleString()}</div>
                          {p.originalPrice > p.price && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'line-through', fontFamily: 'var(--font-mono)' }}>
                              ₹{p.originalPrice.toLocaleString()}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${p.countInStock === 0 ? 'badge-red' : p.countInStock < 5 ? 'badge-yellow' : 'badge-green'}`}>
                            {p.countInStock}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.85rem' }}>
                            ⭐ {p.rating?.toFixed(1)} ({p.numReviews})
                          </div>
                        </td>
                        <td>
                          {p.isFeatured ? (
                            <span className="badge badge-red">🔥 Yes</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No</span>
                          )}
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="table-action-btn edit"
                              onClick={() => navigate(`/admin/products/${p._id}/edit`)}
                              title="Edit"
                            >✏️</button>
                            <button
                              className="table-action-btn delete"
                              onClick={() => handleDelete(p._id, p.name)}
                              disabled={deleting === p._id}
                              title="Delete"
                            >
                              {deleting === p._id ? '...' : '🗑️'}
                            </button>
                            <a
                              href={`/products/${p._id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="table-action-btn view"
                              title="View"
                            >👁️</a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {products.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No products found
                </div>
              )}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="admin-pagination">
                <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Page {page} of {pages}</span>
                <button className="btn btn-secondary btn-sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
