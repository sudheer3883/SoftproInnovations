import { useEffect, useRef, useState } from "react";
import { Swiper as SwiperReact, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, getImageUrl } from "../config/api";

import "swiper/css";
import "swiper/css/autoplay";

const categoryPalette = [
  {
    accent: "#1976f3",
    soft: "#e9f4ff",
    glow: "rgba(25, 118, 243, 0.18)",
    icon: "bi-gear-wide-connected",
  },
  {
    accent: "#f59e0b",
    soft: "#fff2d7",
    glow: "rgba(245, 158, 11, 0.2)",
    icon: "bi-battery-charging",
  },
  {
    accent: "#8b3dff",
    soft: "#f1e9ff",
    glow: "rgba(139, 61, 255, 0.18)",
    icon: "bi-wifi",
  },
  {
    accent: "#00bd9d",
    soft: "#e5fbf6",
    glow: "rgba(0, 189, 157, 0.18)",
    icon: "bi-lightbulb",
  },
  {
    accent: "#2382ee",
    soft: "#e8f3ff",
    glow: "rgba(35, 130, 238, 0.18)",
    icon: "bi-display",
  },
];

const Swiper = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const swiperRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/category/show`, {
          timeout: 2000,
        });
        const savedCategories = (
          Array.isArray(response.data) ? response.data : []
        )
          .filter((category) => (category.status || "active") === "active")
          .map((category) => ({
            ...category,
            displayName: category.name || category.category,
            image: category.image || "",
          }));
        setCategories(savedCategories);
      } catch (error) {
        console.error("Failed to load public categories", error);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleExploreCategory = (categoryName) => {
    navigate(`/Product?category=${encodeURIComponent(categoryName)}`);
  };

  return (
    <section className="category-section py-5">
      <div className="container">
        {/* Header Strip */}
        <div className="category-header d-flex flex-column flex-lg-row justify-content-between align-items-lg-end mb-3">
          <div>
            <span className="category-subtitle text-uppercase fw-semibold small">
              <i className="bi bi-grid-3x3-gap-fill"></i> BROWSE BY TYPE
            </span>
            <h2 className="category-heading mt-1 mb-2 fw-bold">
              Popular{" "}
              <span className="text-orangered fst-italic">Categories</span>
            </h2>
            <p className="category-text text-muted mb-0">
              Find exactly what your project needs from our curated electronics
              families.
            </p>
          </div>
          <div className="category-trust-strip" aria-label="Store benefits">
            <span>
              <i className="bi bi-shield-check"></i>
              <strong>Trusted Quality</strong>
              <small>100% Genuine Products</small>
            </span>
            <span>
              <i className="bi bi-truck"></i>
              <strong>Fast Delivery</strong>
              <small>Across India</small>
            </span>
            <span>
              <i className="bi bi-headset"></i>
              <strong>Expert Support</strong>
              <small>We're here to help</small>
            </span>
          </div>
        </div>

        {loading && (
          <div className="category-loading text-center py-4 text-muted">
            Loading categories...
          </div>
        )}
        {!loading && categories.length === 0 && (
          <div className="category-empty text-center py-4 text-muted">
            New categories will appear here soon.
          </div>
        )}

        {/* Swiper Slider */}
        {!loading && categories.length > 0 && (
          <div className="category-slider-shell">
            <button
              type="button"
              className="category-nav-btn category-nav-prev"
              aria-label="Previous categories"
              onClick={() => swiperRef.current?.slidePrev()}
            >
              <i className="bi bi-chevron-left"></i>
            </button>

            <SwiperReact
              modules={[Autoplay]}
              spaceBetween={22}
              slidesPerView={1}
              loop={true}
              speed={1200}
              grabCursor={true}
              autoplay={{
                delay: 2400,
                disableOnInteraction: false,
              }}
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
              }}
              breakpoints={{
                480: {
                  slidesPerView: 2,
                  spaceBetween: 18,
                },
                768: {
                  slidesPerView: 3,
                  spaceBetween: 22,
                },
                1024: {
                  slidesPerView: 3,
                  spaceBetween: 22,
                },
                1280: {
                  slidesPerView: 4,
                  spaceBetween: 22,
                },
              }}
              className="category-swiper py-3"
            >
              {categories.map((cat, index) => {
                const palette = categoryPalette[index % categoryPalette.length];

                return (
                  <SwiperSlide key={cat._id || `${cat.displayName}-${index}`}>
                    <div
                      className="category-card text-center h-100 d-flex flex-column"
                      style={{
                        "--card-accent": palette.accent,
                        "--card-soft": palette.soft,
                        "--card-glow": palette.glow,
                      }}
                    >
                      <span className="category-card-badge" aria-hidden="true">
                        <i className={`bi ${palette.icon}`}></i>
                      </span>
                      <div className="category-icon-shell d-flex align-items-center justify-content-center mx-auto">
                        {cat.image ? (
                          <img
                            src={getImageUrl(cat.image)}
                            alt={cat.displayName}
                            className="img-fluid category-img"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                              if (event.currentTarget.nextElementSibling) {
                                event.currentTarget.nextElementSibling.style.display =
                                  "inline-block";
                              }
                            }}
                          />
                        ) : null}
                        <i
                          className="bi bi-grid-3x3-gap category-placeholder-icon"
                          style={{
                            display: cat.image ? "none" : "inline-block",
                          }}
                        ></i>
                      </div>

                      <h5 className="category-card-title mb-2">
                        {cat.displayName}
                      </h5>

                      <p className="category-card-description mb-3">
                        {cat.description ||
                          "Explore products from this category."}
                      </p>

                      <button
                        type="button"
                        className="category-cta-btn mt-auto"
                        onClick={() => handleExploreCategory(cat.displayName)}
                      >
                        Explore products <span aria-hidden="true">→</span>
                      </button>
                    </div>
                  </SwiperSlide>
                );
              })}
            </SwiperReact>

            <button
              type="button"
              className="category-nav-btn category-nav-next"
              aria-label="Next categories"
              onClick={() => swiperRef.current?.slideNext()}
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Swiper;
