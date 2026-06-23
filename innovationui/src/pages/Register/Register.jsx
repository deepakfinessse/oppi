import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { api, saveSession } from '../../services/api';
import './Register.css';
import trophyImg from '../../assets/Trophy1.png';

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
      newErrors.createPassword = newErrors.createPassword ? `${newErrors.createPassword} ${msg}` : msg;
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
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    // Clear error for the field being edited
    if (errors[name] || errors.form) {
      setErrors(prev => ({ ...prev, [name]: '', form: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let hasError = false;
    const newErrors = {};

    const passwordVal = formData.createPassword || '';
    const hasMinLength = passwordVal.length >= 8;
    const hasUppercase = /[A-Z]/.test(passwordVal);
    const hasLowercase = /[a-z]/.test(passwordVal);
    const hasNumber = /\d/.test(passwordVal);

    if (!hasMinLength || !hasUppercase || !hasLowercase || !hasNumber) {
      newErrors.createPassword = 'Password does not meet the requirements below';
      hasError = true;
    }

    if (formData.createPassword !== formData.confirmPassword) {
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
        password: formData.createPassword
      });
      saveSession(session);
      setMessage('Registration successful. Redirecting to application...');
      setTimeout(() => navigate('/application', { replace: true }), 800);
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
                  {errors.createPassword && <div className="field-error-text">{errors.createPassword}</div>}
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

                  <div className="password-requirements">
                    <div className={`requirement ${(formData.createPassword || '').length >= 8 ? 'met' : ''}`}>
                      <span className="req-icon">{(formData.createPassword || '').length >= 8 ? '✓' : '○'}</span>
                      <span>Min. 8 characters</span>
                    </div>
                    <div className={`requirement ${/[A-Z]/.test(formData.createPassword || '') ? 'met' : ''}`}>
                      <span className="req-icon">{/[A-Z]/.test(formData.createPassword || '') ? '✓' : '○'}</span>
                      <span>One uppercase (A-Z)</span>
                    </div>
                    <div className={`requirement ${/[a-z]/.test(formData.createPassword || '') ? 'met' : ''}`}>
                      <span className="req-icon">{/[a-z]/.test(formData.createPassword || '') ? '✓' : '○'}</span>
                      <span>One lowercase (a-z)</span>
                    </div>
                    <div className={`requirement ${/\d/.test(formData.createPassword || '') ? 'met' : ''}`}>
                      <span className="req-icon">{/\d/.test(formData.createPassword || '') ? '✓' : '○'}</span>
                      <span>One number (0-9)</span>
                    </div>
                  </div>

                  {errors.confirmPassword && <div className="field-error-text">{errors.confirmPassword}</div>}
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
                  {errors.form && <div className="form-error" style={{ marginBottom: '1rem' }}>{errors.form}</div>}
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