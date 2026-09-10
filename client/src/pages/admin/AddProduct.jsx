import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const PRODUCT_API = 'http://localhost:5000/api/product';
const CATEGORY_API = 'http://localhost:5000/api/category/show';
const emptyForm = { name: '', category: '', tags: '', brand: '', summary: '', description: '', image: '', galleryImages: [], price: '', originalPrice: '', stock: 0, status: 'active', featured: false, dimensions: { height: '', width: '', depth: '', unit: 'mm' }, weight: '', shippingClass: 'Standard' };

const AddProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const [formData, setFormData] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  useEffect(() => {
    const loadData = async () => {
      try {
        const categoryResponse = await axios.get(CATEGORY_API);
        setCategories(Array.isArray(categoryResponse.data) ? categoryResponse.data : []);
        if (isEditMode) {
          const productResponse = await axios.get(`${PRODUCT_API}/${id}`);
          setFormData({ ...emptyForm, ...productResponse.data });
        }
      } catch (error) {
        setAlert({ show: true, type: 'danger', message: error.response?.data?.message || 'Failed to load product details.' });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, isEditMode]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((previous) => ({ ...previous, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      setAlert({ show: true, type: 'danger', message: 'Choose an image smaller than 5MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setFormData((previous) => ({ ...previous, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleGallery = (event) => {
    const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024);
    files.slice(0, 8).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => setFormData((previous) => ({ ...previous, galleryImages: [...previous.galleryImages, reader.result].slice(0, 8) }));
      reader.readAsDataURL(file);
    });
    event.target.value = '';
  };

  const removeGalleryImage = (index) => setFormData((previous) => ({ ...previous, galleryImages: previous.galleryImages.filter((_, imageIndex) => imageIndex !== index) }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const request = isEditMode ? axios.put(`${PRODUCT_API}/update/${id}`, formData) : axios.post(`${PRODUCT_API}/register`, formData);
      await request;
      navigate('/dashboard/products');
    } catch (error) {
      setAlert({ show: true, type: 'danger', message: error.response?.data?.message || 'Failed to save product.' });
    } finally {
      setSaving(false);
    }
  };

  const selectedCategory = categories.find((category) => category.name === formData.category);
  const stockLabel = Number(formData.stock) === 0 ? 'Out of Stock' : Number(formData.stock) < 10 ? 'Low Stock' : 'In Stock';

  return (
    <div className="add-product-page">
      <div className="product-form-heading">
        <div>
          <div className="product-breadcrumb"><Link to="/dashboard">Dashboard</Link><span>/</span><Link to="/dashboard/products">Products</Link><span>/</span><strong>{isEditMode ? 'Edit Product' : 'Add New Product'}</strong></div>
          <h1>{isEditMode ? 'Edit' : 'Create'} <em>Product</em></h1>
          <p>Fill in the complete details to list a new product in your store</p>
        </div>
        <Link to="/dashboard/products" className="product-back-link"><i className="bi bi-arrow-left"></i> Back to Products</Link>
      </div>

      {alert.show && <div className={`alert alert-${alert.type} shadow-sm`} role="alert">{alert.message}</div>}

      {loading ? <div className="dashboard-section text-center py-5"><span className="spinner-border text-primary"></span></div> : <form onSubmit={handleSubmit}>
        <div className="product-form-layout">
          <div className="product-form-main">
            <section className="product-panel">
              <div className="product-panel-title"><span className="panel-icon"><i className="bi bi-info-circle-fill"></i></span><div><h2>Basic Product Details</h2><p>Make your product easy to discover and understand</p></div></div>
              <div className="product-panel-body">
                <div className="product-field"><label htmlFor="productName">Product Title / Name <b>*</b></label><input id="productName" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Raspberry Pi 4 Model B (4GB RAM) Starter Kit" /></div>
                <div className="product-field-grid"><div className="product-field"><label htmlFor="category">Category <b>*</b></label><select id="category" name="category" value={formData.category} onChange={handleChange} required><option value="">Select a category</option>{categories.map((category) => <option key={category._id} value={category.name}>{category.name}</option>)}{formData.category && !selectedCategory && <option value={formData.category}>{formData.category}</option>}</select></div><div className="product-field"><label htmlFor="tags">Tags <small>(comma separated)</small></label><input id="tags" name="tags" value={formData.tags} onChange={handleChange} placeholder="e.g. iot, robotics, arduino, sensor" /></div></div>
                <div className="product-field"><label htmlFor="summary">Short Summary / Tagline <b>*</b></label><input id="summary" name="summary" value={formData.summary} onChange={handleChange} required placeholder="Brief 1-sentence product summary displayed on cards" /></div>
                <div className="product-field"><label htmlFor="description">Full Description</label><textarea id="description" name="description" rows="5" value={formData.description} onChange={handleChange} placeholder="Comprehensive description of specifications, features, pinouts, and package contents..."></textarea></div>
              </div>
            </section>

            <section className="product-panel">
              <div className="product-panel-title"><span className="panel-icon green"><i className="bi bi-currency-rupee"></i></span><div><h2>Pricing & Product Image</h2><p>Set your price and give customers a clear visual</p></div></div>
              <div className="product-panel-body"><div className="product-field-grid"><div className="product-field"><label htmlFor="price">Selling Price <b>*</b></label><div className="input-prefix"><span>₹</span><input id="price" type="number" min="0" name="price" value={formData.price} onChange={handleChange} required placeholder="0.00" /></div></div><div className="product-field"><label htmlFor="originalPrice">Original / MRP</label><div className="input-prefix"><span>₹</span><input id="originalPrice" type="number" min="0" name="originalPrice" value={formData.originalPrice || ''} onChange={handleChange} placeholder="0.00" /></div></div></div><div className="product-field"><label htmlFor="productImage">Product Image</label><label className="product-upload" htmlFor="productImage"><i className="bi bi-cloud-arrow-up"></i><strong>Click to upload product image</strong><small>PNG, JPG or WEBP, max 5MB</small><input id="productImage" type="file" accept="image/*" onChange={handleImage} /></label>{formData.image && <div className="image-preview"><img src={formData.image} alt="Product preview" /><button type="button" onClick={() => setFormData((previous) => ({ ...previous, image: '' }))}><i className="bi bi-x"></i></button></div>}</div></div>
            </section>

            <section className="product-panel gallery-panel">
              <div className="gallery-heading"><div><div className="section-kicker"><i className="bi bi-images"></i> Visual showcase</div><h2>Gallery Images <b>*</b></h2><p>Upload angles, package shots, and dimension photos for your product.</p></div><label className="add-images-button" htmlFor="galleryImages"><i className="bi bi-plus-lg"></i> Add Images<input id="galleryImages" type="file" accept="image/*" multiple onChange={handleGallery} /></label></div>
              {formData.galleryImages.length ? <div className="gallery-grid">{formData.galleryImages.map((image, index) => <div className="gallery-tile" key={`${image.slice(0, 20)}-${index}`}><img src={image} alt={`Gallery ${index + 1}`} /><button type="button" onClick={() => removeGalleryImage(index)} title="Remove image"><i className="bi bi-x"></i></button>{index === 0 && <span>Cover</span>}</div>)}</div> : <label className="gallery-empty" htmlFor="galleryImages"><i className="bi bi-images"></i><strong>Your product story starts here</strong><small>Click “Add Images” to upload up to 8 product photos</small></label>}
            </section>

            <section className="product-panel specs-panel">
              <div className="product-panel-title"><span className="panel-icon cyan"><i className="bi bi-rulers"></i></span><div><h2>Dimensions & Shipping Specs</h2><p>Help customers plan their build and delivery</p></div></div>
              <div className="product-panel-body"><div className="dimension-grid"><div className="product-field"><label htmlFor="height">Height <small>({formData.dimensions.unit})</small></label><input id="height" type="number" min="0" placeholder="e.g. 56" value={formData.dimensions.height} onChange={(event) => setFormData((previous) => ({ ...previous, dimensions: { ...previous.dimensions, height: event.target.value } }))} /></div><div className="product-field"><label htmlFor="width">Width <small>({formData.dimensions.unit})</small></label><input id="width" type="number" min="0" placeholder="e.g. 85" value={formData.dimensions.width} onChange={(event) => setFormData((previous) => ({ ...previous, dimensions: { ...previous.dimensions, width: event.target.value } }))} /></div><div className="product-field"><label htmlFor="depth">Depth <small>({formData.dimensions.unit})</small></label><input id="depth" type="number" min="0" placeholder="e.g. 20" value={formData.dimensions.depth} onChange={(event) => setFormData((previous) => ({ ...previous, dimensions: { ...previous.dimensions, depth: event.target.value } }))} /></div><div className="product-field"><label htmlFor="unit">Unit</label><select id="unit" value={formData.dimensions.unit} onChange={(event) => setFormData((previous) => ({ ...previous, dimensions: { ...previous.dimensions, unit: event.target.value } }))}><option value="mm">Millimetres (mm)</option><option value="cm">Centimetres (cm)</option><option value="in">Inches (in)</option></select></div></div><div className="shipping-row"><div className="product-field"><label htmlFor="weight">Package Weight (g)</label><input id="weight" type="number" min="0" name="weight" value={formData.weight} onChange={handleChange} placeholder="e.g. 250" /></div><div className="product-field"><label htmlFor="shippingClass">Shipping Class</label><select id="shippingClass" name="shippingClass" value={formData.shippingClass} onChange={handleChange}><option>Standard</option><option>Fragile</option><option>Heavy</option></select></div></div></div>
            </section>
          </div>

          <aside className="product-form-side">
            <section className="product-panel"><div className="product-panel-title"><span className="panel-icon blue"><i className="bi bi-box-seam"></i></span><div><h2>Stock & Inventory</h2><p>Keep your inventory accurate</p></div></div><div className="product-panel-body"><div className="product-field"><label htmlFor="stock">Stock Quantity <b>*</b></label><input id="stock" type="number" min="0" name="stock" value={formData.stock} onChange={handleChange} required /></div><div className="product-field"><label htmlFor="brand">Brand</label><input id="brand" name="brand" value={formData.brand} onChange={handleChange} placeholder="Enter brand name" /></div><label className="featured-toggle"><input type="checkbox" name="featured" checked={formData.featured} onChange={handleChange} /><span><i className="bi bi-star-fill"></i> Mark as featured product</span></label></div></section>
            <section className="product-preview-panel"><div className="preview-top"><span><i className="bi bi-eye-fill"></i> Live Card Preview</span><small>Card display appearance</small></div><div className="preview-card"><div className="preview-image">{formData.image ? <img src={formData.image} alt="" /> : <i className="bi bi-box-seam"></i>}</div><div className="preview-content"><span>{formData.category || 'CATEGORY'}</span><h3>{formData.name || 'Your Product Name'}</h3><p>{formData.summary || 'Your short product summary will appear here.'}</p><div className="preview-price">{formData.price ? `₹${Number(formData.price).toLocaleString('en-IN')}` : '₹0'} {formData.originalPrice && <del>₹{Number(formData.originalPrice).toLocaleString('en-IN')}</del>}</div><div className="preview-stock"><i className="bi bi-circle-fill"></i> {stockLabel}</div></div></div></section>
          </aside>
        </div>
        <section className="product-panel publish-panel publish-panel-bottom"><div className="side-panel-heading"><div><h2>Ready to publish?</h2><p className="publish-helper">Review your product details, then make it visible in your store.</p></div><span className="settings-dot"><i className="bi bi-sliders"></i></span></div><div className="publish-bottom-controls"><div className="product-field"><label htmlFor="status">Store Status</label><select id="status" name="status" value={formData.status} onChange={handleChange}><option value="active">● Active (Visible in Store)</option><option value="inactive">● Inactive (Hidden)</option></select></div><button className="publish-button" type="submit" disabled={saving}><i className="bi bi-cloud-arrow-up"></i>{saving ? 'Saving Product...' : isEditMode ? 'Update Product' : 'Publish Product'}</button><Link to="/dashboard/products" className="cancel-button">Cancel</Link></div></section>
      </form>}
    </div>
  );
};

export default AddProduct;

