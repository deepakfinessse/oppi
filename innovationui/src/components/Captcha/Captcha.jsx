import React, { useEffect, useRef, useState } from 'react';
import './Captcha.css';

const Captcha = ({ onChange, errors }) => {
  const containerRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (window.grecaptcha && window.grecaptcha.render) {
      setScriptLoaded(true);
      return;
    }

    const scriptId = 'google-recaptcha-script';
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    const checkGrecaptcha = setInterval(() => {
      if (window.grecaptcha && window.grecaptcha.render) {
        clearInterval(checkGrecaptcha);
        setScriptLoaded(true);
      }
    }, 100);

    return () => clearInterval(checkGrecaptcha);
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !containerRef.current) return;

    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";
    
    // Clear container to avoid double render errors
    containerRef.current.innerHTML = '';
    
    const wrapper = document.createElement('div');
    containerRef.current.appendChild(wrapper);

    try {
      window.grecaptcha.render(wrapper, {
        sitekey: siteKey,
        callback: (token) => {
          onChange({ id: 'recaptcha', captchaAnswer: token });
        },
        'expired-callback': () => {
          onChange({ id: 'recaptcha', captchaAnswer: '' });
        },
        'error-callback': () => {
          onChange({ id: 'recaptcha', captchaAnswer: '' });
        }
      });
    } catch (err) {
      console.error("Error rendering reCAPTCHA:", err);
    }
  }, [scriptLoaded, onChange]);

  return (
    <div className="captcha-container">
      <div ref={containerRef} className="g-recaptcha-wrapper"></div>
      {errors?.captcha && <div className="field-error-text" style={{ marginTop: '0.4rem' }}>{errors.captcha}</div>}
    </div>
  );
};

export default Captcha;
