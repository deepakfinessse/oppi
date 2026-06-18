import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { api, saveSession } from '../../services/api';
import './Login.css';
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

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    emailId: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    if (errors[name] || errors.form) {
      setErrors(prev => ({ ...prev, [name]: '', form: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      const session = await api.login(formData);
      saveSession(session);
      navigate('/application', { replace: true });
    } catch (err) {
      const { newErrors, formError } = parseValidationErrors(err);
      setErrors(prev => ({
        ...prev,
        ...newErrors,
        form: formError || (Object.keys(newErrors).length > 0 ? '' : (err.message || 'Login failed. Please check your email and password.'))
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-content-wrapper">
          <div className="login-card">
            <div className="login-image-section">
              <img src={trophyImg} alt="OPPI Excellence in Innovation Award" className="login-trophy" />
            </div>

            <div className="login-form-section">
              <div className="login-header">
                <h2>Login</h2>
                <p>New here? <Link to="/register" className="register-link">Register Now</Link></p>
              </div>

              <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group">
                  <label>Email Id <span className="required">*</span></label>
                  <input
                    type="email"
                    name="emailId"
                    placeholder="name@example.com"
                    value={formData.emailId}
                    onChange={handleChange}
                    required
                  />
                  {errors.emailId && <div className="field-error-text">{errors.emailId}</div>}
                </div>

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

                <div className="form-options">
                  <label className="remember-me">
                    <input type="checkbox" id="remember" />
                    Remember me
                  </label>
                  <Link to="/forgot-password" className="forgot-password">Forgot Password?</Link>
                </div>

                <div className="form-footer">
                  {errors.form && <div className="form-error" style={{ marginBottom: '1rem', width: '100%' }}>{errors.form}</div>}
                  <button type="submit" className="btn-login" disabled={isSubmitting}>
                    {isSubmitting ? 'LOGGING IN...' : 'LOGIN'}
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

export default Login;