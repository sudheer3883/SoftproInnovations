import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';


const Register = () => {
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [picture, setPicture] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handlePictureChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setPicture(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const response = await axios.post('http://localhost:5000/api/user/register', {
        name: fullName,
        mobile: mobileNumber,
        email,
        password,
        picture,
      });
      if (response.data.msg !== 'User Registered') {
        throw new Error(response.data.msg || 'Unable to create account.');
      }
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.msg || err.message || 'Unable to create account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page-wrapper d-flex flex-column align-items-center justify-content-center py-5">
      {/* Main Register Card */}
      <div className="login-card-container" style={{ maxWidth: '540px' }}>
        <div className="login-card p-4 p-sm-5">
          {/* Card Header */}
          <div className="login-card-header text-start mb-4">
            <h1 className="login-title mb-1">
              Create an <span className="highlight-italic">account</span>
            </h1>
            <p className="login-subtitle">Join thousands of makers &mdash; it's free and takes 30 seconds</p>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit}>
            <div className="profile-upload text-start mb-4">
              <label htmlFor="pictureInput" className="profile-upload-label">
                {picture ? (
                  <img src={picture} alt="Selected profile" className="register-picture-preview" />
                ) : (
                  <span className="register-picture-placeholder"><i className="bi bi-camera" /></span>
                )}
                <span>
                  <strong>Add a profile picture</strong>
                  <small>Choose a photo so your profile feels like yours</small>
                </span>
                <i className="bi bi-arrow-up-right profile-upload-arrow" />
              </label>
              <input id="pictureInput" type="file" accept="image/*" onChange={handlePictureChange} />
            </div>

            {/* Row 1: Full Name & Mobile Number */}
            <div className="row g-3 mb-3 text-start">
              <div className="col-12 col-md-6">
                <label htmlFor="fullNameInput" className="form-label login-label">Full Name</label>
                <div className="position-relative">
                  <input
                    id="fullNameInput"
                    type="text"
                    className="form-control login-input"
                    placeholder="Arjun Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                  <i className="bi bi-person login-input-icon"></i>
                </div>
              </div>

              <div className="col-12 col-md-6">
                <label htmlFor="mobileInput" className="form-label login-label">Mobile Number</label>
                <div className="position-relative">
                  <input
                    id="mobileInput"
                    type="tel"
                    className="form-control login-input"
                    placeholder="+91 99999 99999"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    required
                  />
                  <i className="bi bi-phone login-input-icon"></i>
                </div>
              </div>
            </div>

            {/* Email Address Field */}
            <div className="mb-3 text-start">
              <label htmlFor="emailInput" className="form-label login-label">Email Address</label>
              <div className="position-relative">
                <input
                  id="emailInput"
                  type="email"
                  className="form-control login-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <i className="bi bi-envelope login-input-icon"></i>
              </div>
            </div>

            {/* Create Password Field */}
            <div className="mb-3 text-start">
              <label htmlFor="passwordInput" className="form-label login-label">Create Password</label>
              <div className="position-relative">
                <input
                  id="passwordInput"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control login-input"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={4}
                  required
                />
                <i
                  className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} login-input-icon cursor-pointer`}
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                ></i>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="form-check d-flex align-items-center gap-2 mb-4 text-start">
              <input
                className="form-check-input login-checkbox"
                type="checkbox"
                id="termsCheck"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                required
              />
              <label className="form-check-label login-remember-label mb-0" htmlFor="termsCheck" style={{ fontSize: '13.5px' }}>
                I agree to the{' '}
                <Link to="/terms" style={{ color: '#3945E0', textDecoration: 'underline' }}>Terms & Conditions</Link>{' '}
                and{' '}
                <Link to="/privacy" style={{ color: '#3945E0', textDecoration: 'underline' }}>Privacy Policy</Link>
              </label>
            </div>

            {/* Create Account Button */}
            {error && <div className="login-error" role="alert">{error}</div>}
            <button type="submit" className="btn btn-orangered-about w-100 py-3 rounded-3 font-weight-bold mb-4" style={{ fontSize: '16px' }}>
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>

            {/* Divider */}
            <div className="login-divider d-flex align-items-center my-4">
              <div className="flex-grow-1 border-bottom"></div>
              <span className="px-3 text-muted" style={{ fontSize: '13px' }}>already a member?</span>
              <div className="flex-grow-1 border-bottom"></div>
            </div>

            {/* Have an Account / Sign In Link */}
            <div className="text-center pt-1">
              <span className="text-secondary" style={{ fontSize: '14.5px' }}>Have an account? </span>
              <Link to="/login" className="login-create-link text-decoration-none fw-semibold">
                Sign in &rarr;
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>


  );
};

export default Register;
