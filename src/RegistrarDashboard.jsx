import React, { useEffect, useMemo, useState } from 'react';
import './AdminDashboard.css';
import './RegistrarDashboard.css';
import Logo from './Logo';

// API configuration
const API_BASE_URL = 'http://localhost:5000/api';

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
        alert('Please login again');
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
        alert('Profile updated successfully!');
        if (onProfileUpdate) {
          onProfileUpdate();
        }
        if (onClose) onClose();
      } else {
        alert(result.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving registrar profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (e) => {
    e?.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (form.newPassword.length < 6) {
      alert('New password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('Please login again');
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
        alert('Password changed successfully!');
        setForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      } else {
        alert(result.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Failed to change password. Please try again.');
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
      <div className="modal-overlay" onClick={onClose} style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000
      }} />
      <div className="modal-content" style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: '2rem',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        zIndex: 1001,
        minWidth: '400px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, color: 'white', fontSize: '1.3rem', fontWeight: '700' }}>Registrar Profile</h3>
          <button className="btn-secondary" onClick={onClose} style={{ fontSize: '1.5rem', lineHeight: '1', padding: '0.25rem 0.5rem' }}>×</button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <button
            type="button"
            className={`btn-${activeTab === 'profile' ? 'primary' : 'secondary'}`}
            onClick={() => setActiveTab('profile')}
            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
          >
            Profile Info
          </button>
          <button
            type="button"
            className={`btn-${activeTab === 'password' ? 'primary' : 'secondary'}`}
            onClick={() => setActiveTab('password')}
            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
          >
            Change Password
          </button>
        </div>

        {activeTab === 'profile' ? (
          <form onSubmit={saveProfile}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.5rem' }}>Email (Read-only)</label>
              <input
                className="search-input"
                value={profileData?.email || ''}
                style={{ width: '100%', opacity: 0.6 }}
                disabled
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.5rem' }}>University (Read-only)</label>
              <input
                className="search-input"
                value={profileData?.university || ''}
                style={{ width: '100%', opacity: 0.6 }}
                disabled
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.5rem' }}>Contact Number</label>
              <input
                type="tel"
                className="search-input"
                name="contact"
                value={form.contact || ''}
                onChange={handleChange}
                style={{ width: '100%' }}
                placeholder="Enter your contact number"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary">Save Changes</button>
            </div>
          </form>
        ) : (
          <form onSubmit={changePassword}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.5rem' }}>Current Password</label>
              <input
                type="password"
                className="search-input"
                name="currentPassword"
                value={form.currentPassword || ''}
                onChange={handleChange}
                style={{ width: '100%' }}
                placeholder="Enter your current password"
                required
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.5rem' }}>New Password</label>
              <input
                type="password"
                className="search-input"
                name="newPassword"
                value={form.newPassword || ''}
                onChange={handleChange}
                style={{ width: '100%' }}
                placeholder="Enter new password (min 6 characters)"
                required
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.5rem' }}>Confirm New Password</label>
              <input
                type="password"
                className="search-input"
                name="confirmPassword"
                value={form.confirmPassword || ''}
                onChange={handleChange}
                style={{ width: '100%' }}
                placeholder="Confirm new password"
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary">Change Password</button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}

function InstitutesTab({ institutes, onInstitutesUpdate }) {
  const [form, setForm] = useState({ name: '', contact: '', courses: '' });
  const [loading, setLoading] = useState(false);

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
          contact: form.contact.trim(),
          courses: form.courses
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('Institute added successfully!');
        setForm({ name: '', contact: '', courses: '' });
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
        alert('Institute updated successfully!');
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

  const removeInstitute = async (id) => {
    if (!confirm('Remove this institute?')) return;
    setLoading(true);

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
        alert('Institute removed successfully!');
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
            <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.5rem' }}>Contact</label>
            <input
              className="search-input"
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              placeholder="Contact information"
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

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Institute Name</th>
              <th>Contact</th>
              <th>Courses Offered</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {institutes.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'rgba(255, 255, 255, 0.6)' }}>
                  No institutes added yet. Add your first institute above.
                </td>
              </tr>
            ) : (
              institutes.map(inst => (
                <tr key={inst.id}>
                  <td>{inst.name}</td>
                  <td>{inst.contact || '—'}</td>
                  <td>{inst.courses?.join(', ') || '—'}</td>
                  <td>
                    <span className={`status-badge ${inst.status === 'Active' ? 'active' : 'pending'}`}>
                      {inst.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`btn-${inst.status === 'Active' ? 'reject' : 'approve'}`}
                      onClick={() => updateInstitute(inst.id, { status: inst.status === 'Active' ? 'Disabled' : 'Active' })}
                    >
                      {inst.status === 'Active' ? 'Disable' : 'Enable'}
                    </button>
                    <button className="btn-delete" onClick={() => removeInstitute(inst.id)}>Remove</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChartsTab({ analyticsData, institutes }) {
  // Mock data for registrar-specific analytics
  const monthlyEnrollments = [
    { month: 'Jan', enrollments: 45, institutes: 3 },
    { month: 'Feb', enrollments: 62, institutes: 4 },
    { month: 'Mar', enrollments: 38, institutes: 3 },
    { month: 'Apr', enrollments: 71, institutes: 5 },
    { month: 'May', enrollments: 89, institutes: 6 },
    { month: 'Jun', enrollments: 56, institutes: 5 }
  ];

  const topCourses = [
    { name: 'Computer Science', students: 234, institutes: 3 },
    { name: 'Information Technology', students: 189, institutes: 2 },
    { name: 'Business Administration', students: 156, institutes: 2 },
    { name: 'Electronics', students: 98, institutes: 1 },
    { name: 'Mechanical', students: 87, institutes: 1 }
  ];

  const recentActivities = [
    { type: 'enrollment', message: 'New student enrolled in Computer Science', time: '2 hours ago', icon: '👤' },
    { type: 'institute', message: 'Engineering College added new course: AI & ML', time: '4 hours ago', icon: '📚' },
    { type: 'institute', message: 'Management Studies updated contact info', time: '1 day ago', icon: '📝' },
    { type: 'enrollment', message: '12 new enrollments this week', time: '2 days ago', icon: '📈' },
    { type: 'institute', message: 'Computer Science Department added 3 new courses', time: '3 days ago', icon: '🏛️' }
  ];

  return (
    <div className="analytics-panel">
      <h2>📊 Institute Analytics & Reports</h2>

      {/* Monthly Enrollment Trends */}
      <div className="analytics-section">
        <h3>📈 Monthly Enrollment Trends</h3>
        <div className="chart-container">
          <div className="chart-header">
            <span>Student Enrollments</span>
            <span>Active Institutes</span>
          </div>
          {monthlyEnrollments.map((data, index) => (
            <div key={data.month} className="chart-row">
              <div className="chart-label">{data.month}</div>
              <div className="chart-bars">
                <div className="bar-container">
                  <div className="bar enrollments" style={{ width: `${(data.enrollments / 100) * 100}%` }}></div>
                  <span className="bar-value">{data.enrollments}</span>
                </div>
                <div className="bar-container">
                  <div className="bar institutes" style={{ width: `${(data.institutes / 6) * 100}%` }}></div>
                  <span className="bar-value">{data.institutes}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Performing Courses */}
      <div className="analytics-section">
        <h3>🏆 Most Popular Courses</h3>
        <div className="courses-grid">
          {topCourses.map((course, index) => (
            <div key={course.name} className="course-card">
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
      </div>

      {/* Recent Activities Feed */}
      <div className="analytics-section">
        <h3>🔄 Recent Institute Activities</h3>
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
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
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
        return isApproved;
      }
    } catch (error) {
      console.error('Error checking university approval:', error);
    }
    return false;
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
        setInstitutes(result.data || []);
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
      const registrarData = localStorage.getItem('registrar_user');
      if (!registrarData) {
        window.location.href = '/login';
        return;
      }

      // Fetch dashboard data from our new API endpoint
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

      // Set mock user data if not already set
      if (!user) {
        setUser({
          name: 'Registrar User',
          email: 'registrar@university.edu',
          university: 'University Name'
        });

        setProfileData({
          name: 'Registrar User',
          email: 'registrar@university.edu',
          contact: '+1 234 567 890',
          university: 'University Name'
        });

        // Set university as approved for demo
        setUniversityApproved(true);
        localStorage.setItem('registrar_approved', 'true');
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      alert('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // For demo purposes, we'll use mock data if not logged in
    const registrarData = localStorage.getItem('registrar_user');

    // If no user data, create a mock user for demo
    if (!registrarData) {
      const mockUser = {
        name: 'Registrar User',
        email: 'registrar@university.edu',
        university: 'University Name'
      };
      localStorage.setItem('registrar_user', JSON.stringify(mockUser));
    }

    // Initialize WebSocket connection
    const ws = setupWebSocket();

    // Fetch initial dashboard data
    fetchDashboardData();
    fetchInstitutes();

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
        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{stats.pendingApprovals}</h3>
            <p>Pending Approvals</p>
            <span className="stat-trend">Requires attention</span>
            {stats.pendingApprovals > 0 && (
              <div className="stat-details">
                <span>Action required</span>
              </div>
            )}
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
          <ChartsTab analyticsData={analyticsData} institutes={institutes} />
        ) : (
          <ApprovalGate>
            <ChartsTab analyticsData={analyticsData} institutes={institutes} />
          </ApprovalGate>
        )
      );
      case 'profile': return (
        <div className="user-management-panel">
          <h2>👤 Account & Settings</h2>

          {/* Account Overview */}
          <div className="profile-section">
            <h3>📋 Account Overview</h3>
            <div className="profile-cards">
              <div className="profile-card">
                <div className="profile-icon">👤</div>
                <div className="profile-info">
                  <h4>Personal Information</h4>
                  <p>Email: {profileData?.email || 'N/A'}</p>
                  <p>Contact: {profileData?.contact || 'Not provided'}</p>
                </div>
                <button className="btn-edit" onClick={() => setProfileOpen(true)}>Edit</button>
              </div>

              <div className="profile-card">
                <div className="profile-icon">🏛️</div>
                <div className="profile-info">
                  <h4>University Information</h4>
                  <p>University: {profileData?.university || 'N/A'}</p>
                  <p>Status: <span style={{ color: profileData?.universityApproved ? '#10b981' : '#f59e0b' }}>
                    {profileData?.universityStatus || 'Unknown'}
                  </span></p>
                </div>
                <div className="status-indicator">
                  {profileData?.universityApproved ? '✅' : '⏳'}
                </div>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="profile-section">
            <h3>🔒 Security Settings</h3>
            <div className="security-options">
              <div className="security-item">
                <div className="security-info">
                  <h4>Password</h4>
                  <p>Last changed: 30 days ago</p>
                </div>
                <button className="btn-secondary" onClick={() => setProfileOpen(true)}>Change Password</button>
              </div>

              <div className="security-item">
                <div className="security-info">
                  <h4>Login Activity</h4>
                  <p>View recent login attempts</p>
                </div>
                <button className="btn-secondary">View Activity</button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="profile-section">
            <h3>📊 Your Activity Summary</h3>
            <div className="activity-stats">
              <div className="stat-item">
                <span className="stat-number">12</span>
                <span className="stat-label">Institutes Managed</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">1,234</span>
                <span className="stat-label">Students Enrolled</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">45</span>
                <span className="stat-label">Courses Offered</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">98%</span>
                <span className="stat-label">Satisfaction Rate</span>
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
          <button className="logout-btn" onClick={() => {
            try {
              localStorage.removeItem('auth_token');
              localStorage.removeItem('registrar_user');
              localStorage.removeItem('registrar_approved');
            } catch (e) { }
            if (typeof onLogout === 'function') {
              try { onLogout(); } catch (e) { }
            }
            window.location.href = '/login';
          }}>
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
            <span>Welcome, Registrar</span>
            <div className="admin-avatar">👤</div>
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
        onProfileUpdate={fetchDashboardData}
      />
    </div>
  );
}

export default RegistrarDashboard;