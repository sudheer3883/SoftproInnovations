import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(`${API_BASE_URL}/api/user/show`);
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (loadError) {
      console.error("Failed to fetch users", loadError);
      setError(loadError.response?.data?.msg || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete user "${user.name}"?`)) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/user/delete/${user._id}`);
      setUsers((currentUsers) =>
        currentUsers.filter((currentUser) => currentUser._id !== user._id),
      );
      setError("");
      setSuccessMessage(`${user.name} deleted successfully.`);
    } catch (deleteError) {
      setError(deleteError.response?.data?.msg || "Failed to delete user.");
    }
  };

  const handleEditChange = (event) => {
    setEditingUser((currentUser) => ({
      ...currentUser,
      [event.target.name]: event.target.value,
    }));
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/user/updated/${editingUser._id}`,
        {
          name: editingUser.name,
          email: editingUser.email,
          mobile: editingUser.mobile,
          status: editingUser.status,
        },
      );
      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user._id === editingUser._id ? response.data.user : user,
        ),
      );
      setEditingUser(null);
      setSuccessMessage("User details updated successfully.");
    } catch (saveError) {
      setError(saveError.response?.data?.msg || "Failed to update user.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddUserChange = (event) => {
    setNewUser((currentUser) => ({
      ...currentUser,
      [event.target.name]: event.target.value,
    }));
  };

  const handleAddUserSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      const response = await axios.post(`${API_BASE_URL}/api/user/register`, {
        ...newUser,
      });
      if (response.data.msg !== "User Registered") {
        throw new Error(response.data.msg || "Unable to add user.");
      }
      setShowAddUser(false);
      setNewUser({ name: "", email: "", mobile: "", password: "" });
      setSuccessMessage("User added successfully. Welcome email sent.");
      await loadUsers();
    } catch (saveError) {
      setError(
        saveError.response?.data?.msg ||
          saveError.message ||
          "Failed to add user.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = [user.name, user.email, user.mobile].some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(search),
    );
    const matchesStatus =
      statusFilter === "all" || (user.status || "active") === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const activeUsers = users.filter(
    (user) => (user.status || "active") === "active",
  ).length;
  const inactiveUsers = users.length - activeUsers;

  return (
    <>
      <div className="users-page-header d-flex justify-content-between align-items-center mb-4">
        <h1 className="dashboard-header-title mb-0">
          User <span>Management</span>
        </h1>
        <button
          type="button"
          className="users-add-button"
          onClick={() => setShowAddUser(true)}
        >
          <i className="bi bi-person-plus-fill me-1"></i> Add New User
        </button>
      </div>

      {successMessage && (
        <div className="users-feedback users-feedback-success" role="status">
          <i className="bi bi-check-circle-fill" />{" "}
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            aria-label="Dismiss success"
          >
            <i className="bi bi-x" />
          </button>
        </div>
      )}
      {error && (
        <div className="users-feedback users-feedback-error" role="alert">
          <i className="bi bi-exclamation-circle-fill" /> <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <i className="bi bi-x" />
          </button>
        </div>
      )}

      <div className="users-stat-grid">
        <div className="users-stat-card users-stat-total">
          <span>
            <i className="bi bi-people-fill" />
          </span>
          <div>
            <small>Total users</small>
            <strong>{users.length}</strong>
          </div>
        </div>
        <div className="users-stat-card users-stat-active">
          <span>
            <i className="bi bi-person-check-fill" />
          </span>
          <div>
            <small>Active users</small>
            <strong>{activeUsers}</strong>
          </div>
        </div>
        <div className="users-stat-card users-stat-inactive">
          <span>
            <i className="bi bi-person-dash-fill" />
          </span>
          <div>
            <small>Inactive users</small>
            <strong>{inactiveUsers}</strong>
          </div>
        </div>
      </div>

      <div className="dashboard-section users-panel p-4">
        <div className="users-toolbar">
          <div>
            <h2>
              Customer directory <span>{filteredUsers.length}</span>
            </h2>
            <p>Manage registered customers and account access.</p>
          </div>
          <div className="users-toolbar-controls">
            <label className="users-search">
              <i className="bi bi-search" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search users..."
              />
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button
              type="button"
              className="users-refresh-button"
              onClick={loadUsers}
              title="Refresh users"
            >
              <i className="bi bi-arrow-clockwise" />
            </button>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle users-table">
            <thead className="table-light">
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    No users found in the database.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr key={user._id || index}>
                    <td>
                      <strong>{user.name}</strong>
                    </td>
                    <td>{user.email}</td>
                    <td>{user.mobile || "N/A"}</td>
                    <td>
                      <span
                        className={`badge ${user.status === "active" ? "bg-success" : "bg-secondary"}`}
                      >
                        {user.status
                          ? user.status.charAt(0).toUpperCase() +
                            user.status.slice(1)
                          : "Unknown"}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary me-2"
                        onClick={() => setEditingUser({ ...user })}
                        title={`Edit ${user.name}`}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(user)}
                        title={`Delete ${user.name}`}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddUser && (
        <div
          className="modal d-block users-modal-backdrop"
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <form
              className="modal-content users-modal"
              onSubmit={handleAddUserSubmit}
            >
              <div className="modal-header">
                <div>
                  <span className="users-modal-kicker">Customer access</span>
                  <h5 className="modal-title">Add New User</h5>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddUser(false)}
                  aria-label="Close"
                />
              </div>
              <div className="modal-body">
                <label className="users-form-label">
                  Full name
                  <input
                    name="name"
                    value={newUser.name}
                    onChange={handleAddUserChange}
                    required
                    placeholder="Customer name"
                  />
                </label>
                <label className="users-form-label">
                  Email address
                  <input
                    type="email"
                    name="email"
                    value={newUser.email}
                    onChange={handleAddUserChange}
                    required
                    placeholder="customer@example.com"
                  />
                </label>
                <label className="users-form-label">
                  Mobile number
                  <input
                    name="mobile"
                    value={newUser.mobile}
                    onChange={handleAddUserChange}
                    required
                    placeholder="9876543210"
                  />
                </label>
                <label className="users-form-label">
                  Temporary password
                  <input
                    type="password"
                    name="password"
                    value={newUser.password}
                    onChange={handleAddUserChange}
                    minLength="4"
                    required
                    placeholder="Minimum 4 characters"
                  />
                </label>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="users-secondary-button"
                  onClick={() => setShowAddUser(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="users-primary-button"
                  disabled={isSaving}
                >
                  {isSaving ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingUser && (
        <div
          className="modal d-block"
          role="dialog"
          aria-modal="true"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.55)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <form
              className="modal-content border-0 shadow"
              onSubmit={handleEditSubmit}
            >
              <div className="modal-header">
                <h5 className="modal-title">Edit User</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setEditingUser(null)}
                  aria-label="Close"
                />
              </div>
              <div className="modal-body">
                <label className="form-label">
                  Name
                  <input
                    className="form-control mt-1"
                    name="name"
                    value={editingUser.name || ""}
                    onChange={handleEditChange}
                    required
                  />
                </label>
                <label className="form-label mt-3">
                  Email
                  <input
                    className="form-control mt-1"
                    type="email"
                    name="email"
                    value={editingUser.email || ""}
                    onChange={handleEditChange}
                    required
                  />
                </label>
                <label className="form-label mt-3">
                  Mobile
                  <input
                    className="form-control mt-1"
                    name="mobile"
                    value={editingUser.mobile || ""}
                    onChange={handleEditChange}
                  />
                </label>
                <label className="form-label mt-3">
                  Status
                  <select
                    className="form-select mt-1"
                    name="status"
                    value={editingUser.status || "active"}
                    onChange={handleEditChange}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="delete">Delete</option>
                  </select>
                </label>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default UsersList;
