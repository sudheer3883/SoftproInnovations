import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import productCatalog from "../../data/productCatalog";
import { API_BASE_URL, getImageUrl } from "../../config/api";

const API_URL = `${API_BASE_URL}/api/product`;

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    window.setTimeout(
      () => setAlert({ show: false, type: "", message: "" }),
      4000,
    );
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/show`);
      const savedProducts = Array.isArray(response.data) ? response.data : [];
      const catalogNames = new Set(
        productCatalog.map((product) => product.name.toLowerCase()),
      );
      const extraProducts = savedProducts.filter(
        (product) => !catalogNames.has((product.name || "").toLowerCase()),
      );
      if (extraProducts.length > 0) {
        await Promise.all(
          extraProducts.map((product) =>
            axios.delete(`${API_URL}/delete/${product._id}`),
          ),
        );
      }
      const catalogProducts = savedProducts.filter((product) =>
        catalogNames.has((product.name || "").toLowerCase()),
      );
      const savedNames = new Set(
        catalogProducts.map((product) => product.name.toLowerCase()),
      );
      const missingProducts = productCatalog.filter(
        (product) => !savedNames.has(product.name.toLowerCase()),
      );

      if (extraProducts.length > 0 || missingProducts.length > 0) {
        await Promise.all(
          missingProducts.map((product) =>
            axios.post(`${API_URL}/register`, product),
          ),
        );
        const updatedResponse = await axios.get(`${API_URL}/show`);
        setProducts(
          (Array.isArray(updatedResponse.data)
            ? updatedResponse.data
            : []
          ).filter((product) =>
            catalogNames.has((product.name || "").toLowerCase()),
          ),
        );
      } else {
        setProducts(catalogProducts);
      }
    } catch (error) {
      showAlert(
        "danger",
        error.response?.data?.message || "Failed to load products.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    try {
      await axios.delete(`${API_URL}/delete/${product._id}`);
      showAlert("success", "Product deleted successfully.");
      fetchProducts();
    } catch (error) {
      showAlert(
        "danger",
        error.response?.data?.message || "Failed to delete product.",
      );
    }
  };

  const filteredProducts = products.filter((product) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = [product.name, product.category, product.brand].some(
      (value) => (value || "").toLowerCase().includes(search),
    );
    const matchesStatus =
      filterStatus === "all" || (product.status || "active") === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const activeCount = products.filter(
    (product) => (product.status || "active") === "active",
  ).length;
  const lowStockCount = products.filter(
    (product) => Number(product.stock) > 0 && Number(product.stock) < 10,
  ).length;
  const outOfStockCount = products.filter(
    (product) => Number(product.stock) === 0,
  ).length;
  const formatPrice = (price) =>
    `₹${Number(price || 0).toLocaleString("en-IN")}`;
  const stockState = (stock) =>
    Number(stock) === 0
      ? { label: "Out of stock", className: "out" }
      : Number(stock) < 10
        ? { label: `${stock} left`, className: "low" }
        : { label: `${stock} in stock`, className: "good" };

  return (
    <div className="products-page">
      <div className="products-hero">
        <div>
          <div className="product-breadcrumb">
            <Link to="/dashboard">Dashboard</Link>
            <span>/</span>
            <strong>Products</strong>
          </div>
          <div className="products-title-row">
            <div>
              <p className="products-eyebrow">CATALOG CONTROL CENTER</p>
              <h1>
                Product <em>Library</em>
              </h1>
              <p className="products-intro">
                Keep your store catalog organized, current, and ready to ship.
              </p>
            </div>
            <Link to="/dashboard/products/add" className="add-product-button">
              <i className="bi bi-plus-lg"></i>
              <span>Add Product</span>
            </Link>
          </div>
        </div>
        <div className="products-hero-mark">
          <i className="bi bi-boxes"></i>
          <span>{products.length} products</span>
        </div>
      </div>

      {alert.show && (
        <div
          className={`alert alert-${alert.type} alert-dismissible fade show product-alert`}
          role="alert"
        >
          {alert.message}
          <button
            type="button"
            className="btn-close"
            onClick={() => setAlert({ show: false, type: "", message: "" })}
          ></button>
        </div>
      )}

      <div className="product-stats-row">
        <div className="product-stat-card">
          <span className="stat-symbol blue">
            <i className="bi bi-grid-3x3-gap-fill"></i>
          </span>
          <div>
            <small>Total products</small>
            <strong>{products.length}</strong>
          </div>
          <i className="bi bi-arrow-up-right stat-arrow"></i>
        </div>
        <div className="product-stat-card">
          <span className="stat-symbol green">
            <i className="bi bi-check2-circle"></i>
          </span>
          <div>
            <small>Active listings</small>
            <strong>{activeCount}</strong>
          </div>
          <i className="bi bi-arrow-up-right stat-arrow"></i>
        </div>
        <div className="product-stat-card">
          <span className="stat-symbol amber">
            <i className="bi bi-exclamation-triangle-fill"></i>
          </span>
          <div>
            <small>Low stock</small>
            <strong>{lowStockCount}</strong>
          </div>
          <i className="bi bi-arrow-up-right stat-arrow"></i>
        </div>
        <div className="product-stat-card">
          <span className="stat-symbol red">
            <i className="bi bi-box-seam"></i>
          </span>
          <div>
            <small>Out of stock</small>
            <strong>{outOfStockCount}</strong>
          </div>
          <i className="bi bi-arrow-up-right stat-arrow"></i>
        </div>
      </div>

      <section className="product-table-panel">
        <div className="product-toolbar">
          <div>
            <h2>
              All products <span>{filteredProducts.length}</span>
            </h2>
            <p>Review and manage every item in your catalog.</p>
          </div>
          <div className="product-toolbar-actions">
            <label className="product-search">
              <i className="bi bi-search"></i>
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search products..."
              />
            </label>
            <select
              className="product-filter"
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
            >
              <option value="all">All status</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
          </div>
        </div>
        <div className="product-table-scroll">
          <table className="product-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Inventory</th>
                <th>Visibility</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="6" className="product-table-message">
                    <span className="spinner-border text-primary"></span>
                    <p>Loading your catalog...</p>
                  </td>
                </tr>
              )}
              {!loading && filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="6" className="product-table-message">
                    <i className="bi bi-search"></i>
                    <p>No products match this view.</p>
                    <Link to="/dashboard/products/add">Create a product</Link>
                  </td>
                </tr>
              )}
              {!loading &&
                filteredProducts.map((product) => {
                  const stock = stockState(product.stock);
                  return (
                    <tr key={product._id}>
                      <td>
                        <div className="product-identity">
                          <div className="product-thumb">
                            {product.image ? (
                              <img src={getImageUrl(product.image)} alt="" />
                            ) : (
                              <i className="bi bi-box-seam"></i>
                            )}
                          </div>
                          <div>
                            <strong>{product.name}</strong>
                            <small>{product.brand || ""}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="category-chip">
                          {product.category || "Uncategorized"}
                        </span>
                      </td>
                      <td>
                        <strong className="price-value">
                          {formatPrice(product.price)}
                        </strong>
                        {product.originalPrice && (
                          <del>{formatPrice(product.originalPrice)}</del>
                        )}
                      </td>
                      <td>
                        <span className={`stock-pill ${stock.className}`}>
                          <i className="bi bi-circle-fill"></i>
                          {stock.label}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`visibility-pill ${product.status === "inactive" ? "hidden" : ""}`}
                        >
                          <i
                            className={`bi ${product.status === "inactive" ? "bi-eye-slash" : "bi-eye"}`}
                          ></i>
                          {product.status === "inactive" ? "Hidden" : "Live"}
                        </span>
                      </td>
                      <td>
                        <div className="product-actions">
                          <Link
                            to={`/dashboard/products/edit/${product._id}`}
                            title="Edit product"
                          >
                            <i className="bi bi-pencil-square"></i>
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(product)}
                            title="Delete product"
                          >
                            <i className="bi bi-trash3"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        <div className="product-table-footer">
          <span>
            Showing <strong>{filteredProducts.length}</strong> of{" "}
            <strong>{products.length}</strong> products
          </span>
          <span>
            <i className="bi bi-shield-check"></i> Catalog changes sync
            instantly
          </span>
        </div>
      </section>
    </div>
  );
};

export default Products;
