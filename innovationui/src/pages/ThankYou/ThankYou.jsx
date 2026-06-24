import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSession, clearSession, getApplicationStorageKey, api } from '../../services/api';
import oppiLogo from '../../assets/OPPI-logo-black.png';
import '../ApplicationForm/ApplicationForm.css';
import './ThankYou.css';
import { ArrowRight } from 'lucide-react';

export default function ThankYou() {
  const navigate = useNavigate();
  const session = getSession();
  const confettiRef = useRef(null);

  const [applicationId, setApplicationId] = useState(() => {
    if (!session?.userId) return null;
    return localStorage.getItem(getApplicationStorageKey(session.userId));
  });

  // Try to fetch application ID from API if not in localStorage
  useEffect(() => {
    if (!applicationId && session?.token) {
      api.getPreview().then((data) => {
        if (data?.id) {
          setApplicationId(String(data.id));
        }
      }).catch(() => {});
    }
  }, [applicationId, session?.token]);

  useEffect(() => {
    const container = confettiRef.current;
    if (!container) return;
    const colors = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF6FC8', '#A78BFA', '#FB923C'];
    const pieces = [];
    for (let i = 0; i < 30; i++) {
      const el = document.createElement('div');
      el.className = 'confetti-piece';
      el.style.left = Math.random() * 100 + '%';
      el.style.background = colors[Math.floor(Math.random() * colors.length)];
      el.style.animationDuration = (2.5 + Math.random() * 3) + 's';
      el.style.animationDelay = (Math.random() * 4) + 's';
      el.style.width = (6 + Math.random() * 8) + 'px';
      el.style.height = (6 + Math.random() * 8) + 'px';
      el.style.borderRadius = Math.random() > 0.5 ? '50%' : '3px';
      container.appendChild(el);
      pieces.push(el);
    }
    return () => pieces.forEach(el => el.remove());
  }, []);

  const handleLogout = () => {
    clearSession();
    navigate('/auth');
  };

  const handleChangePassword = () => {
    navigate('/change-password');
  };

  return (
    <div className="application-page">
      <div className="application-header-wrapper">
        <header className="application-header-bar no-print">
          <div className="application-header-logo">
            <img src={oppiLogo} alt="OPPI Logo" />
          </div>
          <div className="application-header-actions">
            {applicationId && (
              <span className="application-id-badge">Application ID: {applicationId}</span>
            )}
            <button type="button" className="btn-header change-pwd" onClick={handleChangePassword}>CHANGE PASSWORD</button>
            <button type="button" className="btn-header logout" onClick={handleLogout}>LOG OUT <ArrowRight size={16} /></button>
          </div>
        </header>
      </div>

      <div className="application-container">
        <div className="application-content-wrapper">
          <div className="application-card">
            <div className="thank-you-content" ref={confettiRef}>
              <div className="thank-you">
                <h2>Thank you for your submission!</h2>
                <p>Your application has been submitted successfully.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
