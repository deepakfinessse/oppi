import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, saveSession } from '../../services/api';
import './Login.css';
import trophyImg from '../../assets/Trophy1.png';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    emailId: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    setError('');
    setIsSubmitting(true);

    try {
      const session = await api.login(formData);
      saveSession(session);
      navigate('/application', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your email and password.');
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
                {error && <div className="form-error">{error}</div>}
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
                </div>

                <div className="form-group">
                  <label>Password <span className="required">*</span></label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-options">
                  <label className="remember-me">
                    <input type="checkbox" id="remember" />
                    Remember me
                  </label>
                  <Link to="/forgot-password" className="forgot-password">Forgot Password?</Link>
                </div>

                <div className="form-footer">
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