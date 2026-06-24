import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronDown, Download, Eye, Edit } from 'lucide-react';
import { api, clearSession, getFileUrl, formatIST } from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import './Dashboards.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [apps, setApps] = useState([]);
  const [juryMembers, setJuryMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dropdown & Filter States
  const [userFilter, setUserFilter] = useState('USER');
  const [appFilter, setAppFilter] = useState('ALL');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [appDropdownOpen, setAppDropdownOpen] = useState(false);

  // User edit modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userForm, setUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    role: 'USER',
    password: ''
  });
  const [userModalError, setUserModalError] = useState('');
  const [userModalSubmitting, setUserModalSubmitting] = useState(false);

  // Jury edit modal states
  const [showJuryModal, setShowJuryModal] = useState(false);
  const [selectedJuryMember, setSelectedJuryMember] = useState(null);
  const [juryForm, setJuryForm] = useState({
    name: '',
    email: '',
    role: '',
    type: 'JURY',
    sortOrder: 0,
    password: '',
    imageFile: null
  });
  const [juryModalError, setJuryModalError] = useState('');
  const [juryModalSubmitting, setJuryModalSubmitting] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');

  // Auto cleanup for preview object URL on unmount/change
  useEffect(() => {
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);


  // Dropdown Refs
  const userDropdownRef = useRef(null);
  const appDropdownRef = useRef(null);

  const fetchAdminData = useCallback(async () => {
    try {
      const [uRes, aRes, jRes] = await Promise.all([
        api.getAdminUsers(),
        api.getAdminApps(),
        api.getJuryMembers()
      ]);
      setUsers(uRes);
      setApps(aRes);
      setJuryMembers(jRes || []);
    } catch (err) {
      setError('Failed to fetch data or unauthorized.');
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setUserForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      mobile: user.mobile || '',
      role: user.role || 'USER',
      password: ''
    });
    setUserModalError('');
    setShowUserModal(true);
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setUserModalError('');
    setUserModalSubmitting(true);
    try {
      await api.updateAdminUser(selectedUser.id, {
        FirstName: userForm.firstName,
        LastName: userForm.lastName,
        Email: userForm.email,
        Mobile: userForm.mobile || null,
        Role: userForm.role,
        Password: userForm.password || null
      });
      setShowUserModal(false);
      fetchAdminData();
    } catch (err) {
      setUserModalError(err.message || 'Failed to update user.');
    } finally {
      setUserModalSubmitting(false);
    }
  };

  const handleEditJuryMember = (member) => {
    setSelectedJuryMember(member);
    setJuryForm({
      name: member.name || '',
      email: member.email || '',
      role: member.role || '',
      type: member.type || 'USER',
      sortOrder: member.sortOrder || 0,
      password: '',
      imageFile: null
    });
    if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl(member.imageUrl ? getFileUrl(member.imageUrl) : '');
    setJuryModalError('');
    setShowJuryModal(true);
  };

  const handleAddJuryMember = () => {
    setSelectedJuryMember(null);
    setJuryForm({
      name: '',
      email: '',
      role: '',
      type: 'JURY',
      sortOrder: 0,
      password: '',
      imageFile: null
    });
    if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl('');
    setJuryModalError('');
    setShowJuryModal(true);
  };

  const handleCloseJuryModal = () => {
    if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl('');
    setShowJuryModal(false);
  };

  const handleDeleteJuryMember = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await api.deleteJuryMember(id);
      fetchAdminData();
    } catch (err) {
      alert(err.message || 'Failed to delete jury member.');
    }
  };

  const handleJurySubmit = async (e) => {
    e.preventDefault();
    setJuryModalError('');

    // Validation for profile photo
    if (!selectedJuryMember && !juryForm.imageFile) {
      setJuryModalError('Profile Photo is mandatory.');
      return;
    }
    if (selectedJuryMember && !juryForm.imageFile && !selectedJuryMember.imageUrl) {
      setJuryModalError('Profile Photo is mandatory.');
      return;
    }

    setJuryModalSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', juryForm.name);
      formData.append('email', juryForm.email);
      formData.append('password', juryForm.password);
      formData.append('role', juryForm.role);
      formData.append('type', juryForm.type);
      formData.append('sortOrder', juryForm.sortOrder);
      if (juryForm.imageFile) {
        formData.append('image', juryForm.imageFile);
      }

      if (selectedJuryMember) {
        await api.updateJuryMember(selectedJuryMember.id, formData);
      } else {
        await api.createJuryMember(formData);
      }
      
      // Cleanup preview URL
      if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      setImagePreviewUrl('');
      setShowJuryModal(false);
      fetchAdminData();
    } catch (err) {
      setJuryModalError(err.message || 'Failed to save jury member.');
    } finally {
      setJuryModalSubmitting(false);
    }
  };


  // Click outside listener to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
      if (appDropdownRef.current && !appDropdownRef.current.contains(event.target)) {
        setAppDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    clearSession();
    navigate('/auth');
  };

  // Padded double-digit ID formatting (e.g. 01, 02)
  const formatId = (id) => {
    if (!id) return '';
    const numStr = String(id);
    if (/^\d+$/.test(numStr)) {
      return numStr.padStart(2, '0');
    }
    return numStr;
  };

  const totalJuries = juryMembers.filter(m => m.type === 'JURY').length;

  // Filter Registered Users
  const filteredUsers = users.filter(u => {
    if (u.role?.toUpperCase() === 'ADMIN') return false;
    if (userFilter === 'ALL') return true;
    return u.role?.toUpperCase() === userFilter;
  });

  // Filter Applications
  const filteredApps = apps.filter(a => {
    if (appFilter === 'ALL') return true;
    const statusUpper = a.status?.toUpperCase() || '';
    if (appFilter === 'DRAFT') return statusUpper === 'DRAFT';
    if (appFilter === 'SUBMITTED') return statusUpper === 'SUBMITTED';
    if (appFilter === 'UNDER_VALIDATOR_REVIEW') return statusUpper === 'UNDER_VALIDATOR_REVIEW';
    if (appFilter === 'VALIDATOR_APPROVED') return statusUpper === 'VALIDATOR_APPROVED';
    if (appFilter === 'VALIDATOR_REJECTED') return statusUpper === 'VALIDATOR_REJECTED';
    if (appFilter === 'UNDER_JURY_REVIEW') return statusUpper === 'UNDER_JURY_REVIEW';
    if (appFilter === 'JURY_APPROVED') return statusUpper === 'JURY_APPROVED';
    if (appFilter === 'JURY_REJECTED') return statusUpper === 'JURY_REJECTED';
    return true;
  });

  // Download filtered data as CSV
  const handleDownloadCSV = (data, type) => {
    let headers = [];
    let filename = '';

    if (type === 'users') {
      filename = `registered_users_${userFilter.toLowerCase()}.csv`;
      headers = [
        { label: 'ID', key: 'id', format: (v) => formatId(v) },
        { label: 'Name', key: 'name', format: (_, row) => `${row.firstName || ''} ${row.lastName || ''}`.trim() },
        { label: 'Email', key: 'email' },
        { label: 'Mobile', key: 'mobile' },
        { label: 'Role', key: 'role' }
      ];
    } else {
      filename = `submitted_applications_${appFilter.toLowerCase()}.csv`;
      headers = [
        { label: 'App ID', key: 'id', format: (v) => formatId(v) },
        { label: 'Name', key: 'user_name' },
        { label: 'Email', key: 'user_email' },
        { label: 'Company', key: 'company' },
        { label: 'Status', key: 'status' },
        { label: 'Submitted Date', key: 'submitted_at', format: (v) => formatIST(v) },
        { label: 'Validator Score', key: 'validator_score', format: (v) => v ? v.toFixed(2) : '—' },
        { label: 'Jury Score', key: 'jury_approval_count', format: (v, row) => `${v || 0}/${totalJuries || 3} (${row.average_score ? row.average_score.toFixed(2) : '—'})` }
      ];
    }

    const csvRows = [];
    // Header row
    csvRows.push(headers.map(h => `"${h.label}"`).join(','));

    // Data rows
    for (const row of data) {
      const values = headers.map(h => {
        let val = '';
        if (h.format) {
          val = h.format(row[h.key], row);
        } else {
          val = row[h.key];
        }
        const escaped = ('' + (val ?? '')).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    const csvContent = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="dashboard-loading">Loading Admin Dashboard...</div>;

  return (
    <DashboardLayout
      title="Admin Dashboard"
      className="admin-dashboard-page"
      headerActions={
        <button className="admin-btn-logout" onClick={handleLogout}>
          LOG OUT <ArrowRight size={16} />
        </button>
      }
    >
      <div className="dashboard-content">
        {error && <div className="dashboard-error">{error}</div>}
        <br />
        {/* <h1 className="admin-main-heading">Admin</h1> */}

        {/* Applications Section */}
        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h3>Applications ({String(filteredApps.length).padStart(2, '0')})</h3>
            <div className="admin-header-actions">
              <div className="filter-dropdown-container" ref={appDropdownRef}>
                <button
                  className={`btn-filter ${appFilter !== 'ALL' ? 'active-filter' : ''}`}
                  onClick={() => setAppDropdownOpen(!appDropdownOpen)}
                >
                  FILTER <ChevronDown size={14} />
                </button>
                {appDropdownOpen && (
                  <div className="dropdown-menu" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <button className={appFilter === 'ALL' ? 'active' : ''} onClick={() => { setAppFilter('ALL'); setAppDropdownOpen(false); }}>All</button>
                    <button className={appFilter === 'DRAFT' ? 'active' : ''} onClick={() => { setAppFilter('DRAFT'); setAppDropdownOpen(false); }}>Draft</button>
                    <button className={appFilter === 'SUBMITTED' ? 'active' : ''} onClick={() => { setAppFilter('SUBMITTED'); setAppDropdownOpen(false); }}>Submitted</button>
                    <button className={appFilter === 'UNDER_VALIDATOR_REVIEW' ? 'active' : ''} onClick={() => { setAppFilter('UNDER_VALIDATOR_REVIEW'); setAppDropdownOpen(false); }}>Under Validator Review</button>
                    <button className={appFilter === 'VALIDATOR_APPROVED' ? 'active' : ''} onClick={() => { setAppFilter('VALIDATOR_APPROVED'); setAppDropdownOpen(false); }}>Validator Approved</button>
                    <button className={appFilter === 'VALIDATOR_REJECTED' ? 'active' : ''} onClick={() => { setAppFilter('VALIDATOR_REJECTED'); setAppDropdownOpen(false); }}>Validator Rejected</button>
                    <button className={appFilter === 'UNDER_JURY_REVIEW' ? 'active' : ''} onClick={() => { setAppFilter('UNDER_JURY_REVIEW'); setAppDropdownOpen(false); }}>Under Jury Review</button>
                    <button className={appFilter === 'JURY_APPROVED' ? 'active' : ''} onClick={() => { setAppFilter('JURY_APPROVED'); setAppDropdownOpen(false); }}>Jury Approved</button>
                    <button className={appFilter === 'JURY_REJECTED' ? 'active' : ''} onClick={() => { setAppFilter('JURY_REJECTED'); setAppDropdownOpen(false); }}>Jury Rejected</button>
                  </div>
                )}
              </div>
              <button className="btn-download" onClick={() => handleDownloadCSV(filteredApps, 'apps')}>
                DOWNLOAD <Download size={14} />
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>App ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Validator score</th>
                  <th>Jury score</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.map(a => (
                  <tr key={a.id}>
                    <td>{formatId(a.id)}</td>
                    <td>{a.user_name}</td>
                    <td>{a.user_email}</td>
                    <td>{a.company || '—'}</td>
                    <td>
                      <span className={`status-badge ${a.status.toLowerCase().replace('_', '-')}`}>
                        {a.status}
                      </span>
                    </td>
                    <td>
                      {a.validator_score ? (
                        <span>
                          <strong>{a.validator_score.toFixed(2)}</strong>
                          {a.validator_name && <span style={{ color: '#64748b', fontSize: '0.8rem' }}> by {a.validator_name}</span>}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td>
                      {a.jury_approval_count > 0 ? (
                        <span>
                          <strong>{a.jury_approval_count}/{totalJuries || 3}</strong> ({a.average_score ? a.average_score.toFixed(2) : '0.00'})
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>0/{totalJuries || 3} (—)</span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-action view" onClick={() => navigate(`/review/${a.id}`)} title="View Application">
                          <Eye size={16} />
                        </button>
                        <button className="btn-action edit" onClick={() => navigate(`/admin/edit-application/${a.id}`)} title="Edit Application">
                          <Edit size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredApps.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center">No applications found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Jury Board Members Section */}
        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h3>Jury Board ({juryMembers.length})</h3>
            <div className="admin-header-actions">
              <button
                className="btn-download"
                style={{ background: '#2563eb', color: 'white', border: 'none' }}
                onClick={handleAddJuryMember}
              >
                ADD MEMBER
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Type</th>
                  <th>Sort Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {juryMembers.map(m => (
                  <tr key={m.id}>
                    <td>
                      {m.imageUrl ? (
                        <img
                          src={getFileUrl(m.imageUrl)}
                          alt={m.name}
                          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: '#64748b' }}>
                          No image
                        </div>
                      )}
                    </td>
                    <td><strong>{m.name}</strong></td>
                    <td>{m.email}</td>
                    <td>{m.role}</td>
                    <td>
                      <span className={`admin-role-badge ${m.type.toLowerCase()}`}>
                        {m.type.toLowerCase()}
                      </span>
                    </td>
                    <td>{m.sortOrder}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-action edit" onClick={() => handleEditJuryMember(m)} title="Edit Member">
                          <Edit size={16} />
                        </button>
                        <button
                          className="btn-action view"
                          style={{ color: '#dc2626' }}
                          onClick={() => handleDeleteJuryMember(m.id, m.name)}
                          title="Delete Member"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {juryMembers.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center">No jury members found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Registered Users Section */}
        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h3>Registered Users({String(filteredUsers.length).padStart(2, '0')})</h3>
            <div className="admin-header-actions">
              <div className="filter-dropdown-container" ref={userDropdownRef}>
                <button
                  className={`btn-filter ${userFilter !== 'ALL' ? 'active-filter' : ''}`}
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                >
                  FILTER <ChevronDown size={14} />
                </button>
                {userDropdownOpen && (
                  <div className="dropdown-menu">
                    <button className={userFilter === 'ALL' ? 'active' : ''} onClick={() => { setUserFilter('ALL'); setUserDropdownOpen(false); }}>All</button>
                    <button className={userFilter === 'VALIDATOR' ? 'active' : ''} onClick={() => { setUserFilter('VALIDATOR'); setUserDropdownOpen(false); }}>Validator</button>
                    <button className={userFilter === 'JURY' ? 'active' : ''} onClick={() => { setUserFilter('JURY'); setUserDropdownOpen(false); }}>Jury</button>
                    <button className={userFilter === 'USER' ? 'active' : ''} onClick={() => { setUserFilter('USER'); setUserDropdownOpen(false); }}>User</button>
                  </div>
                )}
              </div>
              <button className="btn-download" onClick={() => handleDownloadCSV(filteredUsers, 'users')}>
                DOWNLOAD <Download size={14} />
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td>{formatId(u.id)}</td>
                    <td>{u.firstName} {u.lastName}</td>
                    <td>{u.email}</td>
                    <td>{u.mobile || '—'}</td>
                    <td>
                      <span className={`admin-role-badge ${u.role.toLowerCase()}`}>
                        {u.role.toLowerCase()}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-action edit" onClick={() => handleEditUser(u)} title="Edit User">
                          <Edit size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {showUserModal && (

        <div className="modal-overlay">
          <div className="modal-container user-edit-modal">
            <div className="modal-header">
              <h3>Edit User: {selectedUser?.firstName} {selectedUser?.lastName}</h3>
              <button className="modal-close-btn" onClick={() => setShowUserModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleUserSubmit} className="user-edit-form">
              {userModalError && <div className="dashboard-error">{userModalError}</div>}

              <div className="form-row">
                <div className="form-group">
                  <label className="modal-label">First Name *</label>
                  <input
                    type="text"
                    required
                    value={userForm.firstName}
                    onChange={(e) => setUserForm(prev => ({ ...prev, firstName: e.target.value }))}
                    className="modal-input"
                  />
                </div>
                <div className="form-group">
                  <label className="modal-label">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={userForm.lastName}
                    onChange={(e) => setUserForm(prev => ({ ...prev, lastName: e.target.value }))}
                    className="modal-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="modal-label">Email *</label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                  className="modal-input"
                />
              </div>

              <div className="form-group">
                <label className="modal-label">Mobile</label>
                <input
                  type="text"
                  value={userForm.mobile || ''}
                  onChange={(e) => setUserForm(prev => ({ ...prev, mobile: e.target.value }))}
                  className="modal-input"
                />
              </div>



              <div className="form-group">
                <label className="modal-label">Password (leave blank to keep unchanged)</label>
                <input
                  type="password"
                  placeholder="New password"
                  value={userForm.password}
                  onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                  className="modal-input"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-modal-cancel" onClick={() => setShowUserModal(false)}>Cancel</button>
                <button type="submit" className="btn-modal-save" disabled={userModalSubmitting}>
                  {userModalSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showJuryModal && (
        <div className="modal-overlay">
          <div className="modal-container user-edit-modal">
            <div className="modal-header">
              <h3>{selectedJuryMember ? 'Edit Jury Board Profile' : 'Add Jury Board Profile'}</h3>
              <button className="modal-close-btn" onClick={handleCloseJuryModal}>&times;</button>
            </div>
            <form onSubmit={handleJurySubmit} className="user-edit-form">
              {juryModalError && <div className="dashboard-error">{juryModalError}</div>}

              {/* Row 1: Name and Email */}
              <div className="form-row">
                <div className="form-group">
                  <label className="modal-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={juryForm.name}
                    onChange={(e) => setJuryForm(prev => ({ ...prev, name: e.target.value }))}
                    className="modal-input"
                    placeholder="Enter full name"
                  />
                </div>
                <div className="form-group">
                  <label className="modal-label">Login Email *</label>
                  <input
                    type="email"
                    required
                    value={juryForm.email}
                    onChange={(e) => setJuryForm(prev => ({ ...prev, email: e.target.value }))}
                    className="modal-input"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              {/* Row 2: Designation and Password */}
              <div className="form-row">
                <div className="form-group">
                  <label className="modal-label">Designation / Role *</label>
                  <input
                    type="text"
                    required
                    value={juryForm.role}
                    onChange={(e) => setJuryForm(prev => ({ ...prev, role: e.target.value }))}
                    className="modal-input"
                    placeholder="e.g. Managing Director"
                  />
                </div>
                <div className="form-group">
                  <label className="modal-label">Login Password {selectedJuryMember ? '(optional)' : '*'}</label>
                  <input
                    type="password"
                    required={!selectedJuryMember}
                    value={juryForm.password}
                    onChange={(e) => setJuryForm(prev => ({ ...prev, password: e.target.value }))}
                    className="modal-input"
                    placeholder={selectedJuryMember ? "Leave blank to keep current" : "Enter login password"}
                  />
                </div>
              </div>

              {/* Row 3: Board Role Type and Sort Order */}
              <div className="form-row">
                <div className="form-group">
                  <label className="modal-label">Board Role Type *</label>
                  <select
                    value={juryForm.type}
                    onChange={(e) => setJuryForm(prev => ({ ...prev, type: e.target.value }))}
                    className="modal-select"
                  >
                    <option value="JURY">Jury Member</option>
                    <option value="VALIDATOR">Validator</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="modal-label">Display Sort Order</label>
                  <input
                    type="number"
                    value={juryForm.sortOrder}
                    onChange={(e) => setJuryForm(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                    className="modal-input"
                    min="0"
                  />
                </div>
              </div>

              {/* Row 4: Custom Image Dropzone with Preview */}
              <div className="form-group">
                <label className="modal-label">Profile Photo *</label>
                <p className="jury-image-help-text">
                  Allowed formats: JPG, JPEG, PNG, WEBP. Max size: 5MB. Recommended: Square dimensions (e.g. 400x400 px).
                </p>
                <div className="jury-image-preview-container">
                  {imagePreviewUrl ? (
                    <div className="jury-image-preview">
                      <img src={imagePreviewUrl} alt="Jury Member Preview" />
                    </div>
                  ) : (
                    <div className="jury-image-preview-placeholder">
                      <span>No photo</span>
                    </div>
                  )}
                  <div className="file-dropzone" style={{ flex: 1 }}>
                    <input
                      type="file"
                      id="jury-image-upload"
                      accept="image/jpeg, image/png, image/webp"
                      required={!selectedJuryMember || !selectedJuryMember.imageUrl}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            alert("Image file size exceeds the 5MB limit.");
                            e.target.value = null;
                            return;
                          }
                          const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
                          if (!allowedTypes.includes(file.type)) {
                            alert("Only JPG, JPEG, PNG, and WEBP formats are allowed.");
                            e.target.value = null;
                            return;
                          }
                          setJuryForm(prev => ({ ...prev, imageFile: file }));
                          if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
                            URL.revokeObjectURL(imagePreviewUrl);
                          }
                          setImagePreviewUrl(URL.createObjectURL(file));
                        }
                      }}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="jury-image-upload" className="dropzone-label">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="upload-icon" style={{ color: '#2563eb', marginBottom: '4px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                      <span>{juryForm.imageFile ? juryForm.imageFile.name : (selectedJuryMember ? "Click to change profile picture" : "Click to select profile picture")}</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-modal-cancel" onClick={handleCloseJuryModal}>Cancel</button>
                <button type="submit" className="btn-modal-save" disabled={juryModalSubmitting}>
                  {juryModalSubmitting ? 'Saving...' : 'Save Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
