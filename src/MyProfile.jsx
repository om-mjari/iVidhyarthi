import React, { useState, useEffect } from 'react';
import DashboardHeader from './components/DashboardHeader';
import './MyProfile.css';

const MyProfile = ({ user, onNavigate, onLogout }) => {
  return (
    <div className="my-profile-page">
      <DashboardHeader user={user} onNavigate={onNavigate} onLogout={onLogout} />
      <div className="profile-container">
        <h2>My Profile</h2>
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="profile-info">
              <h3>{user?.name || 'Student Name'}</h3>
              <p>{user?.email || 'student@example.com'}</p>
            </div>
          </div>
          <div className="profile-details">
            <div className="detail-item">
              <label>User ID</label>
              <p>{user?.id || user?._id || 'N/A'}</p>
            </div>
            <div className="detail-item">
              <label>Phone</label>
              <p>{user?.phone || user?.contact || 'N/A'}</p>
            </div>
            <div className="detail-item">
              <label>Date of Birth</label>
              <p>{user?.dob || user?.dateOfBirth || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;