import React, { useState, useEffect } from 'react';
import AssignmentPage from './AssignmentPage';
import WeeklyAssignments from './WeeklyAssignments';
import './CourseLearningPage.css';

const CourseLearningPage = ({ onBackToDashboard }) => {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [currentVideo, setCurrentVideo] = useState(0);
  const [completedVideos, setCompletedVideos] = useState([0]);
  const [completedAssignments, setCompletedAssignments] = useState([]);
  const [completedQuizzes, setCompletedQuizzes] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [courseInfo, setCourseInfo] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [progress, setProgress] = useState(0);
  const [enrollmentId, setEnrollmentId] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [feedbackData, setFeedbackData] = useState({
    rating: 5,
    comment: ''
  });
  const [showAssignment, setShowAssignment] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showWeeklyAssignments, setShowWeeklyAssignments] = useState(false);

  useEffect(() => {
    const savedCourse = localStorage.getItem('selected_course');
    const paymentSuccess = localStorage.getItem('payment_success');
    const authToken = localStorage.getItem('auth_token');
    
    // Get student ID from token
    let userId = '';
    if (authToken) {
      try {
        const tokenParts = authToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          userId = payload.userId || '';
          setStudentId(userId);
        }
      } catch (e) {
        console.error('Error decoding token:', e);
      }
    }

    if (savedCourse) {
      try {
        const parsedCourse = JSON.parse(savedCourse);
        setSelectedCourse(parsedCourse);
        
        // Fetch course details and create enrollment
        initializeCourseData(parsedCourse, userId, paymentSuccess);
      } catch (error) {
        console.error('Error parsing saved course:', error);
        const defaultCourse = {
          name: "Maths with AI",
          instructor: "22bmiti09@gmail.com",
          image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop"
        };
        setSelectedCourse(defaultCourse);
      }
    } else {
      const defaultCourse = {
        name: "Maths with AI",
        instructor: "22bmiti09@gmail.com",
        image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop"
      };
      setSelectedCourse(defaultCourse);
    }
  }, []);

  // Initialize course data with enrollment and earnings
  const initializeCourseData = async (course, userId, paymentData) => {
    try {
      const paymentInfo = paymentData ? JSON.parse(paymentData) : null;
      
      // Create enrollment record
      if (paymentInfo && userId) {
        const enrollmentResponse = await fetch('http://localhost:5000/api/enrollments/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            Course_Id: course.id || course.Course_Id || 'COURSE_001',
            Student_Id: userId,
            Payment_Status: 'Paid'
          })
        });

        const enrollmentResult = await enrollmentResponse.json();
        if (enrollmentResult.success) {
          setEnrollmentId(enrollmentResult.data.Enrollment_Id);
          
          // Create earnings record for lecturer
          if (course.Lecturer_Id && paymentInfo.amount) {
            await fetch('http://localhost:5000/api/earnings/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                Lecturer_Id: course.Lecturer_Id || 'LECT_001',
                Amount: paymentInfo.amount * 0.7, // 70% to lecturer
                Course_Id: course.id || course.Course_Id,
                Transaction_Type: 'Course Sale',
                Status: 'Processed'
              })
            });
          }
        }
      }

      // Fetch assignments for this course
      fetchAssignments(course.id || course.Course_Id || 'COURSE_001');
      
      // Fetch progress
      fetchProgress(course.id || course.Course_Id || 'COURSE_001', userId);
      
    } catch (error) {
      console.error('Error initializing course data:', error);
    }
  };

  // Fetch assignments from backend
  const fetchAssignments = async (courseId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/assignments/course/${courseId}`);
      const result = await response.json();
      if (result.success) {
        setAssignments(result.data);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  // Fetch progress from backend
  const fetchProgress = async (courseId, userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/progress/${courseId}/${userId}`);
      const result = await response.json();
      if (result.success && result.data) {
        setProgress(result.data.Progress_Percent);
        setCompletedVideos(result.data.Completed_Topics || [0]);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  // Update progress in backend
  const updateProgress = async () => {
    if (!selectedCourse || !studentId) return;

    const totalVideos = courseContent.videos.length;
    const newProgress = Math.round((completedVideos.length / totalVideos) * 100);

    try {
      await fetch('http://localhost:5000/api/progress/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Course_Id: selectedCourse.id || selectedCourse.Course_Id || 'COURSE_001',
          Student_Id: studentId,
          Progress_Percent: newProgress,
          Completed_Topics: completedVideos
        })
      });
      setProgress(newProgress);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  // Submit feedback
  const submitFeedback = async () => {
    // Validate inputs
    if (!feedbackData.comment.trim()) {
      alert('Please provide feedback comment');
      return;
    }

    // Get student ID from localStorage if not already set
    let finalStudentId = studentId;
    if (!finalStudentId) {
      try {
        const authUser = localStorage.getItem('auth_user');
        if (authUser) {
          const parsedUser = JSON.parse(authUser);
          finalStudentId = parsedUser.id || parsedUser._id;
          setStudentId(finalStudentId);
        }
      } catch (e) {
        console.error('Error getting student ID:', e);
      }
    }

    if (!finalStudentId) {
      alert('Please login to submit feedback');
      return;
    }

    if (!selectedCourse) {
      alert('Course information not found');
      return;
    }

    const courseId = selectedCourse.Course_Id || selectedCourse.id || selectedCourse.courseId || 'UNKNOWN';

    console.log('📝 Submitting Feedback:', {
      Course_Id: courseId,
      Student_Id: finalStudentId,
      Rating: feedbackData.rating,
      Comment: feedbackData.comment.substring(0, 50) + '...'
    });

    try {
      const response = await fetch('http://localhost:5000/api/feedback/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Course_Id: courseId.toString(),
          Student_Id: finalStudentId.toString(),
          Rating: feedbackData.rating,
          Comment: feedbackData.comment,
          Status: 'Pending',
          Posted_On: new Date()
        })
      });

      const result = await response.json();
      console.log('Feedback response:', result);

      if (result.success) {
        alert('✅ Thank you for your feedback! Your feedback has been submitted successfully.');
        setFeedbackData({ rating: 5, comment: '' });
      } else {
        alert('Failed to submit feedback: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback. Please try again.');
    }
  };

  // Course content data - NPTEL style with multi-language support
  const courseContent = {
    info: {
      title: selectedCourse?.name || "Introduction to Internet of Things",
      description: "This course covers the fundamentals of IoT, including sensors, actuators, networking protocols, and real-world applications. Learn how to build smart connected devices and understand the IoT ecosystem.",
      objectives: [
        "Understand the basic architecture and components of IoT systems",
        "Learn about various sensors, actuators, and communication protocols",
        "Develop skills to design and implement IoT applications",
        "Explore real-world IoT use cases and industry applications"
      ],
      instructor: selectedCourse?.instructor || "Prof. Sudip Misra",
      institution: "IIT Kharagpur",
      duration: "12 Weeks",
      level: "Beginner to Intermediate"
    },
    videos: [
      {
        id: 1,
        title: "Introduction to IoT - Part I",
        duration: "15:30",
        url: "https://www.youtube.com/embed/LlhmzVL5bm8",
        description: "Overview of Internet of Things and its applications",
        transcripts: {
          English: "Welcome to Introduction to Internet of Things...",
          Hindi: "इंटरनेट ऑफ थिंग्स में आपका स्वागत है...",
          Gujarati: "ઇન્ટરનેટ ઓફ થિંગ્સમાં આપનું સ્વાગત છે..."
        }
      },
      {
        id: 2,
        title: "Introduction to IoT - Part II",
        duration: "22:45",
        url: "https://www.youtube.com/embed/LlhmzVL5bm8",
        description: "Deep dive into IoT architecture and components",
        transcripts: {
          English: "Let's explore IoT architecture...",
          Hindi: "आइए IoT आर्किटेक्चर का अन्वेषण करें...",
          Gujarati: "ચાલો IoT આર્કિટેક્ચર શોધીએ..."
        }
      },
      {
        id: 3,
        title: "Sensing and Actuation",
        duration: "18:20",
        url: "https://www.youtube.com/embed/LlhmzVL5bm8",
        description: "Understanding sensors and actuators in IoT",
        transcripts: {
          English: "Sensors are the eyes and ears of IoT...",
          Hindi: "सेंसर IoT की आँखें और कान हैं...",
          Gujarati: "સેન્સર IoT ની આંખો અને કાન છે..."
        }
      },
      {
        id: 4,
        title: "Basics of IoT Networking - Part I",
        duration: "25:10",
        url: "https://www.youtube.com/embed/LlhmzVL5bm8",
        description: "IoT communication protocols and networking",
        transcripts: {
          English: "IoT devices communicate using various protocols...",
          Hindi: "IoT उपकरण विभिन्न प्रोटोकॉल का उपयोग करके संवाद करते हैं...",
          Gujarati: "IoT ઉપકરણો વિવિધ પ્રોટોકોલનો ઉપયોગ કરીને વાતચીત કરે છે..."
        }
      }
    ],
    assignments: assignments.length > 0 ? assignments : [
      {
        id: 1,
        title: "Week 01: Assignment",
        description: "IoT Architecture and Components - Multiple Choice Questions",
        deadline: "2025-08-06",
        marks: 100,
        Assignment_Type: "Quiz"
      },
      {
        id: 2,
        title: "Week 02: Assignment",
        description: "Sensor Networks and Communication Protocols",
        deadline: "2025-08-13",
        marks: 100,
        Assignment_Type: "Quiz"
      },
      {
        id: 3,
        title: "Week 03: Assignment",
        description: "IoT Application Development Project",
        deadline: "2025-08-20",
        marks: 100,
        Assignment_Type: "Project"
      }
    ],
    quizzes: [
      {
        id: 1,
        title: "Week 1 Quiz",
        timeLimit: "30 minutes",
        marks: 50,
        questions: 10
      },
      {
        id: 2,
        title: "Week 2 Quiz",
        timeLimit: "30 minutes",
        marks: 50,
        questions: 10
      },
      {
        id: 3,
        title: "Week 3 Quiz",
        timeLimit: "30 minutes",
        marks: 50,
        questions: 10
      }
    ]
  };

  const totalVideos = courseContent.videos.length;
  const totalAssignments = courseContent.assignments.length;
  const completionPercentage = progress || Math.round((completedVideos.length / totalVideos) * 100);

  const handleVideoComplete = (videoId) => {
    if (!completedVideos.includes(videoId)) {
      const newCompleted = [...completedVideos, videoId];
      setCompletedVideos(newCompleted);
      // Update progress after state update
      setTimeout(updateProgress, 100);
    }
  };

  const handleAssignmentStart = (assignmentId) => {
    const assignment = courseContent.assignments.find(a => a.id === assignmentId);
    if (assignment) {
      setSelectedAssignment(assignment);
      setShowAssignment(true);
    }
  };

  const handleViewAllAssignments = () => {
    setShowWeeklyAssignments(true);
  };

  const handleWeeklyAssignmentsBack = () => {
    setShowWeeklyAssignments(false);
  };

  const handleAssignmentComplete = (score) => {
    if (selectedAssignment) {
      setCompletedAssignments(prev => [...prev, selectedAssignment.id]);
      // Update progress
      setTimeout(updateProgress, 100);
    }
  };

  const handleAssignmentBack = () => {
    setShowAssignment(false);
    setSelectedAssignment(null);
  };

  const handleQuizStart = (quizId) => {
    alert(`Starting Quiz ${quizId}`);
  };

  if (!selectedCourse) {
    return (
      <div className="nptel-loading">
        <div className="loading-spinner"></div>
        <p>Loading course...</p>
      </div>
    );
  }

  // Show Weekly Assignments Page if selected
  if (showWeeklyAssignments) {
    return (
      <WeeklyAssignments
        courseId={selectedCourse.id || selectedCourse.Course_Id}
        courseName={selectedCourse.name || selectedCourse.Name}
        onBack={handleWeeklyAssignmentsBack}
      />
    );
  }

  // Show Assignment Page if assignment is selected
  if (showAssignment && selectedAssignment) {
    return (
      <AssignmentPage
        assignment={selectedAssignment}
        onBack={handleAssignmentBack}
        onComplete={handleAssignmentComplete}
      />
    );
  }

  return (
    <div className="nptel-course-page">
      {/* NPTEL-Style Header */}
      <header className="nptel-header">
        <div className="nptel-header-inner">
          <button className="nptel-back-btn" onClick={onBackToDashboard}>
            <span className="back-arrow">←</span>
            Back to Dashboard
          </button>
          <div className="nptel-course-title-section">
            <h1 className="nptel-course-title">{selectedCourse.name}</h1>
            <p className="nptel-instructor">by {selectedCourse.instructor}</p>
          </div>
        </div>
        <div className="nptel-divider"></div>
      </header>

      {/* Main Content */}
      <div className="nptel-content-wrapper">
        {/* Course Information Section */}
        <div className="nptel-section course-info-section">
          <h2 className="nptel-section-title">📚 Course Information</h2>
          <div className="course-info-card">
            <div className="course-info-header">
              <img 
                src={selectedCourse.image} 
                alt={courseContent.info.title}
                className="course-info-image"
              />
              <div className="course-info-details">
                <h3 className="course-info-title">{courseContent.info.title}</h3>
                <p className="course-info-instructor">
                  <strong>Instructor:</strong> {courseContent.info.instructor}
                </p>
                <p className="course-info-institution">
                  <strong>Institution:</strong> {courseContent.info.institution}
                </p>
                <div className="course-info-meta">
                  <span className="meta-badge">📅 {courseContent.info.duration}</span>
                  <span className="meta-badge">📊 {courseContent.info.level}</span>
                </div>
              </div>
            </div>
            <div className="course-info-body">
              <h4>Course Description</h4>
              <p>{courseContent.info.description}</p>
              
              <h4>Learning Objectives</h4>
              <ul className="objectives-list">
                {courseContent.info.objectives.map((obj, idx) => (
                  <li key={idx}>{obj}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Course Progress Card */}
        <div className="nptel-progress-card">
          <div className="progress-card-header">
            <span className="progress-icon">📊</span>
            <h2>Course Progress</h2>
          </div>
          <div className="progress-stats-grid">
            <div className="progress-stat-box">
              <div className="stat-number">{totalVideos}</div>
              <div className="stat-label">VIDEOS</div>
            </div>
            <div className="progress-stat-box">
              <div className="stat-number">{totalAssignments}</div>
              <div className="stat-label">ASSIGNMENTS</div>
            </div>
            <div className="progress-stat-box">
              <div className="stat-number">{completionPercentage}%</div>
              <div className="stat-label">COMPLETE</div>
            </div>
          </div>
          <div className="video-progress-section">
            <h3 className="progress-subtitle">Video Progress</h3>
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${(completedVideos.length / totalVideos) * 100}%` }}
              ></div>
            </div>
            <p className="progress-text">
              {completedVideos.length} of {totalVideos} videos completed
            </p>
          </div>
        </div>

        {/* Video Lectures Section */}
        <div className="nptel-section">
          <div className="section-header-with-language">
            <h2 className="nptel-section-title">📹 Video Lectures</h2>
            <div className="language-selector">
              <label>Language: </label>
              <select 
                value={selectedLanguage} 
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="language-dropdown"
              >
                <option value="English">English</option>
                <option value="Hindi">हिन्दी (Hindi)</option>
                <option value="Gujarati">ગુજરાતી (Gujarati)</option>
              </select>
            </div>
          </div>
          <div className="nptel-videos-grid">
            {courseContent.videos.map((video, index) => (
              <div key={video.id} className="nptel-video-card">
                <div className="video-card-header">
                  <h3 className="video-lecture-number">Lecture {index + 1}</h3>
                  <span className="video-duration">{video.duration}</span>
                </div>
                <div className="nptel-video-container">
                  <iframe
                    src={video.url}
                    title={video.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="nptel-video-iframe"
                  ></iframe>
                </div>
                <div className="video-card-footer">
                  <h4 className="video-title">{video.title}</h4>
                  <p className="video-description">{video.description}</p>
                  
                  {/* Video Content/Transcript */}
                  <div className="video-content-section">
                    <h5>Video Content ({selectedLanguage})</h5>
                    <p className="video-transcript">
                      {video.transcripts[selectedLanguage]}
                    </p>
                  </div>
                  
                  <button 
                    className={`mark-complete-btn ${completedVideos.includes(video.id) ? 'completed' : ''}`}
                    onClick={() => handleVideoComplete(video.id)}
                  >
                    {completedVideos.includes(video.id) ? '✓ Completed' : 'Mark as Complete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assignments Section */}
        <div className="nptel-section">
          <div className="section-header-with-action">
            <h2 className="nptel-section-title">📝 Assignments</h2>
            <button className="view-all-btn" onClick={handleViewAllAssignments}>
              📊 View All 7 Weeks
            </button>
          </div>
          <div className="nptel-assignments-grid">
            {courseContent.assignments.slice(0, 3).map((assignment) => (
              <div key={assignment.id} className="nptel-assignment-card">
                <div className="assignment-card-header">
                  <h3 className="assignment-title">{assignment.title || assignment.Title}</h3>
                  <span className="assignment-marks">{assignment.marks || assignment.Marks} Marks</span>
                </div>
                <p className="assignment-description">{assignment.description || assignment.Description}</p>
                <div className="assignment-meta">
                  <span className="assignment-type">
                    📋 Type: {assignment.Assignment_Type || 'Assignment'}
                  </span>
                  <span className="assignment-deadline">
                    📅 Due: {assignment.deadline || assignment.Due_Date?.split('T')[0]}
                  </span>
                </div>
                <div className="assignment-actions">
                  <button 
                    className="nptel-btn nptel-btn-primary"
                    onClick={() => handleAssignmentStart(assignment.id)}
                  >
                    Start Assignment
                  </button>
                  <button className="nptel-btn nptel-btn-secondary">
                    View Submission
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="view-all-footer">
            <button className="view-all-assignments-btn" onClick={handleViewAllAssignments}>
              <span className="btn-icon">📚</span>
              View Complete 7-Week Assignment Schedule
              <span className="btn-arrow">→</span>
            </button>
          </div>
        </div>

        {/* Quizzes Section */}
        <div className="nptel-section">
          <h2 className="nptel-section-title">✍️ Weekly Quizzes</h2>
          <div className="nptel-quizzes-grid">
            {courseContent.quizzes.map((quiz) => (
              <div key={quiz.id} className="nptel-quiz-card">
                <div className="quiz-card-header">
                  <h3 className="quiz-title">{quiz.title}</h3>
                  <span className="quiz-marks">{quiz.marks} Marks</span>
                </div>
                <div className="quiz-meta">
                  <span className="quiz-time">⏱️ Time: {quiz.timeLimit}</span>
                  <span className="quiz-questions">❓ Questions: {quiz.questions}</span>
                </div>
                <div className="quiz-actions">
                  <button 
                    className="nptel-btn nptel-btn-quiz"
                    onClick={() => handleQuizStart(quiz.id)}
                  >
                    Start Quiz
                  </button>
                  {completedQuizzes.includes(quiz.id) && (
                    <span className="quiz-score">Score: 45/{quiz.marks}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback Section */}
        <div className="nptel-section feedback-section">
          <h2 className="nptel-section-title">💬 Course Feedback</h2>
          <div className="feedback-card">
            <p className="feedback-intro">
              Help us improve! Share your experience with this course.
            </p>
            
            <div className="feedback-form">
              <div className="form-group">
                <label className="form-label">
                  <strong>Rating:</strong>
                </label>
                <div className="rating-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`star ${feedbackData.rating >= star ? 'filled' : ''}`}
                      onClick={() => setFeedbackData({ ...feedbackData, rating: star })}
                    >
                      ★
                    </span>
                  ))}
                  <span className="rating-text">({feedbackData.rating} / 5)</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <strong>Your Feedback:</strong>
                </label>
                <textarea
                  className="feedback-textarea"
                  rows="6"
                  placeholder="Share your thoughts about the course, instructor, content quality, assignments, etc..."
                  value={feedbackData.comment}
                  onChange={(e) => setFeedbackData({ ...feedbackData, comment: e.target.value })}
                  maxLength={1000}
                ></textarea>
                <span className="char-count">
                  {feedbackData.comment.length} / 1000 characters
                </span>
              </div>

              <button 
                className="nptel-btn nptel-btn-primary submit-feedback-btn"
                onClick={submitFeedback}
                disabled={!feedbackData.comment.trim()}
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseLearningPage;
