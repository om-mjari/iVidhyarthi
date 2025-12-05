import React, { useState, useEffect } from 'react';
import AssignmentPage from './AssignmentPage';
import WeeklyAssignments from './WeeklyAssignments';
import QuizPage from './QuizPage';
import './CourseLearningPage.css';

const CourseLearningPage = ({ onBackToDashboard, onNavigate }) => {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [currentVideo, setCurrentVideo] = useState(0);
  const [completedVideos, setCompletedVideos] = useState([]);
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

  // Course content from database
  const [courseTopics, setCourseTopics] = useState([]);
  const [courseContents, setCourseContents] = useState([]);
  const [loadingContent, setLoadingContent] = useState(false);

  // Doubt Solving Sessions state
  const [doubtSessions, setDoubtSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Dynamic video progress state
  const [videoProgress, setVideoProgress] = useState({
    totalVideos: 0,
    completedVideos: 0,
    completionPercentage: 0
  });

  // Track which videos have been watched (to enable Mark as Complete button)
  const [watchedVideos, setWatchedVideos] = useState([]);

  // Track videos currently being watched with timer
  const [watchingVideos, setWatchingVideos] = useState({});

  // Store interval IDs to clear them later
  const intervalRefs = React.useRef({});

  // Handle video watching with duration tracking
  const handleWatchVideo = (videoId, durationMinutes) => {
    // Mark as currently watching
    setWatchingVideos(prev => ({
      ...prev,
      [videoId]: { progress: 0, duration: durationMinutes, startTime: Date.now() }
    }));

    // Convert duration from "MM:SS" format to seconds
    const [minutes, seconds] = durationMinutes.split(':').map(Number);
    const totalSeconds = (minutes * 60) + (seconds || 0);

    // Simulate video watching with a timer matching real-time
    const interval = setInterval(() => {
      setWatchingVideos(prev => {
        const current = prev[videoId];
        if (!current) {
          clearInterval(interval);
          delete intervalRefs.current[videoId];
          return prev;
        }

        // Calculate actual elapsed time in seconds
        const elapsedSeconds = Math.floor((Date.now() - current.startTime) / 1000);
        const progressPercentage = (elapsedSeconds / totalSeconds) * 100;

        // If video is 15% watched, enable Mark as Complete button
        if (progressPercentage >= 15 && !watchedVideos.includes(videoId)) {
          setWatchedVideos(prevWatched => [...prevWatched, videoId]);
        }

        // If video is fully watched (100%), stop tracking
        if (progressPercentage >= 100) {
          clearInterval(interval);
          delete intervalRefs.current[videoId];
          const newState = { ...prev };
          delete newState[videoId];
          return newState;
        }

        return {
          ...prev,
          [videoId]: { ...current, progress: elapsedSeconds }
        };
      });
    }, 1000); // Update every second

    intervalRefs.current[videoId] = interval;
  };

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(intervalRefs.current).forEach(interval => clearInterval(interval));
    };
  }, []);

  useEffect(() => {
    const savedCourse = localStorage.getItem('selected_course');
    const paymentSuccess = localStorage.getItem('payment_success');
    const authToken = localStorage.getItem('auth_token');
    const authUser = localStorage.getItem('auth_user');

    // Get student ID from token or auth_user
    let userId = '';
    
    // Try getting from auth_user first (for students)
    if (authUser) {
      try {
        const user = JSON.parse(authUser);
        userId = user.studentId || user.Student_Id || user.id || '';
        if (userId) {
          setStudentId(userId);
          console.log('Student ID from auth_user:', userId);
        }
      } catch (e) {
        console.error('Error parsing auth_user:', e);
      }
    }
    
    // Fallback to auth_token if no userId yet
    if (!userId && authToken) {
      try {
        const tokenParts = authToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          userId = payload.userId || '';
          setStudentId(userId);
          console.log('Student ID from auth_token:', userId);
        }
      } catch (e) {
        console.error('Error decoding token:', e);
      }
    }

    console.log('Final userId:', userId);

    // Fetch enrolled course data from backend
    const fetchEnrolledCourseData = async () => {
      if (!savedCourse || !userId) {
        console.log('Skipping fetchEnrolledCourseData - savedCourse:', !!savedCourse, 'userId:', userId);
        return;
      }

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
        } else {
          // No progress yet, set defaults
          setVideoProgress({
            totalVideos: 4,
            completedVideos: 0,
            completionPercentage: 0
          });
          setProgress(0);
        }
      } catch (error) {
        console.error('Error fetching video progress:', error);
        // On error, set defaults
        setVideoProgress({
          totalVideos: 4,
          completedVideos: 0,
          completionPercentage: 0
        });
        setProgress(0);
      }
    };

    fetchEnrolledCourseData();

    // Set the selected course regardless of fetchEnrolledCourseData
    if (savedCourse) {
      try {
        const parsedCourse = JSON.parse(savedCourse);
        console.log('Setting selected course:', parsedCourse);
        
        // Ensure the course has required fields
        if (!parsedCourse.name || !parsedCourse.instructor) {
          console.warn('Course missing required fields, setting defaults');
          parsedCourse.name = parsedCourse.name || parsedCourse.Title || 'Course';
          parsedCourse.instructor = parsedCourse.instructor || parsedCourse.Instructor_Name || 'Instructor';
          parsedCourse.image = parsedCourse.image || parsedCourse.image_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop';
        }
        
        setSelectedCourse(parsedCourse);
        console.log('✅ Course set successfully:', parsedCourse);

        // Fetch course details and create enrollment
        if (userId) {
          initializeCourseData(parsedCourse, userId, paymentSuccess);
        }
      } catch (error) {
        console.error('Error parsing saved course:', error);
        const defaultCourse = {
          name: "Maths with AI",
          instructor: "22bmiti09@gmail.com",
          image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop"
        };
        console.log('Setting default course:', defaultCourse);
        setSelectedCourse(defaultCourse);
      }
    } else {
      console.warn('No saved course found in localStorage');
      const defaultCourse = {
        name: "Maths with AI",
        instructor: "22bmiti09@gmail.com",
        image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop"
      };
      console.log('Setting default course (no saved course):', defaultCourse);
      setSelectedCourse(defaultCourse);
    }
  }, []);

  // Fetch submitted assignments on component mount
  useEffect(() => {
    if (studentId) {
      fetchSubmittedAssignments();
    }
  }, [studentId]);

  // Fetch doubt sessions when course is selected
  useEffect(() => {
    if (selectedCourse) {
      fetchDoubtSessions();
    }
  }, [selectedCourse]);

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

      // Fetch course topics and content
      fetchCourseTopics(course.id || course.Course_Id || 'COURSE_001');
      fetchCourseContent(course.id || course.Course_Id || 'COURSE_001');

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

  // Fetch course topics from backend
  const fetchCourseTopics = async (courseId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/course-topics/course/${courseId}`);
      const result = await response.json();
      if (result.success) {
        setCourseTopics(result.data);
        console.log('✅ Course topics fetched:', result.data);
      }
    } catch (error) {
      console.error('Error fetching course topics:', error);
    }
  };

  // Fetch course content (videos, pdfs, notes) from backend
  const fetchCourseContent = async (courseId) => {
    try {
      setLoadingContent(true);
      const response = await fetch(`http://localhost:5000/api/course-content/course/${courseId}`);
      const result = await response.json();
      if (result.success) {
        setCourseContents(result.data);
        console.log('✅ Course content fetched:', result.data);
      }
    } catch (error) {
      console.error('Error fetching course content:', error);
    } finally {
      setLoadingContent(false);
    }
  };

  // Fetch progress from backend
  const fetchProgress = async (courseId, userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/progress/${courseId}/${userId}`);
      const result = await response.json();
      if (result.success && result.data) {
        setProgress(result.data.Progress_Percent);
        setCompletedVideos(result.data.Completed_Topics || []);
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

  // Fetch doubt solving sessions for the enrolled course
  const fetchDoubtSessions = async () => {
    if (!selectedCourse) return;

    setLoadingSessions(true);
    try {
      const courseId = selectedCourse.Course_Id || selectedCourse.id || selectedCourse.courseId;
      const response = await fetch(
        `http://localhost:5000/api/lecturer/sessions/student?course_ids=${courseId}`
      );

      const result = await response.json();
      if (result.success && result.data) {
        setDoubtSessions(result.data);
      } else {
        setDoubtSessions([]);
      }
    } catch (error) {
      console.error('Error fetching doubt sessions:', error);
      setDoubtSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  // Check if a session is currently active (can join)
  const canJoinSession = (session) => {
    const now = new Date();
    const scheduledTime = new Date(session.scheduled_at);
    const endTime = new Date(scheduledTime.getTime() + session.duration * 60000);
    
    // Session is joinable from scheduled time until end time
    return now >= scheduledTime && now <= endTime && session.session_url;
  };

  // Get the status text for a session
  const getSessionStatus = (session) => {
    const now = new Date();
    const scheduledTime = new Date(session.scheduled_at);
    const endTime = new Date(scheduledTime.getTime() + session.duration * 60000);
    
    if (now < scheduledTime) return 'Upcoming';
    if (now > endTime) return 'Ended';
    return 'Live Now';
  };

  // Format date and time
  const formatSessionDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Course content data - NPTEL style with multi-language support
  // Process videos from courseContents (filter by Content_Type === 'video')
  const processedVideos = courseContents
    .filter(content => content.Content_Type === 'video')
    .map((content, index) => ({
      id: index + 1,
      title: content.Title,
      duration: "15:00", // Default duration, can be enhanced
      url: content.File_Url,
      description: content.Title,
      topic_id: content.Topic_Id,
      transcripts: {
        English: "Transcript not available",
        Hindi: "ट्रांसक्रिप्ट उपलब्ध नहीं है",
        Gujarati: "ટ્રાન્સક્રિપ્ટ ઉપલબ્ધ નથી"
      }
    }));

  // Group content by topics for organized display
  const contentByTopic = {};
  courseTopics.forEach(topic => {
    contentByTopic[topic.Topic_Id] = {
      topic: topic,
      contents: courseContents.filter(c => c.Topic_Id === topic.Topic_Id)
    };
  });

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
    videos: processedVideos.length > 0 ? processedVideos : [
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
      // Add Course_Id to assignment object
      const assignmentWithCourseId = {
        ...assignment,
        Course_Id: selectedCourse?.Course_Id || selectedCourse?.id || selectedCourse?.courseId || courseInfo?.Course_Id
      };
      setSelectedAssignment(assignmentWithCourseId);
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

  console.log('CourseLearningPage render - selectedCourse:', selectedCourse);
  console.log('showAssignment:', showAssignment);
  console.log('showWeeklyAssignments:', showWeeklyAssignments);
  console.log('showQuiz:', showQuiz);

  if (!selectedCourse) {
    console.log('Showing loading state - no selected course');
    return (
      <div className="nptel-loading">
        <div className="loading-spinner"></div>
        <p>Loading course...</p>
      </div>
    );
  }

  console.log('Selected course loaded, rendering course page');

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

        {/* Course Content by Topics Section */}
        {courseTopics.length > 0 && (
          <div className="nptel-section">
            <h2 className="nptel-section-title">📚 Course Content</h2>
            <div className="course-topics-container">
              {loadingContent ? (
                <div className="loading-topics">
                  <div className="loading-spinner"></div>
                  <p>Loading course content...</p>
                </div>
              ) : (
                courseTopics.map((topic, index) => {
                  const topicContents = Object.values(contentByTopic[topic.Topic_Id]?.contents || []);
                  const videos = topicContents.filter(c => c.Content_Type === 'video');
                  const pdfs = topicContents.filter(c => c.Content_Type === 'pdf');
                  const notes = topicContents.filter(c => c.Content_Type === 'notes');

                  return (
                    <div key={topic.Topic_Id} className="topic-card">
                      <div className="topic-header">
                        <div className="topic-number">{index + 1}</div>
                        <div className="topic-info">
                          <h3 className="topic-title">{topic.Title}</h3>
                          {topic.Description && (
                            <p className="topic-description">{topic.Description}</p>
                          )}
                          {topic.Estimated_Hours && (
                            <span className="topic-duration">⏱️ {topic.Estimated_Hours} hours</span>
                          )}
                        </div>
                      </div>
                      
                      {topicContents.length > 0 && (
                        <div className="topic-content-section">
                          {videos.length > 0 && (
                            <div className="content-type-group">
                              <h4 className="content-type-title">🎥 Video Lectures ({videos.length})</h4>
                              <div className="content-items-list">
                                {videos.map((video, idx) => (
                                  <div key={idx} className="content-item">
                                    <span className="content-icon">🎥</span>
                                    <span className="content-title">{video.Title}</span>
                                    <a 
                                      href={video.File_Url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="content-link"
                                    >
                                      Watch
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {pdfs.length > 0 && (
                            <div className="content-type-group">
                              <h4 className="content-type-title">📄 PDF Resources ({pdfs.length})</h4>
                              <div className="content-items-list">
                                {pdfs.map((pdf, idx) => (
                                  <div key={idx} className="content-item">
                                    <span className="content-icon">📄</span>
                                    <span className="content-title">{pdf.Title}</span>
                                    <a 
                                      href={pdf.File_Url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="content-link"
                                    >
                                      Download
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {notes.length > 0 && (
                            <div className="content-type-group">
                              <h4 className="content-type-title">📝 Study Notes ({notes.length})</h4>
                              <div className="content-items-list">
                                {notes.map((note, idx) => (
                                  <div key={idx} className="content-item">
                                    <span className="content-icon">📝</span>
                                    <span className="content-title">{note.Title}</span>
                                    <a 
                                      href={note.File_Url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="content-link"
                                    >
                                      View
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {topicContents.length === 0 && (
                        <div className="no-content">
                          <p>No content available for this topic yet.</p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

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
            <div 
              className="progress-stat-box" 
              onClick={() => {
                const videoSection = document.querySelector('.nptel-videos-grid');
                if (videoSection) {
                  videoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
            >
              <div className="stat-number">{videoProgress.totalVideos || totalVideos}</div>
              <div className="stat-label">VIDEOS</div>
            </div>
            <div 
              className="progress-stat-box"
              onClick={() => {
                const assignmentSection = document.querySelector('.nptel-assignments-grid');
                if (assignmentSection) {
                  assignmentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
            >
              <div className="stat-number">{totalAssignments}</div>
              <div className="stat-label">ASSIGNMENTS</div>
            </div>
            <div className="progress-stat-box">
              <div className="stat-number">{videoProgress.completionPercentage !== undefined ? videoProgress.completionPercentage : completionPercentage}%</div>
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
              {videoProgress.completedVideos !== undefined ? videoProgress.completedVideos : completedVideos.length} of {videoProgress.totalVideos || totalVideos} videos completed
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

                  {/* Video watching progress */}
                  {watchingVideos[video.id] && !watchedVideos.includes(video.id) && (
                    <div style={{
                      marginBottom: '0.75rem',
                      padding: '0.75rem',
                      background: '#f0f8ff',
                      borderRadius: '8px',
                      border: '2px solid #667eea'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#667eea' }}>
                          🎬 Watching video...
                        </span>
                        <span style={{ fontSize: '0.85rem', color: '#666' }}>
                          {Math.round((watchingVideos[video.id].progress / (parseInt(video.duration.split(':')[0]) * 60 + parseInt(video.duration.split(':')[1]))) * 100)}%
                        </span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '8px',
                        background: '#e0e0e0',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${(watchingVideos[video.id].progress / (parseInt(video.duration.split(':')[0]) * 60 + parseInt(video.duration.split(':')[1]))) * 100}%`,
                          height: '100%',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          transition: 'width 0.3s ease'
                        }}></div>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem', marginBottom: 0 }}>
                        Please watch the entire video to enable Mark as Complete
                      </p>
                    </div>
                  )}

                  {/* Watch Video Button */}
                  {!watchingVideos[video.id] && !watchedVideos.includes(video.id) && !completedVideos.includes(video.id) && (
                    <button
                      className="watch-video-btn"
                      onClick={() => handleWatchVideo(video.id, video.duration)}
                      style={{
                        marginBottom: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        width: '100%'
                      }}
                    >
                      ▶ Watch Video
                    </button>
                  )}

                  {/* Mark as Complete Button */}
                  <button
                    className={`mark-complete-btn ${completedVideos.includes(video.id) ? 'completed' : ''}`}
                    onClick={() => handleVideoComplete(video.id)}
                    disabled={!watchedVideos.includes(video.id) && !completedVideos.includes(video.id)}
                    style={{
                      opacity: (!watchedVideos.includes(video.id) && !completedVideos.includes(video.id)) ? 0.5 : 1,
                      cursor: (!watchedVideos.includes(video.id) && !completedVideos.includes(video.id)) ? 'not-allowed' : 'pointer'
                    }}
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

        {/* Doubt Solving Session Section */}
        <div className="nptel-section doubt-session-section">
          <h2 className="nptel-section-title">🎥 Doubt Solving Sessions</h2>
          <div className="doubt-session-card">
            <p className="doubt-session-intro">
              Join live sessions with your instructor to clarify doubts and discuss course topics.
            </p>

            {loadingSessions ? (
              <div className="sessions-loading">
                <div className="loading-spinner"></div>
                <p>Loading sessions...</p>
              </div>
            ) : doubtSessions.length === 0 ? (
              <div className="no-sessions">
                <span className="no-sessions-icon">📅</span>
                <p>No doubt solving sessions scheduled yet.</p>
                <p className="no-sessions-subtitle">Your instructor will schedule sessions soon. Check back later!</p>
              </div>
            ) : (
              <div className="sessions-list">
                {doubtSessions.map((session) => {
                  const status = getSessionStatus(session);
                  const canJoin = canJoinSession(session);

                  return (
                    <div key={session.session_id} className={`session-card ${status.toLowerCase().replace(' ', '-')}`}>
                      <div className="session-header">
                        <div className="session-title-area">
                          <h3 className="session-title">{session.title}</h3>
                          <span className={`session-status status-${status.toLowerCase().replace(' ', '-')}`}>
                            {status === 'Live Now' && '🔴 '}
                            {status === 'Upcoming' && '🕐 '}
                            {status === 'Ended' && '⏹️ '}
                            {status}
                          </span>
                        </div>
                        <p className="session-course">{session.course_name}</p>
                      </div>

                      <div className="session-details">
                        <div className="session-info-row">
                          <span className="session-info-item">
                            📅 {formatSessionDateTime(session.scheduled_at)}
                          </span>
                          <span className="session-info-item">
                            ⏱️ {session.duration} minutes
                          </span>
                        </div>

                        {session.description && (
                          <p className="session-description">{session.description}</p>
                        )}
                      </div>

                      <div className="session-actions">
                        {canJoin ? (
                          <a
                            href={session.session_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="nptel-btn nptel-btn-primary join-meeting-btn"
                          >
                            🚀 Join Meeting
                          </a>
                        ) : status === 'Upcoming' ? (
                          <button
                            className="nptel-btn nptel-btn-secondary"
                            disabled
                          >
                            ⏳ Starts at {new Date(session.scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </button>
                        ) : (
                          <button
                            className="nptel-btn nptel-btn-secondary"
                            disabled
                          >
                            ✓ Session Ended
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
