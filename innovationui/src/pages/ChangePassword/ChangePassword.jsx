import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import '../Auth/Auth.css';
import trophyImg from '../../assets/Trophy1.png';

const ChangePassword = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await api.changePassword(formData.oldPassword, formData.newPassword);
      setMessage('Password changed successfully! Redirecting...');
      setTimeout(() => navigate('/application', { replace: true }), 1500);
    } catch (err) {
      setError(err.message || 'Failed to change password. Please try again.');
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
                {error && <div className="form-error">{error}</div>}

                <div className="form-group">
                  <label>Current Password <span className="required">*</span></label>
                  <input 
                    type="password" 
                    name="oldPassword" 
                    placeholder="Enter current password"
                    value={formData.oldPassword}
                    onChange={handleChange}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>New Password <span className="required">*</span></label>
                  <input 
                    type="password" 
                    name="newPassword" 
                    placeholder="Enter new password"
                    value={formData.newPassword}
                    onChange={handleChange}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Confirm New Password <span className="required">*</span></label>
                  <input 
                    type="password" 
                    name="confirmPassword" 
                    placeholder="Confirm new password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required 
                  />
                </div>

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
