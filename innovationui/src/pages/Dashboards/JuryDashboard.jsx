import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, clearSession } from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import './Dashboards.css';

export default function JuryDashboard() {
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
      const data = await api.getJuryApps();
      setApps(data);
    } catch (err) {
      setError('Failed to load applications', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
        await api.juryReject(id);
        fetchApps();
      } catch (err) {
        alert('Failed to reject application', err.message);
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAppId(null);
  };

  const calculateWeightedScore = () => {
    const { innovationIp, teamStrength, businessPlan, impact } = scores;
    if (!innovationIp || !teamStrength || !businessPlan || !impact) return '0.00';
    return ((innovationIp + teamStrength + businessPlan + impact) / 4.0).toFixed(2);
  };

  const submitScores = async () => {
    try {
      setSubmitting(true);
      await api.juryApprove(selectedAppId, {
        innovationIpScore: scores.innovationIp,
        teamStrengthScore: scores.teamStrength,
        businessPlanScore: scores.businessPlan,
        impactScore: scores.impact
      });
      closeModal();
      fetchApps();
    } catch (err) {
      alert(err.message || 'Failed to submit jury review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate('/auth');
  };

  if (loading) return <div className="dashboard-loading">Loading Jury Dashboard...</div>;

  return (
    <>
      <DashboardLayout
        title="Jury Dashboard"
        headerActions={<button className="btn-logout" onClick={handleLogout}>Log Out</button>}
      >
        <div className="dashboard-content">
          {error && <div className="dashboard-error">{error}</div>}

          <div className="dashboard-section">
            <h3>Applications Pending Final Approval ({apps.length})</h3>
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>App ID</th>
                    <th>Applicant</th>
                    <th>Company</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map(a => (
                    <tr key={a.id}>
                      <td>{a.id}</td>
                      <td>{a.user_name}</td>
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
                  {apps.length === 0 && <tr><td colSpan="4" className="text-center">No pending applications.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DashboardLayout>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Score & Approve Application #{selectedAppId}</h3>
              <button className="modal-close-btn" onClick={closeModal}>&times;</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="rating-group">
                <div className="rating-label">
                  <span>Innovation & IP</span>
                  <span>{scores.innovationIp || '—'} / 5</span>
                </div>
                <div className="rating-desc">Quality and novelty of the innovation and associated IP</div>
                <div className="rating-selector">
                  {[1, 2, 3, 4, 5].map(val => (
                    <button
                      key={val}
                      type="button"
                      className={`rating-btn ${scores.innovationIp === val ? 'active' : ''}`}
                      onClick={() => setScores(prev => ({ ...prev, innovationIp: val }))}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rating-group">
                <div className="rating-label">
                  <span>Founding Team</span>
                  <span>{scores.teamStrength || '—'} / 5</span>
                </div>
                <div className="rating-desc">Strength of the founding team</div>
                <div className="rating-selector">
                  {[1, 2, 3, 4, 5].map(val => (
                    <button
                      key={val}
                      type="button"
                      className={`rating-btn ${scores.teamStrength === val ? 'active' : ''}`}
                      onClick={() => setScores(prev => ({ ...prev, teamStrength: val }))}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rating-group">
                <div className="rating-label">
                  <span>Business Plan</span>
                  <span>{scores.businessPlan || '—'} / 5</span>
                </div>
                <div className="rating-desc">The Business Plan (market potential)</div>
                <div className="rating-selector">
                  {[1, 2, 3, 4, 5].map(val => (
                    <button
                      key={val}
                      type="button"
                      className={`rating-btn ${scores.businessPlan === val ? 'active' : ''}`}
                      onClick={() => setScores(prev => ({ ...prev, businessPlan: val }))}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rating-group">
                <div className="rating-label">
                  <span>Impact</span>
                  <span>{scores.impact || '—'} / 5</span>
                </div>
                <div className="rating-desc">Impact (short term & long term)</div>
                <div className="rating-selector">
                  {[1, 2, 3, 4, 5].map(val => (
                    <button
                      key={val}
                      type="button"
                      className={`rating-btn ${scores.impact === val ? 'active' : ''}`}
                      onClick={() => setScores(prev => ({ ...prev, impact: val }))}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="weighted-score-display">
                <span>Calculated Total Score (Weights: 25% each)</span>
                <span className="weighted-score-val">{calculateWeightedScore()}</span>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-action view" onClick={closeModal}>Cancel</button>
              <button
                className="btn-action approve"
                onClick={submitScores}
                disabled={submitting || !scores.innovationIp || !scores.teamStrength || !scores.businessPlan || !scores.impact}
              >
                {submitting ? 'Submitting...' : 'Submit Approval'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
