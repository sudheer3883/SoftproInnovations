import { Link } from "react-router-dom";
import logo from "../assets/logoone.png";

const Footer = () => {
  return (
    <footer className="spi-footer text-white">
      <div className="container py-5">
        <div className="row g-4 justify-content-between">
          {/* Column 1: Brand Info & Quick Contact */}
          <div className="col-12 col-lg-4 pe-lg-4">
            <Link
              to="/"
              className="d-inline-flex align-items-center text-decoration-none mb-3"
            >
              <img
                src={logo}
                alt="SPI Logo"
                width="36"
                height="36"
                className="me-2"
                style={{
                  objectFit: "contain",
                  padding: "3px",
                  borderRadius: "7px",
                  backgroundColor: "#1e3a8a",
                }}
              />
              <span
                className="fs-4 fw-bold text-white tracking-tight"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Softpro<span style={{ color: "#ff6b35" }}>Innovation</span>
              </span>
            </Link>
            <p className="spi-footer-tagline mb-3">
              India&apos;s trusted platform for genuine development boards, microcontrollers,
              sensors, and robotics components with fast dispatch and reliable support.
            </p>

            <div className="spi-footer-contact-items mb-3">
              <div className="d-flex align-items-center gap-2 mb-2 text-white-50 small">
                <i className="bi bi-geo-alt-fill text-warning"></i>
                <span>Jankipuram, Kursi Road, Lucknow - 226021</span>
              </div>
              <div className="d-flex align-items-center gap-3 text-white-50 small flex-wrap">
                <a
                  href="tel:+918299403883"
                  className="text-white-50 text-decoration-none hover-white d-inline-flex align-items-center gap-1.5"
                >
                  <i className="bi bi-telephone-fill text-warning"></i> +91 8299403883
                </a>
                <span className="opacity-25">&bull;</span>
                <a
                  href="mailto:rsk205096@gmail.com"
                  className="text-white-50 text-decoration-none hover-white d-inline-flex align-items-center gap-1.5"
                >
                  <i className="bi bi-envelope-fill text-warning"></i> rsk205096@gmail.com
                </a>
              </div>
            </div>

            {/* Social Icons */}
            <div className="d-flex gap-2 pt-1">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="spi-social-icon"
                aria-label="Facebook"
              >
                <i className="bi bi-facebook"></i>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="spi-social-icon"
                aria-label="Twitter"
              >
                <i className="bi bi-twitter-x"></i>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="spi-social-icon"
                aria-label="Instagram"
              >
                <i className="bi bi-instagram"></i>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="spi-social-icon"
                aria-label="YouTube"
              >
                <i className="bi bi-youtube"></i>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="spi-social-icon"
                aria-label="LinkedIn"
              >
                <i className="bi bi-linkedin"></i>
              </a>
            </div>
          </div>

          {/* Links Grid: 3 Clean Columns (responsive 2-col on mobile, 3-col on desktop) */}
          <div className="col-12 col-lg-8">
            <div className="row g-4">
              {/* Column 2: Quick Links */}
              <div className="col-6 col-md-4">
                <h6 className="spi-footer-heading">Quick Links</h6>
                <ul className="list-unstyled spi-footer-links mb-0">
                  <li>
                    <Link to="/">Home</Link>
                  </li>
                  <li>
                    <Link to="/about">About Us</Link>
                  </li>
                  <li>
                    <Link to="/Product">All Products</Link>
                  </li>
                  <li>
                    <Link to="/contact">Contact Us</Link>
                  </li>
                  <li>
                    <Link to="/profile/orders">My Orders</Link>
                  </li>
                </ul>
              </div>

              {/* Column 3: Categories */}
              <div className="col-6 col-md-4">
                <h6 className="spi-footer-heading">Categories</h6>
                <ul className="list-unstyled spi-footer-links mb-0">
                  <li>
                    <Link to="/Product">Arduino Boards</Link>
                  </li>
                  <li>
                    <Link to="/Product">Raspberry Pi</Link>
                  </li>
                  <li>
                    <Link to="/Product">ESP32 &amp; IoT</Link>
                  </li>
                  <li>
                    <Link to="/Product">Sensors &amp; Modules</Link>
                  </li>
                  <li>
                    <Link to="/Product">Motors &amp; Drivers</Link>
                  </li>
                </ul>
              </div>

              {/* Column 4: Help & Policies */}
              <div className="col-12 col-md-4">
                <h6 className="spi-footer-heading">Help &amp; Policies</h6>
                <ul className="list-unstyled spi-footer-links mb-0">
                  <li>
                    <Link to="/track-order">Track Order</Link>
                  </li>
                  <li>
                    <Link to="/returns">Return &amp; Refund Policy</Link>
                  </li>
                  <li>
                    <Link to="/support">Support Center</Link>
                  </li>
                  <li>
                    <Link to="/b2b">Bulk &amp; Institutional Orders</Link>
                  </li>
                  <li>
                    <Link
                      to="/admin/login"
                      className="d-inline-flex align-items-center gap-1"
                      style={{ color: "#ff8c5a" }}
                    >
                      <i className="bi bi-shield-lock"></i> Admin Portal
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="spi-footer-bottom mt-4 pt-3 border-top border-white border-opacity-10 d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
          <p className="mb-0 text-white-50 small text-center text-md-start">
            &copy; 2026 <strong className="text-white">SoftproInnovation</strong>. All rights reserved.
          </p>
          <div className="d-flex align-items-center gap-3 text-white-50 small flex-wrap justify-content-center">
            <span className="d-inline-flex align-items-center gap-1">
              <i className="bi bi-shield-check text-success"></i> 100% Secure Checkout
            </span>
            <span className="opacity-25">&bull;</span>
            <span className="d-inline-flex align-items-center gap-1">
              <i className="bi bi-truck text-info"></i> Fast Pan-India Dispatch
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
