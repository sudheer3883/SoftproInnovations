import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/user/show`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setUsers(data);
        } else {
          setUsers([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch users", err);
        setError("Failed to load users.");
        setLoading(false);
      });
  }, []);

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete user "${user.name}"?`)) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/user/delete/${user._id}`);
      setUsers((currentUsers) =>
        currentUsers.filter((currentUser) => currentUser._id !== user._id),
      );
      setError("");
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
    } catch (saveError) {
      setError(saveError.response?.data?.msg || "Failed to update user.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="dashboard-header-title mb-0">
          User <span>Management</span>
        </h1>
        <button
          className="btn btn-primary"
          style={{ backgroundColor: "#3945E0", border: "none" }}
        >
          <i className="bi bi-person-plus-fill me-1"></i> Add New User
        </button>
      </div>

      <div className="dashboard-section p-4">
        <div className="table-responsive">
          {error && <div className="alert alert-danger mb-3">{error}</div>}
          <table className="table table-hover align-middle">
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
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    No users found in the database.
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
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
