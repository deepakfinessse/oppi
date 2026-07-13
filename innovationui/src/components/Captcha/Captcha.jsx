import React, { useState, useEffect } from 'react';
import { RotateCw } from 'lucide-react';
import { api } from '../../services/api';
import './Captcha.css';

const Captcha = ({ onChange, errors }) => {
  const [captchaData, setCaptchaData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [markerPos, setMarkerPos] = useState(null);

  const fetchCaptcha = async () => {
    setLoading(true);
    setMarkerPos(null);
    try {
      const data = await api.getCaptcha();
      setCaptchaData(data);
      onChange({ id: data.captchaId, clickX: null, clickY: null });
    } catch (err) {
      console.error('Error fetching captcha:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleImageClick = (e) => {
    if (loading || !captchaData) return;

    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();

    // Coordinates of click relative to the image element bounding box
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Scale coordinates back to the original 200x65 backend SVG coordinates
    const scaleX = 200 / rect.width;
    const scaleY = 65 / rect.height;

    const canvasX = clickX * scaleX;
    const canvasY = clickY * scaleY;

    // Save marker percentage coordinates for the visual target pointer dot
    const pctX = (clickX / rect.width) * 100;
    const pctY = (clickY / rect.height) * 100;
    setMarkerPos({ x: pctX, y: pctY });

    onChange({
      id: captchaData.captchaId,
      clickX: canvasX,
      clickY: canvasY
    });
  };

  // Extract clean prompt wording, e.g. "blue square"
  const getCleanInstruction = () => {
    if (!captchaData?.instruction) return '';
    return captchaData.instruction.replace('Click on the ', '');
  };

  return (
    <div className="captcha-container">
      <div className="captcha-instruction-row">
        <span className="captcha-label">Security Check <span className="required">*</span></span>
        {captchaData && (
          <span className="captcha-prompt">
            Please click on the <strong className="captcha-highlight">{getCleanInstruction()}</strong>
          </span>
        )}
      </div>

      <div className="captcha-image-row">
        <div className="captcha-image-wrapper">
          {captchaData ? (
            <div className="captcha-image-click-area">
              <img
                src={captchaData.captchaImage}
                alt="Click Captcha"
                className="captcha-image"
                onClick={handleImageClick}
                draggable={false}
              />
              {markerPos && (
                <div
                  className="captcha-marker-dot"
                  style={{
                    left: `${markerPos.x}%`,
                    top: `${markerPos.y}%`,
                  }}
                />
              )}
            </div>
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
      {errors?.captcha && <div className="field-error-text">{errors.captcha}</div>}
    </div>
  );
};

export default Captcha;
