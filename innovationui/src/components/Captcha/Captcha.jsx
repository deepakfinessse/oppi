import React, { useState, useEffect } from 'react';
import { RotateCw } from 'lucide-react';
import { api } from '../../services/api';
import './Captcha.css';

const Captcha = ({ onChange, errors }) => {
  const [captchaData, setCaptchaData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userInput, setUserInput] = useState('');

  const fetchCaptcha = async () => {
    setLoading(true);
    try {
      const data = await api.getCaptcha();
      setCaptchaData(data);
      setUserInput('');
      onChange({ id: data.captchaId, captchaAnswer: '' });
    } catch (err) {
      console.error('Error fetching captcha:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setUserInput(val);
    if (captchaData) {
      onChange({ id: captchaData.captchaId, captchaAnswer: val });
    }
  };

  return (
    <div className="captcha-container">
      <label className="captcha-label">Verification Code <span className="required">*</span></label>
      <div className="captcha-image-row">
        <div className="captcha-image-wrapper">
          {captchaData ? (
            <img src={captchaData.captchaImage} alt="Captcha Code" className="captcha-image" />
          ) : (
            <div className="captcha-placeholder-box">Loading...</div>
          )}
        </div>
        <button
          type="button"
          onClick={fetchCaptcha}
          className="captcha-refresh-btn"
          disabled={loading}
          title="Refresh Captcha"
        >
          <RotateCw size={16} className={loading ? 'spin-animation' : ''} />
        </button>
      </div>
      <input
        type="text"
        placeholder="Enter verification code"
        value={userInput}
        onChange={handleInputChange}
        required
        className="captcha-input-field"
      />
      {errors?.captcha && <div className="field-error-text">{errors.captcha}</div>}
    </div>
  );
};

export default Captcha;
