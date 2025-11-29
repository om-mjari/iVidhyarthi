import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardHeader from './components/DashboardHeader';
import './MyProfile.css';

const MyProfile = ({ user, onNavigate, onLogout }) => {
  const [profileData, setProfileData] = useState(user || {});

  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.id || user?._id) {
        try {
          const userId = user.id || user._id;
          const response = await axios.get(`http://localhost:5000/api/auth/student-profile/${userId}`);
          if (response.data.success) {
            const student = response.data.data;
            setProfileData(prev => ({
              ...prev,
              name: student.Full_Name || prev.name,
              phone: student.Mobile_No || prev.phone,
              dob: student.DOB || prev.dob,
              gender: student.Gender || prev.gender,
              ...student // merge other fields if needed
            }));
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      }
    };

    fetchProfile();
  }, [user]);

  return (
    <div className="my-profile-page">
      <DashboardHeader user={user} onNavigate={onNavigate} onLogout={onLogout} />
      <div className="profile-container">
        <h2>My Profile</h2>
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              {profileData.name?.charAt(0) || 'U'}
            </div>
            <div className="profile-info">
              <h3>{profileData.name || 'Student Name'}</h3>
              <p>{profileData.email || 'student@example.com'}</p>
            </div>
          </div>
          <div className="profile-details">
            <div className="detail-item">
              <label>User ID</label>
              <p>{profileData.id || profileData._id || 'N/A'}</p>
            </div>
            <div className="detail-item">
              <label>Phone</label>
              <p>{profileData.phone || profileData.Mobile_No || 'N/A'}</p>
            </div>
            <div className="detail-item">
              <label>Date of Birth</label>
              <p>{(profileData.dob || profileData.dateOfBirth || profileData.DOB) ? new Date(profileData.dob || profileData.dateOfBirth || profileData.DOB).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div className="detail-item">
              <label>Gender</label>
              <p>{profileData.gender || profileData.Gender || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;