import { useState, useEffect } from "react";
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
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  // Resend cooldown timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const requestOtp = async (event) => {
    event?.preventDefault();
    const normalizedEmail = email.trim().replace(/\s+/g, "").toLowerCase();
    setEmail(normalizedEmail);
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setMessage({
        type: "error",
        text: "Please enter a valid email address.",
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
      setMessage({
        type: "success",
        text: response.data.msg || "OTP sent successfully to your Gmail.",
      });
      setStep(2);
      setCountdown(60); // 60s cooldown
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.msg ||
          "Unable to send OTP. Please ensure this email is registered.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    const normalizedEmail = email.trim().replace(/\s+/g, "").toLowerCase();
    setEmail(normalizedEmail);

    if (otp.length !== 6) {
      setMessage({ type: "error", text: "Please enter the complete 6-digit OTP." });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }

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
      setMessage({
        type: "success",
        text: response.data.msg || "Password reset successfully! Redirecting to login...",
      });
      window.setTimeout(() => {
        navigate("/login", {
          state: {
            registrationMessage:
              "Password reset successful! Please sign in with your new password.",
          },
        });
      }, 1500);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.msg ||
          "Invalid or expired OTP. Please request a new one.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="login-page-wrapper user-login-page forgot-password-page d-flex flex-column align-items-center justify-content-center py-4 py-md-5">
        <div className="login-card-container px-2" style={{ maxWidth: "480px" }}>
          <div className="login-card p-4 p-sm-5 shadow-sm border-0 rounded-4">
            <div className="login-card-header text-start mb-4">
              <span className="forgot-password-eyebrow d-inline-flex align-items-center gap-1.5 badge bg-light text-primary border mb-2 px-2.5 py-1.5 rounded-pill small">
                <i className="bi bi-shield-lock" /> Account Recovery
              </span>
              <h1 className="login-title mb-1 fw-bold fs-3">
                Forgot <span className="highlight-italic text-primary">Password?</span>
              </h1>
              <p className="login-subtitle text-muted small">
                {step === 1
                  ? "Enter your registered Gmail address. We will send you a 6-digit OTP code to verify your account."
                  : "Check your Gmail for the 6-digit OTP and choose a secure new password."}
              </p>
            </div>

            {message.text && (
              <div
                className={`alert ${message.type === "error" ? "alert-danger" : "alert-success"} d-flex align-items-center gap-2 py-2.5 px-3 rounded-3 mb-3 small`}
                role="alert"
              >
                <i
                  className={`bi ${message.type === "error" ? "bi-exclamation-circle-fill text-danger" : "bi-check-circle-fill text-success"}`}
                />
                <span>{message.text}</span>
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={requestOtp}>
                <div className="mb-3 text-start">
                  <label className="form-label login-label fw-semibold small" htmlFor="forgot-email">
                    Registered Gmail Address
                  </label>
                  <div className="position-relative">
                    <input
                      id="forgot-email"
                      className="form-control login-input ps-3 pe-4 py-2.5"
                      type="email"
                      placeholder="you@gmail.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>
                <button
                  className="btn btn-primary w-100 py-2.5 rounded-3 fw-bold shadow-sm"
                  style={{ backgroundColor: "#1e3a8a", borderColor: "#1e3a8a" }}
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Sending OTP to Gmail...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send me-1"></i> Send OTP to Gmail
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={resetPassword}>
                {/* Email Display & Change Email */}
                <div className="d-flex align-items-center justify-content-between p-2 mb-3 rounded-3 bg-light border small">
                  <div className="text-truncate me-2">
                    <span className="text-muted d-block" style={{ fontSize: "11px" }}>SENDING OTP TO:</span>
                    <strong className="text-dark">{email}</strong>
                  </div>
                  <button
                    type="button"
                    className="btn btn-link btn-sm text-decoration-none p-0 fw-semibold"
                    onClick={() => {
                      setStep(1);
                      setMessage({ type: "", text: "" });
                    }}
                  >
                    Change
                  </button>
                </div>

                {/* 6-digit OTP Input */}
                <div className="mb-3 text-start">
                  <label className="form-label login-label fw-semibold small" htmlFor="reset-otp">
                    Enter 6-Digit OTP
                  </label>
                  <input
                    id="reset-otp"
                    className="form-control text-center fw-bold fs-4 py-2"
                    style={{ letterSpacing: "8px", fontFamily: "monospace" }}
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
                    autoFocus
                  />
                  <small className="text-muted d-block mt-1" style={{ fontSize: "11.5px" }}>
                    Check your Gmail inbox or spam/junk folder. Valid for 10 minutes.
                  </small>
                </div>

                {/* New Password */}
                <div className="mb-3 text-start">
                  <label className="form-label login-label fw-semibold small" htmlFor="new-password">
                    New Password
                  </label>
                  <div className="position-relative">
                    <input
                      id="new-password"
                      className="form-control login-input pe-5 py-2.5"
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
                      className="btn btn-link position-absolute top-50 end-0 translate-middle-y text-muted text-decoration-none pe-3"
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
                </div>

                {/* Confirm Password */}
                <div className="mb-4 text-start">
                  <label className="form-label login-label fw-semibold small" htmlFor="confirm-password">
                    Confirm New Password
                  </label>
                  <div className="position-relative">
                    <input
                      id="confirm-password"
                      className="form-control login-input pe-5 py-2.5"
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
                      className="btn btn-link position-absolute top-50 end-0 translate-middle-y text-muted text-decoration-none pe-3"
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
                </div>

                <button
                  className="btn btn-primary w-100 py-2.5 rounded-3 fw-bold shadow-sm"
                  style={{ backgroundColor: "#1e3a8a", borderColor: "#1e3a8a" }}
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Updating Password...
                    </>
                  ) : (
                    "Reset Password & Sign In"
                  )}
                </button>

                {/* Resend OTP */}
                <div className="text-center mt-3">
                  <button
                    className="btn btn-link text-decoration-none small p-0"
                    type="button"
                    onClick={() => countdown === 0 && requestOtp()}
                    disabled={isSubmitting || countdown > 0}
                    style={{ color: countdown > 0 ? "#94a3b8" : "#1e3a8a" }}
                  >
                    <i className="bi bi-arrow-repeat me-1" />
                    {countdown > 0
                      ? `Resend OTP in ${countdown}s`
                      : "Didn't receive the OTP? Send again"}
                  </button>
                </div>
              </form>
            )}

            <div className="text-center mt-4 pt-3 border-top">
              <Link
                className="text-decoration-none small text-muted hover-primary"
                to="/login"
              >
                <i className="bi bi-arrow-left me-1" /> Back to Sign In
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
