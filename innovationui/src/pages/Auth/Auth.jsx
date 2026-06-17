// pages/Auth/Auth.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { api, saveSession } from '../../services/api';
import './Auth.css';
import trophyImg from '../../assets/Trophy1.png';

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
    setFormData(prev => ({ ...prev, [name]: value }));
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
      setErrors({ form: err.message || 'Invalid email or password' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    let hasError = false;
    const newErrors = {};

    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
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
      setMessage('Registration successful! Please login.');
      setTimeout(() => {
        setIsLogin(true);
        setMessage('');
        setFormData(prev => ({ ...prev, emailId: '', password: '', confirmPassword: '' }));
      }, 1500);
    } catch (err) {
      setErrors({ form: err.message || 'Registration failed. Please try again.' });
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
                  </div>
                )}

                {/* PASSWORD FIELDS */}
                <div className="form-group">
                  <label>{isLogin ? 'Password' : 'Create Password'} <span className="required">*</span></label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder={isLogin ? "Enter your password" : "Create a strong password"}
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

                {/* CONFIRM PASSWORD - Register only */}
                {!isLogin && (
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

                {/* reCAPTCHA - Register only */}
                {!isLogin && (
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
                )}

                {errors.form && <div className="form-error" style={{ marginBottom: '1rem' }}>{errors.form}</div>}
                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                  {isSubmitting
                    ? (isLogin ? 'LOGGING IN...' : 'REGISTERING...')
                    : (isLogin ? 'LOG IN' : 'REGISTER')}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;