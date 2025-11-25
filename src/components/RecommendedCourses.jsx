import React from 'react';

const RecommendedCourses = () => {
  const recommendations = [
    {
      id: 1,
      title: 'Advanced React & TypeScript',
      instructor: 'Dr. Sarah Johnson',
      price: 1299,
      rating: 4.8,
      students: 2340,
      duration: '12 weeks',
      level: 'Advanced',
      matchScore: 95,
      image: '⚛️',
      tags: ['React', 'TypeScript', 'Frontend']
    },
    {
      id: 2,
      title: 'Deep Learning Specialization',
      instructor: 'Prof. Michael Chen',
      price: 1499,
      rating: 4.9,
      students: 3120,
      duration: '16 weeks',
      level: 'Intermediate',
      matchScore: 88,
      image: '🧠',
      tags: ['AI', 'Deep Learning', 'Python']
    },
    {
      id: 3,
      title: 'DevOps & CI/CD Pipeline',
      instructor: 'Mr. Amit Patel',
      price: 1199,
      rating: 4.7,
      students: 1890,
      duration: '10 weeks',
      level: 'Intermediate',
      matchScore: 82,
      image: '🔧',
      tags: ['DevOps', 'Docker', 'Kubernetes']
    }
  ];

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
        <button className="view-all-btn">See All →</button>
      </div>

      <div className="recommended-courses-grid">
        {recommendations.map(course => (
          <div key={course.id} className="recommended-course-card">
            <div className="match-score-badge">{course.matchScore}% Match</div>
            
            <div className="recommended-course-thumbnail">{course.image}</div>
            
            <div className="recommended-course-content">
              <h3 className="recommended-course-title">{course.title}</h3>
              <p className="recommended-course-instructor">by {course.instructor}</p>

              <div className="course-tags">
                {course.tags.map((tag, index) => (
                  <span key={index} className="course-tag">{tag}</span>
                ))}
              </div>

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
                <button className="enroll-recommended-btn">Enroll Now</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RecommendedCourses;
