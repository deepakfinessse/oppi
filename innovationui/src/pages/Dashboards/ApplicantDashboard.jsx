import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, clearSession } from '../../services/api';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import html2pdf from 'html2pdf.js';
import oppiLogo from '../../assets/OPPI-logo-black.png';
import './Dashboards.css';

export default function ApplicantDashboard() {
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchApp = async () => {
      try {
        const data = await api.getPreview();
        setApp(data);
      } catch (err) {
        setError('Failed to load application');
      } finally {
        setLoading(false);
      }
    };
    fetchApp();
  }, []);

  const handleLogout = () => {
    clearSession();
    navigate('/auth');
  };

  const handleDownloadZip = async () => {
    // We will navigate to a hidden printable view to generate the zip, or generate it directly.
    // For simplicity, we can route them to the detailed view for downloading, or do it here.
    navigate('/my-application/details');
  };

  if (loading) return <div className="dashboard-loading">Loading your dashboard...</div>;
  if (error || !app) return <div className="dashboard-error">{error || 'Application not found'}</div>;

  return (
    <div className="dashboard-page" style={{ background: '#f5f8fc', minHeight: '100vh' }}>
      <div className="dashboard-header">
        <div className="dashboard-logo">
          <img src={oppiLogo} alt="OPPI Logo" />
          <span>Applicant Dashboard</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-action" onClick={() => navigate('/change-password')}>Change Password</button>
          <button className="btn-logout" onClick={handleLogout}>Log Out</button>
        </div>
      </div>

      <div className="dashboard-content" style={{ maxWidth: '800px', margin: '60px auto' }}>
        <div className="application-card" style={{ padding: '40px', background: 'white', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '2.2rem', color: '#1a1a1a', marginBottom: '10px' }}>Welcome, {app.user_name || app.personal_info?.companyName || 'Applicant'}!</h2>
            <p style={{ color: '#666', fontSize: '1.1rem' }}>Thank you for participating in the OPPI Innovation Awards.</p>
          </div>

          <div style={{ background: '#f8fafc', padding: '30px', borderRadius: '12px', marginBottom: '30px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ color: '#475467', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px' }}>Current Application Status</h3>
            <div style={{ display: 'inline-block', padding: '10px 24px', borderRadius: '30px', fontSize: '1.2rem', fontWeight: 'bold', background: app.status === 'SUBMITTED' ? '#ecfdf3' : '#eff8ff', color: app.status === 'SUBMITTED' ? '#027a48' : '#175cd3', border: `1px solid ${app.status === 'SUBMITTED' ? '#abefc6' : '#b2ddff'}` }}>
              {app.status.replace('_', ' ')}
            </div>
            <p style={{ marginTop: '15px', color: '#666', fontSize: '0.95rem' }}>
              Submitted on: {new Date(app.submitted_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '400px', margin: '0 auto' }}>
            <button className="btn-action approve" style={{ padding: '15px', fontSize: '1.1rem', borderRadius: '8px' }} onClick={() => navigate('/my-application/details')}>
              View & Download Application
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
