import React, { useState, useEffect } from 'react';

const EnrolledCourses = ({ onNavigate }) => {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch enrolled courses from API
  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get student ID from localStorage
        const authUser = localStorage.getItem('auth_user');
        if (!authUser) {
          setError('Please login to view enrolled courses');
          setLoading(false);
          return;
        }

        const user = JSON.parse(authUser);
        const studentId = user.studentId || user.Student_Id || user.id;

        if (!studentId) {
          setError('Student ID not found');
          setLoading(false);
          return;
        }

        console.log('Fetching enrollments for student:', studentId);

        // Fetch enrollments from API
        const response = await fetch(`http://localhost:5000/api/enrollments/student/${studentId}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || 'Failed to fetch enrollments');
        }

        console.log('Enrollments fetched:', result.data);

        // Transform data to match component structure
        const transformedCourses = result.data
          .filter(enrollment => enrollment.courseDetails) // Only include if course details exist
          .map(enrollment => {
            const course = enrollment.courseDetails;
            return {
              id: enrollment._id,
              enrollmentId: enrollment.Enrollment_Id,
              courseId: enrollment.Course_Id,
              title: course.Title || course.title || 'Untitled Course',
              instructor: course.Instructor_Name || course.instructorName || 'Instructor',
              progress: calculateProgress(enrollment),
              image: course.image_url || getCourseIcon(course.Category || course.category),
              imageUrl: course.image_url || null,
              nextLesson: getNextLesson(course),
              dueDate: getDueDate(enrollment),
              lastAccessed: getLastAccessed(enrollment),
              enrolledOn: enrollment.Enrolled_On,
              status: enrollment.Status,
              fullCourseData: course // Store full course data for navigation
            };
          });

        setEnrolledCourses(transformedCourses);
      } catch (err) {
        console.error('Error fetching enrollments:', err);
        setError(err.message || 'Failed to load enrolled courses');
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledCourses();
  }, []);

  // Helper functions
  const calculateProgress = (enrollment) => {
    // TODO: Implement actual progress calculation from course completion data
    return Math.floor(Math.random() * 100); // Temporary random progress
  };

  const getCourseIcon = (category) => {
    const icons = {
      'Web Development': '💻',
      'Programming': '👨‍💻',
      'Data Science': '📊',
      'Machine Learning': '🤖',
      'Cloud Computing': '☁️',
      'Mobile Development': '📱',
      'Security': '🔐',
      'Database': '🗄️',
      'DevOps': '⚙️',
      'Design': '🎨'
    };
    return icons[category] || '📚';
  };

  const getNextLesson = (course) => {
    // TODO: Implement actual next lesson from course progress
    return course.Title ? `${course.Title.split(' ').slice(0, 3).join(' ')} - Next Module` : 'Next Lesson';
  };

  const getDueDate = (enrollment) => {
    // TODO: Implement actual due date calculation
    const days = Math.floor(Math.random() * 7) + 1;
    return `${days} day${days > 1 ? 's' : ''}`;
  };

  const getLastAccessed = (enrollment) => {
    if (!enrollment.Enrolled_On) return 'Never';
    const enrollDate = new Date(enrollment.Enrolled_On);
    const today = new Date();
    const diffTime = Math.abs(today - enrollDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  };

  // Handle Continue Learning button click
  const handleContinueLearning = (course) => {
    try {
      // Determine the image to use (URL or fallback)
      let courseImage = course.imageUrl;
      if (!courseImage || courseImage.length < 10) {
        // If no image URL or it's just an emoji, use a default image
        courseImage = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop';
      }

      // Store selected course in localStorage for CourseLearningPage
      // Map fields to match what CourseLearningPage expects
      const courseData = {
        id: course.courseId,
        Course_Id: course.courseId,
        name: course.title, // CourseLearningPage expects 'name'
        Title: course.title,
        instructor: course.instructor, // CourseLearningPage expects 'instructor'
        Instructor_Name: course.instructor,
        image: courseImage, // CourseLearningPage expects 'image' as URL
        image_url: course.imageUrl,
        // Include all original course data
        ...course.fullCourseData
      };
      
      console.log('Navigating to course with data:', courseData);
      localStorage.setItem('selected_course', JSON.stringify(courseData));
      
      // Navigate to course learning page
      if (onNavigate) {
        onNavigate('learning');
      } else {
        // Fallback: try window navigation
        console.warn('onNavigate prop not provided, using window navigation');
        window.location.href = '/learning';
      }
    } catch (err) {
      console.error('Error navigating to course:', err);
      alert('Failed to open course. Please try again.');
    }
  };

  return (
    <section className="enrolled-courses-section">
      <div className="section-header-dashboard">
        <h2 className="dashboard-section-title">📚 My Enrolled Courses</h2>
        <button className="view-all-btn">View All →</button>
      </div>
      
      {loading ? (
        <div className="enrolled-courses-loading">
          <div className="loading-spinner"></div>
          <p>Loading your courses...</p>
        </div>
      ) : error ? (
        <div className="enrolled-courses-error">
          <p className="error-icon">⚠️</p>
          <p className="error-message">{error}</p>
        </div>
      ) : enrolledCourses.length === 0 ? (
        <div className="enrolled-courses-empty">
          <p className="empty-icon">📚</p>
          <h3>No Enrolled Courses Yet</h3>
          <p>Start learning by enrolling in a course!</p>
        </div>
      ) : (
      <div className="enrolled-courses-grid">
        {enrolledCourses.map(course => (
          <div key={course.id} className="enrolled-course-card">
            <div className="enrollment-badge">
              <span className="badge-icon">✓</span>
              <span className="badge-text">Enrolled</span>
            </div>
            
            <div className="enrolled-course-header">
              <div className="course-thumbnail">
                {course.imageUrl ? (
                  <img 
                    src={course.imageUrl} 
                    alt={course.title}
                    className="course-thumbnail-img"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="course-thumbnail-emoji" 
                  style={{ display: course.imageUrl ? 'none' : 'flex' }}
                >
                  {course.image}
                </div>
              </div>
              <div className="course-info-brief">
                <h3 className="enrolled-course-title">{course.title}</h3>
                <p className="enrolled-course-instructor">{course.instructor}</p>
              </div>
            </div>
            
            <div className="course-progress-section">
              <div className="progress-header">
                <span className="progress-label">Learning Progress</span>
                <span className="progress-percentage">{course.progress}%</span>
              </div>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${course.progress}%` }}
                ></div>
              </div>
            </div>

            <div className="course-meta-info">
              <div className="meta-item">
                <span className="meta-label">Next Lesson</span>
                <span className="meta-value">{course.nextLesson}</span>
              </div>
            </div>

            <button 
              className="continue-learning-btn"
              onClick={() => handleContinueLearning(course)}
            >
              Continue Learning →
            </button>
          </div>
        ))}
      </div>
      )}
    </section>
  );
};

export default EnrolledCourses;
