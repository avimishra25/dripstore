import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import { useDemo } from '../context/DemoContext';
import AdminLayout from './AdminLayout';
import { Loader } from '../components/Loader';
import { toast } from 'react-toastify';
import './AdminProductForm.css';

const CATEGORIES = ['sneakers', 'hoodies', 'streetwear', 'accessories'];
const STREETWEAR_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const SNEAKER_SIZES = ['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '12'];

const AdminProductForm = () => {
  const { enabled: demo } = useDemo();
  const maxImageMB = demo ? 1 : 5;
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);

  const [form, setForm] = useState({
    name: '', brand: '', category: 'sneakers', description: '',
    price: '', originalPrice: '', countInStock: '',
    sizes: [], variantStock: [], tags: '', isFeatured: false,
  });

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/products/${id}`)
      .then(({ data }) => {
        const p = data.product;
        setForm({
          name: p.name, brand: p.brand, category: p.category,
          description: p.description, price: p.price,
          originalPrice: p.originalPrice || '',
          countInStock: p.countInStock,
          sizes: p.sizes || [],
          variantStock: p.variantStock || [],
          tags: p.tags?.join(', ') || '',
          isFeatured: p.isFeatured,
        });
        setExistingImages(p.images || []);
      })
      .catch(() => toast.error('Failed to load product'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const toggleSize = (size) => {
    setForm(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size],
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (existingImages.length + imageFiles.length + files.length > 5 || files.some(f => f.size > maxImageMB * 1024 * 1024 || !['image/jpeg','image/png','image/webp'].includes(f.type))) { toast.error(`Use up to 5 JPG, PNG or WEBP images, each under ${maxImageMB}MB`); return; }
    setImageFiles(prev => [...prev, ...files]);

  };

  const removeExistingImage = (url) => {
    setExistingImages(prev => prev.filter(i => i !== url));
  };

  const removeNewImage = (idx) => {
    setImageFiles(prev => prev.filter((_, i) => i !== idx));

  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.sizes.length === 0) { toast.error('Please select at least one size'); return; }
    if (!isEdit && imageFiles.length === 0) { toast.error('Please upload at least one image'); return; }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('brand', form.brand);
      formData.append('category', form.category);
      formData.append('description', form.description);
      formData.append('price', form.price);
      formData.append('originalPrice', form.originalPrice || 0);
      formData.append('countInStock', form.countInStock);
      formData.append('sizes', JSON.stringify(form.sizes));
      formData.append('variantStock', JSON.stringify(form.variantStock));
      formData.append('tags', JSON.stringify(form.tags.split(',').map(t => t.trim()).filter(Boolean)));
      formData.append('isFeatured', form.isFeatured);

      if (isEdit) {
        formData.append('existingImages', JSON.stringify(existingImages));
      }

      imageFiles.forEach(file => formData.append('images', file));

      if (isEdit) {
        await api.put(`/admin/products/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Product updated successfully!');
      } else {
        await api.post('/admin/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Product created successfully!');
      }
      navigate('/admin/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => { const previews = imageFiles.map(file => URL.createObjectURL(file)); setImagePreview(previews); return () => previews.forEach(url => URL.revokeObjectURL(url)); }, [imageFiles]);
  const sizeOptions = form.category === 'accessories' ? ['One Size'] : form.category === 'sneakers' ? SNEAKER_SIZES : STREETWEAR_SIZES;

  if (loading) return <AdminLayout><Loader /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="admin-product-form">
        <div className="admin-page-header">
          <button className="back-link-btn" onClick={() => navigate('/admin/products')}>← Back to Products</button>
          <h1 className="display-font">{isEdit ? 'EDIT PRODUCT' : 'ADD PRODUCT'}</h1>
        </div>

        <form onSubmit={handleSubmit} className="product-form-grid">
          {/* Left Column */}
          <div className="form-col-main">
            {/* Basic Info */}
            <div className="admin-card form-section">
              <h3>Basic Information</h3>
              <div className="form-group">
                <label className="form-label" htmlFor="adminproductform-1">Product Name *</label>
                <input id="adminproductform-1" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Air Max 97 Silver Bullet" required />
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="adminproductform-2">Brand *</label>
                  <input id="adminproductform-2" name="brand" value={form.brand} onChange={handleChange} placeholder="Nike, Adidas, Jordan..." required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="adminproductform-3">Category *</label>
                  <select id="adminproductform-3" name="category" value={form.category} onChange={handleChange} required>
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="adminproductform-4">Description *</label>
                <textarea id="adminproductform-4" name="description" value={form.description} onChange={handleChange}
                  rows={4} placeholder="Describe the product in detail..." required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="adminproductform-5">Tags (comma separated)</label>
                <input id="adminproductform-5" name="tags" value={form.tags} onChange={handleChange}
                  placeholder="limited, exclusive, retro, collab..." />
              </div>
              <div className="form-group">
                <label className="featured-toggle">
                  <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange} />
                  <span className="toggle-text">
                    <span className="toggle-label">Featured Product</span>
                    <span className="toggle-sub">Show on homepage hot picks section</span>
                  </span>
                </label>
              </div>
            </div>

            {/* Pricing & Stock */}
            <div className="admin-card form-section">
              <h3>Pricing & Inventory</h3>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="adminproductform-6">Price (₹) *</label>
                  <input id="adminproductform-6" name="price" type="number" value={form.price} onChange={handleChange}
                    placeholder="12999" min="0" required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="adminproductform-7">Original Price (₹)</label>
                  <input id="adminproductform-7" name="originalPrice" type="number" value={form.originalPrice} onChange={handleChange}
                    placeholder="14999 (for showing discount)" min="0" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="adminproductform-8">Stock Count *</label>
                <input id="adminproductform-8" name="countInStock" type="number" value={form.countInStock} onChange={handleChange}
                  placeholder="50" min="0" required />
              </div>
            </div>

            {/* Sizes */}
            <div className="admin-card form-section"><h3>Stock per size</h3>
              <label><input type="checkbox" checked={form.variantStock.length > 0} onChange={e => setForm(prev => ({ ...prev, variantStock: e.target.checked ? prev.sizes.map(size => ({ size, countInStock: 0 })) : [] }))} /> Track inventory separately for each size</label>
              {form.variantStock.length > 0 && <p>Total must match Stock Count. Update size quantities after changing available sizes.</p>}
              {form.variantStock.length > 0 && form.sizes.map(size => <label key={size} style={{ display: 'block' }}>Size {size}<input type="number" min="0" step="1" value={form.variantStock.find(v => v.size === size)?.countInStock ?? 0} onChange={e => { const count = Number(e.target.value); setForm(prev => ({ ...prev, variantStock: prev.sizes.map(s => ({ size: s, countInStock: s === size ? count : prev.variantStock.find(v => v.size === s)?.countInStock || 0 })) })); }} /></label>)}
            </div>
            <div className="admin-card form-section">
              <h3>Available Sizes</h3>
              <p className="form-help">Select all sizes available for this product</p>
              <div className="size-selector">
                {sizeOptions.map(size => (
                  <button
                    key={size}
                    type="button"
                    className={`size-select-btn ${form.sizes.includes(size) ? 'selected' : ''}`}
                    onClick={() => toggleSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {form.sizes.length > 0 && (
                <p className="selected-sizes-display">
                  Selected: {form.sizes.join(', ')}
                </p>
              )}
            </div>
          </div>

          {/* Right Column - Images */}
          <div className="form-col-side">
            <div className="admin-card form-section">
              <h3>Product Images</h3>
              <p className="form-help">Upload up to 5 images. First image will be the thumbnail.</p>

              {/* Existing Images */}
              {isEdit && existingImages.length > 0 && (
                <div className="image-grid">
                  {existingImages.map((url, i) => (
                    <div key={i} className="image-preview-item">
                      <img src={url} alt={`Product ${i + 1}`} />
                      <button type="button" className="remove-img-btn" onClick={() => removeExistingImage(url)}>×</button>
                      {i === 0 && <span className="main-img-badge">Main</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* New Image Previews */}
              {imagePreview.length > 0 && (
                <div className="image-grid">
                  {imagePreview.map((url, i) => (
                    <div key={i} className="image-preview-item new">
                      <img src={url} alt={`New ${i + 1}`} />
                      <button type="button" className="remove-img-btn" onClick={() => removeNewImage(i)}>×</button>
                      <span className="new-img-badge">New</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              {(existingImages.length + imageFiles.length) < 5 && (
                <label className="upload-area">
                  <input type="file" accept="image/*" multiple onChange={handleImageChange} style={{ display: 'none' }} />
                  <div className="upload-inner">
                    <span className="upload-icon">📸</span>
                    <span className="upload-text">Click to upload images</span>
                    <span className="upload-sub">JPG, PNG, WEBP — Max {maxImageMB}MB each</span>
                  </div>
                </label>
              )}
            </div>

            {/* Submit */}
            <div className="form-submit-area">
              <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={saving}>
                {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
              </button>
              <button type="button" className="btn btn-secondary btn-full" onClick={() => navigate('/admin/products')}>
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminProductForm;
