import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import categoryCatalog from "../../data/categoryCatalog";
import { API_BASE_URL } from "../../config/api";

const CATEGORY_PRESETS = categoryCatalog.map(({ name, description }) => [
  name,
  description,
]);

const AddCategory = ({ isEditMode: propIsEditMode }) => {
  const { id } = useParams();
  const isEditMode = propIsEditMode || Boolean(id);
  const [formData, setFormData] = useState({
    category: "",
    image: "",
    description: "",
    status: "active",
  });

  const [loading, setLoading] = useState(false);
  const [fetchingExisting, setFetchingExisting] = useState(isEditMode);
  const [recentCategories, setRecentCategories] = useState([]);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });
  const [createdSuccess, setCreatedSuccess] = useState(false);

  // Fetch recent categories for preview / reference
  const fetchRecentCategories = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/category/show`);
      if (Array.isArray(res.data)) {
        setRecentCategories(res.data.slice(0, 5));

        // If edit mode and id present, find the current category
        if (id) {
          const found = res.data.find((c) => c._id === id);
          if (found) {
            setFormData({
              category: found.category || found.name || "",
              image: found.image || "",
              description: found.description || "",
              status: found.status || "active",
            });
          }
        }
      }
    } catch (err) {
      console.error("Failed to load recent categories", err);
    } finally {
      setFetchingExisting(false);
    }
  };

  useEffect(() => {
    fetchRecentCategories();
  }, [id]);

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      setAlert({ show: false, type: "", message: "" });
    }, 5000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePresetChange = (e) => {
    const preset = CATEGORY_PRESETS.find(([name]) => name === e.target.value);
    if (!preset) return;
    setFormData((prev) => ({
      ...prev,
      category: preset[0],
      description: preset[1],
    }));
  };

  const handleReset = () => {
    setFormData({
      category: "",
      image: "",
      description: "",
      status: "active",
    });
    setCreatedSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category.trim()) {
      showAlert("danger", "Please enter a category name.");
      return;
    }
    if (!formData.description.trim()) {
      showAlert("danger", "Please provide a category description.");
      return;
    }

    setLoading(true);
    setCreatedSuccess(false);

    try {
      if (isEditMode && id) {
        const res = await axios.put(
          `${API_BASE_URL}/api/category/update/${id}`,
          formData,
        );
        showAlert(
          "success",
          res.data.message || "Category updated successfully!",
        );
        setCreatedSuccess(true);
        fetchRecentCategories();
      } else {
        const res = await axios.post(
          `${API_BASE_URL}/api/category/register`,
          formData,
        );
        showAlert(
          "success",
          res.data.message || "Category registered successfully!",
        );
        setCreatedSuccess(true);
        fetchRecentCategories();
        // Reset form for next category
        setFormData({
          category: "",
          image: "",
          description: "",
          status: "active",
        });
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to save category. Please try again.";
      showAlert("danger", errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-category-page">
      {/* Top Header & Breadcrumbs */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1" style={{ fontSize: "13px" }}>
              <li className="breadcrumb-item">
                <Link
                  to="/dashboard"
                  className="text-decoration-none text-muted"
                >
                  <i className="bi bi-house-door me-1"></i> Dashboard
                </Link>
              </li>
              <li className="breadcrumb-item">
                <Link
                  to="/dashboard/categories"
                  className="text-decoration-none text-muted"
                >
                  Categories
                </Link>
              </li>
              <li
                className="breadcrumb-item active fw-semibold text-primary"
                aria-current="page"
              >
                {isEditMode ? "Edit Category" : "Add Category"}
              </li>
            </ol>
          </nav>
          <h1 className="dashboard-header-title mb-1">
            {isEditMode ? "Edit" : "Add New"} <span>Category</span>
          </h1>
          <p className="text-muted mb-0" style={{ fontSize: "14.5px" }}>
            {isEditMode
              ? "Update the category details and publishing status"
              : "Create a new product category with rich details and instant preview"}
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Link
            to="/dashboard/categories"
            className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 px-3 py-2"
            style={{ borderRadius: "10px", fontWeight: "500" }}
          >
            <i className="bi bi-arrow-left"></i> Back to Categories
          </Link>
        </div>
      </div>

      {/* Alert Notification */}
      {alert.show && (
        <div
          className={`alert alert-${alert.type} alert-dismissible fade show shadow-sm border-0 mb-4`}
          role="alert"
          style={{ borderRadius: "12px" }}
        >
          <div className="d-flex align-items-center">
            <i
              className={`bi ${alert.type === "success" ? "bi-check-circle-fill text-success fs-5" : "bi-exclamation-triangle-fill text-danger fs-5"} me-3`}
            ></i>
            <div className="flex-grow-1">
              <strong>
                {alert.type === "success" ? "Success!" : "Notice:"}
              </strong>{" "}
              {alert.message}
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={() => setAlert({ show: false, type: "", message: "" })}
            ></button>
          </div>
        </div>
      )}

      {/* Success banner with quick navigation */}
      {createdSuccess && (
        <div
          className="card border-0 mb-4 shadow-sm"
          style={{
            backgroundColor: "#ecfdf5",
            borderRadius: "14px",
            borderLeft: "5px solid #10b981",
          }}
        >
          <div className="card-body p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-patch-check-fill text-success fs-4"></i>
              <div>
                <h6 className="mb-0 fw-bold text-success">
                  Category successfully registered!
                </h6>
                <small className="text-muted">
                  You can add another category below or view all categories in
                  the list.
                </small>
              </div>
            </div>
            <div className="d-flex gap-2">
              <Link
                to="/dashboard/categories"
                className="btn btn-sm btn-success px-3"
                style={{ borderRadius: "8px" }}
              >
                <i className="bi bi-list-ul me-1"></i> View All Categories
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Category Form */}
      <div className="row justify-content-center">
        <div className="col-12 col-xl-9">
          <div
            className="dashboard-section p-4"
            style={{ borderRadius: "18px" }}
          >
            <div className="d-flex align-items-center justify-content-between pb-3 mb-4 border-bottom">
              <div className="d-flex align-items-center gap-2">
                <div
                  className="d-inline-flex p-2 rounded-3 text-white"
                  style={{ backgroundColor: "#3945E0" }}
                >
                  <i className="bi bi-tag-fill fs-5"></i>
                </div>
                <div>
                  <h5 className="fw-bold mb-0 text-dark">
                    Category Information
                  </h5>
                  <small className="text-muted">
                    Enter essential details about the product classification
                  </small>
                </div>
              </div>
              <span
                className="badge bg-light text-secondary border px-2.5 py-1.5"
                style={{ fontSize: "11.5px" }}
              >
                <i className="bi bi-asterisk text-danger me-1"></i> Required
                fields
              </span>
            </div>

            {fetchingExisting ? (
              <div className="text-center py-5">
                <div
                  className="spinner-border text-primary"
                  role="status"
                ></div>
                <p className="mt-2 text-muted">Loading category details...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label
                    htmlFor="categoryPreset"
                    className="form-label fw-semibold text-dark"
                  >
                    Choose From Electronics Categories
                  </label>
                  <select
                    id="categoryPreset"
                    className="form-select"
                    defaultValue=""
                    onChange={handlePresetChange}
                    disabled={loading}
                  >
                    <option value="">
                      Select a suggested category (optional)
                    </option>
                    {CATEGORY_PRESETS.map(([name]) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <div
                    className="form-text mt-1 text-muted"
                    style={{ fontSize: "12.5px" }}
                  >
                    Selecting a category fills its name and details. You can
                    still edit them before saving.
                  </div>
                </div>

                {/* Category Name */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-1.5">
                    <label
                      htmlFor="categoryName"
                      className="form-label fw-semibold text-dark mb-0"
                    >
                      Category Name <span className="text-danger">*</span>
                    </label>
                    <span className="text-muted" style={{ fontSize: "12px" }}>
                      {formData.category.length}/60 chars
                    </span>
                  </div>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <i className="bi bi-tags"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 ps-0"
                      id="categoryName"
                      name="category"
                      placeholder="e.g. Microcontrollers, Sensors, Robotics Kits"
                      value={formData.category}
                      onChange={handleChange}
                      maxLength={60}
                      required
                      disabled={loading}
                      style={{ fontSize: "15px", height: "48px" }}
                    />
                  </div>
                  <div
                    className="form-text mt-1 text-muted"
                    style={{ fontSize: "12.5px" }}
                  >
                    Choose a clear and descriptive name for this category.
                  </div>
                </div>

                {/* Category Image */}
                <div className="mb-4">
                  <label
                    htmlFor="categoryImage"
                    className="form-label fw-semibold text-dark"
                  >
                    Category Image <span className="text-danger">*</span>
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    id="categoryImage"
                    name="image"
                    accept="image/png,image/jpeg,image/webp"
                    required={!isEditMode && !formData.image}
                    disabled={loading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) {
                        showAlert(
                          "danger",
                          "Category image must be smaller than 5MB.",
                        );
                        e.target.value = "";
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () =>
                        setFormData((prev) => ({
                          ...prev,
                          image: reader.result,
                        }));
                      reader.readAsDataURL(file);
                    }}
                  />
                  {formData.image && (
                    <img
                      src={formData.image}
                      alt="Category preview"
                      className="mt-3 rounded-3 border"
                      style={{
                        width: "96px",
                        height: "72px",
                        objectFit: "cover",
                      }}
                    />
                  )}
                </div>

                {/* Description */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-1.5">
                    <label
                      htmlFor="categoryDesc"
                      className="form-label fw-semibold text-dark mb-0"
                    >
                      Description <span className="text-danger">*</span>
                    </label>
                    <span className="text-muted" style={{ fontSize: "12px" }}>
                      {formData.description.length}/300 chars
                    </span>
                  </div>
                  <div className="position-relative">
                    <textarea
                      className="form-control"
                      id="categoryDesc"
                      name="description"
                      rows="4"
                      placeholder="Write a clear and comprehensive description explaining what products belong to this category..."
                      value={formData.description}
                      onChange={handleChange}
                      maxLength={300}
                      required
                      disabled={loading}
                      style={{ fontSize: "14.5px", resize: "vertical" }}
                    ></textarea>
                  </div>
                  <div
                    className="form-text mt-1 text-muted"
                    style={{ fontSize: "12.5px" }}
                  >
                    Describe the purpose, specifications, or scope of products
                    under this category.
                  </div>
                </div>

                {/* Status Selection */}
                <div className="mb-4">
                  <label className="form-label fw-semibold text-dark mb-2">
                    Visibility & Status
                  </label>
                  <div className="row g-2">
                    <div className="col-6">
                      <div
                        className={`p-3 border rounded-3 text-center cursor-pointer transition-all ${
                          formData.status === "active"
                            ? "border-success bg-success bg-opacity-10 text-success"
                            : "border-light bg-light text-muted"
                        }`}
                        style={{ cursor: "pointer", transition: "0.2s ease" }}
                        onClick={() =>
                          !loading &&
                          setFormData((prev) => ({ ...prev, status: "active" }))
                        }
                      >
                        <i className="bi bi-check-circle-fill fs-4 d-block mb-1"></i>
                        <strong
                          className="d-block"
                          style={{ fontSize: "14px" }}
                        >
                          Active
                        </strong>
                        <span
                          style={{ fontSize: "12px" }}
                          className="text-muted"
                        >
                          Visible in store and product filters
                        </span>
                      </div>
                    </div>
                    <div className="col-6">
                      <div
                        className={`p-3 border rounded-3 text-center cursor-pointer transition-all ${
                          formData.status === "inactive"
                            ? "border-secondary bg-secondary bg-opacity-10 text-dark"
                            : "border-light bg-light text-muted"
                        }`}
                        style={{ cursor: "pointer", transition: "0.2s ease" }}
                        onClick={() =>
                          !loading &&
                          setFormData((prev) => ({
                            ...prev,
                            status: "inactive",
                          }))
                        }
                      >
                        <i className="bi bi-dash-circle-fill fs-4 d-block mb-1 text-secondary"></i>
                        <strong
                          className="d-block"
                          style={{ fontSize: "14px" }}
                        >
                          Inactive
                        </strong>
                        <span
                          style={{ fontSize: "12px" }}
                          className="text-muted"
                        >
                          Hidden from store catalog
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="d-flex align-items-center gap-3 pt-3 border-top flex-wrap">
                  <button
                    type="submit"
                    className="btn btn-primary d-inline-flex align-items-center justify-content-center gap-2 px-4 py-2.5"
                    style={{
                      backgroundColor: "#3945E0",
                      border: "none",
                      borderRadius: "10px",
                      fontWeight: "600",
                      minWidth: "180px",
                    }}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        <span>Saving Category...</span>
                      </>
                    ) : (
                      <>
                        <i
                          className={`bi ${isEditMode ? "bi-check2-circle" : "bi-plus-circle-fill"}`}
                        ></i>
                        <span>
                          {isEditMode
                            ? "Update Category"
                            : "Save & Publish Category"}
                        </span>
                      </>
                    )}
                  </button>

                  {!isEditMode && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary px-3 py-2.5"
                      style={{ borderRadius: "10px" }}
                      onClick={handleReset}
                      disabled={loading}
                    >
                      <i className="bi bi-arrow-counterclockwise me-1"></i>{" "}
                      Reset
                    </button>
                  )}

                  <Link
                    to="/dashboard/categories"
                    className="btn btn-link text-muted text-decoration-none ms-auto"
                    style={{ fontSize: "14px" }}
                  >
                    Cancel
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCategory;
