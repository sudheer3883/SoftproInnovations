import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";

const PRODUCT_API = `${API_BASE_URL}/api/product`;

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
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
      const response = await axios.get(`${PRODUCT_API}/show`);
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      showAlert(
        "danger",
        error.response?.data?.message || "Failed to load inventory.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const inventoryProducts = useMemo(
    () =>
      products.filter((product) => {
        const stock = Number(product.stock || 0);
        const search = searchTerm.toLowerCase();
        const matchesSearch = [
          product.name,
          product.category,
          product.brand,
        ].some((value) => (value || "").toLowerCase().includes(search));
        const matchesFilter =
          stockFilter === "all" ||
          (stockFilter === "out" && stock === 0) ||
          (stockFilter === "low" && stock > 0 && stock < 10) ||
          (stockFilter === "healthy" && stock >= 10);
        return matchesSearch && matchesFilter;
      }),
    [products, searchTerm, stockFilter],
  );

  const totalUnits = products.reduce(
    (total, product) => total + Number(product.stock || 0),
    0,
  );
  const lowStock = products.filter(
    (product) =>
      Number(product.stock || 0) > 0 && Number(product.stock || 0) < 10,
  ).length;
  const outOfStock = products.filter(
    (product) => Number(product.stock || 0) === 0,
  ).length;
  const getStockState = (stock) =>
    Number(stock) === 0
      ? { label: "Out of stock", className: "out" }
      : Number(stock) < 10
        ? { label: "Low stock", className: "low" }
        : { label: "Healthy", className: "good" };

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <div>
          <div className="product-breadcrumb">
            <Link to="/dashboard">Dashboard</Link>
            <span>/</span>
            <strong>Inventory</strong>
          </div>
          <p className="inventory-eyebrow">STOCK CONTROL</p>
          <h1>
            Inventory <em>Monitor</em>
          </h1>
          <p className="inventory-intro">
            Live stock levels for every product in your catalog.
          </p>
        </div>
        <button
          type="button"
          className="inventory-sync-button"
          onClick={fetchProducts}
          disabled={loading}
        >
          <i
            className={`bi ${loading ? "bi-arrow-repeat spin" : "bi-arrow-clockwise"}`}
          ></i>
          {loading ? "Syncing..." : "Sync Inventory"}
        </button>
      </div>

      {alert.show && (
        <div
          className={`alert alert-${alert.type} alert-dismissible fade show`}
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

      <div className="inventory-stats">
        <div className="inventory-stat">
          <span className="inventory-stat-icon blue">
            <i className="bi bi-boxes"></i>
          </span>
          <div>
            <small>Total products</small>
            <strong>{products.length}</strong>
          </div>
        </div>
        <div className="inventory-stat">
          <span className="inventory-stat-icon green">
            <i className="bi bi-stack"></i>
          </span>
          <div>
            <small>Total units in stock</small>
            <strong>{totalUnits.toLocaleString("en-IN")}</strong>
          </div>
        </div>
        <div className="inventory-stat">
          <span className="inventory-stat-icon amber">
            <i className="bi bi-exclamation-triangle"></i>
          </span>
          <div>
            <small>Low stock alerts</small>
            <strong>{lowStock}</strong>
          </div>
        </div>
        <div className="inventory-stat">
          <span className="inventory-stat-icon red">
            <i className="bi bi-x-circle"></i>
          </span>
          <div>
            <small>Out of stock</small>
            <strong>{outOfStock}</strong>
          </div>
        </div>
      </div>

      <section className="inventory-panel">
        <div className="inventory-toolbar">
          <div>
            <h2>
              Product stock <span>{inventoryProducts.length}</span>
            </h2>
            <p>Every product is listed here, including inactive items.</p>
          </div>
          <div className="inventory-controls">
            <label className="inventory-search">
              <i className="bi bi-search"></i>
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search products..."
              />
            </label>
            <select
              value={stockFilter}
              onChange={(event) => setStockFilter(event.target.value)}
            >
              <option value="all">All stock</option>
              <option value="healthy">Healthy</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </select>
          </div>
        </div>
        <div className="inventory-table-wrap">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Current stock</th>
                <th>Stock status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="6" className="inventory-message">
                    <span className="spinner-border text-primary"></span>
                    <p>Loading product inventory...</p>
                  </td>
                </tr>
              )}
              {!loading && inventoryProducts.length === 0 && (
                <tr>
                  <td colSpan="6" className="inventory-message">
                    <i className="bi bi-box-seam"></i>
                    <p>No products found.</p>
                    <Link to="/dashboard/products/add">Add a product</Link>
                  </td>
                </tr>
              )}
              {!loading &&
                inventoryProducts.map((product) => {
                  const state = getStockState(product.stock);
                  return (
                    <tr key={product._id}>
                      <td>
                        <div className="inventory-product">
                          <div className="inventory-thumb">
                            {product.image ? (
                              <img src={product.image} alt="" />
                            ) : (
                              <i className="bi bi-box-seam"></i>
                            )}
                          </div>
                          <div>
                            <strong>{product.name}</strong>
                            {product.brand && <small>{product.brand}</small>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="category-chip">
                          {product.category || "Uncategorized"}
                        </span>
                      </td>
                      <td>
                        <strong className="inventory-price">
                          ₹{Number(product.price || 0).toLocaleString("en-IN")}
                        </strong>
                      </td>
                      <td>
                        <strong
                          className={`inventory-quantity ${state.className}`}
                        >
                          {Number(product.stock || 0).toLocaleString("en-IN")}
                        </strong>
                      </td>
                      <td>
                        <span className={`stock-pill ${state.className}`}>
                          <i className="bi bi-circle-fill"></i>
                          {state.label}
                        </span>
                      </td>
                      <td>
                        <Link
                          to={`/dashboard/products/edit/${product._id}`}
                          className="inventory-edit"
                          title="Update product stock"
                        >
                          <i className="bi bi-pencil-square"></i>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        <div className="inventory-footer">
          <span>
            Showing <strong>{inventoryProducts.length}</strong> of{" "}
            <strong>{products.length}</strong> products
          </span>
          <span>
            <i className="bi bi-arrow-repeat"></i> Stock is synced from product
            details
          </span>
        </div>
      </section>
    </div>
  );
};

export default Inventory;
