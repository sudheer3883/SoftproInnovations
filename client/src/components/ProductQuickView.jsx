import { useEffect, useState } from "react";
import { getImageUrl } from "../config/api";

const toNumber = (value) =>
  Number(String(value ?? 0).replace(/[^0-9.-]/g, "")) || 0;
const formatPrice = (value) => `₹${toNumber(value).toLocaleString("en-IN")}`;

const ProductQuickView = ({ product, onClose, onViewDetails }) => {
  const [zoom, setZoom] = useState(0.82);

  useEffect(() => {
    const closeOnEscape = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  if (!product) return null;

  const images = [
    ...new Set(
      [product.img, product.image, ...(product.galleryImages || [])].filter(
        Boolean,
      ),
    ),
  ];
  const price = product.priceValue ?? product.price;
  const stock =
    product.stock === undefined
      ? product.inStock !== false
      : Number(product.stock) > 0;

  return (
    <div className="quick-view-backdrop" role="presentation" onClick={onClose}>
      <div
        className="quick-view-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-view-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="quick-view-close"
          onClick={onClose}
          aria-label="Close quick view"
        >
          <i className="bi bi-x-lg" />
        </button>
        <div className="quick-view-media" style={{ minHeight: 320 }}>
          <div
            className="quick-view-zoom-controls"
            aria-label="Quick view image zoom controls"
          >
            <button
              type="button"
              onClick={() => setZoom((value) => Math.min(1.2, value + 0.1))}
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => setZoom((value) => Math.max(0.62, value - 0.1))}
              aria-label="Zoom out"
            >
              −
            </button>
          </div>
          {images[0] ? (
            <img
              className="quick-view-main-image"
              src={getImageUrl(images[0])}
              alt={product.title || product.name}
              style={{ "--quick-view-zoom": zoom }}
            />
          ) : (
            <i className="bi bi-box-seam text-muted" aria-hidden="true" />
          )}
          {product.badge && (
            <span className="quick-view-badge">{product.badge}</span>
          )}
          {images.length > 1 && (
            <div className="quick-view-gallery" aria-label="Product images">
              {images.map((image, index) => (
                <img
                  key={`${image}-${index}`}
                  src={getImageUrl(image)}
                  alt={`${product.title || product.name} view ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
        <div className="quick-view-content">
          <span className="text-uppercase text-primary fw-bold small">
            {product.category || "Components"}
          </span>
          <h2 id="quick-view-title">{product.title || product.name}</h2>
          <p className="text-muted mb-2">
            {product.brand || "Softpro Innovation"}
          </p>
          <div className="text-warning mb-2">
            ★★★★★{" "}
            <span className="text-dark small">
              {product.rating || "4.8"} ({product.reviews || 0} reviews)
            </span>
          </div>
          <p className="quick-view-description">
            {product.description ||
              product.summary ||
              "A reliable electronics component for prototyping, learning, and production projects."}
          </p>
          <div className="d-flex align-items-center gap-2 mb-3">
            <strong className="fs-4 text-primary">{formatPrice(price)}</strong>
            {product.originalPrice && (
              <del className="text-muted">
                {typeof product.originalPrice === "string" &&
                product.originalPrice.includes("₹")
                  ? product.originalPrice
                  : formatPrice(product.originalPrice)}
              </del>
            )}
          </div>
          <p
            className={
              stock ? "text-success fw-semibold" : "text-danger fw-semibold"
            }
          >
            <i
              className={`bi ${stock ? "bi-check-circle-fill" : "bi-x-circle-fill"} me-1`}
            />
            {stock ? "In stock" : "Out of stock"}
          </p>
          <button
            type="button"
            className="quick-view-details-link"
            onClick={() => onViewDetails(product)}
          >
            View full product details <i className="bi bi-arrow-right" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductQuickView;
