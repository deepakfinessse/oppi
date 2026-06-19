import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { api } from '../../services/api';
import '../Auth/Auth.css';
import trophyImg from '../../assets/Trophy1.png';

const ChangePassword = () => {
  const navigate = useNavigate();
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name] || errors.form) {
      setErrors(prev => ({ ...prev, [name]: '', form: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setMessage('');

    let hasError = false;
    const newErrors = {};

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'New passwords do not match';
      hasError = true;
    }

    if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    
    try {
      await api.changePassword(formData.oldPassword, formData.newPassword);
      setMessage('Password changed successfully! Redirecting...');
      setTimeout(() => navigate('/application', { replace: true }), 1500);
    } catch (err) {
      setErrors({ form: err.message || 'Failed to change password. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-content-wrapper">
          <div className="auth-card">
            <div className="auth-image-section">
              <img src={trophyImg} alt="OPPI Excellence in Innovation Award" className="auth-trophy" />
            </div>
            
            <div className="auth-form-section">
              <div className="auth-header">
                <h2>Change Password</h2>
                <p>Please enter your current password and choose a new one.</p>
              </div>

              <form onSubmit={handleSubmit} className="auth-form">
                {message && <div className="form-success">{message}</div>}

                <div className="form-group">
                  <label>Current Password <span className="required">*</span></label>
                  <div className="password-input-wrapper">
                    <input 
                      type={showOldPassword ? 'text' : 'password'} 
                      name="oldPassword" 
                      placeholder="Enter current password"
                      value={formData.oldPassword}
                      onChange={handleChange}
                      required 
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      aria-label={showOldPassword ? "Hide password" : "Show password"}
                    >
                      {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>New Password <span className="required">*</span></label>
                  <div className="password-input-wrapper">
                    <input 
                      type={showNewPassword ? 'text' : 'password'} 
                      name="newPassword" 
                      placeholder="Enter new password"
                      value={formData.newPassword}
                      onChange={handleChange}
                      required 
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.newPassword && <div className="field-error-text">{errors.newPassword}</div>}
                </div>

                <div className="form-group">
                  <label>Confirm New Password <span className="required">*</span></label>
                  <div className="password-input-wrapper">
                    <input 
                      type={showConfirmPassword ? 'text' : 'password'} 
                      name="confirmPassword" 
                      placeholder="Confirm new password"
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

                {errors.form && <div className="form-error" style={{ marginBottom: '0.5rem' }}>{errors.form}</div>}
                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'UPDATING...' : 'CHANGE PASSWORD'}
                </button>

                <div className="form-options" style={{ justifyContent: 'center', marginTop: '1rem' }}>
                  <button type="button" onClick={() => navigate(-1)} className="toggle-link">Back to Dashboard</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
