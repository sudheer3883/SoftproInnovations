import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logoone.png";
import { useCart } from "../context/CartContext";

const Header = () => {
  const { cartCount } = useCart();
  const [profile, setProfile] = useState(null);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark",
  );
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [selectedAccountItem, setSelectedAccountItem] = useState(null);
  const profileMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";

  useEffect(() => {
    const loadProfile = () => {
      const storedProfile =
        localStorage.getItem("userProfile") ||
        sessionStorage.getItem("userProfile");

      if (!storedProfile) {
        setProfile(null);
        return;
      }

      try {
        setProfile(JSON.parse(storedProfile));
      } catch {
        setProfile(null);
      }
    };

    loadProfile();
    window.addEventListener("storage", loadProfile);
    return () => window.removeEventListener("storage", loadProfile);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark-theme", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    if (!isProfileMenuOpen) return;

    const closeOnOutsideClick = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsProfileMenuOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isProfileMenuOpen]);

  useEffect(() => {
    setIsProfileMenuOpen(false);
    setIsNavOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    ["userProfile", "name", "email", "mobile", "token", "role"].forEach(
      (key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      },
    );
    setProfile(null);
    setSelectedAccountItem(null);
    setIsProfileMenuOpen(false);
    navigate("/login");
  };

  const activeAccountItem = selectedAccountItem;

  return (
    <>
      <div
        className={`site-header container-fluid p-0 sticky-top shadow-sm ${darkMode ? "is-dark" : ""}`}
      >
        <nav
          className="navbar navbar-expand-lg navbar-dark site-header-navbar px-3 px-lg-4"
          style={{
            background: darkMode
              ? "linear-gradient(135deg, #0b1220 0%, #132649 32%, #16396d 100%)"
              : "#1e3a8a",
            minHeight: "56px",
          }}
        >
          <div className="container-fluid">
            <Link
              className="navbar-brand d-flex align-items-center text-white my-0"
              to="/"
            >
              <img
                src={logo}
                alt="SPI Logo"
                width="34"
                className="me-2"
                style={{
                  objectFit: "contain",
                  padding: "3px",
                  borderRadius: "6px",
                  backgroundColor: "#1e3a8a",
                  mixBlendMode: "screen",
                }}
              />
              Softpro<span>Innovation</span>
            </Link>
            {/* Mobile Quick Actions + Toggler */}
            <div className="d-flex align-items-center gap-2 d-lg-none">
              <button
                className={`header-theme-toggle p-1 px-2 ${darkMode ? "is-active" : ""}`}
                type="button"
                aria-pressed={darkMode}
                aria-label={darkMode ? "Light mode" : "Dark mode"}
                onClick={() => setDarkMode((current) => !current)}
                style={{ minHeight: "34px", borderRadius: "8px", fontSize: "13px" }}
              >
                <i className={`bi ${darkMode ? "bi-sun-fill" : "bi-moon-stars-fill"}`} />
              </button>

              <Link
                to="/cart"
                className="header-action header-cart d-flex align-items-center gap-1 position-relative text-decoration-none py-1 px-2.5"
                style={{ minHeight: "34px", borderRadius: "8px" }}
                aria-label="View Cart"
              >
                <i className="bi bi-cart3 fs-5"></i>
                {cartCount > 0 && (
                  <span className="badge rounded-pill bg-danger header-cart-count">
                    {cartCount}
                  </span>
                )}
              </Link>

              <button
                className={`navbar-toggler py-1 px-2 ${!isNavOpen ? "collapsed" : ""}`}
                type="button"
                onClick={() => setIsNavOpen((prev) => !prev)}
                aria-controls="navbarSupportedContent"
                aria-expanded={isNavOpen}
                aria-label="Toggle navigation"
              >
                <span className="navbar-toggler-icon"></span>
              </button>
            </div>

            <div
              className={`collapse navbar-collapse ${isNavOpen ? "show" : ""}`}
              id="navbarSupportedContent"
            >
              <ul className="navbar-nav site-header-nav mx-auto mb-0 gap-1 gap-lg-3 py-2 py-lg-0">
                <li className="nav-item">
                  <NavLink
                    to="/"
                    end
                    onClick={() => setIsNavOpen(false)}
                    className={({ isActive }) =>
                      `nav-link ${isActive ? "active" : ""}`
                    }
                  >
                    Home
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    to="/about"
                    onClick={() => setIsNavOpen(false)}
                    className={({ isActive }) =>
                      `nav-link ${isActive ? "active" : ""}`
                    }
                  >
                    About
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    to="/Product"
                    onClick={() => setIsNavOpen(false)}
                    className={({ isActive }) =>
                      `nav-link ${isActive ? "active" : ""}`
                    }
                  >
                    Products
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    to="/contact"
                    onClick={() => setIsNavOpen(false)}
                    className={({ isActive }) =>
                      `nav-link ${isActive ? "active" : ""}`
                    }
                  >
                    Contact Us
                  </NavLink>
                </li>
              </ul>
              <div className="site-header-actions d-flex flex-wrap gap-2 align-items-center mt-2 mt-lg-0 pb-3 pb-lg-0">
                <button
                  className={`header-theme-toggle d-none d-lg-flex ${darkMode ? "is-active" : ""}`}
                  type="button"
                  aria-pressed={darkMode}
                  aria-label={
                    darkMode ? "Switch to light mode" : "Switch to dark mode"
                  }
                  onClick={() => setDarkMode((current) => !current)}
                >
                  <i
                    className={`bi ${darkMode ? "bi-sun-fill" : "bi-moon-stars-fill"}`}
                    aria-hidden="true"
                  ></i>
                  <span>{darkMode ? "Light" : "Dark"}</span>
                </button>
                <Link
                  to="/cart"
                  className="d-none d-lg-flex header-action header-cart align-items-center gap-1 position-relative text-decoration-none"
                >
                  <i className="bi bi-cart3 fs-6"></i> Cart
                  {cartCount > 0 && (
                    <span className="badge rounded-pill bg-danger ms-1 header-cart-count">
                      {cartCount}
                    </span>
                  )}
                </Link>
                {profile && !isAuthPage && (
                  <Link
                    to="/profile/wishlist"
                    className="header-wishlist-link text-decoration-none"
                    aria-label="Open wishlist"
                    title="Wishlist"
                  >
                    <i className="bi bi-heart-fill" aria-hidden="true"></i>
                    <span>Wishlist</span>
                  </Link>
                )}
                {profile && !isAuthPage ? (
                  <div className="header-account" ref={profileMenuRef}>
                    <button
                      type="button"
                      className={`header-profile-link ${isProfileMenuOpen ? "is-open" : ""}`}
                      aria-expanded={isProfileMenuOpen}
                      aria-haspopup="menu"
                      onClick={() => setIsProfileMenuOpen((open) => !open)}
                    >
                      {profile.picture ? (
                        <img
                          src={profile.picture}
                          alt="Profile"
                          className="header-profile-avatar"
                        />
                      ) : (
                        <span className="header-profile-avatar header-profile-initials">
                          {(profile.name || "User")
                            .split(" ")
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                      )}
                      <span className="header-profile-name">Profile</span>
                      <i
                        className="bi bi-chevron-down header-profile-chevron"
                        aria-hidden="true"
                      ></i>
                    </button>

                    {isProfileMenuOpen && (
                      <div className="header-account-menu" role="menu">
                        <div className="header-account-menu-top">
                          <div className="header-account-icon-wrap">
                            <i
                              className="bi bi-person-circle header-account-icon"
                              aria-hidden="true"
                            ></i>
                          </div>
                          <div className="header-account-identity">
                            <div className="header-account-menu-title">
                              Your Account
                            </div>
                            <div className="header-account-subtitle">
                              {profile.name || "Customer"}
                            </div>
                          </div>
                          <span className="header-account-pill">Online</span>
                        </div>

                        <div className="header-account-menu-body">
                          <Link
                            className={`header-account-item ${
                              activeAccountItem === "profile" ? "is-active" : ""
                            }`}
                            to="/profile"
                            role="menuitem"
                            onClick={() => {
                              setSelectedAccountItem("profile");
                              setIsProfileMenuOpen(false);
                            }}
                          >
                            <i
                              className="bi bi-person-circle"
                              aria-hidden="true"
                            ></i>
                            My Profile
                          </Link>
                          <Link
                            className={`header-account-item ${
                              activeAccountItem === "orders" ? "is-active" : ""
                            }`}
                            to="/profile/orders"
                            role="menuitem"
                            onClick={() => {
                              setSelectedAccountItem("orders");
                              setIsProfileMenuOpen(false);
                            }}
                          >
                            <i
                              className="bi bi-box-seam"
                              aria-hidden="true"
                            ></i>
                            Orders
                          </Link>
                          <Link
                            className={`header-account-item ${
                              activeAccountItem === "addresses"
                                ? "is-active"
                                : ""
                            }`}
                            to="/profile/addresses"
                            role="menuitem"
                            onClick={() => {
                              setSelectedAccountItem("addresses");
                              setIsProfileMenuOpen(false);
                            }}
                          >
                            <i className="bi bi-geo-alt" aria-hidden="true"></i>
                            Saved Addresses
                          </Link>
                          <Link
                            className={`header-account-item header-account-wishlist ${
                              activeAccountItem === "wishlist"
                                ? "is-active"
                                : ""
                            }`}
                            to="/profile/wishlist"
                            role="menuitem"
                            onClick={() => {
                              setSelectedAccountItem("wishlist");
                              setIsProfileMenuOpen(false);
                            }}
                          >
                            <i className="bi bi-heart" aria-hidden="true"></i>
                            Wishlist
                          </Link>
                          <button
                            className={`header-account-item header-account-logout ${
                              activeAccountItem === "logout" ? "is-active" : ""
                            }`}
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setSelectedAccountItem("logout");
                              handleLogout();
                            }}
                          >
                            <i
                              className="bi bi-box-arrow-right"
                              aria-hidden="true"
                            ></i>
                            Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsNavOpen(false)}
                      className="header-action header-login text-decoration-none"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsNavOpen(false)}
                      className="header-action header-register text-decoration-none"
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
};

export default Header;
