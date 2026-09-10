import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import categoryCatalog from "../../data/categoryCatalog";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [alert, setAlert] = useState({
    show: false,
    type: "",
    message: "",
  });

  // =========================
  // Fetch Categories
  // =========================
  const fetchCategories = async () => {
    try {
      setLoading(true);

      const res = await axios.get("http://localhost:5000/api/category/show");

      const savedCategories = Array.isArray(res.data) ? res.data : [];
      const savedNames = new Set(
        savedCategories.map((category) =>
          (category.name || category.category || "").trim().toLowerCase(),
        ),
      );
      const missingCategories = categoryCatalog.filter(
        (category) => !savedNames.has(category.name.toLowerCase()),
      );

      if (missingCategories.length > 0) {
        await Promise.all(
          missingCategories.map((category) =>
            axios.post("http://localhost:5000/api/category/register", {
              category: category.name,
              image: category.image,
              description: category.description,
              status: "active",
            }),
          ),
        );

        const updatedResponse = await axios.get(
          "http://localhost:5000/api/category/show",
        );
        setCategories(
          Array.isArray(updatedResponse.data) ? updatedResponse.data : [],
        );
      } else {
        setCategories(savedCategories);
      }
    } catch (error) {
      console.error(error);

      showAlert("danger", "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // =========================
  // Alert
  // =========================
  const showAlert = (type, message) => {
    setAlert({
      show: true,
      type,
      message,
    });

    setTimeout(() => {
      setAlert({
        show: false,
        type: "",
        message: "",
      });
    }, 4000);
  };

  // =========================
  // Delete
  // =========================
  const handleDelete = async (id, name) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${name}"?`,
    );

    if (!confirmDelete) return;

    try {
      const res = await axios.delete(
        `http://localhost:5000/api/category/delete/${id}`,
      );

      showAlert(
        "success",
        res.data.message || "Category deleted successfully.",
      );

      fetchCategories();
    } catch (error) {
      console.error(error);

      showAlert(
        "danger",
        error.response?.data?.message || "Failed to delete category.",
      );
    }
  };

  // =========================
  // Date
  // =========================
  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // =========================
  // Filter
  // =========================
  const filteredCategories = categories.filter((cat) => {
    const name = (cat.category || cat.name || "").toLowerCase();

    const description = (cat.description || "").toLowerCase();

    const search = searchTerm.toLowerCase();

    const searchMatch = name.includes(search) || description.includes(search);

    const statusMatch =
      filterStatus === "all"
        ? true
        : (cat.status || "active").toLowerCase() === filterStatus;

    return searchMatch && statusMatch;
  });

  // =========================
  // Counts
  // =========================
  const totalCategories = categories.length;

  const activeCategories = categories.filter(
    (cat) => (cat.status || "active").toLowerCase() === "active",
  ).length;

  const inactiveCategories = totalCategories - activeCategories;

  return (
    <div className="categories-page">
      {/* =========================
          Header
      ========================= */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <div className="text-muted mb-2" style={{ fontSize: "14px" }}>
            <i className="bi bi-house-door me-1"></i>
            Dashboard
            <span className="mx-2">/</span>
            Categories
          </div>

          <h1
            className="fw-bold mb-1"
            style={{
              fontSize: "30px",
              color: "#172033",
            }}
          >
            Product{" "}
            <span
              style={{
                color: "#3945E0",
              }}
            >
              Categories
            </span>
          </h1>

          <p
            className="text-muted mb-0"
            style={{
              fontSize: "14px",
            }}
          >
            Manage your product categories
          </p>
        </div>

        {/* =========================
            ADD CATEGORY BUTTON
        ========================= */}
        <Link
          to="/dashboard/categories/add"
          className="btn d-inline-flex align-items-center gap-2"
          style={{
            backgroundColor: "#3945E0",
            color: "#fff",
            borderRadius: "10px",
            padding: "11px 18px",
            fontWeight: "600",
            border: "none",
            boxShadow: "0 4px 12px rgba(57,69,224,0.20)",
          }}
        >
          <i className="bi bi-plus-lg"></i>
          Add Category
        </Link>
      </div>

      {/* =========================
          Alert
      ========================= */}
      {alert.show && (
        <div
          className={`alert alert-${alert.type} alert-dismissible fade show`}
          role="alert"
          style={{
            borderRadius: "10px",
          }}
        >
          {alert.message}

          <button
            type="button"
            className="btn-close"
            onClick={() =>
              setAlert({
                show: false,
                type: "",
                message: "",
              })
            }
          ></button>
        </div>
      )}

      {/* =========================
          Stats
      ========================= */}
      <div className="row g-3 mb-4">
        {/* Total */}
        <div className="col-12 col-md-4">
          <div
            className="card border-0 shadow-sm"
            style={{
              borderRadius: "14px",
            }}
          >
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <small
                    className="text-muted"
                    style={{
                      fontSize: "12px",
                    }}
                  >
                    TOTAL CATEGORIES
                  </small>

                  <h3 className="fw-bold mb-0 mt-1">{totalCategories}</h3>
                </div>

                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    backgroundColor: "#eef2ff",
                    color: "#3945E0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                  }}
                >
                  <i className="bi bi-tags-fill"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active */}
        <div className="col-12 col-md-4">
          <div
            className="card border-0 shadow-sm"
            style={{
              borderRadius: "14px",
            }}
          >
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <small
                    className="text-muted"
                    style={{
                      fontSize: "12px",
                    }}
                  >
                    ACTIVE
                  </small>

                  <h3 className="fw-bold mb-0 mt-1 text-success">
                    {activeCategories}
                  </h3>
                </div>

                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    backgroundColor: "#ecfdf5",
                    color: "#10b981",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                  }}
                >
                  <i className="bi bi-check-circle-fill"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Inactive */}
        <div className="col-12 col-md-4">
          <div
            className="card border-0 shadow-sm"
            style={{
              borderRadius: "14px",
            }}
          >
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <small
                    className="text-muted"
                    style={{
                      fontSize: "12px",
                    }}
                  >
                    INACTIVE
                  </small>

                  <h3 className="fw-bold mb-0 mt-1 text-secondary">
                    {inactiveCategories}
                  </h3>
                </div>

                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    backgroundColor: "#f1f5f9",
                    color: "#64748b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                  }}
                >
                  <i className="bi bi-dash-circle-fill"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================
          Category Table
      ========================= */}
      <div
        className="card border-0 shadow-sm"
        style={{
          borderRadius: "16px",
        }}
      >
        <div className="card-body p-4">
          {/* Search / Filter */}
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
            <div
              className="input-group"
              style={{
                maxWidth: "350px",
              }}
            >
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-search"></i>
              </span>

              <input
                type="text"
                className="form-control bg-light border-start-0"
                placeholder="Search category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="form-select"
              style={{
                maxWidth: "150px",
                borderRadius: "8px",
              }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>

              <option value="active">Active</option>

              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Table */}
          <div className="table-responsive">
            <table className="table table-hover align-middle categories-table">
              <colgroup>
                <col className="category-number-column" />
                <col className="category-name-column" />
                <col className="category-description-column" />
                <col className="category-status-column" />
                <col className="category-created-column" />
                <col className="category-action-column" />
              </colgroup>
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <div
                        className="spinner-border text-primary"
                        role="status"
                      ></div>

                      <div className="mt-2 text-muted">
                        Loading categories...
                      </div>
                    </td>
                  </tr>
                ) : filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <i
                        className="bi bi-folder-x"
                        style={{
                          fontSize: "40px",
                          color: "#94a3b8",
                        }}
                      ></i>

                      <p className="text-muted mt-2 mb-3">
                        No categories found.
                      </p>

                      {/* Add Category Again */}
                      <Link
                        to="/dashboard/categories/add"
                        className="btn btn-sm"
                        style={{
                          backgroundColor: "#3945E0",
                          color: "#fff",
                          borderRadius: "8px",
                        }}
                      >
                        <i className="bi bi-plus-lg me-1"></i>
                        Add Category
                      </Link>
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((cat, index) => {
                    const name = cat.category || cat.name || "Unnamed";

                    const isActive =
                      (cat.status || "active").toLowerCase() === "active";

                    return (
                      <tr key={cat._id || index}>
                        <td className="category-name-cell">{index + 1}</td>

                        <td className="category-description-cell">
                          <div className="d-flex align-items-center gap-2">
                            {cat.image ? (
                              <img
                                src={cat.image}
                                alt={`${name} category`}
                                style={{
                                  width: "38px",
                                  height: "38px",
                                  borderRadius: "8px",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: "38px",
                                  height: "38px",
                                  borderRadius: "8px",
                                  backgroundColor: "#eef2ff",
                                  color: "#3945E0",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <i className="bi bi-tag-fill"></i>
                              </div>
                            )}

                            <div>
                              <div
                                className="fw-semibold"
                                style={{
                                  fontSize: "14px",
                                }}
                              >
                                {name}
                              </div>

                              <small className="text-muted">
                                ID: {cat._id ? cat._id.slice(-6) : "N/A"}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span
                            className="text-muted"
                            style={{
                              fontSize: "13px",
                            }}
                          >
                            {cat.description || "—"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`badge rounded-pill ${
                              isActive ? "bg-success" : "bg-secondary"
                            }`}
                          >
                            {isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td>
                          <small className="text-muted">
                            {formatDate(cat.timestamps || cat.createdAt)}
                          </small>
                        </td>

                        <td className="text-end category-actions-cell">
                          <Link
                            to={`/dashboard/categories/edit/${cat._id}`}
                            className="btn btn-sm btn-outline-secondary me-1"
                            title="Edit"
                          >
                            <i className="bi bi-pencil"></i>
                          </Link>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            title="Delete"
                            onClick={() => handleDelete(cat._id, name)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* =========================
          CSS
      ========================= */}
      <style>
        {`
          .categories-page {
            width: 100%;
            padding-bottom: 30px;
          }

          .categories-page .form-control:focus,
          .categories-page .form-select:focus {
            border-color: #3945E0;
            box-shadow: 0 0 0 0.15rem rgba(57, 69, 224, 0.10);
          }

          .categories-page .table-responsive {
            overflow-x: auto;
          }

          .categories-table {
            width: 100%;
            min-width: 960px;
            table-layout: fixed;
            margin-bottom: 0;
          }

          .categories-table th,
          .categories-table td {
            vertical-align: middle;
          }

          .categories-table .category-number-column {
            width: 52px;
          }

          .categories-table .category-name-column {
            width: 250px;
          }

          .categories-table .category-description-column {
            width: auto;
          }

          .categories-table .category-status-column {
            width: 92px;
          }

          .categories-table .category-created-column {
            width: 110px;
          }

          .categories-table .category-action-column {
            width: 112px;
          }

          .categories-table .category-description-cell {
            white-space: normal;
            overflow-wrap: anywhere;
            line-height: 1.5;
          }

          .categories-table .category-actions-cell {
            width: 112px;
            min-width: 112px;
            white-space: nowrap;
          }

          .categories-table .category-actions-cell .btn {
            width: 36px;
            height: 36px;
            padding: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-right: 4px;
          }

          .categories-table .category-actions-cell .btn:last-child {
            margin-right: 0;
          }

          @media (max-width: 768px) {
            .categories-page {
              padding: 10px;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Categories;
