  import React, { useState, useEffect } from 'react';
import './CourseLearningPage.css';

const CourseLearningPage = ({ onBackToDashboard }) => {
  console.log('🔥 CourseLearningPage component is being rendered!');
  console.log('🔥 onBackToDashboard prop:', onBackToDashboard);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [currentVideo, setCurrentVideo] = useState(0);
  const [completedAssignments, setCompletedAssignments] = useState([]);
  const [feedback, setFeedback] = useState({
    rating: 0,
    comments: '',
    topics: [],
    difficulty: '',
    recommend: false
  });

  console.log('🔥 Component state:', { selectedCourse, currentVideo });

  useEffect(() => {
    console.log('🔥 useEffect running - loading course data');
    const savedCourse = localStorage.getItem('selected_course');
    if (savedCourse) {
      try {
        const parsedCourse = JSON.parse(savedCourse);
        console.log('🔥 Loaded course from localStorage:', parsedCourse);
        setSelectedCourse(parsedCourse);
      } catch (error) {
        console.error('Error parsing saved course:', error);
        // Set default course if parsing fails
        const defaultCourse = {
          name: "Blockchain Development",
          instructor: "Bhumika Ma'am",
          image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=300&fit=crop"
        };
        console.log('🔥 Setting default course:', defaultCourse);
        setSelectedCourse(defaultCourse);
      }
    } else {
      // Set default course if no saved course
      const defaultCourse = {
        name: "Blockchain Development",
        instructor: "Bhumika Ma'am",
        image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=300&fit=crop"
      };
      console.log('🔥 No saved course, setting default:', defaultCourse);
      setSelectedCourse(defaultCourse);
    }
  }, []);

  // Sample course content
  const courseContent = {
    videos: [
      {
        id: 1,
        title: "Introduction to Data Structures",
        duration: "15:30",
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop",
        url: "https://www.youtube.com/embed/dQw4w9WgXcQ"
      },
      {
        id: 2,
        title: "Arrays and Linked Lists",
        duration: "22:45",
        thumbnail: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=300&fit=crop",
        url: "https://www.youtube.com/embed/dQw4w9WgXcQ"
      },
      {
        id: 3,
        title: "Stacks and Queues",
        duration: "18:20",
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop",
        url: "https://www.youtube.com/embed/dQw4w9WgXcQ"
      },
      {
        id: 4,
        title: "Trees and Binary Search Trees",
        duration: "25:10",
        thumbnail: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=300&fit=crop",
        url: "https://www.youtube.com/embed/dQw4w9WgXcQ"
      }
    ],
    assignments: [
      {
        id: 1,
        title: "Array Implementation",
        description: "Implement basic array operations",
        dueDate: "2024-01-15",
        points: 100
      },
      {
        id: 2,
        title: "Linked List Project",
        description: "Create a complete linked list with all operations",
        dueDate: "2024-01-22",
        points: 150
      },
      {
        id: 3,
        title: "Stack and Queue Quiz",
        description: "Complete the online quiz on stack and queue concepts",
        dueDate: "2024-01-29",
        points: 75
      }
    ]
  };

  const handleAssignmentToggle = (assignmentId) => {
    setCompletedAssignments(prev =>
      prev.includes(assignmentId)
        ? prev.filter(id => id !== assignmentId)
        : [...prev, assignmentId]
    );
  };

  const handleFeedbackChange = (field, value) => {
    setFeedback(prev => ({ ...prev, [field]: value }));
  };

  const handleTopicToggle = (topic) => {
    setFeedback(prev => ({
      ...prev,
      topics: prev.topics.includes(topic)
        ? prev.topics.filter(t => t !== topic)
        : [...prev.topics, topic]
    }));
  };

  const handleFeedbackSubmit = () => {
    console.log('Feedback submitted:', feedback);
    alert('Thank you for your feedback!');
  };

  console.log('🔥 About to render component, selectedCourse:', selectedCourse);
  console.log('🔥 Course content:', courseContent);
  console.log('🔥 Videos available:', courseContent.videos?.length);
  console.log('🔥 Assignments available:', courseContent.assignments?.length);

  if (!selectedCourse) {
    console.log('🔥 Rendering loading state');
    return (
      <div className="course-learning-page">
        <div className="course-header">
          <div className="header-content">
            <button className="back-btn-modern" onClick={onBackToDashboard}>
              <span className="back-icon">←</span>
              Back to Dashboard
            </button>
            <div className="course-info">
              <h1>Loading Course...</h1>
              <p>Please wait while we load the course content</p>
            </div>
          </div>
        </div>
        <div className="course-content">
          <div className="loading" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '400px',
            fontSize: '1.5rem',
            color: '#6b7280',
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '24px',
            margin: '2rem',
            backdropFilter: 'blur(10px)'
          }}>
            🔄 Loading course content...
          </div>
        </div>
      </div>
    );
  }

  console.log('🔥 Rendering main component');

  return (
    <div className="course-learning-page">
      <header className="course-header">
        <div className="header-content">
          <button className="back-btn-modern" onClick={onBackToDashboard}>
            <span className="back-icon">←</span>
            Back to Dashboard
          </button>
          <div className="course-info">
            <h1>{selectedCourse.name}</h1>
            <p>by {selectedCourse.instructor}</p>
          </div>
        </div>
      </header>

      <div className="course-content">
        <div className="main-content">
          {/* Course Progress - placed before the video section */}
          <div className="course-progress-section">
            <h3>📊 Course Progress</h3>
            <div className="course-stats">
              <div className="stat-item">
                <span className="stat-number">{courseContent.videos ? courseContent.videos.length : 0}</span>
                <span className="stat-label">Videos</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{courseContent.assignments ? courseContent.assignments.length : 0}</span>
                <span className="stat-label">Assignments</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{courseContent.videos && courseContent.videos.length > 0 ? Math.round((currentVideo + 1) / courseContent.videos.length * 100) : 0}%</span>
                <span className="stat-label">Complete</span>
              </div>
            </div>
            <div className="progress-text">Video Progress</div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${courseContent.videos && courseContent.videos.length > 0 ? ((currentVideo + 1) / courseContent.videos.length) * 100 : 0}%` }}
              ></div>
            </div>
            <div className="progress-percentage">
              {courseContent.videos && courseContent.videos.length > 0 ? `${currentVideo + 1} of ${courseContent.videos.length} videos completed` : 'No videos available'}
            </div>
          </div>

          {/* Video Player Section - FIRST */}
          <div className="video-section" style={{ border: '3px solid red' }}>
            <div className="video-player">
              {courseContent.videos && courseContent.videos[currentVideo] ? (
                <iframe
                  src={courseContent.videos[currentVideo].url}
                  title={courseContent.videos[currentVideo].title}
                  frameBorder="0"
                  allowFullScreen
                ></iframe>
              ) : (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                  background: '#000',
                  color: '#fff',
                  fontSize: '1.2rem'
                }}>
                  📹 Video not available
                </div>
              )}
            </div>
            <div className="video-info">
              <h3>{courseContent.videos && courseContent.videos[currentVideo] ? courseContent.videos[currentVideo].title : 'Video Title'}</h3>
              <p>Duration: {courseContent.videos && courseContent.videos[currentVideo] ? courseContent.videos[currentVideo].duration : 'N/A'}</p>
            </div>
          </div>

          {/* Course Videos Playlist - SECOND */}
          <div className="video-playlist" style={{ border: '3px solid blue' }}>
            <h3>🎬 Course Videos</h3>
            <div className="playlist">
              {courseContent.videos && courseContent.videos.length > 0 ? (
                courseContent.videos.map((video, index) => (
                  <div
                    key={video.id}
                    className={`playlist-item ${index === currentVideo ? 'active' : ''}`}
                    onClick={() => setCurrentVideo(index)}
                  >
                    <img src={video.thumbnail} alt={video.title} />
                    <div className="video-details">
                      <h4>{video.title}</h4>
                      <p>{video.duration}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                  📚 No videos available
                </div>
              )}
            </div>
          </div>

          {/* Assignments Section - THIRD */}
          <div className="assignments-section" style={{ border: '3px solid green' }}>
            <h3>📝 Assignments</h3>
            <div className="assignments-list">
              {courseContent.assignments && courseContent.assignments.length > 0 ? (
                courseContent.assignments.map(assignment => (
                  <div key={assignment.id} className="assignment-item interactive-element">
                    <div className="assignment-header">
                      <label className="assignment-checkbox">
                        <input
                          type="checkbox"
                          checked={completedAssignments.includes(assignment.id)}
                          onChange={() => handleAssignmentToggle(assignment.id)}
                        />
                        <span className="checkmark"></span>
                      </label>
                      <div className="assignment-info">
                        <h4>{assignment.title}</h4>
                        <p>{assignment.description}</p>
                        <div className="assignment-meta">
                          <span className="due-date">Due: {assignment.dueDate}</span>
                          <span className="points">{assignment.points} points</span>
                        </div>
                        <span className={`assignment-status ${completedAssignments.includes(assignment.id) ? 'completed' : 'pending'}`}>
                          {completedAssignments.includes(assignment.id) ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                  📝 No assignments available
                </div>
              )}
            </div>
          </div>

          {/* Feedback Section - FOURTH */}
          <div className="feedback-section">
            <h3>⭐ Course Feedback</h3>
            <form className="feedback-form">
              <div className="form-group">
                <label>Overall Rating</label>
                <div className="rating-stars">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span
                      key={star}
                      className={`star ${star <= feedback.rating ? 'filled' : ''}`}
                      onClick={() => handleFeedbackChange('rating', star)}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Comments</label>
                <textarea
                  className="feedback-textarea"
                  value={feedback.comments}
                  onChange={(e) => handleFeedbackChange('comments', e.target.value)}
                  placeholder="Share your thoughts about this course..."
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label className="topic-checkbox">
                  <input
                    type="checkbox"
                    checked={feedback.recommend}
                    onChange={(e) => handleFeedbackChange('recommend', e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  I would recommend this course to others
                </label>
              </div>

              <button type="button" className="submit-feedback-btn" onClick={handleFeedbackSubmit}>
                Submit Feedback
              </button>
            </form>
          </div>

          {/* Brand badge at bottom-right after feedback */}
          <div className="brand-badge">iVidharthi</div>
        </div>
      </div>
    </div>
  );
};

export default CourseLearningPage;