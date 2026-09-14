import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
                      <button className="btn btn-sm btn-outline-secondary me-2">
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
    </>
  );
};

export default UsersList;
