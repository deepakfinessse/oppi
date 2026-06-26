import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, clearSession } from '../../services/api';
import { Eye, ArrowRight } from 'lucide-react';
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
  const [remarks, setRemarks] = useState('');
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

  const handleApprove = async (id) => {
    setSelectedAppId(id);
    const app = apps.find(a => a.id === id);
    if (app && app.draft_scores) {
      setScores({
        innovationIp: app.draft_scores.innovationIpScore || 0,
        teamStrength: app.draft_scores.teamStrengthScore || 0,
        businessPlan: app.draft_scores.businessPlanScore || 0,
        impact: app.draft_scores.impactScore || 0
      });
      setRemarks(app.draft_scores.remarks || '');
    } else {
      setScores({ innovationIp: 0, teamStrength: 0, businessPlan: 0, impact: 0 });
      setRemarks('');
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAppId(null);
    setRemarks('');
  };

  const WEIGHTS = {
    innovationIp: 0.3,
    teamStrength: 0.2,
    businessPlan: 0.2,
    impact: 0.3
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

  const submitScores = async (isDraft = false) => {
    if (!isDraft) {
      if (!scores.innovationIp || !scores.teamStrength || !scores.businessPlan || !scores.impact) {
        alert('Please provide all scores before approving.');
        return;
      }
      if (!remarks.trim()) {
        alert('Remarks are mandatory for approval. Please provide proper remarks before approving.');
        return;
      }
    }

    try {
      setSubmitting(true);
      await api.juryApprove(selectedAppId, {
        innovationIpScore: scores.innovationIp,
        teamStrengthScore: scores.teamStrength,
        businessPlanScore: scores.businessPlan,
        impactScore: scores.impact,
        isDraft: isDraft,
        remarks: remarks
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
        className="jury-dashboard-page"
        headerActions={<button className="btn-logout" onClick={handleLogout}>Log Out <ArrowRight size={16} /></button>}
      >
        <div className="dashboard-content">
          {error && <div className="dashboard-error">{error}</div>}
          <br />
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
                          <button className="btn-action view" onClick={() => navigate(`/review/${a.id}`)} title="View Application">
                            <Eye size={16} />
                          </button>
                          <button className="btn-action approve" onClick={() => handleApprove(a.id)}>Approve</button>
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

            <div className="jury-remarks-section" style={{ marginTop: '10px', marginBottom: '10px' }}>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px', fontSize: '0.9rem', color: '#1e293b', textAlign: 'left' }}>
                Remarks / Comments (Mandatory for Approval) *
              </label>
              <textarea
                style={{
                  width: '100%',
                  minHeight: '60px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  padding: '8px 12px',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter jury remarks..."
              />
            </div>

            <div className="modal-actions">
              <button className="btn-action view" onClick={closeModal}>Cancel</button>
              <button
                className="btn-action save"
                onClick={() => submitScores(true)}
                disabled={submitting}
              >
                Save & Exit
              </button>
              <button
                className="btn-action approve"
                onClick={() => submitScores(false)}
                disabled={submitting}
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
