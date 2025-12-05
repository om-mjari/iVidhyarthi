import React, { useEffect, useMemo, useState } from 'react';
import './AdminDashboard.css';
import './RegistrarDashboard.css';
import Logo from './Logo';

// API configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Toast Notification Component
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast-notification ${type}`}>
      <div className="toast-icon">
        {type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}
      </div>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
}

// Removed TopBar component - will be replaced with AdminDashboard structure

// Stat component will be replaced with AdminDashboard structure

function ProfileModal({ open, onClose, profileData, onProfileUpdate }) {
  const [form, setForm] = useState({
    contact: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'password'
  const [toast, setToast] = useState(null);

  // Update form when profileData changes
  useEffect(() => {
    if (profileData && open) {
      setForm(prev => ({
        ...prev,
        contact: profileData.contact || ''
      }));
    }
  }, [profileData, open]);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'radio' ? value : value
    }));
  };

  const saveProfile = async (e) => {
    e?.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        showToast('Please login again', 'error');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/registrar/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          contact: form.contact
        })
      });

      const result = await response.json();

      if (result.success) {
        showToast('Profile updated successfully!', 'success');
        if (onProfileUpdate) {
          onProfileUpdate();
        }
        setTimeout(() => {
          if (onClose) onClose();
        }, 1500);
      } else {
        showToast(result.message || 'Failed to update profile', 'error');
      }
    } catch (error) {
      console.error('Error saving registrar profile:', error);
      showToast('Failed to save profile. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (e) => {
    e?.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    if (form.newPassword.length < 6) {
      showToast('New password must be at least 6 characters long', 'error');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        showToast('Please login again', 'error');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/registrar/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword
        })
      });

      const result = await response.json();

      if (result.success) {
        showToast('Password changed successfully!', 'success');
        setForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      } else {
        showToast(result.message || 'Failed to change password', 'error');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showToast('Failed to change password. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Update form when modal opens or profileData changes
  useEffect(() => {
    if (open && profileData) {
      setForm(prev => ({
        ...prev,
        contact: profileData.contact || ''
      }));
    }
  }, [open, profileData]);

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div className={`registrar-profile-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      
      {/* Slide-Over Panel */}
      <aside className={`registrar-profile-panel ${open ? 'open' : ''}`} aria-hidden={!open}>
        {/* Modal Header */}
        <div className="registrar-profile-header">
          <div className="modal-title-section">
            <div className="modal-icon">
              <span>{activeTab === 'profile' ? '👤' : '🔐'}</span>
            </div>
            <div>
              <h3 className="modal-title">Account Settings</h3>
              <p className="modal-subtitle">Manage your registrar profile</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <span>✕</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="profile-tabs">
          <button
            className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <span className="tab-icon">📋</span>
            <span className="tab-label">Profile Info</span>
          </button>
          <button
            className={`profile-tab ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            <span className="tab-icon">🔑</span>
            <span className="tab-label">Change Password</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="registrar-profile-body">{activeTab === 'profile' ? (
            <form onSubmit={saveProfile} className="profile-form">
              <div className="form-group-modern">
                <label className="form-label-modern">
                  <span className="label-icon">✉️</span>
                  Email Address
                </label>
                <input
                  className="form-input-modern disabled"
                  value={profileData?.email || ''}
                  disabled
                />
                <span className="input-hint">This field cannot be changed</span>
              </div>

              <div className="form-group-modern">
                <label className="form-label-modern">
                  <span className="label-icon">🏛️</span>
                  University
                </label>
                <input
                  className="form-input-modern disabled"
                  value={profileData?.university || ''}
                  disabled
                />
                <span className="input-hint">Assigned by system administrator</span>
              </div>

              <div className="form-group-modern">
                <label className="form-label-modern">
                  <span className="label-icon">📱</span>
                  Contact Number
                </label>
                <input
                  type="tel"
                  className="form-input-modern"
                  name="contact"
                  value={form.contact || ''}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="modal-btn cancel-btn" onClick={onClose}>
                  <span>✕</span> Cancel
                </button>
                <button type="submit" className="modal-btn save-btn">
                  <span>✓</span> Save Changes
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={changePassword} className="profile-form">
              <div className="form-group-modern">
                <label className="form-label-modern">
                  <span className="label-icon">🔒</span>
                  Current Password
                </label>
                <input
                  type="password"
                  className="form-input-modern"
                  name="currentPassword"
                  value={form.currentPassword || ''}
                  onChange={handleChange}
                  placeholder="Enter current password"
                  required
                />
              </div>

              <div className="form-group-modern">
                <label className="form-label-modern">
                  <span className="label-icon">🔑</span>
                  New Password
                </label>
                <input
                  type="password"
                  className="form-input-modern"
                  name="newPassword"
                  value={form.newPassword || ''}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  required
                />
              </div>

              <div className="form-group-modern">
                <label className="form-label-modern">
                  <span className="label-icon">✓</span>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  className="form-input-modern"
                  name="confirmPassword"
                  value={form.confirmPassword || ''}
                  onChange={handleChange}
                  placeholder="Re-enter new password"
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="modal-btn cancel-btn" onClick={onClose}>
                  <span>✕</span> Cancel
                </button>
                <button type="submit" className="modal-btn save-btn">
                  <span>🔐</span> Change Password
                </button>
              </div>
            </form>
          )}
        </div>
        
        {/* Toast Notification */}
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
      </aside>
    </>
  );
}

// Login Activity Modal Component
function LoginActivityModal({ open, onClose, loginHistory, onSeedData }) {
  if (!open) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDeviceIcon = (device) => {
    if (!device) return '💻';
    const lower = device.toLowerCase();
    if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone')) return '📱';
    if (lower.includes('tablet') || lower.includes('ipad')) return '📱';
    return '💻';
  };

  return (
    <>
      <div className="profile-modal-overlay" onClick={onClose} />
      <div className="login-activity-modal">
        <div className="activity-modal-header">
          <div className="modal-title-section">
            <div className="modal-icon">
              <span>📊</span>
            </div>
            <div>
              <h3 className="modal-title">Login Activity Report</h3>
              <p className="modal-subtitle">Your recent login history</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <span>✕</span>
          </button>
        </div>

        <div className="activity-modal-body">
          <div className="activity-stats-summary">
            <div className="stat-card">
              <div className="stat-icon">🔢</div>
              <div className="stat-info">
                <div className="stat-number">{loginHistory.length}</div>
                <div className="stat-label">Total Logins</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-info">
                <div className="stat-number">
                  {loginHistory.length > 0 ? formatDate(loginHistory[0].timestamp).split(',')[0] : 'N/A'}
                </div>
                <div className="stat-label">Last Login</div>
              </div>
            </div>
          </div>

          <div className="activity-timeline">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 className="timeline-title" style={{ margin: 0 }}>Recent Activity</h4>
              {loginHistory.length === 0 && onSeedData && (
                <button 
                  onClick={onSeedData}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.85rem'
                  }}
                >
                  🎲 Add Demo Data
                </button>
              )}
            </div>
            {loginHistory.length === 0 ? (
              <div className="no-activity">
                <div className="no-activity-icon">📭</div>
                <p>No login history available</p>
                <p style={{ fontSize: '0.85rem', color: '#9CA3AF', marginTop: '0.5rem' }}>
                  Click "Add Demo Data" to see sample login records
                </p>
              </div>
            ) : (
              <div className="activity-list">
                {loginHistory.map((login, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-icon">{getDeviceIcon(login.device)}</div>
                    <div className="activity-details">
                      <div className="activity-time">{formatDate(login.timestamp)}</div>
                      <div className="activity-info">
                        <span className="activity-device">{login.device || 'Unknown Device'}</span>
                        {login.ip && <span className="activity-ip">IP: {login.ip}</span>}
                        {login.location && <span className="activity-location">📍 {login.location}</span>}
                      </div>
                    </div>
                    <div className="activity-status">
                      <span className="status-badge success">✓ Success</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Institute Management - Updated to remove Contact field
function InstitutesTab({ institutes, onInstitutesUpdate }) {
  const [form, setForm] = useState({ name: '', courses: '' });
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editMode, setEditMode] = useState(null);
  const [editData, setEditData] = useState({ name: '', courses: '' });
  const [searchName, setSearchName] = useState('');
  const [searchCourse, setSearchCourse] = useState('');

  const addInstitute = async () => {
    if (!form.name) return;
    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('Please login again');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/registrar/institutes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: form.name.trim(),
          courses: form.courses.trim()
        })
      });

      const result = await response.json();

      if (result.success) {
        setForm({ name: '', courses: '' });
        if (onInstitutesUpdate) {
          onInstitutesUpdate();
        }
      } else {
        alert(result.message || 'Failed to add institute');
      }
    } catch (error) {
      console.error('Error adding institute:', error);
      alert('Failed to add institute. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateInstitute = async (id, updates) => {
    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('Please login again');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/registrar/institutes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      const result = await response.json();

      if (result.success) {
        setEditMode(null);
        if (onInstitutesUpdate) {
          onInstitutesUpdate();
        }
      } else {
        alert(result.message || 'Failed to update institute');
      }
    } catch (error) {
      console.error('Error updating institute:', error);
      alert('Failed to update institute. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (inst) => {
    setEditMode(inst.id);
    setEditData({ name: inst.name, courses: inst.courses || '' });
  };

  const handleUpdateClick = (id) => {
    updateInstitute(id, { name: editData.name, courses: editData.courses });
  };

  const cancelEdit = () => {
    setEditMode(null);
    setEditData({ name: '', courses: '' });
  };

  const handleDeleteClick = (id) => {
    setDeleteConfirm(id);
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const confirmDelete = async (id) => {
    setLoading(true);
    setDeleteConfirm(null);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('Please login again');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/registrar/institutes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        if (onInstitutesUpdate) {
          onInstitutesUpdate();
        }
      } else {
        alert(result.message || 'Failed to remove institute');
      }
    } catch (error) {
      console.error('Error removing institute:', error);
      alert('Failed to remove institute. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-management-panel">
      <h2>🏛️ Institute Management</h2>
      <div className="panel-controls">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', width: '100%', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.5rem' }}>Institute Name</label>
            <input
              className="search-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter institute name"
            />
          </div>
          <div>
            <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.5rem' }}>Courses Offered</label>
            <input
              className="search-input"
              value={form.courses}
              onChange={(e) => setForm({ ...form, courses: e.target.value })}
              placeholder="e.g., BCA, BSc IT, MCA"
            />
          </div>
        </div>
        <button className="btn-primary" onClick={addInstitute}>Add Institute</button>
      </div>

      {/* Search Filters */}
      <div className="panel-controls" style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', width: '100%' }}>
          <div>
            <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              🔍 Search by Institute Name
            </label>
            <input
              className="search-input"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Type to search institutes..."
            />
          </div>
          <div>
            <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              🔍 Search by Course
            </label>
            <input
              className="search-input"
              value={searchCourse}
              onChange={(e) => setSearchCourse(e.target.value)}
              placeholder="Type to search courses..."
            />
          </div>
        </div>
      </div>

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Institute Name</th>
              <th>Courses Offered</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              // Filter institutes based on search criteria
              const filteredInstitutes = institutes.filter(inst => {
                const nameMatch = searchName.trim() === '' || 
                  (inst.name || '').toLowerCase().includes(searchName.toLowerCase());
                const courseMatch = searchCourse.trim() === '' || 
                  (inst.courses || '').toLowerCase().includes(searchCourse.toLowerCase());
                return nameMatch && courseMatch;
              });

              if (filteredInstitutes.length === 0) {
                return (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'rgba(255, 255, 255, 0.6)' }}>
                      {institutes.length === 0 
                        ? 'No institutes added yet. Add your first institute above.'
                        : 'No institutes match your search criteria.'}
                    </td>
                  </tr>
                );
              }

              return filteredInstitutes.map(inst => (
                <tr key={inst.id}>
                  <td>
                    {editMode === inst.id ? (
                      <input
                        className="search-input"
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        style={{ margin: 0, width: '100%' }}
                      />
                    ) : (
                      inst.name
                    )}
                  </td>
                  <td>
                    {editMode === inst.id ? (
                      <input
                        className="search-input"
                        value={editData.courses}
                        onChange={(e) => setEditData({ ...editData, courses: e.target.value })}
                        placeholder="e.g., BCA, BSc IT, MCA"
                        style={{ margin: 0, width: '100%' }}
                      />
                    ) : (
                      inst.courses || '—'
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${inst.status === 'Active' ? 'active' : 'pending'}`}>
                      {inst.status}
                    </span>
                  </td>
                  <td>
                    {deleteConfirm === inst.id ? (
                      <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center', padding: '0.5rem', background: 'rgba(255, 107, 107, 0.1)', borderRadius: '8px' }}>
                        <span style={{ color: '#ff6b6b', fontSize: '0.9rem', fontWeight: '500' }}>Delete this?</span>
                        <button
                          className="btn-approve"
                          onClick={() => confirmDelete(inst.id)}
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                        >
                          OK
                        </button>
                        <button
                          className="btn-reject"
                          onClick={cancelDelete}
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : editMode === inst.id ? (
                      <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                          className="btn-approve"
                          onClick={() => handleUpdateClick(inst.id)}
                        >
                          Update
                        </button>
                        <button
                          className="btn-reject"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                          className="btn-primary"
                          onClick={() => handleEditClick(inst)}
                          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', marginLeft: 0 }}
                        >
                          Edit
                        </button>
                        <button className="btn-delete" onClick={() => handleDeleteClick(inst.id)}>Remove</button>
                      </div>
                    )}
                  </td>
                </tr>
              ));
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChartsTab({ analyticsData, institutes }) {
  const [monthlyEnrollments, setMonthlyEnrollments] = useState([]);
  const [topCourses, setTopCourses] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    console.log('📊 ChartsTab: Institutes changed, re-fetching analytics...', institutes.length);
    fetchAllAnalytics();
  }, [institutes, lastUpdate]); // Re-fetch when institutes change or manual refresh

  const fetchAllAnalytics = async () => {
    setLoading(true);
    await Promise.all([
      fetchMonthlyTrends(),
      fetchTopCourses(),
      fetchRecentActivities()
    ]);
    setLoading(false);
  };

  const handleRefresh = () => {
    setLastUpdate(Date.now());
  };

  const fetchMonthlyTrends = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/registrar/monthly-trends`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.success) {
        setMonthlyEnrollments(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching monthly trends:', error);
      setMonthlyEnrollments([]);
    }
  };

  const fetchTopCourses = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/registrar/top-courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.success) {
        setTopCourses(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching top courses:', error);
      setTopCourses([]);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/registrar/recent-activities`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.success) {
        setRecentActivities(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      setRecentActivities([]);
    }
  };

  // Calculate max values for scaling bars
  const maxEnrollments = Math.max(...monthlyEnrollments.map(d => d.enrollments), 1);
  const maxInstitutes = Math.max(...monthlyEnrollments.map(d => d.institutes), 1);

  return (
    <div className="analytics-panel">
      <h2>📊 Institute Analytics & Reports</h2>

      {/* Institute Data Graph */}
      <div className="analytics-section">
        <h3>🏛️ Institute & Courses Distribution</h3>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(0,0,0,0.5)' }}>
            Loading institute data...
          </div>
        ) : institutes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(0,0,0,0.5)' }}>
            No institute data available yet
          </div>
        ) : (() => {
          // Flatten institutes and courses into individual rows
          const instituteCoursePairs = [];
          institutes.forEach(inst => {
            const coursesStr = inst.courses || inst.Courses_Offered || '';
            const coursesList = coursesStr.trim() ? coursesStr.split(',').map(c => c.trim()).filter(c => c) : [];
            
            if (coursesList.length > 0) {
              coursesList.forEach(course => {
                instituteCoursePairs.push({
                  instituteName: inst.name || inst.Institute_Name || 'N/A',
                  courseName: course
                });
              });
            } else {
              // If no courses, still show the institute
              instituteCoursePairs.push({
                instituteName: inst.name || inst.Institute_Name || 'N/A',
                courseName: 'No courses'
              });
            }
          });

          return instituteCoursePairs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(0,0,0,0.5)' }}>
              No courses available
            </div>
          ) : (
            <div className="chart-container">
              <div className="chart-header">
                <span>Institute Name</span>
                <span>Course Name</span>
              </div>
              {instituteCoursePairs.map((pair, index) => (
                <div key={index} className="chart-row">
                  <div className="chart-label" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {pair.instituteName}
                  </div>
                  <div className="chart-bars">
                    <div className="bar-container">
                      <div 
                        className="bar institutes" 
                        style={{ 
                          width: '100%',
                          backgroundColor: '#14b8a6'
                        }}
                      ></div>
                      <span className="bar-value">
                        {pair.courseName}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Monthly Enrollment Trends */}
      <div className="analytics-section">
        <h3>📈 Monthly Enrollment Trends</h3>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(0,0,0,0.5)' }}>
            Loading analytics data...
          </div>
        ) : monthlyEnrollments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(0,0,0,0.5)' }}>
            No enrollment data available yet
          </div>
        ) : (
          <div className="chart-container">
            <div className="chart-header">
              <span>Student Enrollments</span>
              <span>Active Institutes</span>
            </div>
            {monthlyEnrollments.map((data, index) => (
              <div key={index} className="chart-row">
                <div className="chart-label">{data.month}</div>
                <div className="chart-bars">
                  <div className="bar-container">
                    <div className="bar enrollments" style={{ width: `${(data.enrollments / maxEnrollments) * 100}%` }}></div>
                    <span className="bar-value">{data.enrollments}</span>
                  </div>
                  <div className="bar-container">
                    <div className="bar institutes" style={{ width: `${(data.institutes / maxInstitutes) * 100}%` }}></div>
                    <span className="bar-value">{data.institutes}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Performing Courses */}
      <div className="analytics-section">
        <h3>🏆 Most Popular Courses</h3>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(0,0,0,0.5)' }}>
            Loading courses...
          </div>
        ) : topCourses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(0,0,0,0.5)' }}>
            No course data available yet
          </div>
        ) : (
          <div className="courses-grid">
            {topCourses.map((course, index) => (
              <div key={index} className="course-card">
                <div className="course-rank">#{index + 1}</div>
                <div className="course-info">
                  <h4>{course.name}</h4>
                  <div className="course-stats">
                    <span className="students">{course.students} students</span>
                    <span className="institutes">{course.institutes} institutes</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activities Feed */}
      <div className="analytics-section">
        <h3>🔄 Recent Institute Activities</h3>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(0,0,0,0.5)' }}>
            Loading activities...
          </div>
        ) : recentActivities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(0,0,0,0.5)' }}>
            No recent activities
          </div>
        ) : (
          <div className="activities-feed">
            {recentActivities.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">{activity.icon}</div>
                <div className="activity-content">
                  <p>{activity.message}</p>
                  <span className="activity-time">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Institute Management Actions */}
      <div className="analytics-section">
        <h3>⚡ Institute Management</h3>
        <div className="quick-actions-grid">
          <button className="action-card">
            <span className="action-icon">📊</span>
            <span>Generate Report</span>
          </button>
          <button className="action-card">
            <span className="action-icon">📋</span>
            <span>View All Institutes</span>
          </button>
          <button className="action-card">
            <span className="action-icon">📈</span>
            <span>View Enrollment Trends</span>
          </button>
          <button className="action-card">
            <span className="action-icon">💾</span>
            <span>Export Data</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ApprovalGate({ children }) {
  const approved = useMemo(() => localStorage.getItem('registrar_approved') === 'true', []);
  if (!approved) {
    return (
      <div className="user-management-panel">
        <h2>⏳ Awaiting Admin Approval</h2>
        <div className="quick-actions">
          <h3>Registration Under Review</h3>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '1rem' }}>
            Your university registration is under review by Admin. You will be notified upon approval.
          </p>
          <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem' }}>
            Tip: Ask Admin to approve your registration to enable institute management features.
          </div>
        </div>
      </div>
    );
  }
  return children;
}

function RegistrarDashboard({ onLogout }) {
  const [activePanel, setActivePanel] = useState('overview');
  const [profileOpen, setProfileOpen] = useState(false);
  const [loginActivityOpen, setLoginActivityOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loginHistory, setLoginHistory] = useState([]);
  const [stats, setStats] = useState({
    totalInstitutes: 0,
    totalStudents: 0,
    activeCourses: 0,
    pendingApprovals: 0
  });
  const [latestInstitutes, setLatestInstitutes] = useState([]);
  const [latestStudents, setLatestStudents] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  const [analyticsData, setAnalyticsData] = useState({});
  const [ws, setWs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [universityApproved, setUniversityApproved] = useState(false);

  // Fetch university approval status specifically
  const checkUniversityApproval = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const profileResponse = await fetch(`${API_BASE_URL}/registrar/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const profileResult = await profileResponse.json();
      if (profileResult.success) {
        const isApproved = profileResult.data.universityApproved;
        setUniversityApproved(isApproved);
        localStorage.setItem('registrar_approved', String(!!isApproved));
        
        // Update profile data with actual values from backend
        setProfileData({
          email: profileResult.data.email,
          contact: profileResult.data.contact || '',
          university: profileResult.data.university || 'University Name',
          universityApproved: isApproved,
          universityStatus: isApproved ? 'Verified' : 'Pending Approval'
        });
        
        return isApproved;
      }
    } catch (error) {
      console.error('Error checking university approval:', error);
    }
    return false;
  };

  // Fetch registrar profile data
  const fetchRegistrarProfile = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.log('No auth token found');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/registrar/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        const data = result.data;
        
        // Update profile data state
        setProfileData({
          email: data.email,
          contact: data.contact || '',
          university: data.university || 'University Name',
          universityApproved: data.universityApproved || false,
          universityStatus: data.universityApproved ? 'Verified' : 'Pending Approval'
        });

        // Update user state
        setUser({
          name: data.name || 'Registrar',
          email: data.email,
          university: data.university || 'University Name'
        });

        // Update approval status
        setUniversityApproved(data.universityApproved || false);
        localStorage.setItem('registrar_approved', String(!!data.universityApproved));
        
        console.log('✅ Profile data loaded:', data);
      } else {
        console.error('Failed to fetch profile:', result.message);
      }
    } catch (error) {
      console.error('Error fetching registrar profile:', error);
    }
  };

  // Fetch login history
  const fetchLoginHistory = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        showToast('Please log in to view activity', 'error');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/registrar/login-history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.success) {
        setLoginHistory(result.data || []);
        console.log('✅ Login history fetched:', result.data);
      } else {
        showToast('Failed to fetch login history', 'error');
      }
    } catch (error) {
      console.error('Error fetching login history:', error);
      showToast('Error loading login activity', 'error');
      setLoginHistory([]);
    }
  };

  // Seed sample login history for demo
  const seedLoginHistory = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        showToast('Please log in first', 'error');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/registrar/seed-login-history`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.success) {
        showToast(`Added ${result.count} sample login records!`, 'success');
        fetchLoginHistory(); // Refresh the data
      } else {
        showToast('Failed to seed login history', 'error');
      }
    } catch (error) {
      console.error('Error seeding login history:', error);
      showToast('Error adding sample data', 'error');
    }
  };

  // Fetch institutes data
  const fetchInstitutes = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/registrar/institutes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        const institutesData = result.data || [];
        setInstitutes(institutesData);
        // Update stats count dynamically
        setStats(prev => ({
          ...prev,
          totalInstitutes: institutesData.length
        }));
      }
    } catch (error) {
      console.error('Error fetching institutes:', error);
      setInstitutes([]);
    }
  };

  // Initialize WebSocket connection
  const setupWebSocket = () => {
    const ws = new WebSocket(`ws://localhost:5000/ws/registrar`);

    ws.onopen = () => {
      console.log('WebSocket Connected');
      setWs(ws);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'statsUpdate') {
        setStats(prev => ({
          ...prev,
          ...data.data
        }));
      }
    };

    ws.onclose = () => {
      console.log('WebSocket Disconnected');
      // Attempt to reconnect after 5 seconds
      setTimeout(setupWebSocket, 5000);
    };

    return ws;
  };

  // Fetch all dashboard data from API
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Check if user is logged in first
      const token = localStorage.getItem('auth_token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      // Fetch registrar profile first to get real data
      await fetchRegistrarProfile();

      // Fetch dashboard stats
      const response = await fetch(`${API_BASE_URL}/registrar/dashboard`);
      const result = await response.json();

      if (result.success) {
        const { stats, latestInstitutes, latestStudents } = result.data;
        setStats(stats);
        setLatestInstitutes(latestInstitutes || []);
        setLatestStudents(latestStudents || []);
      } else {
        console.error('Failed to fetch dashboard data:', result.message);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      alert('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('auth_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    // Initialize WebSocket connection
    const ws = setupWebSocket();

    // Fetch initial dashboard data and profile
    fetchDashboardData();
    fetchInstitutes();
    fetchLoginHistory(); // Fetch login history on mount

    // Set up auto-refresh every 5 minutes as a fallback
    const refreshInterval = setInterval(() => {
      fetchDashboardData();
      fetchInstitutes();
    }, 5 * 60 * 1000);

    // Clean up on component unmount
    return () => {
      clearInterval(refreshInterval);
      if (ws) {
        ws.close();
      }
    };
  }, []);

  const approved = universityApproved;

  const menuItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: '📊' },
    { id: 'institutes', label: 'Institute Management', icon: '🏛️' },
    { id: 'charts', label: 'Analytics & Charts', icon: '📈' },
    { id: 'profile', label: 'Profile Settings', icon: '👤' }
  ];

  const renderLatestInstitutes = () => (
    <div className="recent-institutes">
      <h3>Recent Institutes</h3>
      {latestInstitutes.length > 0 ? (
        <ul className="institute-list">
          {latestInstitutes.map((institute) => (
            <li key={institute._id} className="institute-item">
              <div className="institute-name">{institute.Institute_Name}</div>
              <div className="institute-id">ID: {institute.University_Id}</div>
              <div className="institute-date">
                {new Date(institute.createdAt).toLocaleDateString()}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No institutes found</p>
      )}
    </div>
  );

  const renderLatestStudents = () => (
    <div className="recent-students">
      <h3>Recent Students</h3>
      {latestStudents.length > 0 ? (
        <ul className="student-list">
          {latestStudents.map((student) => (
            <li key={student._id} className="student-item">
              <div className="student-name">{student.name}</div>
              <div className="student-email">{student.email}</div>
              <div className="student-institute">{student.institute || 'No Institute'}</div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No students found</p>
      )}
    </div>
  );

  const renderOverview = () => (
    <div className="overview-panel">
      <h2>📊 Registrar Dashboard</h2>
      <div className="stats-grid">
        <div className="stat-card institutes">
          <div className="stat-icon">🏛️</div>
          <div className="stat-content">
            <h3>{stats.totalInstitutes.toLocaleString()}</h3>
            <p>Total Institutes</p>
            <span className="stat-trend">Managed by you</span>
            {latestInstitutes.length > 0 && (
              <div className="stat-details">
                <span>Latest: {latestInstitutes[0]?.Institute_Name || 'N/A'}</span>
              </div>
            )}
          </div>
        </div>
        <div className="stat-card students">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.totalStudents.toLocaleString()}</h3>
            <p>Total Students</p>
            <span className="stat-trend">Across all institutes</span>
            {latestStudents.length > 0 && (
              <div className="stat-details">
                <span>Latest: {latestStudents[0]?.name || 'N/A'}</span>
              </div>
            )}
          </div>
        </div>
        <div className="stat-card courses">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3>{stats.activeCourses.toLocaleString()}</h3>
            <p>Active Courses</p>
            <span className="stat-trend">Available programs</span>
          </div>
        </div>
      </div>

      {!universityApproved && (
        <div className="quick-actions">
          <h3>⏳ University Approval Pending</h3>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '1rem' }}>
            Your university registration is under review by Admin. You will be notified upon approval.
          </p>
          <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            <strong>Status:</strong> {profileData?.universityStatus || 'Pending'}<br />
            <strong>University:</strong> {profileData?.university || 'Unknown'}<br />
            <strong>Note:</strong> You can only manage institutes after your university is approved by admin.
          </div>
          <button
            className="btn-primary"
            onClick={checkUniversityApproval}
            style={{ marginTop: '1rem' }}
          >
            🔄 Check Approval Status
          </button>
        </div>
      )}

      {universityApproved && (
        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <button className="action-btn" onClick={() => setActivePanel('institutes')}>
              🏛️ Manage Institutes
            </button>
            <button className="action-btn" onClick={() => setActivePanel('charts')}>
              📈 View Analytics
            </button>
            <button className="action-btn" onClick={() => setActivePanel('profile')}>
              👤 Update Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderActivePanel = () => {
    if (loading) {
      return (
        <div className="overview-panel">
          <h2>📊 Loading Dashboard...</h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Please wait while we fetch your data...</p>
        </div>
      );
    }

    switch (activePanel) {
      case 'overview': return renderOverview();
      case 'institutes': return (
        universityApproved ? (
          <InstitutesTab institutes={institutes} onInstitutesUpdate={() => { fetchDashboardData(); fetchInstitutes(); }} />
        ) : (
          <ApprovalGate>
            <InstitutesTab institutes={institutes} onInstitutesUpdate={() => { fetchDashboardData(); fetchInstitutes(); }} />
          </ApprovalGate>
        )
      );
      case 'charts': return (
        universityApproved ? (
          <ChartsTab key={institutes.length} analyticsData={analyticsData} institutes={institutes} />
        ) : (
          <ApprovalGate>
            <ChartsTab key={institutes.length} analyticsData={analyticsData} institutes={institutes} />
          </ApprovalGate>
        )
      );
      case 'profile': return (
        <div className="user-management-panel">
          <div className="settings-header">
            <h2>👤 Account & Settings</h2>
            <p>Manage your profile and account preferences</p>
          </div>

          {/* Profile Grid */}
          <div className="settings-grid">
            {/* Personal Info Card */}
            <div className="settings-card personal-card">
              <div className="card-header">
                <div className="card-icon">👤</div>
                <div>
                  <h3>Personal Information</h3>
                  <p className="card-subtitle">Your account details</p>
                </div>
              </div>
              <div className="card-content">
                <div className="info-row">
                  <span className="info-label">Email</span>
                  <span className="info-value">{profileData?.email || 'registrar@university.edu'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Contact</span>
                  <span className="info-value">{profileData?.contact || '+1 234 567 890'}</span>
                </div>
              </div>
              <button className="card-action-btn" onClick={() => setProfileOpen(true)}>
                <span>✏️</span> EDIT
              </button>
            </div>

            {/* University Info Card */}
            <div className="settings-card university-card">
              <div className="card-header">
                <div className="card-icon university-icon">🏛️</div>
                <div>
                  <h3>University Information</h3>
                  <p className="card-subtitle">Institution details</p>
                </div>
              </div>
              <div className="card-content">
                <div className="info-row">
                  <span className="info-label">University</span>
                  <span className="info-value">{profileData?.university || 'University Name'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Status</span>
                  <span className={`status-badge ${profileData?.universityApproved ? 'approved' : 'pending'}`}>
                    {profileData?.universityApproved ? '✓ Verified' : '⏳ Pending'}
                  </span>
                </div>
              </div>
            </div>

            {/* Activity Card */}
            <div className="settings-card activity-card">
              <div className="card-header">
                <div className="card-icon activity-icon">📊</div>
                <div>
                  <h3>Login Activity</h3>
                  <p className="card-subtitle">Monitor your account access</p>
                </div>
              </div>
              <div className="activity-info">
                <div className="activity-stat">
                  <span className="activity-count">{loginHistory.length}</span>
                  <span className="activity-label">Total Logins</span>
                </div>
              </div>
              <button 
                className="card-action-btn secondary-btn"
                onClick={() => {
                  setLoginActivityOpen(true);
                  fetchLoginHistory();
                }}
              >
                <span>👁️</span> VIEW ACTIVITY
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="stats-section">
            <h3 className="stats-title">📈 Your Activity Overview</h3>
            <div className="stats-row">
              <div className="stat-box">
                <div className="stat-icon">🏢</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.totalInstitutes || 0}</div>
                  <div className="stat-label">Institutes</div>
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-icon">👨‍🎓</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.totalStudents || 0}</div>
                  <div className="stat-label">Students</div>
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-icon">📚</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.activeCourses || 0}</div>
                  <div className="stat-label">Courses</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
      default: return renderOverview();
    }
  };

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-header">
          <Logo size="medium" showText={true} style={{ color: 'white', marginBottom: '1rem' }} />
          <h2>🏛️ Registrar Panel</h2>
          <p>iVidhyarthi Management</p>
        </div>
        <nav className="admin-nav">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activePanel === item.id ? 'active' : ''}`}
              onClick={() => setActivePanel(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="admin-footer">
          <button className="logout-btn" onClick={() => setShowLogoutConfirm(true)}>
            🚪 Logout
          </button>
        </div>
      </aside>

      <main className="admin-content">
        <header className="admin-content-header">
          <div className="breadcrumb">
            <span>Registrar Dashboard</span>
            <span>/</span>
            <span>{menuItems.find(item => item.id === activePanel)?.label}</span>
          </div>
          <div className="admin-user-info">
            <span 
              style={{ cursor: 'pointer', transition: 'color 0.2s' }}
              onClick={() => setProfileOpen(true)}
              onMouseEnter={(e) => e.target.style.color = '#14b8a6'}
              onMouseLeave={(e) => e.target.style.color = ''}
            >
              Welcome, {user?.name || 'Registrar'}
            </span>
            <div 
              className="admin-avatar" 
              style={{ cursor: 'pointer' }}
              onClick={() => setProfileOpen(true)}
            >
              👤
            </div>
          </div>
        </header>

        <div className="admin-panel-content">
          {renderActivePanel()}
        </div>
      </main>

      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        profileData={profileData}
        onProfileUpdate={fetchRegistrarProfile}
      />

      <LoginActivityModal
        open={loginActivityOpen}
        onClose={() => setLoginActivityOpen(false)}
        loginHistory={loginHistory}
        onSeedData={seedLoginHistory}
      />

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            textAlign: 'center'
          }}>
            <h3 style={{ 
              margin: '0 0 1rem 0', 
              color: '#333', 
              fontSize: '1.5rem',
              fontWeight: '600'
            }}>
              Confirm Logout
            </h3>
            <p style={{ 
              margin: '0 0 2rem 0', 
              color: '#666',
              fontSize: '1rem',
              lineHeight: '1.5'
            }}>
              Are you sure you want to logout?
            </p>
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'center' 
            }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  padding: '0.75rem 2rem',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                  minWidth: '120px',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('registrar_user');
                    localStorage.removeItem('registrar_approved');
                  } catch (e) { }
                  if (typeof onLogout === 'function') {
                    try { onLogout(); } catch (e) { }
                  }
                  window.location.href = '/login';
                }}
                style={{
                  padding: '0.75rem 2rem',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: '#14b8a6',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                  minWidth: '120px',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#0d9488'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#14b8a6'}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RegistrarDashboard;