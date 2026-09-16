import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const passwordStrength = [
    data.password.length >= 6,
    /[A-Z]/.test(data.password) && /[0-9]/.test(data.password),
    /[^A-Za-z0-9]/.test(data.password),
  ].filter(Boolean).length;

  const handleChange = (e) => {
    setData((currentData) => ({
      ...currentData,
      [e.target.name]: e.target.value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await axios.post(`${API_BASE_URL}/api/admin/login`, data);
      if (res.data.msg === "Success") {
        const storage = rememberMe ? localStorage : sessionStorage;
        const otherStorage = rememberMe ? sessionStorage : localStorage;
        ["adminName", "adminEmail", "role", "token", "adminId"].forEach((key) =>
          otherStorage.removeItem(key),
        );
        storage.setItem("adminName", res.data.name);
        storage.setItem("adminEmail", res.data.email || data.email);
        storage.setItem("role", res.data.role);
        storage.setItem("token", res.data.token);
        storage.setItem("adminId", res.data.adminId);
        navigate("/dashboard", { state: { loginSuccess: true } });
      } else {
        setError(res.data.msg || "Email or password is incorrect.");
      }
    } catch (err) {
      setError(
        err.response?.data?.msg ||
          "Unable to connect to the server. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="admin-login-page">
      <section
        className="admin-login-panel"
        aria-labelledby="admin-login-title"
      >
        <div className="admin-login-mark" aria-hidden="true">
          SP
        </div>
        <p className="admin-login-eyebrow">SoftPro Innovation</p>
        <h1 id="admin-login-title">Admin portal</h1>
        <p className="admin-login-intro">
          Sign in to manage your store, orders, and customers.
        </p>

        <form className="admin-login-form" onSubmit={handleSubmit}>
          <div className="admin-field">
            <label htmlFor="admin-email">Email address</label>
            <input
              id="admin-email"
              type="email"
              name="email"
              placeholder="sonuver@gmail.com"
              value={data.email}
              onChange={handleChange}
              autoComplete="username"
              required
            />
          </div>
          <div className="admin-field">
            <label htmlFor="admin-password">Password</label>
            <div className="admin-password-wrap">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={data.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="admin-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <i
                  className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}
                />
              </button>
            </div>
            {data.password && (
              <div className="admin-password-strength" aria-live="polite">
                <div className="admin-strength-bars" aria-hidden="true">
                  {[1, 2, 3].map((level) => (
                    <span
                      key={level}
                      className={
                        level <= passwordStrength
                          ? `is-level-${passwordStrength}`
                          : ""
                      }
                    />
                  ))}
                </div>
                <span>
                  {passwordStrength === 3
                    ? "Strong password"
                    : passwordStrength === 2
                      ? "Good password"
                      : "Use 6+ characters"}
                </span>
              </div>
            )}
          </div>

          <label className="admin-remember-option" htmlFor="admin-remember">
            <input
              id="admin-remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            <span className="admin-checkmark" aria-hidden="true">
              <i className="bi bi-check2"></i>
            </span>
            <span>Remember me</span>
          </label>

          {error && (
            <p className="admin-login-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="admin-login-submit"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign in to dashboard"}
          </button>
        </form>
        <div className="admin-login-trust-strip">
          <span>
            <i className="bi bi-shield-lock" /> Secure admin access
          </span>
          <span>
            <i className="bi bi-speedometer2" /> Store control center
          </span>
        </div>
        <p className="admin-login-footer">Authorized administrators only</p>
      </section>
    </main>
  );
};

export default AdminLogin;
