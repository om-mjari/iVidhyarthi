import React, { useState, useEffect } from 'react';
import AssignmentPage from './AssignmentPage';
import WeeklyAssignments from './WeeklyAssignments';
import QuizPage from './QuizPage';
import './CourseLearningPage.css';

const CourseLearningPage = ({ onBackToDashboard, onNavigate }) => {
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
  const [submittedAssignments, setSubmittedAssignments] = useState({});
  const [viewingSubmission, setViewingSubmission] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  
  // Dynamic video progress state
  const [videoProgress, setVideoProgress] = useState({
    totalVideos: 0,
    completedVideos: 0,
    completionPercentage: 0
  });

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

    // Fetch enrolled course data from backend
    const fetchEnrolledCourseData = async () => {
      if (!savedCourse || !userId) return;
      
      try {
        const courseData = JSON.parse(savedCourse);
        const response = await fetch(`http://localhost:5000/api/courses/${courseData.id || courseData.Course_Id}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (response.ok) {
          const enrolledCourse = await response.json();
          setCourseInfo(enrolledCourse);
          
          // Fetch video progress after getting course info
          fetchVideoProgress(userId, courseData.id || courseData.Course_Id, authToken);
        }
      } catch (error) {
        console.error('Error fetching enrolled course:', error);
      }
    };

    // Fetch video progress for this student and course
    const fetchVideoProgress = async (studentId, courseId, token) => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/video-progress/student/${studentId}/course/${courseId}/summary`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setVideoProgress(result.data);
            setProgress(result.data.completionPercentage);
          }
        }
      } catch (error) {
        console.error('Error fetching video progress:', error);
      }
    };

    fetchEnrolledCourseData();

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

  // Fetch submitted assignments on component mount
  useEffect(() => {
    if (studentId) {
      fetchSubmittedAssignments();
    }
  }, [studentId]);

  const fetchSubmittedAssignments = async () => {
    if (!studentId) return;

    try {
      // Fetch all submissions from Tbl_Submissions
      const submissionsResponse = await fetch(
        `http://localhost:5000/api/submissions/student/${studentId}`
      );
      const submissionsResult = await submissionsResponse.json();

      const submissions = {};
      
      // Map submissions from Tbl_Submissions (get latest for each assignment)
      if (submissionsResult.success && submissionsResult.data) {
        // Group submissions by Assignment_Id and get the latest one
        const submissionsByAssignment = {};
        
        submissionsResult.data.forEach(submission => {
          const assignmentId = submission.Assignment_Id;
          
          // If we don't have this assignment yet, or this submission is newer
          if (!submissionsByAssignment[assignmentId] || 
              new Date(submission.Submitted_On) > new Date(submissionsByAssignment[assignmentId].Submitted_On)) {
            submissionsByAssignment[assignmentId] = submission;
          }
        });
        
        // Use the latest submission for each assignment
        Object.keys(submissionsByAssignment).forEach(assignmentId => {
          submissions[assignmentId] = submissionsByAssignment[assignmentId];
        });
      }

      // Also check Tbl_Assignments for submissions
      for (const assignment of courseContent.assignments) {
        if (!submissions[assignment.id]) {
          const response = await fetch(
            `http://localhost:5000/api/assignments/submission/${assignment.id}/${studentId}`
          );
          const result = await response.json();
          if (result.success && result.hasSubmission) {
            submissions[assignment.id] = result.data;
          }
        }
      }
      
      setSubmittedAssignments(submissions);
      console.log('✅ Fetched latest submissions for each assignment:', submissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

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
      title: courseInfo?.Name || selectedCourse?.name || "Introduction to Internet of Things",
      description: courseInfo?.Description || selectedCourse?.description || "This course covers the fundamentals of IoT, including sensors, actuators, networking protocols, and real-world applications. Learn how to build smart connected devices and understand the IoT ecosystem.",
      objectives: courseInfo?.Objectives || [
        "Understand the basic architecture and components of IoT systems",
        "Learn about various sensors, actuators, and communication protocols",
        "Develop skills to design and implement IoT applications",
        "Explore real-world IoT use cases and industry applications"
      ],
      instructor: courseInfo?.Instructor || selectedCourse?.instructor || "Prof. Sudip Misra",
      institution: courseInfo?.Institution || "IIT Kharagpur",
      duration: courseInfo?.Duration || "12 Weeks",
      level: courseInfo?.Level || "Beginner to Intermediate"
    },
    videos: courseInfo?.Videos || [
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
      },
      {
        id: 4,
        title: "Week 04: Assignment",
        description: "Cloud Integration and Data Analytics",
        deadline: "2025-08-27",
        marks: 100,
        Assignment_Type: "Quiz"
      },
      {
        id: 5,
        title: "Week 05: Assignment",
        description: "Security and Privacy in IoT Systems",
        deadline: "2025-09-03",
        marks: 100,
        Assignment_Type: "Quiz"
      },
      {
        id: 6,
        title: "Week 06: Assignment",
        description: "Edge Computing and Real-time Processing",
        deadline: "2025-09-10",
        marks: 100,
        Assignment_Type: "Project"
      },
      {
        id: 7,
        title: "Week 07: Assignment",
        description: "Final IoT System Design and Implementation",
        deadline: "2025-09-17",
        marks: 100,
        Assignment_Type: "Project"
      }
    ],
    quizzes: [
      {
        id: 1,
        week: 1,
        title: "Week 1 Quiz",
        timeLimit: "30 minutes",
        marks: 50,
        questions: 10
      },
      {
        id: 2,
        week: 2,
        title: "Week 2 Quiz",
        timeLimit: "30 minutes",
        marks: 50,
        questions: 10
      },
      {
        id: 3,
        week: 3,
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
  
  // Calculate assignment progress (out of 7 weeks)
  const completedAssignmentsCount = completedAssignments.length;
  const totalWeeks = 7;
  const assignmentProgressPercentage = Math.round((completedAssignmentsCount / totalWeeks) * 100);

  const handleVideoComplete = async (videoId) => {
    if (!completedVideos.includes(videoId)) {
      const newCompleted = [...completedVideos, videoId];
      setCompletedVideos(newCompleted);
      
      // Update video progress in database
      await updateVideoProgressInDB(videoId, true);
      
      // Update progress after state update
      setTimeout(updateProgress, 100);
    }
  };

  // Update video progress in database
  const updateVideoProgressInDB = async (videoId, isCompleted = false) => {
    try {
      const authToken = localStorage.getItem('auth_token');
      const courseData = JSON.parse(localStorage.getItem('selected_course'));
      
      if (!authToken || !studentId || !courseData) return;

      const video = courseContent.videos.find(v => v.id === videoId);
      if (!video) return;

      const endpoint = isCompleted 
        ? 'http://localhost:5000/api/video-progress/mark-complete'
        : 'http://localhost:5000/api/video-progress/update';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          studentId: studentId,
          studentEmail: localStorage.getItem('user_email') || '',
          courseId: courseData.id || courseData.Course_Id,
          courseName: courseData.name || courseData.Name,
          videoId: videoId.toString(),
          videoTitle: video.title,
          totalDuration: 1800, // 30 minutes default
          watchDuration: isCompleted ? 1800 : 900
        })
      });

      if (response.ok) {
        // Refresh video progress summary
        const summaryResponse = await fetch(
          `http://localhost:5000/api/video-progress/student/${studentId}/course/${courseData.id || courseData.Course_Id}/summary`,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          }
        );

        if (summaryResponse.ok) {
          const result = await summaryResponse.json();
          if (result.success) {
            setVideoProgress(result.data);
            setProgress(result.data.completionPercentage);
          }
        }
      }
    } catch (error) {
      console.error('Error updating video progress:', error);
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
      // Refresh submitted assignments list
      fetchSubmittedAssignments();
      // Update progress
      setTimeout(updateProgress, 100);
    }
  };

  const handleAssignmentBack = () => {
    setShowAssignment(false);
    setSelectedAssignment(null);
    setViewingSubmission(false);
    setSelectedSubmission(null);
  };

  const handleViewSubmission = async (assignmentId) => {
    if (!studentId) return;

    try {
      // First try to get from Tbl_Submissions
      const submissionsResponse = await fetch(
        `http://localhost:5000/api/submissions/student/${studentId}`
      );
      const submissionsResult = await submissionsResponse.json();
      
      if (submissionsResult.success && submissionsResult.data) {
        // Get all submissions for this assignment and find the latest one
        const assignmentSubmissions = submissionsResult.data.filter(s => s.Assignment_Id === assignmentId);
        
        if (assignmentSubmissions.length > 0) {
          // Sort by Submitted_On date descending and get the most recent
          const latestSubmission = assignmentSubmissions.sort((a, b) => 
            new Date(b.Submitted_On) - new Date(a.Submitted_On)
          )[0];
          
          // Get the original assignment to fetch questions
          const assignment = courseContent.assignments.find(a => a.id === assignmentId);
          
          // Convert Tbl_Submissions format to expected format
          const convertedData = {
            Assignment_Id: latestSubmission.Assignment_Id,
            Marks: assignment?.marks || 100,
            Submission_Data: {
              Student_Id: latestSubmission.Student_Id,
              Course_Id: latestSubmission.Course_Id,
              Score: latestSubmission.Score,
              Time_Spent: latestSubmission.Time_Spent,
              Submitted_On: latestSubmission.Submitted_On,
              Feedback: latestSubmission.Feedback,
              Answers: JSON.parse(latestSubmission.Submission_Content || '{}'),
              Questions: assignment?.questions || [] // Use original assignment questions
            }
          };
          setSelectedSubmission(convertedData);
          setViewingSubmission(true);
          console.log('📝 Viewing latest submission from Tbl_Submissions:', convertedData);
          return;
        }
      }

      // If not found in Tbl_Submissions, try Tbl_Assignments
      const assignmentsResponse = await fetch(
        `http://localhost:5000/api/assignments/submission/${assignmentId}/${studentId}`
      );
      const assignmentsResult = await assignmentsResponse.json();
      
      if (assignmentsResult.success && assignmentsResult.data) {
        setSelectedSubmission(assignmentsResult.data);
        setViewingSubmission(true);
        console.log('📝 Viewing submission from Tbl_Assignments:', assignmentsResult.data);
      } else {
        alert('No submission found for this assignment.');
      }
    } catch (error) {
      console.error('Error fetching submission:', error);
      alert('Error loading submission.');
    }
  };

  const handleQuizStart = async (weekNumber) => {
    try {
      setLoadingQuiz(true);
      const authToken = localStorage.getItem('auth_token');
      
      if (!authToken) {
        alert('Please login to start quiz');
        return;
      }

      if (!courseInfo || !courseInfo.id) {
        alert('Course information not available');
        return;
      }

      // First, try to fetch existing quiz for this week
      const fetchResponse = await fetch(
        `http://localhost:5000/api/quiz/course/${courseInfo.id}/week/${weekNumber}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      );

      let quiz;
      if (fetchResponse.ok) {
        // Quiz exists, use it
        quiz = await fetchResponse.json();
      } else {
        // Generate new quiz
        const generateResponse = await fetch('http://localhost:5000/api/quiz/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            courseId: courseInfo.id,
            courseName: courseInfo.title,
            weekNumber: weekNumber,
            topic: `Week ${weekNumber} - ${courseInfo.title}`
          })
        });

        if (!generateResponse.ok) {
          throw new Error('Failed to generate quiz');
        }

        quiz = await generateResponse.json();
      }

      setSelectedQuiz(quiz);
      setShowQuiz(true);
      setLoadingQuiz(false);
    } catch (error) {
      console.error('Error starting quiz:', error);
      alert('Error starting quiz. Please try again.');
      setLoadingQuiz(false);
    }
  };

  const handleQuizComplete = () => {
    setShowQuiz(false);
    setSelectedQuiz(null);
    // Optionally refresh quiz completion status here
  };

  const handleQuizBack = () => {
    setShowQuiz(false);
    setSelectedQuiz(null);
  };

  if (!selectedCourse) {
    return (
      <div className="nptel-loading">
        <div className="loading-spinner"></div>
        <p>Loading course...</p>
      </div>
    );
  }

  // Show Quiz Page if quiz is selected
  if (showQuiz && selectedQuiz) {
    return (
      <QuizPage
        quiz={selectedQuiz}
        courseId={courseInfo?.id}
        weekNumber={selectedQuiz.Week_Number}
        onBack={handleQuizBack}
        onComplete={handleQuizComplete}
      />
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

  // Show Submission Viewer
  if (viewingSubmission && selectedSubmission) {
    return (
      <div className="submission-viewer-page">
        <div className="submission-viewer-header">
          <button className="back-btn" onClick={handleAssignmentBack}>
            ← Back to Course
          </button>
          <h1>Assignment Submission</h1>
        </div>
        <div className="submission-viewer-container">
          <div className="submission-info-card">
            <h2>Submission Details</h2>
            <div className="submission-stats">
              <div className="stat-item">
                <span className="stat-label">Score:</span>
                <span className="stat-value">{selectedSubmission.Submission_Data?.Score || 0} / {selectedSubmission.Marks}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Time Spent:</span>
                <span className="stat-value">
                  {Math.floor(selectedSubmission.Submission_Data?.Time_Spent / 60)}m {selectedSubmission.Submission_Data?.Time_Spent % 60}s
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Submitted:</span>
                <span className="stat-value">
                  {new Date(selectedSubmission.Submission_Data?.Submitted_On).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="answers-display">
            <h2>Your Answers</h2>
            {selectedSubmission.Submission_Data?.Questions?.map((q, index) => (
              <div key={q.id} className="answer-card">
                <div className="question-header">
                  <span className="question-number">Question {index + 1}</span>
                  <span className="question-marks">{q.marks} Marks</span>
                </div>
                <p className="question-text">{q.question}</p>
                
                <div className="submitted-answer">
                  <strong>Your Answer:</strong>
                  <div className="answer-content">
                    {q.type === 'text' 
                      ? selectedSubmission.Submission_Data?.Answers[q.id] || 'Not answered'
                      : q.options?.[parseInt(selectedSubmission.Submission_Data?.Answers[q.id])] || 'Not answered'
                    }
                  </div>
                </div>

                {q.type === 'mcq' && (
                  <div className="correct-answer">
                    <strong>Correct Answer:</strong>
                    <div className="answer-content">
                      {q.options?.[q.correctAnswer]}
                    </div>
                  </div>
                )}

                <div className="explanation">
                  <strong>💡 Explanation:</strong>
                  <p>{q.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
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
            <button 
              className="view-detailed-progress-btn"
              onClick={() => onNavigate && onNavigate('course-progress')}
              style={{
                marginLeft: 'auto',
                padding: '0.6rem 1.25rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
              }}
            >
              View Detailed Progress
            </button>
          </div>
          <div className="progress-stats-grid">
            <div className="progress-stat-box">
              <div className="stat-number">{videoProgress.totalVideos || totalVideos}</div>
              <div className="stat-label">VIDEOS</div>
            </div>
            <div className="progress-stat-box">
              <div className="stat-number">{totalAssignments}</div>
              <div className="stat-label">ASSIGNMENTS</div>
            </div>
            <div className="progress-stat-box">
              <div className="stat-number">{videoProgress.completionPercentage || completionPercentage}%</div>
              <div className="stat-label">COMPLETE</div>
            </div>
          </div>
          <div className="video-progress-section">
            <h3 className="progress-subtitle">Video Progress</h3>
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${videoProgress.completionPercentage || 0}%` }}
              ></div>
            </div>
            <p className="progress-text">
              {videoProgress.completedVideos || completedVideos.length} of {videoProgress.totalVideos || totalVideos} videos completed
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
          <h2 className="nptel-section-title">📝 Assignments</h2>
          <div className="nptel-assignments-grid">
            {courseContent.assignments.map((assignment) => (
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
                    disabled={submittedAssignments[assignment.id]}
                    style={{ 
                      opacity: submittedAssignments[assignment.id] ? 0.5 : 1,
                      cursor: submittedAssignments[assignment.id] ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {submittedAssignments[assignment.id] ? '✓ Submitted' : 'Start Assignment'}
                  </button>
                  {submittedAssignments[assignment.id] && (
                    <button 
                      className="nptel-btn nptel-btn-secondary"
                      onClick={() => handleViewSubmission(assignment.id)}
                    >
                      View Submission
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assignment Progress Status */}
        <div className="nptel-section assignment-progress-section">
          <h2 className="nptel-section-title">📈 Assignment Progress Status</h2>
          <div className="assignment-progress-card">
            <div className="progress-stats">
              <div className="stat-item">
                <span className="stat-label">Completed</span>
                <span className="stat-value">{completedAssignmentsCount}</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-label">Total Weeks</span>
                <span className="stat-value">{totalWeeks}</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-label">Progress</span>
                <span className="stat-value">{assignmentProgressPercentage}%</span>
              </div>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-track">
                <div 
                  className="progress-bar-fill"
                  style={{ width: `${assignmentProgressPercentage}%` }}
                >
                  <span className="progress-bar-text">{assignmentProgressPercentage}%</span>
                </div>
              </div>
            </div>
            <div className="progress-breakdown">
              <div className="breakdown-item">
                <span className="breakdown-dot completed-dot"></span>
                <span className="breakdown-label">Completed: {completedAssignmentsCount}/{totalWeeks} assignments</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-dot pending-dot"></span>
                <span className="breakdown-label">Pending: {totalWeeks - completedAssignmentsCount}/{totalWeeks} assignments</span>
              </div>
            </div>
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
                    onClick={() => handleQuizStart(quiz.week)}
                    disabled={loadingQuiz}
                  >
                    {loadingQuiz ? 'Loading...' : 'Start Quiz'}
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
