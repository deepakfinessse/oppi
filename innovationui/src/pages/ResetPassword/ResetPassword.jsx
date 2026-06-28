import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Info } from 'lucide-react';
import { api } from '../../services/api';
import '../Auth/Auth.css'; // Reuse Auth CSS
import trophyImg from '../../assets/Trophy4.webp';
import oppiLogo from '../../assets/Oppi-logo.png';
import arrowIcon from '../../assets/Vector.png';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!token) {
      setErrors({ form: 'Reset token is missing or invalid. Please request a new link.' });
      return;
    }

    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);

    if (!hasMinLength || !hasUppercase || !hasLowercase || !hasNumber) {
      setErrors({ password: 'Password does not meet the requirements.' });
      return;
    }

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match.' });
      return;
    }

    setIsSubmitting(true);

    try {
      await api.resetPassword(token, password);
      setIsSubmitted(true);
    } catch (err) {
      setErrors({ form: err.message || 'Failed to reset password. The link may have expired or is invalid.' });
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
                    <h2>Reset Password</h2>
                    <p>Enter your new password below to complete the reset process.</p>
                  </div>

                  <form onSubmit={handleSubmit} className="auth-form">
                    {errors.form && <div className="field-error-text" style={{ textAlign: 'center', marginBottom: '1rem' }}>{errors.form}</div>}

                    <div className="form-group">
                      <label>New Password <span className="required">*</span></label>
                      <div className="password-input-wrapper">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                          }}
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
                      <div className="password-instruction-msg" style={{ marginTop: '0.3rem' }}>
                        <Info size={14} style={{ marginRight: '4px', verticalAlign: 'middle', flexShrink: 0 }} />
                        <span>Password must contain at least 8 characters, including one uppercase letter (A–Z), one lowercase letter (a–z), and one number (0–9)</span>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Confirm New Password <span className="required">*</span></label>
                      <div className="password-input-wrapper">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
                          }}
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

                    <button type="submit" className="submit-btn" disabled={isSubmitting || !token}>
                      {isSubmitting ? 'RESETTING...' : 'RESET PASSWORD'}
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
                    <h2 style={{ fontSize: '1.8rem' }}>Password Reset Success</h2>
                    <p>Your password has been reset successfully. You can now log in using your new password.</p>
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

export default ResetPassword;
