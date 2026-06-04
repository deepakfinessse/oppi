import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, clearSession } from '../../services/api';
import oppiLogo from '../../assets/OPPI-logo-black.png';
import './Dashboards.css';

export default function ValidatorDashboard() {
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      const data = await api.getValidatorApps();
      setApps(data);
    } catch (err) {
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    if (!window.confirm(`Are you sure you want to ${action.toLowerCase()} this application?`)) return;
    try {
      if (action === 'Approve') await api.validatorApprove(id);
      else await api.validatorReject(id);
      fetchApps();
    } catch (err) {
      alert(`Failed to ${action.toLowerCase()}`);
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate('/auth');
  };

  if (loading) return <div className="dashboard-loading">Loading Validator Dashboard...</div>;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="dashboard-logo">
          <img src={oppiLogo} alt="OPPI Logo" />
          <span>Validator</span>
        </div>
        <button className="btn-logout" onClick={handleLogout}>Log Out</button>
      </div>

      <div className="dashboard-content">
        {error && <div className="dashboard-error">{error}</div>}

        <div className="dashboard-section">
          <h3>Pending Applications for Validation ({apps.length})</h3>
          <div className="table-responsive">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>App ID</th>
                  <th>Applicant</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {apps.map(a => (
                  <tr key={a.id}>
                    <td>{a.id}</td>
                    <td>{a.user_name}</td>
                    <td>{a.user_email}</td>
                    <td>{a.company || '—'}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-action view" onClick={() => navigate(`/review/${a.id}`)}>View</button>
                        <button className="btn-action approve" onClick={() => handleAction(a.id, 'Approve')}>Approve</button>
                        <button className="btn-action reject" onClick={() => handleAction(a.id, 'Reject')}>Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {apps.length === 0 && <tr><td colSpan="5" className="text-center">No pending applications.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
