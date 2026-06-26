import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import { api } from '../../services/api';
import '../Auth/Auth.css'; // Reuse Auth CSS
import trophyImg from '../../assets/trophy-bg.webp';
import oppiLogo from '../../assets/Oppi-logo.png';
import arrowIcon from '../../assets/Vector.png';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [tempPassword, setTempPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await api.forgotPassword(email);
      if (response && response.temp_password) {
        setTempPassword(response.temp_password);
      }
      setIsSubmitted(true);
    } catch (err) {
      setErrors({ email: err.message || 'Failed to send reset link. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
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
            <div className="auth-image-section">
              <img src={trophyImg} alt="OPPI Excellence in Innovation Award" className="auth-trophy" />
            </div>

            <div className="auth-form-section">
              {!isSubmitted ? (
                <>
                  <div className="auth-header">
                    <h2>Forgot Password?</h2>
                    <p>Enter your email address and we'll send you a link to reset your password.</p>
                  </div>

                  <form onSubmit={handleSubmit} className="auth-form">

                    <div className="form-group" style={{ marginBottom: '0rem' }}>
                      <label>Email Id <span className="required">*</span></label>
                      <input
                        type="email"
                        name="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errors.email) setErrors({});
                        }}
                        required
                      />
                    </div>
                    {errors.email && <div className="field-error-text">{errors.email}</div>}

                    <button type="submit" className="submit-btn" disabled={isSubmitting}>
                      {isSubmitting ? 'SENDING...' : 'SEND RESET LINK'}
                    </button>

                    <div className="form-options" style={{ justifyContent: 'center', marginTop: '1rem' }}>
                      <Link to="/auth" className="forgot-link">Back to Login</Link>
                    </div>
                  </form>
                </>
              ) : (
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ fontSize: '3rem', color: '#0076BE', margin: '0 auto' }}>✓</div>
                  <div className="auth-header" style={{ textAlign: 'center', marginBottom: 0 }}>
                    <h2 style={{ fontSize: '1.8rem' }}>Check Your Email</h2>
                    <p>We've sent a password reset link to <strong>{email}</strong>. Please check your inbox (and spam/junk folder) and click the link to reset your password.</p>
                  </div>
                  <div style={{ marginTop: '1rem' }}>
                    <Link to="/auth">
                      <button className="submit-btn">BACK TO LOGIN</button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
