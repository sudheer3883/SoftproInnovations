import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import logo from "../assets/logoone.png";
import { useCart } from "../context/CartContext";

const Header = () => {
  const { cartCount } = useCart();
  const [profile, setProfile] = useState(null);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark",
  );
  const location = useLocation();
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

  return (
    <>
      <div className="site-header container-fluid p-0 sticky-top shadow-sm">
        <nav
          className="navbar navbar-expand-lg navbar-dark py-1.5 px-3 px-lg-4"
          style={{ backgroundColor: "#1e3a8a", minHeight: "56px" }}
        >
          <div className="container-fluid">
            <Link
              className="navbar-brand d-flex align-items-center fs-5 fw-bold text-white my-0"
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
            <button
              className="navbar-toggler py-1 px-2"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarSupportedContent"
              aria-controls="navbarSupportedContent"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            <div
              className="collapse navbar-collapse"
              id="navbarSupportedContent"
            >
              <ul className="navbar-nav mx-auto mb-0 gap-1 gap-lg-3 fw-medium">
                <li className="nav-item">
                  <NavLink
                    to="/"
                    end
                    className={({ isActive }) =>
                      `nav-link py-1 ${isActive ? "active" : ""}`
                    }
                  >
                    Home
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    to="/about"
                    className={({ isActive }) =>
                      `nav-link py-1 ${isActive ? "active" : ""}`
                    }
                  >
                    About
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    to="/Product"
                    className={({ isActive }) =>
                      `nav-link py-1 ${isActive ? "active" : ""}`
                    }
                  >
                    Products
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    to="/contact"
                    className={({ isActive }) =>
                      `nav-link py-1 ${isActive ? "active" : ""}`
                    }
                  >
                    Contact Us
                  </NavLink>
                </li>
              </ul>
              <div className="d-flex gap-2 align-items-center mt-2 mt-lg-0">
                <button
                  className={`header-theme-toggle ${darkMode ? "is-active" : ""}`}
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
                  className="btn btn-outline-orangered btn-sm d-flex align-items-center gap-1.5 py-1 px-3 position-relative text-decoration-none"
                  style={{ fontSize: "13px" }}
                >
                  <i className="bi bi-cart3 fs-6"></i> Cart
                  {cartCount > 0 && (
                    <span
                      className="badge rounded-pill bg-danger ms-1"
                      style={{ fontSize: "11px", padding: "3px 6px" }}
                    >
                      {cartCount}
                    </span>
                  )}
                </Link>
                {profile && !isAuthPage ? (
                  <Link
                    to="/profile"
                    className="header-profile-link"
                    title="Open my profile"
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
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="btn btn-outline-orangered btn-sm px-3 py-1 text-decoration-none"
                      style={{ fontSize: "13px" }}
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="btn btn-orangered btn-sm px-3 py-1 text-decoration-none"
                      style={{ fontSize: "13px" }}
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
