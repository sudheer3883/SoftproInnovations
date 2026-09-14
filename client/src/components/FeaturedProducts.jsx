import { useWishlist } from "../context/useWishlist";
import ProductQuickView from "./ProductQuickView";
import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

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
        const savedProducts = (
          Array.isArray(response.data) ? response.data : []
        )
          .filter((product) => (product.status || "active") === "active")
          .map((product) => ({
            ...product,
            title: product.name,
            category: (product.category || "Uncategorized").toUpperCase(),
            price: `₹${Number(product.price || 0).toLocaleString("en-IN")}`,
            originalPrice: product.originalPrice
              ? `₹${Number(product.originalPrice).toLocaleString("en-IN")}`
              : "",
            inStock: Number(product.stock || 0) > 0,
            img: product.image || product.galleryImages?.[0] || "",
            badge: product.featured ? "Featured" : "New",
            rating: product.rating || "4.8",
            reviews: product.reviews || 0,
          }));
        setProducts(savedProducts);
      } catch (error) {
        console.error("Failed to load featured products", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturedProducts();
  }, []);

  const handleAddToCart = (event, product) => {
    event.stopPropagation();
    addToCart(product);
  };

  const handleBuyNow = (event, product) => {
    event.stopPropagation();
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
      className="featured-products-section py-5"
      style={{ backgroundColor: "#f2f0ed" }}
    >
      <div className="container-fluid px-3 px-xl-5">
        {/* Section Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4">
          <div>
            <span className="text-uppercase small fw-semibold text-orangered tracking-wider">
              HANDPICKED FOR YOU
            </span>
            <h2
              className="display-6 fw-bold mt-1 mb-2"
              style={{ color: "#1e3a8a" }}
            >
              Featured{" "}
              <span className="text-orangered fst-italic">Products</span>
            </h2>
            <p className="text-muted mb-0" style={{ maxWidth: "500px" }}>
              Top-rated boards and components loved by engineers, students, and
              hobbyists.
            </p>
          </div>
          <div className="mt-3 mt-md-0">
            <button
              type="button"
              className="btn btn-outline-secondary rounded-pill px-4 py-2 btn-sm fw-semibold"
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
                className="card h-100 overflow-hidden shadow-sm product-card position-relative border-0 rounded-4"
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
                style={{
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-8px)";
                  e.currentTarget.style.boxShadow =
                    "0 15px 30px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 0.125rem 0.25rem rgba(0,0,0,0.075)";
                }}
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
                  className="btn btn-white rounded-circle position-absolute top-0 end-0 m-3 shadow-sm d-flex align-items-center justify-content-center p-0 z-3 border"
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
                  className="product-img-box d-flex align-items-center justify-content-center p-4 position-relative overflow-hidden bg-white"
                  style={{ height: "230px" }}
                >
                  {item.img ? (
                    <img
                      src={item.img}
                      alt={item.title}
                      className="img-fluid product-img"
                      style={{
                        maxHeight: "160px",
                        objectFit: "contain",
                        transition: "transform 0.4s ease",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.transform = "scale(1.1)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.transform = "scale(1)")
                      }
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
                <div className="card-body p-3 p-lg-4 d-flex flex-column bg-white">
                  {/* Category */}
                  <span
                    className="text-uppercase fw-bold text-muted mb-1"
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
                      className="btn flex-grow-1 btn-sm py-2 fw-semibold rounded-2 d-flex justify-content-center align-items-center gap-1"
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
                      className="btn flex-grow-1 btn-sm py-2 fw-semibold rounded-2"
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
