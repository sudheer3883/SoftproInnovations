import { useEffect, useState } from "react";
import { Swiper as SwiperReact, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import axios from "axios";
import { API_BASE_URL, getImageUrl } from "../config/api";

import "swiper/css";
import "swiper/css/autoplay";

const Swiper = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <section className="category-section py-5">
      <div className="container">
        {/* Header Strip */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-3">
          <div>
            <span className="category-subtitle text-uppercase text-muted fw-semibold small">
              BROWSE BY TYPE
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
          <SwiperReact
            modules={[Autoplay]}
            spaceBetween={18}
            slidesPerView={1}
            loop={true}
            speed={1400}
            grabCursor={true}
            autoplay={{
              delay: 2200,
              disableOnInteraction: false,
            }}
            breakpoints={{
              480: {
                slidesPerView: 2,
                spaceBetween: 16,
              },
              768: {
                slidesPerView: 3,
                spaceBetween: 20,
              },
              1024: {
                slidesPerView: 4,
                spaceBetween: 20,
              },
              1280: {
                slidesPerView: 5,
                spaceBetween: 20,
              },
            }}
            className="category-swiper py-3"
          >
            {categories.map((cat) => (
              <SwiperSlide key={cat._id}>
                <div className="category-card text-center p-3 h-100 d-flex flex-column">
                  <div className="category-img-wrapper mb-3 mx-auto d-flex align-items-center justify-content-center">
                    {cat.image ? (
                      <img
                        src={getImageUrl(cat.image)}
                        alt={cat.displayName}
                        className="img-fluid category-img"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                          event.currentTarget.nextElementSibling.style.display =
                            "inline-block";
                        }}
                      />
                    ) : null}
                    <i
                      className="bi bi-grid-3x3-gap category-placeholder-icon"
                      style={{ display: cat.image ? "none" : "inline-block" }}
                    ></i>
                  </div>
                  <h5 className="category-card-title mb-1">
                    {cat.displayName}
                  </h5>
                  <p className="category-card-description text-muted small mb-0">
                    {cat.description || "Explore products from this category."}
                  </p>
                  <span className="category-card-count text-muted small mt-auto pt-2">
                    Explore products
                  </span>
                </div>
              </SwiperSlide>
            ))}
          </SwiperReact>
        )}
      </div>
    </section>
  );
};

export default Swiper;
