import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { API_BASE_URL } from "../../config/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const requestOtp = async (event) => {
    event?.preventDefault();
    const normalizedEmail = email.trim().replace(/\s+/g, "").toLowerCase();
    setEmail(normalizedEmail);
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setMessage({
        type: "error",
        text: "Please enter your registered email address.",
      });
      return;
    }
    setMessage({ type: "", text: "" });
    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/user/forgot-password/request`,
        { email: normalizedEmail },
      );
      setMessage({ type: "success", text: response.data.msg });
      setStep(2);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.msg || "Unable to send OTP.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    const normalizedEmail = email.trim().replace(/\s+/g, "").toLowerCase();
    setEmail(normalizedEmail);
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    setMessage({ type: "", text: "" });
    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/user/forgot-password/reset`,
        {
          email: normalizedEmail,
          otp,
          newPassword,
        },
      );
      setMessage({ type: "success", text: response.data.msg });
      window.setTimeout(() => navigate("/login"), 1400);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.msg || "Unable to reset password.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="login-page-wrapper user-login-page forgot-password-page d-flex flex-column align-items-center justify-content-center py-5">
        <div className="login-card-container">
          <div className="login-card p-4 p-sm-5">
            <div className="login-card-header text-start mb-4">
              <span className="forgot-password-eyebrow">
                <i className="bi bi-shield-lock" /> Account recovery
              </span>
              <h1 className="login-title mb-1">
                Forgot <span className="highlight-italic">password?</span>
              </h1>
              <p className="login-subtitle">
                {step === 1
                  ? "Use the same email address that you added to your account."
                  : "Enter the OTP from your email and choose a new password."}
              </p>
            </div>

            {message.text && (
              <div
                className={`auth-success-message ${message.type === "error" ? "login-error" : ""}`}
                role="alert"
              >
                <i
                  className={`bi ${message.type === "error" ? "bi-exclamation-circle" : "bi-check-circle-fill"}`}
                />{" "}
                <span>{message.text}</span>
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={requestOtp}>
                <label className="login-label" htmlFor="forgot-email">
                  Email Address
                </label>
                <input
                  id="forgot-email"
                  className="form-control login-input mb-4"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                />
                <button
                  className="btn btn-orangered-about w-100 py-3 rounded-3 fw-bold"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending OTP..." : "Send OTP"}
                </button>
              </form>
            ) : (
              <form onSubmit={resetPassword}>
                <label className="login-label" htmlFor="reset-otp">
                  6-digit OTP
                </label>
                <input
                  id="reset-otp"
                  className="form-control login-input mb-3 forgot-otp-input"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength="6"
                  placeholder="000000"
                  value={otp}
                  onChange={(event) =>
                    setOtp(event.target.value.replace(/\D/g, ""))
                  }
                  required
                  autoComplete="one-time-code"
                />
                <label className="login-label" htmlFor="new-password">
                  New Password
                </label>
                <div className="position-relative mb-3">
                  <input
                    id="new-password"
                    className="form-control login-input"
                    type={showNewPassword ? "text" : "password"}
                    minLength="6"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={
                      showNewPassword ? "Hide password" : "Show password"
                    }
                  >
                    <i
                      className={`bi ${showNewPassword ? "bi-eye-slash" : "bi-eye"}`}
                    />
                  </button>
                </div>
                <label className="login-label" htmlFor="confirm-password">
                  Confirm Password
                </label>
                <div className="position-relative mb-4">
                  <input
                    id="confirm-password"
                    className="form-control login-input"
                    type={showConfirmPassword ? "text" : "password"}
                    minLength="6"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    <i
                      className={`bi ${showConfirmPassword ? "bi-eye-slash" : "bi-eye"}`}
                    />
                  </button>
                </div>
                <button
                  className="btn btn-orangered-about w-100 py-3 rounded-3 fw-bold"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Resetting..." : "Reset Password"}
                </button>
                <button
                  className="btn btn-link w-100 mt-2 text-decoration-none fw-bold"
                  type="button"
                  onClick={() => requestOtp()}
                  disabled={isSubmitting}
                >
                  <i className="bi bi-arrow-repeat me-1" />
                  {isSubmitting
                    ? "Sending..."
                    : "Didn't receive the OTP? Send again"}
                </button>
              </form>
            )}

            <div className="text-center mt-4">
              <Link
                className="login-create-link text-decoration-none"
                to="/login"
              >
                <i className="bi bi-arrow-left" /> Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default ForgotPassword;
