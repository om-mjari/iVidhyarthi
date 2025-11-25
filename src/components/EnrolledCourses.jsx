import React from 'react';

const EnrolledCourses = () => {
  const enrolledCourses = [
    {
      id: 1,
      title: 'Full Stack Web Development',
      instructor: 'Dr. Rajesh Kumar',
      progress: 65,
      image: '💻',
      nextLesson: 'React Hooks Advanced',
      dueDate: '2 days',
      lastAccessed: 'Yesterday'
    },
    {
      id: 2,
      title: 'Machine Learning Fundamentals',
      instructor: 'Prof. Anita Desai',
      progress: 42,
      image: '🤖',
      nextLesson: 'Neural Networks Intro',
      dueDate: '5 days',
      lastAccessed: '3 days ago'
    },
    {
      id: 3,
      title: 'Cloud Computing with AWS',
      instructor: 'Mr. Vikram Singh',
      progress: 88,
      image: '☁️',
      nextLesson: 'AWS Lambda Functions',
      dueDate: '1 day',
      lastAccessed: 'Today'
    }
  ];

  return (
    <section className="enrolled-courses-section">
      <div className="section-header-dashboard">
        <h2 className="dashboard-section-title">My Enrolled Courses</h2>
        <button className="view-all-btn">View All →</button>
      </div>
      
      <div className="enrolled-courses-grid">
        {enrolledCourses.map(course => (
          <div key={course.id} className="enrolled-course-card">
            <div className="enrolled-course-header">
              <div className="course-thumbnail">{course.image}</div>
              <div className="course-info-brief">
                <h3 className="enrolled-course-title">{course.title}</h3>
                <p className="enrolled-course-instructor">by {course.instructor}</p>
              </div>
            </div>
            
            <div className="course-progress-section">
              <div className="progress-header">
                <span className="progress-label">Progress</span>
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
                <span className="meta-label">Next Lesson:</span>
                <span className="meta-value">{course.nextLesson}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Due in:</span>
                <span className="meta-value due-date">{course.dueDate}</span>
              </div>
            </div>

            <button className="continue-learning-btn">Continue Learning →</button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default EnrolledCourses;
