import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, clearSession } from '../../services/api';
import oppiLogo from '../../assets/OPPI-logo-black.png';
import './Dashboards.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [uRes, aRes] = await Promise.all([
          api.getAdminUsers(),
          api.getAdminApps()
        ]);
        setUsers(uRes);
        setApps(aRes);
      } catch (err) {
        setError('Failed to fetch data or unauthorized.');
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  const handleLogout = () => {
    clearSession();
    navigate('/auth');
  };

  if (loading) return <div className="dashboard-loading">Loading Admin Dashboard...</div>;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="dashboard-logo">
          <img src={oppiLogo} alt="OPPI Logo" />
          <span>Admin</span>
        </div>
        <button className="btn-logout" onClick={handleLogout}>Log Out</button>
      </div>

      <div className="dashboard-content">
        {error && <div className="dashboard-error">{error}</div>}

        <div className="dashboard-section">
          <h3>Registered Users ({users.length})</h3>
          <div className="table-responsive">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.firstName} {u.lastName}</td>
                    <td>{u.email}</td>
                    <td>{u.mobile}</td>
                    <td><span className={`role-badge ${u.role.toLowerCase()}`}>{u.role}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="dashboard-section">
          <h3>Submitted Applications ({apps.length})</h3>
          <div className="table-responsive">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>App ID</th>
                  <th>Applicant</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Jury Approvals / Avg Score</th>
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
                    <td><span className={`status-badge ${a.status.toLowerCase().replace('_', '-')}`}>{a.status}</span></td>
                    <td>
                      {a.jury_approval_count > 0 ? (
                        <span>
                          <strong>{a.jury_approval_count}/3</strong> ({a.average_score ? a.average_score.toFixed(2) : '0.00'})
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>0/3 (—)</span>
                      )}
                    </td>
                    <td>
                      <button className="btn-action view" onClick={() => navigate(`/review/${a.id}`)}>View</button>
                    </td>
                  </tr>
                ))}
                {apps.length === 0 && <tr><td colSpan="7" className="text-center">No applications found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
