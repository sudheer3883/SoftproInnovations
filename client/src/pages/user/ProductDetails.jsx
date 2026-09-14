import { useWishlist } from "../../context/useWishlist";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  API_BASE_URL,
  getImageUrl,
  getProductImageUrl,
} from "../../config/api";
import productCatalog from "../../data/productCatalog";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useCart } from "../../context/CartContext";
import { resolveProductImage } from "../../data/resolveProductImage";

const toNumber = (value) =>
  Number(String(value ?? 0).replace(/[^0-9.-]/g, "")) || 0;
const formatPrice = (value) => `₹${toNumber(value).toLocaleString("en-IN")}`;

const normalizeProduct = (product) => ({
  ...product,
  title: product.title || product.name,
  category: product.category || "Uncategorized",
  img: resolveProductImage(product),
  priceValue: toNumber(product.priceValue ?? product.price),
  originalPriceValue: toNumber(
    product.originalPriceValue ?? product.originalPrice,
  ),
  inStock: product.inStock ?? Number(product.stock || 0) > 0,
  rating: product.rating || "4.8",
  reviews: product.reviews || 0,
  galleryImages: (product.galleryImages || []).map((image) =>
    resolveProductImage(product, image),
  ),
});

const ProductDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart: addProductToCart, buyNow } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [product, setProduct] = useState(
    location.state?.product ? normalizeProduct(location.state.product) : null,
  );
  const [selectedImage, setSelectedImage] = useState(product?.img || "");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(!product);
  const [error, setError] = useState("");

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [id]);

  useEffect(() => {
    if (location.state?.product) return;

    const loadProduct = async () => {
      try {
        if (String(id).startsWith("catalog-")) {
          const catalogProduct = productCatalog.find(
            (item) => `catalog-${item.name}` === id,
          );
          if (!catalogProduct) throw new Error("Product not found");
          const normalizedCatalogProduct = normalizeProduct(catalogProduct);
          setProduct(normalizedCatalogProduct);
          setSelectedImage(normalizedCatalogProduct.img);
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/api/product/${id}`);
        const normalizedProduct = normalizeProduct(response.data);
        setProduct(normalizedProduct);
        setSelectedImage(normalizedProduct.img);
      } catch (loadError) {
        setError(
          loadError.response?.data?.message || "Unable to load this product.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id, location.state]);

  const images = useMemo(
    () => [
      ...new Set(
        [product?.img, ...(product?.galleryImages || [])].filter(Boolean),
      ),
    ],
    [product],
  );

  const addToCart = () => {
    if (!product?.inStock) return;
    addProductToCart(product, quantity);
    setAdded(true);
  };

  const handleBuyNow = () => {
    if (!product?.inStock) return;
    buyNow(product, quantity);
    navigate("/checkout");
  };

  if (loading)
    return (
      <div className="product-details-state">
        <span className="spinner-border text-primary" /> Loading product...
      </div>
    );
  if (error || !product)
    return (
      <div className="product-details-state">
        <i className="bi bi-exclamation-circle" />
        <h2>{error || "Product not found"}</h2>
        <Link to="/Product">Back to products</Link>
      </div>
    );

  return (
    <>
      <Header />
      <main className="product-details-page">
        <div className="container py-4 py-lg-5">
          <div className="product-details-breadcrumb">
            <Link to="/">Home</Link>
            <i className="bi bi-chevron-right" />
            <Link to="/Product">Products</Link>
            <i className="bi bi-chevron-right" />
            <span>{product.title}</span>
          </div>

          <section className="product-details-hero">
            <div className="product-details-gallery">
              <div className="product-details-thumbnails">
                {images.map((image, index) => (
                  <button
                    type="button"
                    className={selectedImage === image ? "active" : ""}
                    key={`${image}-${index}`}
                    onClick={() => setSelectedImage(image)}
                    aria-label={`Show product image ${index + 1}`}
                  >
                    <img
                      src={getImageUrl(image)}
                      alt={`${product.title} ${index + 1}`}
                    />
                  </button>
                ))}
              </div>
              <div className="product-details-main-image">
                {selectedImage ? (
                  <img src={getImageUrl(selectedImage)} alt={product.title} />
                ) : (
                  <i className="bi bi-box-seam" />
                )}
              </div>
            </div>

            <div className="product-details-summary">
              <span className="product-details-kicker">{product.category}</span>
              <h1>{product.title}</h1>
              <div className="product-details-rating">
                <span className="text-warning">★★★★★</span>
                <strong>{product.rating}</strong>
                <span>({product.reviews} reviews)</span>
              </div>
              <button
                type="button"
                className="product-back-button mb-3"
                onClick={() => toggleWishlist(product)}
              >
                <i
                  className={`bi ${isInWishlist(product.id || product._id) ? "bi-heart-fill text-danger" : "bi-heart"}`}
                />{" "}
                {isInWishlist(product.id || product._id)
                  ? "Remove from wishlist"
                  : "Add to wishlist"}
              </button>
              <p className="product-details-description">
                {product.description ||
                  "A reliable electronics component for prototyping, learning, and production projects."}
              </p>
              <div className="product-details-price">
                <strong>{formatPrice(product.priceValue)}</strong>
                {product.originalPriceValue > product.priceValue && (
                  <del>{formatPrice(product.originalPriceValue)}</del>
                )}
              </div>
              <div
                className={
                  product.inStock
                    ? "product-stock in-stock"
                    : "product-stock out-of-stock"
                }
              >
                <i
                  className={`bi ${product.inStock ? "bi-check-circle-fill" : "bi-x-circle-fill"}`}
                />
                {product.inStock
                  ? `${product.stock || "In"} units available`
                  : "Currently out of stock"}
              </div>

              <div className="product-purchase-row">
                <div className="product-quantity" aria-label="Quantity">
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((value) => Math.max(1, value - 1))
                    }
                  >
                    -
                  </button>
                  <span>{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((value) => value + 1)}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className="product-add-button"
                  disabled={!product.inStock}
                  onClick={addToCart}
                >
                  <i
                    className={`bi ${added ? "bi-check2-circle" : "bi-cart-plus"}`}
                  />{" "}
                  {added ? "Added to cart" : "Add to cart"}
                </button>
                <button
                  type="button"
                  className="product-buy-button"
                  disabled={!product.inStock}
                  onClick={handleBuyNow}
                >
                  <i className="bi bi-lightning-charge-fill" /> Buy now
                </button>
              </div>
              <button
                type="button"
                className="product-back-button"
                onClick={() => navigate(-1)}
              >
                <i className="bi bi-arrow-left" /> Continue shopping
              </button>
            </div>
          </section>

          <section className="product-details-information">
            <div className="product-information-heading">
              <span>Everything you need to know</span>
              <h2>
                Product <em>details</em>
              </h2>
            </div>
            <div className="product-information-grid">
              <div className="product-description-panel">
                <h3>Description</h3>
                <p>
                  {product.description ||
                    "Designed for dependable performance in electronics projects, prototypes, and everyday builds."}
                </p>
                {product.brand && (
                  <p>
                    <strong>Brand:</strong> {product.brand}
                  </p>
                )}
              </div>
              <div className="product-specification-panel">
                <h3>Specifications</h3>
                <dl>
                  {product.sku && (
                    <>
                      <dt>SKU</dt>
                      <dd>{product.sku}</dd>
                    </>
                  )}
                  {product.shippingClass && (
                    <>
                      <dt>Shipping</dt>
                      <dd>{product.shippingClass}</dd>
                    </>
                  )}
                  {product.weight && (
                    <>
                      <dt>Weight</dt>
                      <dd>{product.weight} g</dd>
                    </>
                  )}
                  {product.dimensions && (
                    <>
                      <dt>Dimensions</dt>
                      <dd>
                        {Object.entries(product.dimensions)
                          .filter(([key, value]) => key !== "unit" && value)
                          .map(([, value]) => value)
                          .join(" x ")}{" "}
                        {product.dimensions.unit || ""}
                      </dd>
                    </>
                  )}
                  {product.status && (
                    <>
                      <dt>Status</dt>
                      <dd className="text-capitalize">{product.status}</dd>
                    </>
                  )}
                </dl>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default ProductDetails;
