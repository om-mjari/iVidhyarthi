import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardHeader from './components/DashboardHeader';
import './MyCourses.css';

const MyCourses = ({ user, onNavigate, onLogout }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      if (!user?.email && !user?.id && !user?._id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const studentId = user?.id || user?._id;
        const response = await axios.get(`http://localhost:5000/api/enrollments/student/${studentId}`);
        
        if (response.data.success) {
          setCourses(response.data.data || []);
        } else {
          setError(response.data.message || 'Failed to fetch courses');
        }
      } catch (err) {
        console.error('Error fetching enrolled courses:', err);
        setError('Unable to load your courses. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledCourses();
  }, [user]);

  const handleCourseClick = (course) => {
    localStorage.setItem('selected_course', JSON.stringify(course.courseDetails || { id: course.Course_Id }));
    if (onNavigate) onNavigate('learning');
  };

  return (
    <div className="my-courses-page">
      <DashboardHeader user={user} onNavigate={onNavigate} onLogout={onLogout} />
      
      <div className="my-courses-container">
        <div className="courses-header">
          <h1>My Enrolled Courses</h1>
          <p className="courses-subtitle">Continue your learning journey</p>
        </div>

        {loading && (
          <div className="courses-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="course-card skeleton">
                <div className="skeleton-thumbnail"></div>
                <div className="skeleton-content">
                  <div className="skeleton-title"></div>
                  <div className="skeleton-text"></div>
                  <div className="skeleton-text short"></div>
                  <div className="skeleton-button"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h2>Oops! Something went wrong</h2>
            <p>{error}</p>
            <button className="retry-btn" onClick={() => window.location.reload()}>
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && courses.length === 0 && (
          <div className="empty-state">
            <div className="empty-illustration">
              <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="100" r="80" fill="#F0F4F8" />
                <path d="M70 90C70 83.3726 75.3726 78 82 78H118C124.627 78 130 83.3726 130 90V130C130 136.627 124.627 142 118 142H82C75.3726 142 70 136.627 70 130V90Z" fill="#E2E8F0" />
                <rect x="80" y="88" width="40" height="4" rx="2" fill="#CBD5E0" />
                <rect x="80" y="98" width="35" height="3" rx="1.5" fill="#CBD5E0" />
                <rect x="80" y="106" width="30" height="3" rx="1.5" fill="#CBD5E0" />
                <circle cx="100" cy="60" r="15" fill="#00B894" opacity="0.2" />
                <path d="M100 53V60M100 60V67M100 60H107M100 60H93" stroke="#00B894" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <h2>No Courses Yet</h2>
            <p>Start your learning journey by enrolling in courses</p>
            <button className="browse-courses-btn" onClick={() => onNavigate && onNavigate('home')}>
              <span className="btn-icon">🔍</span>
              Browse All Courses
            </button>
          </div>
        )}

        {!loading && !error && courses.length > 0 && (
          <div className="courses-grid">
            {courses.map((enrollment) => {
              const course = enrollment.courseDetails || {};
              const progress = Math.floor(Math.random() * 21); // 0-20% random progress
              const enrolledDate = new Date(enrollment.Enrolled_On).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });

              return (
                <div 
                  key={enrollment._id || enrollment.Enrollment_Id} 
                  className="course-card"
                  onClick={() => handleCourseClick(enrollment)}
                >
                  <div className="course-thumbnail">
                    {course.image ? (
                      <img src={course.image} alt={course.Title || 'Course'} />
                    ) : (
                      <div className="placeholder-thumbnail">
                        <span className="thumbnail-icon">📚</span>
                      </div>
                    )}
                    <div className="course-badge">Enrolled</div>
                  </div>

                  <div className="course-content">
                    <h3 className="course-title">{course.Title || course.title || 'Course Title'}</h3>
                    
                    <div className="course-meta">
                      <div className="instructor-info">
                        <span className="instructor-icon">👨‍🏫</span>
                        <span className="instructor-name">{course.instructor || course.Lecturer_Id || 'Instructor'}</span>
                      </div>
                      
                      {course.rating && (
                        <div className="course-rating">
                          <span className="star-icon">⭐</span>
                          <span className="rating-value">{course.rating}</span>
                        </div>
                      )}
                    </div>

                    <div className="progress-section">
                      <div className="progress-info">
                        <span className="progress-label">Progress</span>
                        <span className="progress-percentage">{progress}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>

                    <div className="course-footer">
                      <span className="enrolled-date">
                        <span className="date-icon">📅</span>
                        Enrolled: {enrolledDate}
                      </span>
                      <button className="start-learning-btn">
                        Start Learning →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && courses.length > 0 && (
          <div className="courses-summary">
            <p>Showing {courses.length} enrolled {courses.length === 1 ? 'course' : 'courses'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCourses;