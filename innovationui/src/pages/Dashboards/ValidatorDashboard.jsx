import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, clearSession } from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import './Dashboards.css';

export default function ValidatorDashboard() {
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Scoring modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [scores, setScores] = useState({ innovationIp: 0, teamStrength: 0, businessPlan: 0, impact: 0 });
  const [submitting, setSubmitting] = useState(false);

  const fetchApps = useCallback(async () => {
    try {
      const data = await api.getValidatorApps();
      setApps(data);
    } catch (err) {
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const handleAction = async (id, action) => {
    if (action === 'Approve') {
      setSelectedAppId(id);
      setScores({ innovationIp: 0, teamStrength: 0, businessPlan: 0, impact: 0 });
      setShowModal(true);
    } else {
      if (!window.confirm(`Are you sure you want to reject this application?`)) return;
      try {
        await api.validatorReject(id);
        fetchApps();
      } catch (err) {
        alert('Failed to reject application');
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAppId(null);
  };

  const WEIGHTS = {
    innovationIp: 0.25,
    teamStrength: 0.25,
    businessPlan: 0.25,
    impact: 0.25
  };

  const calculateWeightedScore = () => {
    const { innovationIp, teamStrength, businessPlan, impact } = scores;
    if (!innovationIp || !teamStrength || !businessPlan || !impact) return '0.00';
    return (
      innovationIp * WEIGHTS.innovationIp +
      teamStrength * WEIGHTS.teamStrength +
      businessPlan * WEIGHTS.businessPlan +
      impact * WEIGHTS.impact
    ).toFixed(2);
  };

  const submitScores = async () => {
    try {
      setSubmitting(true);
      await api.validatorApprove(selectedAppId, {
        innovationIpScore: scores.innovationIp,
        teamStrengthScore: scores.teamStrength,
        businessPlanScore: scores.businessPlan,
        impactScore: scores.impact
      });
      closeModal();
      fetchApps();
    } catch (err) {
      alert(err.message || 'Failed to submit validator review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate('/auth');
  };

  if (loading) return <div className="dashboard-loading">Loading Validator Dashboard...</div>;

  return (
    <>
      <DashboardLayout
        title="Validator Dashboard"
        headerActions={<button className="btn-logout" onClick={handleLogout}>Log Out</button>}
      >
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
      </DashboardLayout>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container jury-modal-compact">
            <div className="modal-header">
              <h3>Score Application #{selectedAppId}</h3>
              <button className="modal-close-btn" onClick={closeModal}>&times;</button>
            </div>

            <div className="jury-criteria-list">
              {[
                { key: 'innovationIp', label: 'Innovation & IP', desc: 'Quality and novelty of the innovation and associated IP', weight: WEIGHTS.innovationIp },
                { key: 'teamStrength', label: 'Founding Team', desc: 'Strength of the founding team', weight: WEIGHTS.teamStrength },
                { key: 'businessPlan', label: 'Business Plan', desc: 'The Business Plan (market potential)', weight: WEIGHTS.businessPlan },
                { key: 'impact', label: 'Impact', desc: 'Impact (short term & long term)', weight: WEIGHTS.impact },
              ].map(c => (
                <div className="jury-criterion" key={c.key}>
                  <div className="jury-criterion-top">
                    <span className="jury-criterion-label">{c.label}</span>
                    <span className="jury-criterion-weight">×{c.weight}</span>
                  </div>
                  <div className="jury-criterion-bottom">
                    <div className="jury-score-btns">
                      {[1, 3, 5].map(val => (
                        <button
                          key={val}
                          type="button"
                          className={`jury-score-btn ${scores[c.key] === val ? 'active' : ''}`}
                          onClick={() => setScores(prev => ({ ...prev, [c.key]: val }))}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                    <span className="jury-criterion-result">
                      {scores[c.key] ? (scores[c.key] * c.weight).toFixed(2) : '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="jury-total-row">
              <span>Weighted Total</span>
              <span className="jury-total-val">{calculateWeightedScore()}</span>
            </div>

            <div className="modal-actions">
              <button className="btn-action view" onClick={closeModal}>Cancel</button>
              <button
                className="btn-action approve"
                onClick={submitScores}
                disabled={submitting || !scores.innovationIp || !scores.teamStrength || !scores.businessPlan || !scores.impact}
              >
                {submitting ? 'Submitting...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
