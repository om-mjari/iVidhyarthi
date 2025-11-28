import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EnrolledCoursesList.css';

const EnrolledCoursesList = ({ studentId, onNavigate }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!studentId) return;
      try {
        const response = await axios.get(`http://localhost:5000/api/enrollments/student/${studentId}`);
        if (response.data.success) {
          setCourses(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching enrollments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, [studentId]);

  if (loading) return <div className="loading-courses">Loading courses...</div>;

  if (courses.length === 0) {
    return (
      <div className="no-courses-container">
        <p>You haven't enrolled in any courses yet.</p>
        <button className="browse-btn" onClick={() => onNavigate && onNavigate('courses')}>Browse Courses</button>
      </div>
    );
  }

  return (
    <div className="enrolled-courses-list-container">
      <h3 className="section-title">My Enrolled Courses</h3>
      <div className="courses-grid-nptel">
        {courses.map((enrollment) => (
          <div key={enrollment._id || enrollment.Enrollment_Id} className="course-card-nptel" onClick={() => {
             localStorage.setItem('selected_course', JSON.stringify({ id: enrollment.Course_Id }));
             if (onNavigate) onNavigate('learning');
          }}>
             <div className="course-card-header">
                <div className="course-icon">📚</div>
                <span className="status-badge">{enrollment.Status || 'Active'}</span>
             </div>
             <div className="course-card-body">
                <h4>{enrollment.Course_Id}</h4>
                <p className="enrolled-date">Enrolled on: {new Date(enrollment.Enrolled_On).toLocaleDateString()}</p>
             </div>
             <div className="course-card-footer">
                <button className="continue-btn">Continue Learning</button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EnrolledCoursesList;