// pages/Auth/Auth.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Info } from 'lucide-react';
import { api, saveSession } from '../../services/api';
import './Auth.css';
import trophyImg from '../../assets/trophy-bg.webp';
import oppiLogo from '../../assets/Oppi-logo.png';
import arrowIcon from '../../assets/Vector.png';

const parseValidationErrors = (err) => {
  const newErrors = {};
  const unmappedErrors = [];

  const errorList = err.errors || (err.message ? [err.message] : []);

  errorList.forEach(msg => {
    const lower = msg.toLowerCase();
    let mapped = false;

    if (lower.includes("first_name") || lower.includes("first name") || lower.includes("first_ name")) {
      newErrors.firstName = newErrors.firstName ? `${newErrors.firstName} ${msg}` : msg;
      mapped = true;
    }
    if (lower.includes("last_name") || lower.includes("last name") || lower.includes("last_ name")) {
      newErrors.lastName = newErrors.lastName ? `${newErrors.lastName} ${msg}` : msg;
      mapped = true;
    }
    if (lower.includes("email")) {
      newErrors.emailId = newErrors.emailId ? `${newErrors.emailId} ${msg}` : msg;
      mapped = true;
    }
    if (lower.includes("mobile") || lower.includes("must be 10 digits") || lower.includes("mobile number") || lower.includes("mobilenumber")) {
      newErrors.mobileNumber = newErrors.mobileNumber ? `${newErrors.mobileNumber} ${msg}` : msg;
      mapped = true;
    }
    if (lower.includes("password") || lower.includes("need uppercase") || lower.includes("need lowercase") || lower.includes("need digit")) {
      newErrors.password = newErrors.password ? `${newErrors.password} ${msg}` : msg;
      mapped = true;
    }

    if (!mapped) {
      unmappedErrors.push(msg);
    }
  });

  return {
    newErrors,
    formError: unmappedErrors.length > 0 ? unmappedErrors.join(' ') : ''
  };
};

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobileNumber: '',
    emailId: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'mobileNumber') {
      const cleanValue = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: cleanValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name] || errors.form) {
      setErrors(prev => ({ ...prev, [name]: '', form: '' }));
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setMessage('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setFormData({
      firstName: '',
      lastName: '',
      mobileNumber: '',
      emailId: '',
      password: '',
      confirmPassword: '',
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      const session = await api.login({
        emailId: formData.emailId,
        password: formData.password
      });
      saveSession(session);
      if (session.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (session.role === 'VALIDATOR') {
        navigate('/validator', { replace: true });
      } else if (session.role === 'JURY') {
        navigate('/jury', { replace: true });
      } else {
        navigate('/application', { replace: true });
      }
    } catch (err) {
      const { newErrors, formError } = parseValidationErrors(err);
      setErrors(prev => ({
        ...prev,
        ...newErrors,
        form: formError || (Object.keys(newErrors).length > 0 ? '' : (err.message || 'Invalid email or password'))
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    let hasError = false;
    const newErrors = {};

    const passwordVal = formData.password || '';
    const hasMinLength = passwordVal.length >= 8;
    const hasUppercase = /[A-Z]/.test(passwordVal);
    const hasLowercase = /[a-z]/.test(passwordVal);
    const hasNumber = /\d/.test(passwordVal);

    if (!hasMinLength || !hasUppercase || !hasLowercase || !hasNumber) {
      newErrors.password = 'Password does not meet the requirements below';
      hasError = true;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setMessage('');
    setIsSubmitting(true);

    try {
      await api.register(formData);
      const session = await api.login({
        emailId: formData.emailId,
        password: formData.password
      });
      saveSession(session);
      setMessage('Registration successful! Redirecting to application...');
      setTimeout(() => {
        navigate('/application', { replace: true });
      }, 1500);
    } catch (err) {
      const { newErrors, formError } = parseValidationErrors(err);
      setErrors(prev => ({
        ...prev,
        ...newErrors,
        form: formError || (Object.keys(newErrors).length > 0 ? '' : (err.message || 'Registration failed. Please try again.'))
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    isLogin ? handleLogin(e) : handleRegister(e);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-content-wrapper">
          <div className="auth-page-header">
            <img src={oppiLogo} alt="OPPI Logo" className="auth-page-logo" />
            <Link to="/" className="btn-back-home">
              BACK TO HOME
              <img src={arrowIcon} width={16} height={16} alt="" />
            </Link>
          </div>
          <div className="auth-card">
            {/* Left Image Section */}
            <div className="auth-image-section">
              <img src={trophyImg} alt="OPPI Excellence in Innovation Award" className="auth-trophy" />
            </div>

            {/* Right Form Section */}
            <div className="auth-form-section">
              <div className="auth-header">
                <h2>{isLogin ? 'Log In' : 'Register'}</h2>
                <p>
                  {isLogin ? "Don't have an account? " : "Already Registered? "}
                  <button type="button" onClick={toggleMode} className="toggle-link">
                    {isLogin ? 'Create an account' : 'Log in'}
                  </button>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="auth-form">
                {message && <div className="form-success">{message}</div>}

                {/* REGISTER FIELDS */}
                {!isLogin && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label>First Name <span className="required">*</span></label>
                        <input
                          type="text"
                          name="firstName"
                          placeholder="Name"
                          value={formData.firstName}
                          onChange={handleChange}
                          required
                        />
                        {errors.firstName && <div className="field-error-text">{errors.firstName}</div>}
                      </div>
                      <div className="form-group">
                        <label>Last Name <span className="required">*</span></label>
                        <input
                          type="text"
                          name="lastName"
                          placeholder="LastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          required
                        />
                        {errors.lastName && <div className="field-error-text">{errors.lastName}</div>}
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Mobile Number <span className="required">*</span></label>
                        <div className="mobile-input-group">
                          <div className="country-code">
                            +91
                          </div>
                          <input
                            type="tel"
                            name="mobileNumber"
                            placeholder="00000 00000"
                            value={formData.mobileNumber}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        {errors.mobileNumber && <div className="field-error-text">{errors.mobileNumber}</div>}
                      </div>
                      <div className="form-group">
                        <label>Email Id <span className="required">*</span></label>
                        <input
                          type="email"
                          name="emailId"
                          placeholder="xyz@gmail.com"
                          value={formData.emailId}
                          onChange={handleChange}
                          required
                        />
                        {errors.emailId && <div className="field-error-text">{errors.emailId}</div>}
                      </div>
                    </div>
                  </>
                )}

                {/* LOGIN FIELDS */}
                {isLogin && (
                  <div className="form-group">
                    <label>Email Id <span className="required">*</span></label>
                    <input
                      type="email"
                      name="emailId"
                      placeholder="Enter your email address"
                      value={formData.emailId}
                      onChange={handleChange}
                      required
                    />
                    {errors.emailId && <div className="field-error-text">{errors.emailId}</div>}
                  </div>
                )}

                {/* PASSWORD FIELDS */}
                {isLogin ? (
                  <div className="form-group">
                    <label>Password <span className="required">*</span></label>
                    <div className="password-input-wrapper">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && <div className="field-error-text">{errors.password}</div>}
                  </div>
                ) : (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Create Password <span className="required">*</span></label>
                        <div className="password-input-wrapper">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            placeholder="Create a strong password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                          />
                          <button
                            type="button"
                            className="password-toggle-btn"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        {errors.password && <div className="field-error-text">{errors.password}</div>}
                      </div>

                      <div className="form-group">
                        <label>Confirm Password <span className="required">*</span></label>
                        <div className="password-input-wrapper">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            placeholder="Confirm your password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                          />
                          <button
                            type="button"
                            className="password-toggle-btn"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        {errors.confirmPassword && <div className="field-error-text">{errors.confirmPassword}</div>}
                      </div>
                    </div>

                    <div className="password-instruction-msg" style={{ marginTop: '0.2rem' }}>
                      <Info size={14} style={{ marginRight: '4px', verticalAlign: 'middle', flexShrink: 0 }} />
                      <span>Password must contain at least 8 characters, including one uppercase letter (A–Z), one lowercase letter (a–z), and one number (0–9)</span>
                    </div>
                  </>
                )}

                {/* LOGIN OPTIONS */}
                {isLogin && (
                  <div className="form-options">
                    <label className="checkbox-label">
                      <input type="checkbox" />
                      <span>Remember me</span>
                    </label>
                    <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>
                  </div>
                )}

                {errors.form && <div className="form-error" style={{ marginBottom: '1rem' }}>{errors.form}</div>}
                
                {!isLogin ? (
                  <div className="register-actions-row">
                    <div className="recaptcha">
                      <label className="checkbox-label">
                        <input type="checkbox" required />
                        <span>I'm not a robot</span>
                      </label>
                      <div className="recaptcha-brand">
                        <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" alt="reCAPTCHA" />
                        <span>reCAPTCHA</span>
                      </div>
                    </div>
                    <button type="submit" className="submit-btn" disabled={isSubmitting}>
                      {isSubmitting ? 'REGISTERING...' : 'REGISTER'}
                    </button>
                  </div>
                ) : (
                  <button type="submit" className="submit-btn" disabled={isSubmitting}>
                    {isSubmitting ? 'LOGGING IN...' : 'LOG IN'}
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;