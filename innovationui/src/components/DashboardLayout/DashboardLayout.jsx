import React from 'react';
import oppiLogo from '../../assets/OPPI-logo-black.png';
import Footer from '../Footer/Footer';
import './DashboardLayout.css';

export default function DashboardLayout({ title, headerActions, children, className }) {
  return (
    <div className={`dashboard-page ${className || ''}`.trim()}>
      <header className="dashboard-header no-print">
        <div className="dashboard-logo">
          <img src={oppiLogo} alt="OPPI Logo" />
          <span>{title || 'Dashboard'}</span>
        </div>
        <div className="dashboard-header-actions">
          {headerActions}
        </div>
      </header>

      <main className="dashboard-content">
        {children}
      </main>

      <Footer />
    </div>
  );
}
