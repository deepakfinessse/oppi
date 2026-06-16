import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import './ThankYou.css';
import { clearSession } from '../../services/api';

export default function ThankYou() {
  const navigate = useNavigate();
  const confettiRef = useRef(null);

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
    // <DashboardLayout title="Thank You" class Name="thank-you-wrapper">
    <DashboardLayout title='Application Submitted' headerActions={(
                <>
                  <button className="btn-action" onClick={handleChangePassword}>Change Password</button>
                  <button className="btn-logout" onClick={handleLogout}>Log Out</button>
                </>
              )}
            //   className={isMine ? 'applicant-dashboard' : 'review-dashboard'}
            >
    <div className="thank-you-page">
      <div className="confetti-container" ref={confettiRef} />

      {/* Rope system */}
      <div className="rope-center" />
      <div className="rope-left" />
      <div className="rope-right" />

      {/* Hanging board */}
      <div className="board-sway">
        <div className="board-frame">
          <div className="board-surface">
            {/* Corner pins */}
            <div className="pin pin-tl" />
            <div className="pin pin-tr" />
            <div className="pin pin-bl" />
            <div className="pin pin-br" />

            <div className="board-content">
              <div className="board-emoji">🙌</div>
              <h1 className="board-heading">Thank you!</h1>
              <p className="board-sub">Your application has been</p>
              <p className="board-highlight">submitted successfully ✓</p>
              <button
                type="button"
                className="board-btn"
                onClick={() => navigate('/home')}
              >
                Return to home →
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}
