import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ChevronDown, Download, Eye, Edit } from 'lucide-react';
import { api, clearSession } from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import './Dashboards.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dropdown & Filter States
  const [userFilter, setUserFilter] = useState('ALL');
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

  // Dropdown Refs
  const userDropdownRef = useRef(null);
  const appDropdownRef = useRef(null);

  const fetchAdminData = useCallback(async () => {
    try {
      const [uRes, aRes] = await Promise.all([
        api.getAdminUsers(),
        api.getAdminApps()
      ]);
      setUsers(uRes);
      setApps(aRes);
    } catch (err) {
      setError('Failed to fetch data or unauthorized.', err.message);
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

  // Filter Registered Users
  const filteredUsers = users.filter(u => {
    if (userFilter === 'ALL') return true;
    return u.role?.toUpperCase() === userFilter;
  });

  // Filter Submitted Applications
  const filteredApps = apps.filter(a => {
    if (appFilter === 'ALL') return true;
    const statusUpper = a.status?.toUpperCase() || '';
    if (appFilter === 'VALIDATOR') {
      return statusUpper.includes('VALIDATOR') || (a.validator_score !== undefined && a.validator_score !== null);
    }
    if (appFilter === 'JURY') {
      return statusUpper.includes('JURY') || statusUpper === 'UNDER_JURY_REVIEW';
    }
    if (appFilter === 'USER') {
      return statusUpper === 'SUBMITTED';
    }
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
        { label: 'Validator Score', key: 'validator_score', format: (v) => v ? v.toFixed(2) : '—' },
        { label: 'Jury Approval Score', key: 'jury_approval_count', format: (v, row) => `${v || 0}/3 (${row.average_score ? row.average_score.toFixed(2) : '—'})` }
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
          LOG OUT <LogOut size={16} />
        </button>
      }
    >
      <div className="dashboard-content">
        {error && <div className="dashboard-error">{error}</div>}

        <h1 className="admin-main-heading">Admin</h1>

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

        {/* Submitted Applications Section */}
        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h3>Submitted applications({String(filteredApps.length).padStart(2, '0')})</h3>
            <div className="admin-header-actions">
              <div className="filter-dropdown-container" ref={appDropdownRef}>
                <button
                  className={`btn-filter ${appFilter !== 'ALL' ? 'active-filter' : ''}`}
                  onClick={() => setAppDropdownOpen(!appDropdownOpen)}
                >
                  FILTER <ChevronDown size={14} />
                </button>
                {appDropdownOpen && (
                  <div className="dropdown-menu">
                    <button className={appFilter === 'ALL' ? 'active' : ''} onClick={() => { setAppFilter('ALL'); setAppDropdownOpen(false); }}>All</button>
                    <button className={appFilter === 'VALIDATOR' ? 'active' : ''} onClick={() => { setAppFilter('VALIDATOR'); setAppDropdownOpen(false); }}>Validator</button>
                    <button className={appFilter === 'JURY' ? 'active' : ''} onClick={() => { setAppFilter('JURY'); setAppDropdownOpen(false); }}>Jury</button>
                    <button className={appFilter === 'USER' ? 'active' : ''} onClick={() => { setAppFilter('USER'); setAppDropdownOpen(false); }}>User</button>
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
                  <th>Jury approval score</th>
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
                          <strong>{a.jury_approval_count}/3</strong> ({a.average_score ? a.average_score.toFixed(2) : '0.00'})
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>0/3 (—)</span>
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
    </DashboardLayout>
  );
}
