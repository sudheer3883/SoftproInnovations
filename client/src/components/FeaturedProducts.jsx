import { useWishlist } from "../context/useWishlist";
import ProductQuickView from "./ProductQuickView";
import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL, getProductImageUrl } from "../config/api";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { resolveProductImage } from "../data/resolveProductImage";
import productCatalog from "../data/productCatalog";

const normalizeProduct = (product) => ({
  ...product,
  title: product.name || product.title,
  category: String(product.category || "Uncategorized").trim(),
  price: `₹${Number(product.price || 0).toLocaleString("en-IN")}`,
  originalPrice: product.originalPrice
    ? `₹${Number(product.originalPrice).toLocaleString("en-IN")}`
    : "",
  inStock: Number(product.stock || 0) > 0,
  img: resolveProductImage(product),
  badge: product.featured ? "Featured" : "New",
  rating: product.rating || "4.8",
  reviews: product.reviews || 0,
});

const FeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const navigate = useNavigate();
  const { addToCart, buyNow } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/product/show`, {
          timeout: 2000,
        });
        const backendProducts = Array.isArray(response.data)
          ? response.data
          : [];
        const savedProducts = backendProducts
          .filter((product) => (product.status || "active") === "active")
          .map(normalizeProduct);

        setProducts(
          savedProducts.length
            ? savedProducts
            : productCatalog.map(normalizeProduct),
        );
      } catch (error) {
        console.error("Failed to load featured products", error);
        setProducts(productCatalog.map(normalizeProduct));
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturedProducts();
  }, []);

  const isUserLoggedIn = () => {
    if (typeof window === "undefined") return false;
    return Boolean(
      localStorage.getItem("token") ||
      sessionStorage.getItem("token") ||
      localStorage.getItem("userProfile") ||
      sessionStorage.getItem("userProfile"),
    );
  };

  const handleAddToCart = (event, product) => {
    event.stopPropagation();
    if (!isUserLoggedIn()) {
      navigate("/login");
      return;
    }
    addToCart(product);
  };

  const handleBuyNow = (event, product) => {
    event.stopPropagation();
    if (!isUserLoggedIn()) {
      navigate("/login");
      return;
    }
    buyNow(product);
    navigate("/checkout");
  };

  const closeQuickView = () => {
    setQuickViewProduct(null);
  };

  const openQuickView = (item) => {
    setQuickViewProduct(item);
  };

  return (
    <section
      className="featured-products-section product-catalog-section py-5"
      style={{ backgroundColor: "#f2f0ed" }}
    >
      <div className="container-fluid px-3 px-xl-5">
        {/* Section Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4">
          <div>
            <span className="featured-eyebrow text-uppercase small fw-semibold tracking-wider">
              <i className="bi bi-stars"></i> HANDPICKED FOR YOU
            </span>
            <h2 className="featured-heading display-6 fw-bold mt-2 mb-2">
              Featured <span className="fst-italic">Products</span>
            </h2>
            <p className="featured-subtitle text-muted mb-0">
              Top-rated boards and components loved by engineers, students, and
              hobbyists.
            </p>
          </div>
          <div className="mt-3 mt-md-0">
            <button
              type="button"
              className="featured-all-button btn rounded-pill px-4 py-2 btn-sm fw-semibold"
              onClick={() => navigate("/Product")}
            >
              All Products &rarr;
            </button>
          </div>
        </div>

        {/* Product Grid */}
        {loading && (
          <div className="text-center text-muted py-4">
            Loading featured products...
          </div>
        )}
        {!loading && products.length === 0 && (
          <div className="text-center text-muted py-4">
            No featured products available yet.
          </div>
        )}
        <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-4">
          {products.map((item) => (
            <div key={item._id} className="col">
              <div
                className="card h-100 overflow-hidden product-card product-card-unified position-relative"
                role="link"
                tabIndex={0}
                onClick={() =>
                  navigate(`/product/${item._id}`, { state: { product: item } })
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ")
                    navigate(`/product/${item._id}`, {
                      state: { product: item },
                    });
                }}
                style={{ cursor: "pointer" }}
              >
                {/* Badges */}
                <div className="position-absolute top-0 start-0 p-2 z-3 d-flex flex-column gap-1 mt-2 ms-2">
                  {item.badge && (
                    <span
                      className={`badge ${item.badge === "New" ? "bg-success" : "bg-primary"} rounded-1 px-2 py-1 shadow-sm fw-semibold`}
                      style={{ fontSize: "11px", letterSpacing: "0.5px" }}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.discount && (
                    <span
                      className="badge bg-warning text-dark rounded-1 px-2 py-1 shadow-sm fw-bold"
                      style={{ fontSize: "11px", letterSpacing: "0.5px" }}
                    >
                      {item.discount}
                    </span>
                  )}
                </div>

                {/* Wishlist Button (Always visible on top right) */}
                <button
                  className={`wishlist-toggle btn btn-white rounded-circle position-absolute top-0 end-0 m-3 shadow-sm d-flex align-items-center justify-content-center p-0 z-3 border ${isInWishlist(item.id || item._id) ? "is-saved" : ""}`}
                  aria-pressed={isInWishlist(item.id || item._id)}
                  style={{
                    width: "36px",
                    height: "36px",
                    transition: "all 0.2s",
                    backgroundColor: "rgba(255,255,255,0.9)",
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleWishlist(item);
                  }}
                  title={
                    isInWishlist(item.id || item._id)
                      ? "Remove from Wishlist"
                      : "Add to Wishlist"
                  }
                >
                  <i
                    className={`bi ${isInWishlist(item.id || item._id) ? "bi-heart-fill text-danger" : "bi-heart text-secondary"} fs-6`}
                  ></i>
                </button>

                {/* Image Section */}
                <div
                  className="product-img-box d-flex align-items-center justify-content-center p-4 position-relative overflow-hidden"
                  style={{ height: "auto" }}
                >
                  {item.img ? (
                    <img
                      src={getProductImageUrl(item)}
                      alt={item.title}
                      className="img-fluid product-img"
                      style={{ maxHeight: "160px", objectFit: "contain" }}
                    />
                  ) : (
                    <i
                      className="bi bi-box-seam text-muted"
                      style={{ fontSize: "55px" }}
                    ></i>
                  )}

                  {/* Quick View on Hover */}
                  <div
                    className="product-card-overlay position-absolute w-100 h-100 top-0 start-0 d-flex align-items-center justify-content-center"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.4)",
                      opacity: 0,
                      transition: "opacity 0.3s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = 0)}
                  >
                    <button
                      type="button"
                      className="btn btn-dark rounded-pill shadow-sm px-4 py-2 fw-semibold btn-view-action"
                      style={{ fontSize: "13px" }}
                      onClick={(event) => {
                        event.stopPropagation();
                        openQuickView(item);
                      }}
                    >
                      <i className="bi bi-eye me-1"></i> Quick View
                    </button>
                  </div>
                </div>

                {/* Content Section */}
                <div className="card-body p-3 p-lg-4 d-flex flex-column">
                  {/* Category */}
                  <span
                    className="product-card-category text-uppercase fw-bold mb-1"
                    style={{ fontSize: "11px", letterSpacing: "1px" }}
                  >
                    {item.category}
                  </span>

                  {/* Title */}
                  <h6
                    className="card-title fw-bold text-dark mb-2"
                    style={{
                      fontSize: "15px",
                      minHeight: "44px",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {item.title}
                  </h6>

                  {/* Rating & Reviews */}
                  <div
                    className="d-flex align-items-center mb-2 gap-1"
                    style={{ fontSize: "12px" }}
                  >
                    <div className="text-warning d-flex">
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i
                        className={
                          item.rating >= 4.8
                            ? "bi bi-star-fill"
                            : "bi bi-star-half"
                        }
                      ></i>
                    </div>
                    <span className="fw-bold ms-1 text-dark">
                      {item.rating}
                    </span>
                    <span className="text-muted">({item.reviews} reviews)</span>
                  </div>

                  {/* Stock Status */}
                  <div className="mb-2" style={{ fontSize: "12.5px" }}>
                    {item.inStock ? (
                      <span className="text-success fw-semibold">
                        <i className="bi bi-check-circle-fill me-1"></i>In Stock
                      </span>
                    ) : (
                      <span className="text-danger fw-semibold">
                        <i className="bi bi-x-circle-fill me-1"></i>Out of Stock
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mt-auto d-flex flex-column mb-3">
                    <div className="d-flex align-items-end gap-2">
                      <span
                        className="fw-bold fs-5"
                        style={{ color: "#3945e0" }}
                      >
                        {item.price}
                      </span>
                      {item.originalPrice && (
                        <span className="text-muted text-decoration-line-through small mb-1">
                          {item.originalPrice}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="d-flex gap-2 w-100 mt-auto">
                    <button
                      className="btn product-card-add-btn flex-grow-1 btn-sm py-2 fw-semibold rounded-2 d-flex justify-content-center align-items-center gap-1"
                      onClick={(event) => handleAddToCart(event, item)}
                      disabled={!item.inStock}
                      style={{
                        fontSize: "13px",
                        color: "#3945e0",
                        border: "1px solid #3945e0",
                        backgroundColor: "transparent",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#3945e0";
                        e.currentTarget.style.color = "white";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "#3945e0";
                      }}
                    >
                      <i className="bi bi-cart-plus fs-6"></i> Add
                    </button>
                    <button
                      className="btn product-card-buy-btn flex-grow-1 btn-sm py-2 fw-semibold rounded-2"
                      onClick={(event) => handleBuyNow(event, item)}
                      disabled={!item.inStock}
                      style={{
                        fontSize: "13px",
                        backgroundColor: "#3945e0",
                        color: "white",
                        border: "1px solid #3945e0",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#2e36b3";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#3945e0";
                      }}
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {quickViewProduct && (
        <ProductQuickView
          product={quickViewProduct}
          onClose={closeQuickView}
          onViewDetails={(product) => {
            closeQuickView();
            navigate(`/product/${product._id}`, { state: { product } });
          }}
        />
      )}
    </section>
  );
};

export default FeaturedProducts;
