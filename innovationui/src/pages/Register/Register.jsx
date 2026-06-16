import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { api } from '../../services/api';
import './Register.css';
import trophyImg from '../../assets/Trophy1.png';

const Register = () => {
  const navigate = useNavigate();
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobileNumber: '',
    emailId: '',
    createPassword: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Add password validation
    if (formData.createPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      await api.register(formData);
      setMessage('Registration successful. Redirecting to login...');
      setTimeout(() => navigate('/login', { replace: true }), 800);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-content-wrapper">
          <div className="register-card">
            <div className="register-image-section">
              <img src={trophyImg} alt="OPPI Excellence in Innovation Award" className="register-trophy" />
            </div>

            <div className="register-form-section">
              <div className="register-header">
                <h2>Register</h2>
                <p>Already Registered? <Link to="/login" className="login-link">Log in</Link></p>
              </div>

              <form onSubmit={handleSubmit} className="register-form">
                {message && <div className="form-success">{message}</div>}
                {error && <div className="form-error">{error}</div>}

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
                        <span className="flag-icon">IN</span>
                        <svg className="chevron-down" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
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

                <div className="form-group">
                  <label>Create Password <span className="required">*</span></label>
                  <div className="password-input-wrapper">
                    <input
                      type={showCreatePassword ? 'text' : 'password'}
                      name="createPassword"
                      value={formData.createPassword}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowCreatePassword(!showCreatePassword)}
                      aria-label={showCreatePassword ? "Hide password" : "Show password"}
                    >
                      {showCreatePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Confirm Password <span className="required">*</span></label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
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
                </div>

                <div className="form-footer">
                  <div className="recaptcha-placeholder">
                    <div className="recaptcha-mock">
                      <div className="recaptcha-left">
                        <input type="checkbox" id="robot" required />
                        <label htmlFor="robot">I'm not a robot</label>
                      </div>
                      <div className="recaptcha-right">
                        <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" alt="reCAPTCHA" />
                        <span>reCAPTCHA</span>
                      </div>
                    </div>
                  </div>
                  <button type="submit" className="btn-register" disabled={isSubmitting}>
                    {isSubmitting ? 'REGISTERING...' : 'REGISTER'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;