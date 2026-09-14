import { useEffect, useState } from "react";
import axios from "axios";
import {
  NavLink,
  Outlet,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import adminPhoto from "../../assets/photo.jpeg";
import "./Dashboard.css";

const getAdminStorageValue = (key) =>
  localStorage.getItem(key) || sessionStorage.getItem(key);

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showAdminPhoto, setShowAdminPhoto] = useState(true);
  const [loginNotice, setLoginNotice] = useState("");
  const [adminProfile, setAdminProfile] = useState({
    name: getAdminStorageValue("adminName") || "Administrator",
    email: getAdminStorageValue("adminEmail") || "admin@softpro.com",
  });
  const adminId = getAdminStorageValue("adminId");
  const adminName = adminProfile.name;
  const adminEmail = adminProfile.email;
  const adminInitials = adminName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    if (!adminId) return;

    axios
      .get(`http://localhost:5000/api/admin/show/${adminId}`)
      .then(({ data }) => {
        if (!data?.name || !data?.email) return;
        setAdminProfile({ name: data.name, email: data.email });
        const storage = localStorage.getItem("adminId")
          ? localStorage
          : sessionStorage;
        storage.setItem("adminName", data.name);
        storage.setItem("adminEmail", data.email);
      })
      .catch(() => {});
  }, [adminId]);

  useEffect(() => {
    if (!location.state?.loginSuccess) return;

    setLoginNotice(`Welcome back, ${adminName}! Login successful.`);
    navigate(location.pathname, { replace: true, state: {} });
    const timer = window.setTimeout(() => setLoginNotice(""), 4500);
    return () => window.clearTimeout(timer);
  }, [adminName, location.pathname, location.state, navigate]);

  const handleLogout = () => {
    [
      "adminName",
      "adminEmail",
      "name",
      "email",
      "role",
      "token",
      "adminId",
    ].forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  };

  return (
    <div className="dashboard-container">
      {loginNotice && (
        <div className="admin-login-success" role="status">
          <i className="bi bi-check-circle-fill" aria-hidden="true"></i>
          <span>{loginNotice}</span>
          <button
            type="button"
            onClick={() => setLoginNotice("")}
            aria-label="Dismiss notification"
          >
            <i className="bi bi-x" aria-hidden="true"></i>
          </button>
        </div>
      )}
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-profile text-center">
          <div className="avatar-circle mx-auto">
            {showAdminPhoto ? (
              <img
                src={adminPhoto}
                alt={`${adminName} profile`}
                onError={() => setShowAdminPhoto(false)}
              />
            ) : (
              adminInitials
            )}
          </div>
          <h6 className="mb-1 fw-bold">{adminName}</h6>
          <p className="text-white-50 mb-2" style={{ fontSize: "13px" }}>
            {adminEmail}
          </p>
          <span className="admin-badge">ADMIN</span>
        </div>

        <div className="sidebar-nav-title text-uppercase">Admin Controls</div>

        <ul className="sidebar-nav">
          <li>
            <NavLink
              to="/dashboard"
              end
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <i className="bi bi-grid"></i> Overview
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/dashboard/categories"
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <i className="bi bi-tags"></i> Categories
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/dashboard/products"
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <i className="bi bi-box"></i> Products
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/dashboard/orders"
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <i className="bi bi-cart"></i> Orders
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/dashboard/users"
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <i className="bi bi-people"></i> Users List
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/dashboard/inventory"
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <i className="bi bi-list-check"></i> Inventory
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/dashboard/complaints"
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <i className="bi bi-chat-left-text"></i> Complaints
            </NavLink>
          </li>
        </ul>

        <div className="sidebar-footer border-top border-secondary border-opacity-25">
          <Link
            to="/admin/login"
            className="logout-link"
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right"></i> Logout
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
