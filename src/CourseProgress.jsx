import React, { useState, useEffect } from 'react';
import './CourseProgress.css';

const CourseProgress = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    completed: 0,
    pending: 7,
    progressPercentage: 0,
    lateSubmissions: 0
  });

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Trigger animation on mount
    setTimeout(() => setIsLoaded(true), 100);

    // In a real app, fetch actual progress data from API
    // For now using static demo data
    const fetchProgress = async () => {
      // Simulate API call
      setStats({
        completed: 0,
        pending: 7,
        progressPercentage: 0,
        lateSubmissions: 0
      });
    };

    fetchProgress();
  }, []);

  const handleBackToCourse = () => {
    if (onNavigate) {
      onNavigate('learning');
    }
  };

  return (
    <div className={`course-progress-container ${isLoaded ? 'loaded' : ''}`}>
      {/* Gradient Header */}
      <div className="progress-gradient-header">
        <div className="header-content">
          <button className="back-to-course-btn" onClick={handleBackToCourse}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Course
          </button>
        </div>
        <div className="header-wave"></div>
      </div>

      {/* Main Content */}
      <div className="progress-main-content">
        
        {/* Your Progress Card */}
        <div className="your-progress-card">
          <div className="progress-card-left">
            <div className="progress-icon">📊</div>
            <h2 className="progress-title">Your Progress</h2>
          </div>
          <div className="progress-badge">
            {stats.completed}/{stats.pending + stats.completed} Completed
          </div>
        </div>

        {/* Important Announcement Banner */}
        <div className="announcement-banner">
          <div className="announcement-icon">📢</div>
          <div className="announcement-content">
            <span className="announcement-label">Important:</span>
            <span className="announcement-text">
              All assignments must be completed before the due date. Late submissions will not be accepted.
            </span>
          </div>
        </div>

        {/* Additional Progress Details */}
        <div className="progress-details-section">
          <div className="details-card">
            <h3 className="details-title">📝 Assignment Breakdown</h3>
            <div className="progress-bar-container">
              <div className="progress-bar-track">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${stats.progressPercentage}%` }}
                >
                  <span className="progress-bar-text">{stats.progressPercentage}%</span>
                </div>
              </div>
            </div>
            <div className="progress-breakdown">
              <div className="breakdown-item">
                <span className="breakdown-dot completed-dot"></span>
                <span className="breakdown-label">Completed: {stats.completed}</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-dot pending-dot"></span>
                <span className="breakdown-label">Pending: {stats.pending}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseProgress;
