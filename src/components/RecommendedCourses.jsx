import React, { useState, useEffect } from 'react';

const RecommendedCourses = ({ onNavigate }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get student ID and current course from localStorage
      const authUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
      const studentId = authUser.Student_Id || authUser.id;
      const selectedCourse = JSON.parse(localStorage.getItem('selected_course') || 'null');
      const currentCourseId = selectedCourse?.id || selectedCourse?.Course_Id;

      let response;
      
      // Priority 1: If user is viewing a course, show co-enrolled courses
      if (currentCourseId) {
        const queryParams = new URLSearchParams({
          limit: '6'
        });
        
        // Add studentId if available for filtering
        if (studentId) {
          queryParams.append('studentId', studentId);
        }
        
        console.log('🎯 Fetching co-enrolled courses for course:', currentCourseId);
        response = await fetch(`http://localhost:5000/api/recommendations/also-enrolled/${currentCourseId}?${queryParams}`);
      }
      // Priority 2: If user is logged in, show personalized recommendations
      else if (studentId) {
        console.log('👤 Fetching personalized recommendations for student:', studentId);
        // The student endpoint already filters enrolled courses, but we can still pass studentId for consistency
        response = await fetch(`http://localhost:5000/api/recommendations/student/${studentId}?limit=6`);
      }
      // Priority 3: Show popular courses for non-logged-in users
      else {
        const popularParams = new URLSearchParams({
          limit: '6'
        });
        
        // Add studentId if available for filtering
        if (studentId) {
          popularParams.append('studentId', studentId);
        }
        
        console.log('🌟 Fetching popular courses');
        response = await fetch(`http://localhost:5000/api/recommendations/popular?${popularParams}`);
      }

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const result = await response.json();
      
      if (result.success) {
        // Transform API data to component format
        const transformedData = result.data.map(course => ({
          id: course.Course_Id || course.id,
          title: course.Title || course.title,
          instructor: course.Instructor_Name || course.instructor || 'iVidhyarthi',
          price: course.Price || course.price || 0,
          rating: course.Rating || course.rating || 4.5,
          students: course.Enrolled_Students || course.enrolled_students || 0,
          duration: course.Duration || course.duration || '8 weeks',
          level: course.Level || course.level || 'Beginner',
          matchScore: course.matchScore || 85,
          image: course.image_url || course.image || course.Thumbnail_URL,
          tags: parseTags(course.Tags || course.tags || course.Category || ''),
          category: course.Category || course.category,
          description: course.Description || course.description
        }));
        
        setRecommendations(transformedData);
      } else {
        throw new Error(result.message || 'Failed to load recommendations');
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(err.message);
      // Fallback to empty array on error
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const parseTags = (tagsString) => {
    if (!tagsString) return [];
    if (typeof tagsString === 'string') {
      return tagsString.split(',').map(t => t.trim()).filter(t => t.length > 0).slice(0, 3);
    }
    return [];
  };

  const handleEnrollClick = (course) => {
    // Save course to localStorage and navigate to course details
    localStorage.setItem('selected_course', JSON.stringify(course));
    if (onNavigate) {
      onNavigate('course');
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={`full-${i}`} className="star filled">★</span>);
    }
    if (hasHalfStar) {
      stars.push(<span key="half" className="star half">★</span>);
    }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="star empty">☆</span>);
    }
    
    return stars;
  };

  return (
    <section className="recommended-courses-section">
      <div className="section-header-dashboard">
        <h2 className="dashboard-section-title">
          <span className="ai-badge">🤖 AI</span> Recommended For You
        </h2>
        <button className="view-all-btn" onClick={() => onNavigate && onNavigate('all-courses')}>
          See All →
        </button>
      </div>

      {loading ? (
        <div className="recommendations-loading">
          <div className="spinner"></div>
          <p>Finding perfect courses for you...</p>
        </div>
      ) : error ? (
        <div className="recommendations-error">
          <p>Unable to load recommendations. Please try again later.</p>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="no-recommendations">
          <p>No recommendations available at the moment.</p>
        </div>
      ) : (
        <div className="recommended-courses-grid">
          {recommendations.map(course => (
            <div key={course.id} className="recommended-course-card">
              <div className="match-score-badge">{course.matchScore}% Match</div>
              
              <div className="recommended-course-thumbnail">
                {course.image && course.image.startsWith('http') ? (
                  <img src={course.image} alt={course.title} />
                ) : (
                  <div className="course-placeholder">
                    {course.category ? course.category.charAt(0).toUpperCase() : '📚'}
                  </div>
                )}
              </div>
              
              <div className="recommended-course-content">
                <h3 className="recommended-course-title">{course.title}</h3>
                <p className="recommended-course-instructor">by {course.instructor}</p>

                {course.tags.length > 0 && (
                  <div className="course-tags">
                    {course.tags.map((tag, index) => (
                      <span key={index} className="course-tag">{tag}</span>
                    ))}
                  </div>
                )}

                <div className="course-rating-row">
                  <div className="rating-stars">
                    {renderStars(course.rating)}
                    <span className="rating-value">{course.rating}</span>
                  </div>
                  <span className="students-count">({course.students.toLocaleString()} students)</span>
                </div>

                <div className="course-meta-row">
                  <span className="course-duration">📚 {course.duration}</span>
                  <span className="course-level">🎯 {course.level}</span>
                </div>

                <div className="course-footer">
                  <div className="course-price">₹{course.price}</div>
                  <button 
                    className="enroll-recommended-btn"
                    onClick={() => handleEnrollClick(course)}
                  >
                    Enroll Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default RecommendedCourses;
