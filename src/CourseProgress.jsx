import React, { useState, useEffect } from 'react';
import './CourseProgress.css';

const CourseProgress = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    completed: 0,
    pending: 0,
    progressPercentage: 0,
    lateSubmissions: 0
  });

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Trigger animation on mount
    setTimeout(() => setIsLoaded(true), 100);

    // Fetch actual progress data from API
    const fetchProgress = async () => {
      try {
        const selectedCourse = localStorage.getItem('selected_course');
        const authUser = localStorage.getItem('auth_user');
        const authToken = localStorage.getItem('auth_token');

        if (!selectedCourse || !authUser) {
          setStats({
            completed: 0,
            pending: 0,
            progressPercentage: 0,
            lateSubmissions: 0
          });
          return;
        }

        const courseData = JSON.parse(selectedCourse);
        const userData = JSON.parse(authUser);
        const courseId = courseData.Course_Id || courseData.id;
        const studentId = userData.id || userData._id;

        // Fetch video progress
        let videoCompletionPercentage = 0;
        if (authToken && studentId) {
          try {
            const videoProgressResponse = await fetch(
              `http://localhost:5000/api/video-progress/student/${studentId}/course/${courseId}/summary`,
              {
                headers: {
                  'Authorization': `Bearer ${authToken}`
                }
              }
            );
            
            if (videoProgressResponse.ok) {
              const videoResult = await videoProgressResponse.json();
              if (videoResult.success && videoResult.data) {
                videoCompletionPercentage = videoResult.data.completionPercentage || 0;
              }
            }
          } catch (error) {
            console.error('Error fetching video progress:', error);
          }
        }

        // Fetch assignments for this course
        const assignmentsResponse = await fetch(`http://localhost:5000/api/assignments/course/${courseId}`);
        const assignmentsResult = await assignmentsResponse.json();
        
        const totalAssignments = assignmentsResult.success ? assignmentsResult.data.length : 0;

        // Fetch completed assignments for this student
        let completedCount = 0;
        if (authToken && studentId) {
          const submissionsResponse = await fetch(`http://localhost:5000/api/submissions/student/${studentId}`, {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          });
          
          if (submissionsResponse.ok) {
            const submissionsResult = await submissionsResponse.json();
            if (submissionsResult.success && submissionsResult.data) {
              // Count submissions for this specific course
              completedCount = submissionsResult.data.filter(sub => 
                sub.Course_Id === courseId || sub.courseId === courseId
              ).length;
            }
          }
        }

        const pendingCount = totalAssignments - completedCount;
        const assignmentCompletionPercentage = totalAssignments > 0 ? Math.round((completedCount / totalAssignments) * 100) : 0;

        // Overall completion is average of video and assignment completion
        const overallPercentage = Math.round((videoCompletionPercentage + assignmentCompletionPercentage) / 2);

        setStats({
          completed: completedCount,
          pending: pendingCount,
          progressPercentage: overallPercentage,
          lateSubmissions: 0
        });
      } catch (error) {
        console.error('Error fetching progress:', error);
        setStats({
          completed: 0,
          pending: 0,
          progressPercentage: 0,
          lateSubmissions: 0
        });
      }
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
