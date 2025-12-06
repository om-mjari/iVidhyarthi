import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardHeader from './components/DashboardHeader';
import './MyProfile.css';

const MyProfile = ({ user, onNavigate, onLogout }) => {
  const [profileData, setProfileData] = useState(user || {});
  const [studentData, setStudentData] = useState({});
  const [enrollmentStats, setEnrollmentStats] = useState({ totalCourses: 0, completedCourses: 0, inProgressCourses: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [otpData, setOtpData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.id || user?._id) {
        try {
          const userId = user.id || user._id;
          const response = await axios.get(`http://localhost:5000/api/auth/student-profile/${userId}`);
          if (response.data.success) {
            const student = response.data.data;
            setStudentData(student);
            setProfileData(prev => ({
              ...prev,
              name: student.Full_Name || prev.name,
              phone: student.Mobile_No || prev.phone,
              dob: student.DOB || prev.dob,
              gender: student.Gender || prev.gender,
              institution: student.Institution_Id,
              enrollmentYear: student.Enrollment_Year,
              branch: student.Branch,
              course: student.Course,
              semester: student.Semester,
              qualification: student.Highest_Qualification
            }));
            setEditableData({
              phone: student.Mobile_No || '',
              branch: student.Branch || '',
              semester: student.Semester || ''
            });
          }

          // Fetch enrollment statistics
          const enrollmentResponse = await axios.get(`http://localhost:5000/api/enrollments/student/${userId}`);
          if (enrollmentResponse.data.success) {
            const enrollments = enrollmentResponse.data.data;
            setEnrollmentStats({
              totalCourses: enrollments.length,
              completedCourses: enrollments.filter(e => e.Progress === 100).length,
              inProgressCourses: enrollments.filter(e => e.Progress > 0 && e.Progress < 100).length
            });
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      }
    };

    fetchProfile();
  }, [user]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e) => {
    setEditableData({
      ...editableData,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const userId = user.id || user._id;
      const response = await axios.put(`http://localhost:5000/api/auth/update-student-profile/${userId}`, editableData);
      
      if (response.data.success) {
        alert('Profile updated successfully!');
        setIsEditing(false);
        // Refresh profile data
        const updatedResponse = await axios.get(`http://localhost:5000/api/auth/student-profile/${userId}`);
        if (updatedResponse.data.success) {
          const student = updatedResponse.data.data;
          setStudentData(student);
          setProfileData(prev => ({
            ...prev,
            phone: student.Mobile_No,
            branch: student.Branch,
            semester: student.Semester
          }));
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      alert('Password must be at least 6 characters long!');
      return;
    }

    try {
      setLoading(true);
      const userId = user.id || user._id;
      const response = await axios.post(`http://localhost:5000/api/auth/change-password`, {
        userId,
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.data.success) {
        alert('Password changed successfully!');
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!otpData.email) {
      alert('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`http://localhost:5000/send-otp`, {
        email: otpData.email
      });

      if (response.data.success) {
        alert('OTP sent to your email!');
        setOtpSent(true);
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      alert('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordWithOTP = async () => {
    if (otpData.newPassword !== otpData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    if (otpData.newPassword.length < 6) {
      alert('Password must be at least 6 characters long!');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`http://localhost:5000/reset-password`, {
        email: otpData.email,
        otp: otpData.otp,
        newPassword: otpData.newPassword
      });

      if (response.data.success) {
        alert('Password reset successfully!');
        setShowForgotPassword(false);
        setShowPasswordModal(false);
        setOtpData({ email: '', otp: '', newPassword: '', confirmPassword: '' });
        setOtpSent(false);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      alert(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-profile-page">
      <DashboardHeader user={user} onNavigate={onNavigate} onLogout={onLogout} />
      
      <div className="profile-container">
        <div className="profile-header-section">
          <h1 className="profile-main-title">My Profile</h1>
          <p className="profile-subtitle">Manage your personal information and account settings</p>
        </div>

        {/* Profile Overview Card */}
        <div className="profile-overview-card">
          <div className="profile-banner"></div>
          <div className="profile-main-info">
            <div className="profile-avatar-large">
              {profileData.name?.charAt(0)?.toUpperCase() || 'S'}
            </div>
            <div className="profile-identity">
              <h2>{profileData.name || 'Student Name'}</h2>
              <p className="profile-email">{profileData.email || 'student@example.com'}</p>
              <div className="profile-badges">
                <span className="badge badge-primary">Student</span>
                <span className="badge badge-success">Active</span>
              </div>
            </div>
            <div className="profile-actions">
              {!isEditing ? (
                <button className="btn-edit" onClick={handleEditToggle}>
                  <span>✏️</span> Edit Profile
                </button>
              ) : (
                <div className="edit-actions">
                  <button className="btn-save" onClick={handleSaveProfile} disabled={loading}>
                    {loading ? 'Saving...' : '💾 Save Changes'}
                  </button>
                  <button className="btn-cancel" onClick={handleEditToggle}>
                    ❌ Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card stat-primary">
            <div className="stat-icon">📚</div>
            <div className="stat-content">
              <h3>{enrollmentStats.totalCourses}</h3>
              <p>Total Courses</p>
            </div>
          </div>
          <div className="stat-card stat-success">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{enrollmentStats.completedCourses}</h3>
              <p>Completed</p>
            </div>
          </div>
          <div className="stat-card stat-warning">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <h3>{enrollmentStats.inProgressCourses}</h3>
              <p>In Progress</p>
            </div>
          </div>
        </div>

        <div className="profile-content-grid">
          {/* Personal Information */}
          <div className="profile-section">
            <div className="section-header">
              <h3>👤 Personal Information</h3>
            </div>
            <div className="section-content">
              <div className="info-row">
                <div className="info-label">Full Name</div>
                <div className="info-value">{profileData.name || 'N/A'}</div>
              </div>
              <div className="info-row">
                <div className="info-label">Email Address</div>
                <div className="info-value">{profileData.email || 'N/A'}</div>
              </div>
              <div className="info-row">
                <div className="info-label">Phone Number</div>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    className="info-input"
                    value={editableData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                  />
                ) : (
                  <div className="info-value">{profileData.phone || 'N/A'}</div>
                )}
              </div>
              <div className="info-row">
                <div className="info-label">Date of Birth</div>
                <div className="info-value">
                  {profileData.dob ? new Date(profileData.dob).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'N/A'}
                </div>
              </div>
              <div className="info-row">
                <div className="info-label">Gender</div>
                <div className="info-value">{profileData.gender || 'N/A'}</div>
              </div>
              <div className="info-row">
                <div className="info-label">User ID</div>
                <div className="info-value user-id">{profileData.id || profileData._id || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="profile-section">
            <div className="section-header">
              <h3>🎓 Academic Information</h3>
            </div>
            <div className="section-content">
              <div className="info-row">
                <div className="info-label">Enrollment Year</div>
                <div className="info-value">{profileData.enrollmentYear || 'N/A'}</div>
              </div>
              <div className="info-row">
                <div className="info-label">Course/Program</div>
                <div className="info-value">{profileData.course || 'N/A'}</div>
              </div>
              <div className="info-row">
                <div className="info-label">Branch/Specialization</div>
                {isEditing ? (
                  <input
                    type="text"
                    name="branch"
                    className="info-input"
                    value={editableData.branch}
                    onChange={handleInputChange}
                    placeholder="Enter branch"
                  />
                ) : (
                  <div className="info-value">{profileData.branch || 'N/A'}</div>
                )}
              </div>
              <div className="info-row">
                <div className="info-label">Current Semester</div>
                {isEditing ? (
                  <input
                    type="text"
                    name="semester"
                    className="info-input"
                    value={editableData.semester}
                    onChange={handleInputChange}
                    placeholder="Enter semester"
                  />
                ) : (
                  <div className="info-value">{profileData.semester || 'N/A'}</div>
                )}
              </div>
              <div className="info-row">
                <div className="info-label">Highest Qualification</div>
                <div className="info-value">{profileData.qualification || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="profile-section security-section">
          <div className="section-header">
            <h3>🔒 Security Settings</h3>
          </div>
          <div className="section-content">
            <div className="security-options">
              <div className="security-option">
                <div className="security-info">
                  <h4>Change Password</h4>
                  <p>Update your password to keep your account secure</p>
                </div>
                <button className="btn-security" onClick={() => setShowPasswordModal(true)}>
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && !showForgotPassword && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔐 Change Password</h3>
              <button className="modal-close" onClick={() => setShowPasswordModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  placeholder="Enter current password"
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  placeholder="Re-enter new password"
                />
              </div>
              <div className="form-group" style={{ marginTop: '10px', textAlign: 'center' }}>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowForgotPassword(true);
                    setOtpData({...otpData, email: profileData.email || user.email});
                  }}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: '#3b82f6', 
                    cursor: 'pointer', 
                    textDecoration: 'underline',
                    fontSize: '14px'
                  }}
                >
                  Forgot Password?
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-modal btn-cancel" onClick={() => setShowPasswordModal(false)}>
                Cancel
              </button>
              <button className="btn-modal btn-primary" onClick={handlePasswordChange} disabled={loading}>
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password OTP Modal */}
      {showPasswordModal && showForgotPassword && (
        <div className="modal-overlay" onClick={() => {
          setShowForgotPassword(false);
          setOtpSent(false);
          setOtpData({ email: '', otp: '', newPassword: '', confirmPassword: '' });
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔑 Reset Password via OTP</h3>
              <button className="modal-close" onClick={() => {
                setShowForgotPassword(false);
                setOtpSent(false);
                setOtpData({ email: '', otp: '', newPassword: '', confirmPassword: '' });
              }}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Email Address</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="email"
                    className="form-input"
                    value={otpData.email}
                    onChange={(e) => setOtpData({...otpData, email: e.target.value})}
                    placeholder="Enter your registered email"
                    disabled={otpSent}
                    style={{ flex: 1 }}
                  />
                  {!otpSent && (
                    <button 
                      className="btn-modal btn-primary" 
                      onClick={handleSendOTP} 
                      disabled={loading}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {loading ? 'Sending...' : 'Send OTP'}
                    </button>
                  )}
                </div>
              </div>
              
              {otpSent && (
                <>
                  <div className="form-group">
                    <label>Enter OTP</label>
                    <input
                      type="text"
                      className="form-input"
                      value={otpData.otp}
                      onChange={(e) => setOtpData({...otpData, otp: e.target.value})}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                    />
                  </div>
                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      className="form-input"
                      value={otpData.newPassword}
                      onChange={(e) => setOtpData({...otpData, newPassword: e.target.value})}
                      placeholder="Enter new password (min 6 characters)"
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      className="form-input"
                      value={otpData.confirmPassword}
                      onChange={(e) => setOtpData({...otpData, confirmPassword: e.target.value})}
                      placeholder="Re-enter new password"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-modal btn-cancel" onClick={() => {
                setShowForgotPassword(false);
                setOtpSent(false);
                setOtpData({ email: '', otp: '', newPassword: '', confirmPassword: '' });
              }}>
                Back
              </button>
              {otpSent && (
                <button className="btn-modal btn-primary" onClick={handleResetPasswordWithOTP} disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProfile;