import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, clearSession, getSession } from '../../services/api';
import { Eye, ArrowRight } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import './Dashboards.css';

export default function ValidatorDashboard() {
  const navigate = useNavigate();
  const session = getSession();
  const userName = session ? `${session.first_name || ''} ${session.last_name || ''}`.trim() : '';

  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('approved');

  // Scoring modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [scores, setScores] = useState({ innovationIp: 0, teamStrength: 0, businessPlan: 0, impact: 0 });
  const [remarks, setRemarks] = useState('');
  const [remarksError, setRemarksError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reject Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectAppId, setRejectAppId] = useState(null);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [rejectError, setRejectError] = useState('');

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
      setRemarksError('');
      setShowModal(true);
    } else {
      setRejectAppId(id);
      setRejectRemarks('');
      setRejectError('');
      setRejectModalOpen(true);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAppId(null);
    setRemarks('');
    setRemarksError('');
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

  const submitScores = async (isDraft = false) => {
    setRemarksError('');
    if (!isDraft) {
      if (!scores.innovationIp || !scores.teamStrength || !scores.businessPlan || !scores.impact) {
        alert('Please provide all scores before approving.');
        return;
      }
      if (!remarks.trim()) {
        setRemarksError('Remarks are mandatory for approval. Please provide proper remarks before approving.');
        return;
      }
    }

    try {
      setSubmitting(true);
      await api.validatorApprove(selectedAppId, {
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
      alert(err.message || 'Failed to submit validator review');
    } finally {
      setSubmitting(false);
    }
  };

  const submitReject = async () => {
    setRejectError('');
    if (!rejectRemarks.trim()) {
      setRejectError('Remarks are mandatory for rejection.');
      return;
    }
    try {
      setSubmitting(true);
      await api.validatorReject(rejectAppId, { remarks: rejectRemarks });
      setRejectModalOpen(false);
      fetchApps();
    } catch (err) {
      alert(err.message || 'Failed to reject application');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate('/auth');
  };

  const pendingApps = apps.filter(a => !a.is_approved && a.status?.toUpperCase() !== 'VALIDATOR_REJECTED');
  const approvedApps = apps.filter(a => a.is_approved);
  const rejectedApps = apps.filter(a => a.status?.toUpperCase() === 'VALIDATOR_REJECTED');

  if (loading) return <div className="dashboard-loading">Loading...</div>;

  return (
    <>
      <DashboardLayout
        title={userName || "Validator Dashboard"}
        className="validator-dashboard-page"
        headerActions={<button className="btn-logout" onClick={handleLogout}>Log Out <ArrowRight size={16} /></button>}
      >
        <div className="dashboard-content">
          {error && <div className="dashboard-error">{error}</div>}
          <br />
          <div className="dashboard-section">
            <h3>Pending Applications for Validation ({pendingApps.length})</h3>
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
                  {pendingApps.map(a => (
                    <tr key={a.id}>
                      <td>{a.id}</td>
                      <td>{a.user_name}</td>
                      <td>{a.user_email}</td>
                      <td>{a.company || '—'}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-action view" onClick={() => navigate(`/review/${a.id}`)} title="View Application">
                            <Eye size={16} />
                          </button>
                          <button className="btn-action approve" onClick={() => handleAction(a.id, 'Approve')}>Scores</button>
                          <button className="btn-action reject" onClick={() => handleAction(a.id, 'Reject')}>Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pendingApps.length === 0 && <tr><td colSpan="5" className="text-center">No pending applications.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="dashboard-section" style={{ marginTop: '30px' }}>
            <div className="dashboard-tabs" style={{ display: 'flex', gap: '15px', borderBottom: '2px solid #e2e8f0', marginBottom: '20px' }}>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
                style={{
                  padding: '10px 20px',
                  fontWeight: '600',
                  fontSize: '1rem',
                  border: 'none',
                  background: 'none',
                  borderBottom: activeTab === 'approved' ? '2px solid #2563eb' : '2px solid transparent',
                  color: activeTab === 'approved' ? '#2563eb' : '#64748b',
                  cursor: 'pointer',
                  marginBottom: '-2px',
                  transition: 'all 0.2s'
                }}
                onClick={() => setActiveTab('approved')}
              >
                Approved Applications ({approvedApps.length})
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'rejected' ? 'active' : ''}`}
                style={{
                  padding: '10px 20px',
                  fontWeight: '600',
                  fontSize: '1rem',
                  border: 'none',
                  background: 'none',
                  borderBottom: activeTab === 'rejected' ? '2px solid #ef4444' : '2px solid transparent',
                  color: activeTab === 'rejected' ? '#ef4444' : '#64748b',
                  cursor: 'pointer',
                  marginBottom: '-2px',
                  transition: 'all 0.2s'
                }}
                onClick={() => setActiveTab('rejected')}
              >
                Rejected Applications ({rejectedApps.length})
              </button>
            </div>

            {activeTab === 'approved' ? (
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
                    {approvedApps.map(a => (
                      <tr key={a.id}>
                        <td>{a.id}</td>
                        <td>{a.user_name}</td>
                        <td>{a.user_email}</td>
                        <td>{a.company || '—'}</td>
                        <td>
                          <div className="action-buttons">
                            <button className="btn-action view" onClick={() => navigate(`/review/${a.id}`)} title="View Application">
                              <Eye size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {approvedApps.length === 0 && <tr><td colSpan="5" className="text-center">No approved applications.</td></tr>}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>App ID</th>
                      <th>Applicant</th>
                      <th>Email</th>
                      <th>Company</th>
                      <th>Rejection Remarks</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rejectedApps.map(a => (
                      <tr key={a.id}>
                        <td>{a.id}</td>
                        <td>{a.user_name}</td>
                        <td>{a.user_email}</td>
                        <td>{a.company || '—'}</td>
                        <td style={{ color: '#ef4444', fontStyle: 'italic', maxWidth: '300px', wordBreak: 'break-word' }}>
                          {a.remarks || '—'}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button className="btn-action view" onClick={() => navigate(`/review/${a.id}`)} title="View Application">
                              <Eye size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {rejectedApps.length === 0 && <tr><td colSpan="6" className="text-center">No rejected applications.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
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
                  border: remarksError ? '1px solid #ef4444' : '1px solid #cbd5e1',
                  padding: '8px 12px',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
                value={remarks}
                onChange={(e) => {
                  setRemarks(e.target.value);
                  if (e.target.value.trim() && remarksError) {
                    setRemarksError('');
                  }
                }}
                placeholder="Enter validation remarks..."
              />
              {remarksError && (
                <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '5px', textAlign: 'left', fontWeight: '500' }}>
                  {remarksError}
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn-action view" onClick={closeModal}>Cancel</button>
              <button
                className="btn-action save"
                onClick={() => submitScores(true)}
                disabled={submitting}
              >
                Save as Draft
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

      {rejectModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container jury-modal-compact" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3>Reject Application #{rejectAppId}</h3>
              <button className="modal-close-btn" onClick={() => setRejectModalOpen(false)}>&times;</button>
            </div>

            <div className="jury-remarks-section" style={{ marginTop: '10px', marginBottom: '10px' }}>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px', fontSize: '0.9rem', color: '#1e293b', textAlign: 'left' }}>
                Reason for Rejection (Mandatory) *
              </label>
              <textarea
                style={{
                  width: '100%',
                  minHeight: '80px',
                  borderRadius: '6px',
                  border: rejectError ? '1px solid #ef4444' : '1px solid #cbd5e1',
                  padding: '8px 12px',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
                value={rejectRemarks}
                onChange={(e) => {
                  setRejectRemarks(e.target.value);
                  if (e.target.value.trim() && rejectError) {
                    setRejectError('');
                  }
                }}
                placeholder="Please explain why this application is being rejected..."
              />
              {rejectError && (
                <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '5px', textAlign: 'left', fontWeight: '500' }}>
                  {rejectError}
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn-action view" onClick={() => setRejectModalOpen(false)}>Cancel</button>
              <button
                className="btn-action reject"
                onClick={submitReject}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
