import { useWishlist } from "../../context/useWishlist";
import { useEffect, useState, useMemo } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useCart } from "../../context/CartContext";
import ProductQuickView from "../../components/ProductQuickView";

const Product = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("Featured");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const navigate = useNavigate();
  const { addToCart, buyNow } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          axios.get("http://localhost:5000/api/product/show", {
            timeout: 2000,
          }),
          axios.get("http://localhost:5000/api/category/show", {
            timeout: 2000,
          }),
        ]);
        const savedProducts = (
          Array.isArray(productsResponse.data) ? productsResponse.data : []
        )
          .filter((product) => (product.status || "active") === "active")
          .map((product) => ({
            ...product,
            title: product.name,
            price: Number(product.price || 0),
            priceStr: `₹${Number(product.price || 0).toLocaleString("en-IN")}`,
            originalPrice: product.originalPrice
              ? `₹${Number(product.originalPrice).toLocaleString("en-IN")}`
              : "",
            featured: Boolean(product.featured),
            inStock: Number(product.stock || 0) > 0,
            img: product.image || product.galleryImages?.[0] || "",
            badge: product.featured ? "Featured" : "New",
          }));
        const dashboardCategories = (
          Array.isArray(categoriesResponse.data) ? categoriesResponse.data : []
        )
          .filter(
            (category) =>
              String(category.status || "active").toLowerCase() === "active",
          )
          .map((category) => category.name || category.category)
          .filter(Boolean)
          .map((category) => category.trim());
        const uniqueCategories = [
          ...new Map(
            dashboardCategories.map((category) => [
              category.toLowerCase(),
              category,
            ]),
          ).values(),
        ];
        const dashboardCategoryKeys = new Set(
          uniqueCategories.map((category) => category.toLowerCase()),
        );
        const dashboardProducts = savedProducts.filter((product) =>
          dashboardCategoryKeys.has(String(product.category || "").trim().toLowerCase()),
        );
        setProducts(dashboardProducts);
        setCategories(["All", ...uniqueCategories]);
      } catch (error) {
        console.error("Failed to load products", error);
        setProducts([]);
        setCategories(["All"]);
        setLoadError("Unable to load dashboard products.");
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
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

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return products
      .filter((item) => {
        const matchesCategory =
          selectedCategory === "All" ||
          item.category.trim().toLowerCase() ===
            selectedCategory.trim().toLowerCase();
        const matchesSearch =
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "Price: Low to High") return a.price - b.price;
        if (sortBy === "Price: High to Low") return b.price - a.price;
        if (sortBy === "Name: A-Z") return a.title.localeCompare(b.title);
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [products, selectedCategory, searchTerm, sortBy]);

  return (
    <>
      <Header />
      {/* Products Page Hero Banner */}
      <section className="product-hero-section py-5">
        <div className="container py-2">
          <div className="product-hero-content text-start">
            {/* Breadcrumb Navigation */}
            <div className="product-breadcrumb mb-2">
              <Link
                to="/"
                className="text-decoration-none"
                style={{ color: "#3945E0", fontSize: "13px" }}
              >
                Home
              </Link>
              <span className="mx-2 text-muted" style={{ fontSize: "13px" }}>
                &rsaquo;
              </span>
              <span className="text-muted" style={{ fontSize: "13px" }}>
                Products
              </span>
            </div>

            {/* Title */}
            <h1 className="product-hero-title mb-2">
              All <span className="highlight-italic">Products</span>
            </h1>

            {/* Accent Line */}
            <div className="product-accent-line mb-3"></div>

            {/* Subtitle */}
            <p className="product-hero-subtitle mb-0">
              Browse {products.length} electronics components, boards, and
              accessories.
            </p>
          </div>
        </div>
      </section>

      {/* Product Catalog Grid Section */}
      <section className="product-catalog-section py-5">
        <div className="container-fluid px-3 px-xl-5">
          {/* Top Search & Sort Control Bar */}
          <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 mb-4">
            {/* Search Input Box */}
            <div
              className="position-relative w-100"
              style={{ maxWidth: "340px" }}
            >
              <input
                type="text"
                className="form-control product-search-input pe-4 text-start"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <i className="bi bi-search product-search-icon"></i>
            </div>

            {/* Sort Dropdown */}
            <div className="d-flex align-items-center gap-2 ms-auto">
              <span className="text-muted" style={{ fontSize: "14px" }}>
                Sort:
              </span>
              <select
                className="form-select product-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="Featured">Featured</option>
                <option value="Price: Low to High">Price: Low to High</option>
                <option value="Price: High to Low">Price: High to Low</option>
                <option value="Name: A-Z">Name: A-Z</option>
              </select>
            </div>
          </div>

          {/* Category Filter Pills Bar */}
          <div className="d-flex flex-wrap gap-2 mb-4 align-items-center">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`btn category-pill-btn ${selectedCategory === cat ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Showing Count */}
          <div className="text-start mb-4">
            <span className="text-muted" style={{ fontSize: "14px" }}>
              Showing {filteredProducts.length} products
            </span>
          </div>

          {/* 3 Rows x 4 Columns Product Grid */}
          {loading && (
            <div className="text-center text-muted py-5">
              Loading products...
            </div>
          )}
          {!loading && loadError && (
            <div className="text-center text-danger py-5">{loadError}</div>
          )}
          {!loading && !loadError && filteredProducts.length === 0 && (
            <div className="text-center text-muted py-5">
              No products found.
            </div>
          )}
          <div className="row g-3 g-md-4">
            {filteredProducts.map((item) => (
              <div key={item._id} className="col-12 col-sm-6 col-md-6 col-lg-3">
                <div
                  className="card h-100 overflow-hidden shadow-sm position-relative border-0 rounded-4"
                  role="link"
                  tabIndex={0}
                  onClick={() =>
                    navigate(`/product/${item._id}`, {
                      state: { product: item },
                    })
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
                    {item.featured && !item.badge && (
                      <span
                        className="badge bg-info text-dark rounded-1 px-2 py-1 shadow-sm fw-semibold"
                        style={{ fontSize: "11px", letterSpacing: "0.5px" }}
                      >
                        Featured
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
                        className="img-fluid"
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
                      className="position-absolute w-100 h-100 top-0 start-0 d-flex align-items-center justify-content-center"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.4)",
                        opacity: 0,
                        transition: "opacity 0.3s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = 0)}
                    >
                      <button
                        className="btn btn-dark rounded-pill shadow-sm px-4 py-2 fw-semibold"
                        style={{ fontSize: "13px" }}
                        onClick={(event) => {
                          event.stopPropagation();
                          setQuickViewProduct(item);
                        }}
                      >
                        <i className="bi bi-eye me-1"></i> Quick View
                      </button>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="card-body p-3 p-lg-4 d-flex flex-column bg-white text-start">
                    {/* Category */}
                    <span
                      className="text-uppercase fw-bold text-muted mb-1"
                      style={{ fontSize: "11px", letterSpacing: "1px" }}
                    >
                      {item.category}
                    </span>

                    {/* Title */}
                    <h6
                      className="card-title fw-bold text-dark mb-1"
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
                    <p className="text-muted small mb-2">{item.brand}</p>

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
                      <span className="text-muted">
                        ({item.reviews} reviews)
                      </span>
                    </div>

                    {/* Stock Status */}
                    <div className="mb-2" style={{ fontSize: "12.5px" }}>
                      {item.inStock ? (
                        <span className="text-success fw-semibold">
                          <i className="bi bi-check-circle-fill me-1"></i>In
                          Stock
                        </span>
                      ) : (
                        <span className="text-danger fw-semibold">
                          <i className="bi bi-x-circle-fill me-1"></i>Out of
                          Stock
                        </span>
                      )}
                    </div>

                    {/* Price */}
                    <div className="mt-auto d-flex flex-column mb-3 border-top pt-3">
                      <div className="d-flex align-items-end gap-2">
                        <span
                          className="fw-bold fs-5"
                          style={{ color: "#3945e0" }}
                        >
                          {item.priceStr}
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
      </section>

      {quickViewProduct && (
        <ProductQuickView
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onViewDetails={(product) => {
            setQuickViewProduct(null);
            navigate(`/product/${product._id}`, { state: { product } });
          }}
        />
      )}

      <Footer />
    </>
  );
};

export default Product;
