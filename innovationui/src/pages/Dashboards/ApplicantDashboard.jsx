import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, clearSession, formatIST } from '../../services/api';
import JSZip from 'jszip';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import './Dashboards.css';
import { ArrowRight } from 'lucide-react';

export default function ApplicantDashboard() {
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchApp = async () => {
      try {
        const data = await api.getPreview();
        setApp(data);
      } catch (err) {
        setError('Failed to load application', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchApp();
  }, []);

  const handleLogout = () => {
    clearSession();
    navigate('/');
  };


  if (loading) return <div className="dashboard-loading">Loading your dashboard...</div>;
  if (error || !app) return <div className="dashboard-error">{error || 'Application not found'}</div>;

  return (
    <DashboardLayout
      title="Applicant Dashboard"
      headerActions={
        <>
          <button className="btn-action" onClick={() => navigate('/change-password')}>Change Password</button>
          <button className="btn-logout" onClick={handleLogout}>Log Out <ArrowRight size={16} /></button>
        </>
      }
      className="applicant-dashboard"
    >
      <div className="dashboard-content" style={{ maxWidth: '800px', margin: '60px auto' }}>
        <div className="application-card" style={{ padding: '40px', background: 'white', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          
          <div className="dashboard-page-heading" style={{ marginBottom: '30px' }}>
            <h2 className="dashboard-page-title">Welcome, {app.user_name || app.personal_info?.companyName || 'Applicant'}!</h2>
            <p className="dashboard-page-subtitle">Thank you for participating in the OPPI Innovation Award.</p>
          </div>

          <div style={{ background: '#f8fafc', padding: '30px', borderRadius: '12px', marginBottom: '30px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ color: '#475467', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px' }}>Current Application Status</h3>
            <div style={{ 
              display: 'inline-block', 
              padding: '10px 24px', 
              borderRadius: '30px', 
              fontSize: '1.2rem', 
              fontWeight: 'bold', 
              background: app.status?.toUpperCase() === 'SUBMITTED' || app.status?.toUpperCase() === 'VALIDATOR_APPROVED' || app.status?.toUpperCase() === 'JURY_APPROVED' ? '#ecfdf3' : (app.status?.toUpperCase().includes('REJECTED') ? '#fef2f2' : '#eff8ff'), 
              color: app.status?.toUpperCase() === 'SUBMITTED' || app.status?.toUpperCase() === 'VALIDATOR_APPROVED' || app.status?.toUpperCase() === 'JURY_APPROVED' ? '#027a48' : (app.status?.toUpperCase().includes('REJECTED') ? '#b91c1c' : '#175cd3'), 
              border: `1px solid ${app.status?.toUpperCase() === 'SUBMITTED' || app.status?.toUpperCase() === 'VALIDATOR_APPROVED' || app.status?.toUpperCase() === 'JURY_APPROVED' ? '#abefc6' : (app.status?.toUpperCase().includes('REJECTED') ? '#fecaca' : '#b2ddff')}` 
            }}>
              {app.status ? app.status.replace('_', ' ') : ''}
            </div>

            {app.status?.toUpperCase().includes('REJECTED') && app.remarks && (
              <div style={{ marginTop: '20px', padding: '15px', background: '#fff', borderLeft: '4px solid #ef4444', borderRadius: '4px', textAlign: 'left', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <strong style={{ color: '#b91c1c', display: 'block', marginBottom: '5px' }}>Reason for Rejection:</strong>
                <p style={{ margin: 0, color: '#475467', fontStyle: 'italic', fontSize: '0.95rem', lineHeight: '1.4' }}>{app.remarks}</p>
              </div>
            )}

            {app.submitted_at && (
              <p style={{ marginTop: '15px', color: '#666', fontSize: '0.95rem' }}>
                Submitted on: {formatIST(app.submitted_at)}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '400px', margin: '0 auto' }}>
            {/* <button className="btn-action approve" style={{ padding: '15px', fontSize: '1.1rem', borderRadius: '8px' }} onClick={() => navigate('/my-application/details')}> */}
            <button className="btn-action approve" style={{ padding: '15px', fontSize: '1.1rem', borderRadius: '8px' }} onClick={() => navigate('/thank-you')}>

              View & Download Application
            </button>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
