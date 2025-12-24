import React, { useState, useEffect } from 'react';
import AssignmentPage from './AssignmentPage';
import WeeklyAssignments from './WeeklyAssignments';
import QuizPage from './QuizPage';
import AssignmentViewer from './AssignmentViewer';
import './CourseLearningPage.css';
import Notification from './components/Notification';

// Helper function to remove autoplay from video URLs
const removeAutoplay = (url) => {
  if (!url) return url;

  try {
    const urlObj = new URL(url);
    // Remove autoplay parameter
    urlObj.searchParams.delete('autoplay');
    // Set autoplay to 0 for YouTube
    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
      urlObj.searchParams.set('autoplay', '0');
    }
    return urlObj.toString();
  } catch (e) {
    // If URL parsing fails, try simple string replacement
    return url.replace(/[?&]autoplay=1/g, '').replace(/autoplay=1[&]?/g, '');
  }
};

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
  const [notification, setNotification] = useState(null);
  const [generatingCertificate, setGeneratingCertificate] = useState(false);
  const [hasCertificate, setHasCertificate] = useState(false);
  const [certificateBase64, setCertificateBase64] = useState(null);

  // Custom modal states
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '', type: 'info' });
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  // Course content from database
  const [courseTopics, setCourseTopics] = useState([]);
  const [courseSubTopics, setCourseSubTopics] = useState([]);
  const [courseContents, setCourseContents] = useState([]);
  const [loadingContent, setLoadingContent] = useState(false);

  // Doubt Solving Sessions state
  const [doubtSessions, setDoubtSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Reviews state
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [editingFeedbackId, setEditingFeedbackId] = useState(null);
  const [editFeedbackData, setEditFeedbackData] = useState({ rating: 5, comment: '' });

  // Dynamic video progress state
  const [videoProgress, setVideoProgress] = useState({
    totalVideos: 0,
    completedVideos: 0,
    completionPercentage: 0
  });

  // Dynamic course data from database
  const [lecturerInfo, setLecturerInfo] = useState(null);
  const [instituteInfo, setInstituteInfo] = useState(null);
  const [courseDescription, setCourseDescription] = useState('');
  const [learningObjectives, setLearningObjectives] = useState([]);
  const [loadingCourseInfo, setLoadingCourseInfo] = useState(true);

  // Track which videos have been watched (to enable Mark as Complete button)
  const [watchedVideos, setWatchedVideos] = useState([]);

  // Track video watch progress (percentage watched)
  const [videoWatchProgress, setVideoWatchProgress] = useState({});
  const [maxWatchedTime, setMaxWatchedTime] = useState({});

  // Track videos currently being watched with timer

  // User feedbacks state
  const [courseFeedbacks, setCourseFeedbacks] = useState([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  const [watchingVideos, setWatchingVideos] = useState({});

  // Store interval IDs to clear them later
  const intervalRefs = React.useRef({});

  // Read more state for course description
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Transcription states
  const [videoTranscripts, setVideoTranscripts] = useState({});
  const [loadingTranscript, setLoadingTranscript] = useState({});
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState(null);

  // Selected video state for single player
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Ref for video section and video player
  const videoSectionRef = React.useRef(null);
  const videoPlayerRef = React.useRef(null);

  // Timer for tracking video watch time
  const trackingIntervalRef = React.useRef(null);

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

  // Load videoWatchProgress from localStorage on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem('videoWatchProgress');
    if (savedProgress) {
      try {
        setVideoWatchProgress(JSON.parse(savedProgress));
      } catch (e) {
        console.error('Error loading video watch progress:', e);
      }
    }
  }, []);

  // Save videoWatchProgress to localStorage whenever it changes
  useEffect(() => {
    if (Object.keys(videoWatchProgress).length > 0) {
      localStorage.setItem('videoWatchProgress', JSON.stringify(videoWatchProgress));
    }
  }, [videoWatchProgress]);

  // Track video watch time (80% rule - based on elapsed time, not actual playback)
  useEffect(() => {
    if (!selectedVideo) return;

    const videoId = selectedVideo.id;

    // Initialize progress for this video if not exists
    if (videoWatchProgress[videoId] === undefined) {
      setVideoWatchProgress(prev => ({ ...prev, [videoId]: 0 }));
    }

    // Cleanup previous interval
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }

    // Parse video duration from MM:SS format to seconds
    const parseDuration = (durationStr) => {
      if (!durationStr) return 1800; // Default 30 minutes if no duration
      const parts = durationStr.split(':').map(Number);
      if (parts.length === 2) {
        return (parts[0] * 60) + parts[1]; // MM:SS format
      } else if (parts.length === 3) {
        return (parts[0] * 3600) + (parts[1] * 60) + parts[2]; // HH:MM:SS format
      } else if (parts.length === 1) {
        return parts[0]; // Just seconds
      }
      return 1800; // Default fallback to 30 minutes
    };

    const videoDuration = parseDuration(selectedVideo.duration);
    const timeRequired80Percent = videoDuration * 0.8; // 80% of duration
    let accumulatedTime = 0;
    let isPageVisible = !document.hidden;

    // Handle page visibility change
    const handleVisibilityChange = () => {
      isPageVisible = !document.hidden;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Update progress every second when page is visible
    trackingIntervalRef.current = setInterval(() => {
      if (isPageVisible) {
        accumulatedTime += 1;
        const progressPercentage = Math.min((accumulatedTime / videoDuration) * 100, 100);

        setVideoWatchProgress(prev => ({
          ...prev,
          [videoId]: progressPercentage
        }));

        // Stop at 100%
        if (progressPercentage >= 100) {
          clearInterval(trackingIntervalRef.current);
          trackingIntervalRef.current = null;
        }
      }
    }, 1000);

    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
        trackingIntervalRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedVideo]);

  // Generate transcript for a video
  const handleGenerateTranscript = async (video) => {
    const videoId = video.id || video.title;
    const videoKey = `${videoId}_${selectedLanguage}`;

    // Check if transcript already exists for this language
    if (videoTranscripts[videoKey]) {
      setCurrentTranscript({
        ...videoTranscripts[videoKey],
        videoTitle: video.title
      });
      setShowTranscriptModal(true);
      return;
    }

    setLoadingTranscript(prev => ({ ...prev, [videoId]: true }));

    try {
      const response = await fetch('http://localhost:5000/api/transcription/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          videoUrl: video.url,
          videoTitle: video.title,
          language: selectedLanguage
        })
      });

      const result = await response.json();

      if (result.success) {
        const transcriptData = {
          transcript: result.data.transcript,
          summary: result.data.summary,
          language: result.data.language
        };

        setVideoTranscripts(prev => ({
          ...prev,
          [videoKey]: transcriptData
        }));

        setCurrentTranscript({
          ...transcriptData,
          videoTitle: video.title
        });
        setShowTranscriptModal(true);
      } else {
        setNotification({ message: 'Failed to generate transcript: ' + result.message, type: 'error' });
      }
    } catch (error) {
      console.error('Error generating transcript:', error);
      setNotification({ message: 'Failed to generate transcript. Please try again.', type: 'error' });
    } finally {
      setLoadingTranscript(prev => ({ ...prev, [videoId]: false }));
    }
  };

  // Sync selected video's transcripts with the display state automatically
  useEffect(() => {
    if (selectedVideo && selectedVideo.transcripts) {
      Object.entries(selectedVideo.transcripts).forEach(([lang, text]) => {
        const videoId = selectedVideo.id || selectedVideo.title;
        const videoKey = `${videoId}_${lang}`;
        // Only sync if it's NOT the default "not available" message
        if (text &&
          !text.includes('not available') &&
          !text.includes('उपलब्ધ नहीं है') &&
          !text.includes('ઉપલબ્ધ નથી') &&
          !videoTranscripts[videoKey]) {
          setVideoTranscripts(prev => ({
            ...prev,
            [videoKey]: {
              transcript: text,
              summary: "Transcript provided for this session.",
              language: lang
            }
          }));
        }
      });
    }
  }, [selectedVideo, selectedLanguage]);

  // Download transcript as PDF
  const handleDownloadTranscriptPDF = async () => {
    if (!currentTranscript) return;

    try {
      const response = await fetch('http://localhost:5000/api/transcription/download-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transcript: currentTranscript.transcript,
          summary: currentTranscript.summary,
          videoTitle: currentTranscript.videoTitle,
          language: currentTranscript.language
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transcript_${currentTranscript.videoTitle.replace(/[^a-z0-9]/gi, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setNotification({ message: 'Failed to download PDF', type: 'error' });
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setNotification({ message: 'Failed to download PDF. Please try again.', type: 'error' });
    }
  };

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
        // Calculate comprehensive progress from database
        const calculateResponse = await fetch(
          'http://localhost:5000/api/progress/calculate',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              courseId: courseId,
              studentId: studentId
            })
          }
        );

        if (calculateResponse.ok) {
          const result = await calculateResponse.json();
          if (result.success) {
            // Set video progress from database
            setVideoProgress({
              totalVideos: result.data.totalVideos,
              completedVideos: result.data.completedVideos,
              completionPercentage: result.data.videoProgress
            });

            // Set overall progress from database
            setProgress(result.data.overallProgress);

            // Fetch completed videos list from database
            await fetchCompletedVideosList(studentId, courseId);

            console.log('✅ Initial progress loaded from database:', result.data);
          }
        } else {
          // No progress yet, set defaults
          setVideoProgress({
            totalVideos: 0,
            completedVideos: 0,
            completionPercentage: 0
          });
          setProgress(0);
        }
      } catch (error) {
        console.error('Error fetching video progress:', error);
        // On error, set defaults
        setVideoProgress({
          totalVideos: 0,
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
        if (!parsedCourse.name) {
          console.warn('Course missing name field, setting default');
          parsedCourse.name = parsedCourse.name || parsedCourse.Title || 'Course';
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
          image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop"
        };
        console.log('Setting default course:', defaultCourse);
        setSelectedCourse(defaultCourse);
      }
    } else {
      console.warn('No saved course found in localStorage');
      const defaultCourse = {
        name: "Maths with AI",
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

  // Check if certificate already exists
  const checkCertificate = async () => {
    if (!selectedCourse || !studentId) return;

    try {
      const courseId = selectedCourse.Course_Id || selectedCourse.id || selectedCourse.courseId;
      console.log('🔍 Background check for certificate:', { courseId, studentId });
      
      // Check backend for certificate existence
      const response = await fetch(`http://localhost:5000/api/certifications/check/${courseId}/${studentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      const result = await response.json();
      console.log('📦 Certificate check result:', result);
      if (result.success && result.alreadyExists) {
        setHasCertificate(true);
        setCertificateBase64(result.pdfBase64);
        // Persist to localStorage for future reference
        localStorage.setItem(`cert_${courseId}_${studentId}`, result.pdfBase64);
        console.log('✅ Certificate state restored from backend and persisted');
      } else {
        setHasCertificate(false);
        setCertificateBase64(null);
        // Remove from localStorage if no certificate exists
        localStorage.removeItem(`cert_${courseId}_${studentId}`);
      }
    } catch (error) {
      console.error('Error checking certificate:', error);
      // If there's an error, still check localStorage as fallback
      const courseId = selectedCourse.Course_Id || selectedCourse.id || selectedCourse.courseId;
      const localCert = localStorage.getItem(`cert_${courseId}_${studentId}`);
      if (localCert) {
        setHasCertificate(true);
        setCertificateBase64(localCert);
      } else {
        setHasCertificate(false);
        setCertificateBase64(null);
      }
    }
  };

  useEffect(() => {
    checkCertificate();
  }, [selectedCourse, studentId]);

  // Secondary check when course info or progress is loaded to ensure button state stays synced
  useEffect(() => {
    if (courseInfo || videoProgress.completionPercentage >= 100) {
      checkCertificate();
    }
  }, [courseInfo, videoProgress]);

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

        // Get current course ID for filtering
        const currentCourseId = (selectedCourse?.Course_Id || selectedCourse?.id || selectedCourse?.courseId || '').toString();

        submissionsResult.data.forEach(submission => {
          // Only process submissions that belong to the current course 
          // (or if course ID is missing, but excluding clearly different courses)
          if (submission.Course_Id && currentCourseId && submission.Course_Id.toString() !== currentCourseId) {
            return;
          }

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
      const actualCourseId = course.id || course.Course_Id || 'COURSE_001';
      console.log('📚 Course selected:', course.name || course.Title);
      console.log('🔑 Using courseId for assignments:', actualCourseId);
      fetchAssignments(actualCourseId);

      // Fetch course details (lecturer, institute, description, objectives)
      fetchCourseDetails(course.id || course.Course_Id || 'COURSE_001');

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
      console.log('🔍 Fetching assignments for courseId:', courseId);
      const response = await fetch(`http://localhost:5000/api/assignments/course/${courseId}`);
      const result = await response.json();
      if (result.success) {
        console.log('📝 Assignments fetched:', result.data);
        console.log('📝 Number of assignments:', result.data.length);
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

        // Fetch subtopics for each topic
        const allSubTopics = [];
        for (const topic of result.data) {
          try {
            console.log(`🔍 Fetching subtopics for Topic_Id: ${topic.Topic_Id}`);
            const subTopicResponse = await fetch(`http://localhost:5000/api/course-topics/${topic.Topic_Id}/subtopics`);
            const subTopicResult = await subTopicResponse.json();
            console.log(`📦 Subtopics response for Topic_Id ${topic.Topic_Id}:`, subTopicResult);
            if (subTopicResult.success && subTopicResult.data) {
              console.log(`✅ Found ${subTopicResult.data.length} subtopics for Topic_Id ${topic.Topic_Id}`);
              allSubTopics.push(...subTopicResult.data);
            } else {
              console.log(`⚠️ No subtopics found for Topic_Id ${topic.Topic_Id}`);
            }
          } catch (error) {
            console.error(`❌ Error fetching subtopics for topic ${topic.Topic_Id}:`, error);
          }
        }
        setCourseSubTopics(allSubTopics);
        console.log('✅ Total course subtopics fetched:', allSubTopics.length, allSubTopics);
      }
    } catch (error) {
      console.error('Error fetching course topics:', error);
    }
  };

  // Fetch dynamic course information including lecturer, institute, and description
  const fetchCourseDetails = async (courseId) => {
    setLoadingCourseInfo(true);
    try {
      // Fetch course details including lecturer, institute, description
      const courseResponse = await fetch(`http://localhost:5000/api/tbl-courses/${courseId}`);
      const courseResult = await courseResponse.json();

      if (courseResult.success && courseResult.data) {
        const course = courseResult.data;

        // Set course description
        setCourseDescription(course.Description || 'No description available');

        // Fetch lecturer information
        if (course.Lecturer_Id) {
          try {
            const lecturerResponse = await fetch(`http://localhost:5000/api/lecturer-profile/${course.Lecturer_Id}`);
            const lecturerResult = await lecturerResponse.json();
            if (lecturerResult.success && lecturerResult.data) {
              setLecturerInfo(lecturerResult.data);

              // Fetch institute information using lecturer's institute
              if (lecturerResult.data.Institute_Id) {
                try {
                  // Extract institute ID properly (handle if it's an object)
                  let instituteId = lecturerResult.data.Institute_Id;
                  if (typeof instituteId === 'object') {
                    instituteId = instituteId._id || instituteId.Institute_Id || instituteId.id;
                  }

                  if (instituteId) {
                    const instituteResponse = await fetch(`http://localhost:5000/api/institutes/${instituteId}`);
                    const instituteResult = await instituteResponse.json();
                    if (instituteResult.success && instituteResult.data) {
                      setInstituteInfo(instituteResult.data);
                    }
                  }
                } catch (error) {
                  console.error('Error fetching institute info:', error);
                }
              }
            }
          } catch (error) {
            console.error('Error fetching lecturer info:', error);
          }
        }

        // Extract learning objectives from topics
        if (course.Topics && course.Topics.length > 0) {
          const objectives = course.Topics.map(topic => topic.Description || topic.Title).filter(Boolean).slice(0, 5);
          if (objectives.length > 0) {
            setLearningObjectives(objectives);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching course details:', error);
    } finally {
      setLoadingCourseInfo(false);
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

  // Set default video (Week 1's first video) when content is loaded
  useEffect(() => {
    if (courseTopics.length > 0 && courseContents.length > 0 && !selectedVideo) {
      // Sort topics by order to get Week 1
      const sortedTopics = [...courseTopics].sort((a, b) => {
        const orderA = parseInt(a.Order_Number) || 0;
        const orderB = parseInt(b.Order_Number) || 0;
        return orderA - orderB;
      });

      if (sortedTopics.length > 0) {
        const firstTopic = sortedTopics[0];
        const topicVideos = courseContents.filter(
          c => c.Topic_Id === firstTopic.Topic_Id && c.Content_Type === 'video'
        );

        if (topicVideos.length > 0) {
          const firstVideo = topicVideos[0];
          setSelectedVideo({
            id: firstVideo.Content_Id,
            title: firstVideo.Title,
            url: removeAutoplay(firstVideo.File_Url),
            description: firstVideo.Description || firstVideo.Title,
            duration: firstVideo.Duration || "00:56",
            transcripts: {
              English: "Welcome to the 'Introduction to Internet of Things' course. In this first lecture, we will explore the fundamental concepts of IoT. IoT refers to the network of physical objects—'things'—that are embedded with sensors, software, and other technologies for the purpose of connecting and exchanging data with other devices and systems over the internet. These devices range from ordinary household objects to sophisticated industrial tools. We will discuss the 4 stages of IoT architecture: Sensors/Actuators, Data Acquisition Systems, Edge IT, and Cloud Analytics. By the end of this module, you will understand how these components work together to create smart environments.",
              Hindi: "इंटरनेट ऑफ थिंग्स (IoT) पाठ्यक्रम के परिचय में आपका स्वागत है। इस पहले व्याख्यान में, हम IoT की मूलभूत अवधारणाओं का पता लगाएंगे। IoT भौतिक वस्तुओं—'चीजों'—के नेटवर्क को संदर्भित करता है जो सेंसर, सॉफ्टवेयर और अन्य तकनीकों के साथ एम्बेडेड होते हैं ताकि इंटरनेट पर अन्य उपकरणों और प्रणालियों के साथ डेटा को जोड़ने और आदान-प्रदान करने के उद्देश्य से किया जा सके। ये उपकरण साधारण घरेलू वस्तुओं से लेकर परिष्कृत औद्योगिक उपकरणों तक होते हैं। हम IoT आर्किटेक्चर के 4 चरणों पर चर्चा करेंगे: सेंसर/एक्ट्यूएटर, डेटा अधिग्रहण प्रणाली, एज आईटी और क्लाउड एनालिटिक्स। इस मॉड्यूल के अंत तक, आप समझ पाएंगे कि ये घटक स्मार्ट वातावरण बनाने के लिए कैसे एक साथ काम करते हैं।",
              Gujarati: "ઇન્ટરનેટ ઓફ થિંગ્સ (IoT) કોર્સના પરિચયમાં તમારું સ્વાગત છે. આ પ્રથમ વ્યાખ્યાનમાં, આપણે IoT ના મૂળભૂત ખ્યાલો શોધીશું. IoT એ ભૌતિક વસ્તુઓ—'વસ્તુઓ'—ના નેટવર્કનો ઉલ્લેખ કરે છે જે સેન્સર્સ, સોફ્ટવેર અને અન્ય ટેકનોલોજી સાથે એમ્બેડેડ હોય છે જેનો હેતુ ઈન્ટરનેટ પર અન્ય ઉપકરણો અને સિસ્ટમો સાથે ડેટા કનેક્ટ કરવા અને તેની આપ-લે કરવાનો છે. આ ઉપકરણો સામાન્ય ઘરગથ્થુ વસ્તુઓથી લઈને અત્યાધુનિક ઔદ્યોગિક સાધનો સુધીના હોઈ શકે છે. આપણે IoT આર્કિટેક્ચરના 4 તબક્કાઓ વિશે ચર્ચા કરીશું: સેન્સર્સ/એક્ટ્યુએટર્સ, ડેટા એક્વિઝિશન સિસ્ટમ્સ, એજ આઈટી અને ક્લાઉડ એનાલિટિક્સ. આ મોડ્યુલના અંત સુધીમાં, તમે સમજી શકશો કે સ્માર્ટ વાતાવરણ બનાવવા માટે આ ઘટકો કેવી રીતે એકસાથે કામ કરે છે."
            }
          });
          console.log('✅ Default video set:', firstVideo.Title);
        }
      }
    }
  }, [courseTopics, courseContents, selectedVideo]);

  // Fetch course feedbacks when course is loaded
  useEffect(() => {
    if (selectedCourse?.id || selectedCourse?.Course_Id) {
      const courseId = selectedCourse.id || selectedCourse.Course_Id;
      fetchCourseFeedbacks(courseId);
    }
  }, [selectedCourse]);

  // Load progress from database when component mounts or when studentId/selectedCourse changes
  useEffect(() => {
    if (studentId && selectedCourse) {
      refreshVideoProgress();
    }
  }, [studentId, selectedCourse]);

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

  // Refresh comprehensive progress from database (single source of truth)
  const refreshVideoProgress = async () => {
    if (!studentId || !selectedCourse) {
      console.warn('⚠️ Cannot refresh progress - missing studentId or selectedCourse');
      return;
    }

    try {
      const courseId = selectedCourse.id || selectedCourse.Course_Id;
      const authToken = localStorage.getItem('auth_token');

      console.log('📊 Calculating progress for:', { studentId, courseId });

      // Calculate and update overall progress in database
      const calculateResponse = await fetch(
        'http://localhost:5000/api/progress/calculate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            courseId: courseId,
            studentId: studentId
          })
        }
      );

      const calculateResult = await calculateResponse.json();
      console.log('📊 Progress calculation result:', calculateResult);

      if (calculateResponse.ok && calculateResult.success) {
        // Update video progress state from database
        setVideoProgress({
          totalVideos: calculateResult.data.totalVideos,
          completedVideos: calculateResult.data.completedVideos,
          completionPercentage: calculateResult.data.videoProgress
        });

        // Update overall progress from database
        setProgress(calculateResult.data.overallProgress);

        console.log('✅ Progress updated:', {
          videoProgress: calculateResult.data.videoProgress,
          overallProgress: calculateResult.data.overallProgress,
          completedVideos: calculateResult.data.completedVideos
        });
      } else {
        console.error('❌ Failed to calculate progress:', calculateResult);
      }

      // Fetch and set completed video IDs from database
      await fetchCompletedVideosList(studentId, courseId);
    } catch (error) {
      console.error('❌ Error refreshing video progress:', error);
    }
  };

  // Fetch list of completed video IDs from backend
  const fetchCompletedVideosList = async (studentId, courseId) => {
    try {
      const authToken = localStorage.getItem('auth_token');
      const response = await fetch(
        `http://localhost:5000/api/video-progress/student/${studentId}/course/${courseId}/completed`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Extract video IDs from completed videos
          const completedVideoIds = result.data.map(v => parseInt(v.videoId) || v.videoId);
          setCompletedVideos(completedVideoIds);
          console.log('✅ Loaded completed videos:', completedVideoIds);
        }
      }
    } catch (error) {
      console.error('Error fetching completed videos list:', error);
    }
  };

  // Recalculate and update progress in database
  const updateProgress = async () => {
    // Use refreshVideoProgress to recalculate from database
    await refreshVideoProgress();
  };

  // Fetch course feedbacks
  const fetchCourseFeedbacks = async (courseId, loadMore = false) => {
    try {
      setLoadingFeedbacks(true);
      const skip = loadMore ? courseFeedbacks.length : 0;
      const limit = loadMore ? 5 : 5;
      const response = await fetch(`http://localhost:5000/api/feedback/course/${courseId}?skip=${skip}&limit=${limit}`);
      const result = await response.json();

      if (result.success) {
        if (loadMore) {
          setCourseFeedbacks(prev => [...prev, ...(result.data || [])]);
        } else {
          setCourseFeedbacks(result.data || []);
        }
        setShowAllReviews(loadMore || !result.hasMore);
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  // Submit feedback
  const submitFeedback = async () => {
    // Validate inputs
    if (!feedbackData.comment.trim()) {
      setModalContent({
        title: 'Feedback Required',
        message: 'Please provide feedback comment',
        type: 'error'
      });
      setShowModal(true);
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
      setModalContent({
        title: 'Login Required',
        message: 'Please login to submit feedback',
        type: 'error'
      });
      setShowModal(true);
      return;
    }

    if (!selectedCourse) {
      setModalContent({
        title: 'Course Not Found',
        message: 'Course information not found',
        type: 'error'
      });
      setShowModal(true);
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
        setModalContent({
          title: 'Thank You!',
          message: 'Your feedback has been submitted successfully.',
          type: 'success'
        });
        setShowModal(true);
        setFeedbackData({ rating: 5, comment: '' });
        // Refresh feedbacks after submission
        fetchCourseFeedbacks(courseId);
      } else {
        setModalContent({
          title: 'Submission Failed',
          message: 'Failed to submit feedback: ' + (result.message || 'Unknown error'),
          type: 'error'
        });
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setModalContent({
        title: 'Error',
        message: 'Error submitting feedback. Please try again.',
        type: 'error'
      });
      setShowModal(true);
    }
  };

  // Update feedback
  const updateFeedback = async (feedbackId) => {
    if (!editFeedbackData.comment.trim()) {
      setModalContent({
        title: 'Comment Required',
        message: 'Please provide a comment',
        type: 'error'
      });
      setShowModal(true);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/feedback/update-comment/${feedbackId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Student_Id: studentId,
          Comment: editFeedbackData.comment,
          Rating: editFeedbackData.rating
        })
      });

      const result = await response.json();

      if (result.success) {
        setModalContent({
          title: 'Updated!',
          message: 'Your review has been updated successfully.',
          type: 'success'
        });
        setShowModal(true);
        setEditingFeedbackId(null);
        const courseId = selectedCourse.Course_Id || selectedCourse.id || selectedCourse.courseId;
        fetchCourseFeedbacks(courseId);
      } else {
        setModalContent({
          title: 'Update Failed',
          message: result.message || 'Failed to update review',
          type: 'error'
        });
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error updating feedback:', error);
      setModalContent({
        title: 'Error',
        message: 'Error updating review. Please try again.',
        type: 'error'
      });
      setShowModal(true);
    }
  };

  // Delete feedback
  const deleteFeedback = async (feedbackId) => {
    if (!confirm('Are you sure you want to delete your review? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/feedback/delete/${feedbackId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Student_Id: studentId
        })
      });

      const result = await response.json();

      if (result.success) {
        setModalContent({
          title: 'Deleted!',
          message: 'Your review has been deleted successfully.',
          type: 'success'
        });
        setShowModal(true);
        const courseId = selectedCourse.Course_Id || selectedCourse.id || selectedCourse.courseId;
        fetchCourseFeedbacks(courseId);
      } else {
        setModalContent({
          title: 'Delete Failed',
          message: result.message || 'Failed to delete review',
          type: 'error'
        });
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
      setModalContent({
        title: 'Error',
        message: 'Error deleting review. Please try again.',
        type: 'error'
      });
      setShowModal(true);
    }
  };

  // Check if feedback can be edited (within 2 hours)
  const canEditFeedback = (postedOn) => {
    const hoursSincePosted = (new Date() - new Date(postedOn)) / (1000 * 60 * 60);
    return hoursSincePosted <= 2;
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
      duration: content.Duration || "00:56",
      url: content.File_Url,
      description: content.Title,
      topic_id: content.Topic_Id,
      transcripts: {
        English: "Welcome to this module. Today we will dive deep into the technical specifications and real-world implementations. IoT is transforming industries from agriculture to healthcare by providing real-time data insights.",
        Hindi: "इस मॉड्यूल में आपका स्वागत है। आज हम तकनीकी विशिष्टताओं और वास्तविक दुनिया के कार्यान्वयन में गहराई से उतरेंगे। IoT वास्तविक समय डेटा अंतर्दृष्टि प्रदान करके कृषि से स्वास्थ्य देखभाल तक उद्योगों को बदल रहा है।",
        Gujarati: "આ મોડ્યુલમાં તમારું સ્વાગત છે. આજે આપણે તકનીકી વિશિષ્ટતાઓ અને વાસ્તવિક દુનિયાના અમલીકરણમાં ઊંડા ઉતરીશું. IoT રીઅલ-ટાઇમ ડેટા આંતરદૃષ્ટિ પ્રદાન કરીને ખેતીથી લઈને આરોગ્યસંભાળ સુધીના ઉદ્યોગોને બદલી રહ્યું છે."
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
      description: courseDescription || courseInfo?.Description || selectedCourse?.description || "This course covers the fundamentals of IoT, including sensors, actuators, networking protocols, and real-world applications. Learn how to build smart connected devices and understand the IoT ecosystem.",
      objectives: learningObjectives.length > 0 ? learningObjectives : (courseInfo?.Objectives || [
        "Understand the basic architecture and components of IoT systems",
        "Learn about various sensors, actuators, and communication protocols",
        "Develop skills to design and implement IoT applications",
        "Explore real-world IoT use cases and industry applications"
      ]),
      instructor: lecturerInfo?.Full_Name || courseInfo?.Instructor || selectedCourse?.instructor || "Instructor",
      institution: instituteInfo?.Institute_Name || courseInfo?.Institution || "Institute",
      duration: selectedCourse?.duration || courseInfo?.Duration || "12 Weeks",
      level: courseInfo?.Level || "Beginner to Intermediate"
    },
    videos: processedVideos.length > 0 ? processedVideos : [],
    assignments: assignments.length > 0 ? assignments : [],
    quizzes: []
  };

  const totalVideos = courseContent.videos.length || 0;
  const totalAssignments = courseContent.assignments.length || 0;
  const submittedAssignmentsInCourseCount = assignments.filter(a => submittedAssignments[a.Assignment_Id]).length;
  const completionPercentage = totalVideos > 0 ? (progress || Math.round((completedVideos.length / totalVideos) * 100)) : 0;

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
  const updateVideoProgressInDB = async (videoId, isCompleted = false, videoInfo = null) => {
    try {
      const authToken = localStorage.getItem('auth_token');
      const courseData = JSON.parse(localStorage.getItem('selected_course'));

      if (!authToken || !studentId || !courseData) {
        console.error('Missing required data:', { authToken: !!authToken, studentId, courseData: !!courseData });
        return false;
      }

      // Use provided videoInfo or find in courseContent
      let video = videoInfo;
      if (!video) {
        video = courseContent.videos.find(v => v.id === videoId);
      }

      if (!video) {
        console.error('Video not found:', videoId);
        return false;
      }

      const endpoint = isCompleted
        ? 'http://localhost:5000/api/video-progress/mark-complete'
        : 'http://localhost:5000/api/video-progress/update';

      // Get student email from auth_user or localStorage
      let studentEmail = localStorage.getItem('user_email') || '';
      if (!studentEmail) {
        try {
          const authUser = localStorage.getItem('auth_user');
          if (authUser) {
            const user = JSON.parse(authUser);
            studentEmail = user.email || user.Email || user.Student_Email || '';
          }
        } catch (e) {
          console.error('Error getting email from auth_user:', e);
        }
      }

      const requestBody = {
        studentId: studentId,
        studentEmail: studentEmail,
        courseId: courseData.id || courseData.Course_Id,
        courseName: courseData.name || courseData.Name,
        videoId: videoId.toString(),
        videoTitle: video.title,
        totalDuration: 1800,
        watchDuration: isCompleted ? 1800 : 900
      };

      console.log('📤 Marking video as complete:', requestBody);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📥 Response status:', response.status);

      // Clone response to read it multiple times if needed
      const responseClone = response.clone();

      let responseData;
      try {
        responseData = await response.json();
        console.log('📥 Backend response:', responseData);
      } catch (parseError) {
        console.error('❌ Failed to parse JSON response:', parseError);
        const responseText = await responseClone.text();
        console.error('❌ Response text:', responseText);
        return false;
      }

      if (response.ok && responseData.success) {
        console.log('✅ Video completion saved to database');
        return true;
      } else {
        console.error('❌ Failed to save video completion');
        console.error('Status:', response.status);
        console.error('Response:', responseData);
        return false;
      }
    } catch (error) {
      console.error('❌ Error updating video progress:', error);
      console.error('Error details:', error.message);
      return false;
    }
  };

  const handleAssignmentStart = (assignmentId) => {
    const assignment = assignments.find(a => a.Assignment_Id === assignmentId);
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
      // Refresh all progress from database
      setTimeout(() => {
        refreshVideoProgress();
      }, 500);
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
          const assignment = assignments.find(a => a.Assignment_Id === assignmentId) || courseContent.assignments.find(a => a.id === assignmentId);

          // Parse Submission_Data if it's a string
          let submissionData = latestSubmission.Submission_Data;
          if (typeof submissionData === 'string') {
            try {
              submissionData = JSON.parse(submissionData);
            } catch (e) {
              submissionData = {};
            }
          }

          // Convert Tbl_Submissions format to expected format
          const convertedData = {
            Assignment_Id: latestSubmission.Assignment_Id,
            Marks: assignment?.Marks || assignment?.marks || 100,
            Score: latestSubmission.Score || latestSubmission.Grade,
            File_Url: latestSubmission.File_Url,
            Submission_Data: {
              Student_Id: latestSubmission.Student_Id,
              Course_Id: latestSubmission.Course_Id,
              Score: latestSubmission.Score || latestSubmission.Grade,
              Time_Spent: latestSubmission.Time_Spent,
              Submitted_On: latestSubmission.Submitted_On,
              Feedback: latestSubmission.Feedback,
              Answers: submissionData.Answers || JSON.parse(latestSubmission.Submission_Content || '{}'),
              Questions: assignment?.questions || [],
              learningAnswer: submissionData.learningAnswer,
              challengeAnswer: submissionData.challengeAnswer,
              applicationAnswer: submissionData.applicationAnswer,
              textSubmission: submissionData.textSubmission,
              uploadedFile: submissionData.uploadedFile
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
        setNotification({ message: 'No submission found for this assignment.', type: 'warning' });
      }
    } catch (error) {
      console.error('Error fetching submission:', error);
      setNotification({ message: 'Error loading submission. Please try again.', type: 'error' });
    }
  };

  const handleQuizStart = async (weekNumber) => {
    try {
      setLoadingQuiz(true);
      const authToken = localStorage.getItem('auth_token');
      const authUser = localStorage.getItem('auth_user');

      if (!authToken && !authUser) {
        setModalContent({ title: 'Authentication Required', message: 'Please login to start the quiz', type: 'error' });
        setShowModal(true);
        setLoadingQuiz(false);
        return;
      }

      if (!selectedCourse) {
        setModalContent({ title: 'Course Error', message: 'Course information not available', type: 'error' });
        setShowModal(true);
        setLoadingQuiz(false);
        return;
      }

      // 🛑 STRICTOR QUIZ UNLOCKING LOGIC
      // Check if course is marked as "Completed" by the lecturer
      // This is verified via courseInfo which is fetched from the backend
      const currentCourseStatus = courseInfo?.status || courseInfo?.data?.status || selectedCourse?.status;

      if (currentCourseStatus !== 'Completed') {
        setModalContent({
          title: 'Quiz Locked',
          message: 'The FINAL QUIZ is not yet available. Your instructor must mark the course as "Completed" in their dashboard before you can attempt it.',
          type: 'warning'
        });
        setShowModal(true);
        setLoadingQuiz(false);
        return;
      }

      const courseId = selectedCourse.Course_Id || selectedCourse.id || selectedCourse.courseId;

      if (!courseId) {
        setModalContent({ title: 'Course Error', message: 'Course ID not found', type: 'error' });
        setShowModal(true);
        setLoadingQuiz(false);
        return;
      }

      if (!studentId) {
        setModalContent({ title: 'Student Error', message: 'Student information not available', type: 'error' });
        setShowModal(true);
        setLoadingQuiz(false);
        return;
      }

      // Check attempt eligibility first
      const eligibilityResponse = await fetch(
        `http://localhost:5000/api/auto-quiz/check-eligibility?studentId=${studentId}&courseId=${courseId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      );

      if (!eligibilityResponse.ok) {
        throw new Error('Failed to check quiz eligibility');
      }

      const eligibilityData = await eligibilityResponse.json();

      // Check if student is blocked
      if (eligibilityData.isBlocked) {
        if (eligibilityData.blockExpiresAt) {
          const expiryDate = new Date(eligibilityData.blockExpiresAt).toLocaleDateString();
          setModalContent({
            title: 'Access Blocked',
            message: `You are temporarily blocked from attempting this quiz until ${expiryDate}.\n\nReason: ${eligibilityData.blockReason}`,
            type: 'error'
          });
        } else {
          setModalContent({
            title: 'Access Blocked',
            message: `You are permanently blocked from attempting this quiz.\n\nReason: ${eligibilityData.blockReason}`,
            type: 'error'
          });
        }
        setShowModal(true);
        setLoadingQuiz(false);
        return;
      }

      // Check if already passed
      if (eligibilityData.isPassed) {
        setModalContent({
          title: 'Quiz Already Passed',
          message: 'You have already passed this quiz! Check your certificates section.',
          type: 'success'
        });
        setShowModal(true);
        setLoadingQuiz(false);
        return;
      }

      // If quiz doesn't exist, generate it
      if (!eligibilityData.quizExists) {
        setIsGeneratingQuiz(true);
        const generateResponse = await fetch('http://localhost:5000/api/auto-quiz/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            courseId: courseId,
            studentId: studentId
          })
        });

        setIsGeneratingQuiz(false);

        if (!generateResponse.ok) {
          const errorData = await generateResponse.json();
          throw new Error(errorData.message || 'Failed to generate quiz');
        }

        const generatedData = await generateResponse.json();
        setModalContent({
          title: 'Quiz Generated!',
          message: `Quiz generated successfully! ${generatedData.totalQuestions} questions created.`,
          type: 'success'
        });
        setShowModal(true);
        setTimeout(() => setShowModal(false), 2000);
      }

      // Fetch the quiz
      const quizResponse = await fetch(
        `http://localhost:5000/api/auto-quiz/quiz/${courseId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      );

      if (!quizResponse.ok) {
        throw new Error('Failed to fetch quiz');
      }

      const quiz = await quizResponse.json();

      // Show attempt information
      setModalContent({
        title: 'Quiz Ready!',
        message: `Remaining attempts: ${eligibilityData.remainingAttempts}/5\n\nYou need 70% to pass and receive your certificate.`,
        type: 'info'
      });
      setShowModal(true);
      setTimeout(() => {
        setShowModal(false);
        setSelectedQuiz(quiz);
        setShowQuiz(true);
      }, 2000);
      setLoadingQuiz(false);
    } catch (error) {
      console.error('Error starting quiz:', error);
      setModalContent({
        title: 'Error',
        message: `${error.message}. Please try again or contact support.`,
        type: 'error'
      });
      setShowModal(true);
      setLoadingQuiz(false);
      setIsGeneratingQuiz(false);
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
      <AssignmentViewer
        assignment={selectedAssignment}
        onBack={handleAssignmentBack}
        studentId={studentId}
        totalAssignments={assignments.length}
        submittedCount={submittedAssignmentsInCourseCount}
        onSubmissionComplete={() => {
          fetchSubmittedAssignments();
          fetchAssignments(selectedCourse?.Course_Id || selectedCourse?.id);
          // Recalculate course progress after assignment submission
          setTimeout(() => {
            refreshVideoProgress();
          }, 500);
        }}
      />
    );
  }

  // Show Submission Viewer
  if (viewingSubmission && selectedSubmission) {
    return (
      <div className="submission-viewer-page" style={{ height: '100vh', overflow: 'auto' }}>
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
                <span className="stat-value">{selectedSubmission.Score || selectedSubmission.Submission_Data?.Score || 0} / {selectedSubmission.Marks || 10}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Submitted:</span>
                <span className="stat-value">
                  {new Date(selectedSubmission.Submission_Data?.Submitted_On || selectedSubmission.Submitted_On).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Show uploaded PDF if exists */}
            {selectedSubmission.File_Url && (
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ marginBottom: '10px' }}>📄 Uploaded PDF</h3>
                <button
                  onClick={() => window.open(`http://localhost:5000${selectedSubmission.File_Url}`, '_blank')}
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  📥 View Uploaded PDF
                </button>
              </div>
            )}

            {/* Show reflective answers if exists */}
            {(selectedSubmission.Submission_Data?.learningAnswer ||
              selectedSubmission.Submission_Data?.challengeAnswer ||
              selectedSubmission.Submission_Data?.applicationAnswer) && (
                <div style={{ marginTop: '20px' }}>
                  <h3>📝 Reflective Answers</h3>
                  {selectedSubmission.Submission_Data.learningAnswer && (
                    <div style={{ marginTop: '15px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                      <h4 style={{ marginBottom: '8px', color: '#667eea' }}>🎓 What did you learn?</h4>
                      <p style={{ lineHeight: '1.6' }}>{selectedSubmission.Submission_Data.learningAnswer}</p>
                    </div>
                  )}
                  {selectedSubmission.Submission_Data.challengeAnswer && (
                    <div style={{ marginTop: '15px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                      <h4 style={{ marginBottom: '8px', color: '#667eea' }}>🤔 What challenges did you face?</h4>
                      <p style={{ lineHeight: '1.6' }}>{selectedSubmission.Submission_Data.challengeAnswer}</p>
                    </div>
                  )}
                  {selectedSubmission.Submission_Data.applicationAnswer && (
                    <div style={{ marginTop: '15px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                      <h4 style={{ marginBottom: '8px', color: '#667eea' }}>💡 How will you apply this?</h4>
                      <p style={{ lineHeight: '1.6' }}>{selectedSubmission.Submission_Data.applicationAnswer}</p>
                    </div>
                  )}
                </div>
              )}
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
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      {/* NPTEL-Style Header */}
      <header className="nptel-header">
        <div className="nptel-header-inner">
          <button className="nptel-back-btn" onClick={onBackToDashboard}>
            <span className="back-arrow">←</span>
            Back to Dashboard
          </button>
          <div className="nptel-course-title-section">
            <h1 className="nptel-course-title">{selectedCourse.name}</h1>
            <p className="nptel-instructor">by {lecturerInfo?.Full_Name || courseContent.info.instructor}</p>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
                {/* Course Description - Left Side */}
                <div>
                  <h4 style={{ marginBottom: '12px' }}>Course Description</h4>
                  <p style={{ lineHeight: '1.6', color: '#555' }}>
                    {showFullDescription
                      ? courseContent.info.description
                      : courseContent.info.description.length > 200
                        ? `${courseContent.info.description.substring(0, 200)}...`
                        : courseContent.info.description
                    }
                  </p>
                  {courseContent.info.description.length > 200 && (
                    <button
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      style={{
                        marginTop: '8px',
                        background: 'none',
                        border: 'none',
                        color: '#0066cc',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        padding: '0'
                      }}
                    >
                      {showFullDescription ? 'Show less' : 'Read more...'}
                    </button>
                  )}
                </div>

                {/* What You Will Learn - Right Side */}
                {courseTopics.length > 0 && (
                  <div style={{ padding: '20px', background: '#f0f8ff', borderRadius: '8px', border: '1px solid #d0e7ff' }}>
                    <h4 style={{ marginBottom: '16px', color: '#0066cc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      📚 What You Will Learn
                    </h4>
                    <div style={{ fontFamily: 'monospace', fontSize: '14px', lineHeight: '1.8', color: '#333', whiteSpace: 'pre-wrap' }}>
                      {courseTopics
                        .sort((a, b) => {
                          const orderA = parseInt(a.Order_Number) || 0;
                          const orderB = parseInt(b.Order_Number) || 0;
                          return orderA - orderB;
                        })
                        .map((topic, topicIndex) => {
                          const topicSubTopics = courseSubTopics
                            .filter(sub => sub.Topic_Id === topic.Topic_Id)
                            .sort((a, b) => {
                              const orderA = parseFloat(a.Order_Number) || 0;
                              const orderB = parseFloat(b.Order_Number) || 0;
                              return orderA - orderB;
                            });

                          const mainTopicNumber = topicIndex + 1;

                          return (
                            <div key={topic.Topic_Id} style={{ marginBottom: '12px' }}>
                              <div style={{ fontWeight: '600', color: '#000' }}>
                                {mainTopicNumber}. {topic.Title}
                              </div>
                              {topicSubTopics.length > 0 && (
                                <div style={{ marginLeft: '24px' }}>
                                  {topicSubTopics.map((subTopic, subIndex) => (
                                    <div key={subTopic.SubTopic_Id}>
                                      {mainTopicNumber}.{subIndex + 1} {subTopic.Title}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Course Content by Topics Section */}
        {courseTopics.length > 0 && (
          <div className="nptel-section">
            <h2 className="nptel-section-title">📚 Course Content</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '24px', padding: '0 20px' }}>
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
                    <div key={topic.Topic_Id} style={{
                      background: 'white',
                      borderRadius: '16px',
                      border: '3px solid #2dd4bf',
                      padding: '24px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}>
                      {/* Topic Header */}
                      <div style={{ borderLeft: '4px solid #000', paddingLeft: '16px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0, color: '#1a1a1a' }}>
                            {topic.Title}
                          </h3>
                          {topic.Estimated_Hours && (
                            <span style={{
                              background: '#ff9800',
                              color: 'white',
                              padding: '6px 14px',
                              borderRadius: '20px',
                              fontSize: '0.85rem',
                              fontWeight: '600'
                            }}>
                              {topic.Estimated_Hours} Hours
                            </span>
                          )}
                        </div>
                        {topic.Description && (
                          <p style={{ color: '#666', margin: '8px 0 0 0', fontSize: '0.95rem' }}>
                            {topic.Description}
                          </p>
                        )}
                      </div>

                      {/* Content Details */}
                      <div style={{ borderLeft: '4px solid #2dd4bf', paddingLeft: '16px', marginBottom: '20px' }}>
                        {videos.length > 0 && (
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{
                              background: '#e0f2fe',
                              padding: '10px 14px',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginBottom: '8px'
                            }}>
                              <span style={{ fontSize: '1.1rem' }}>🎥</span>
                              <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0369a1' }}>Type: Video Lectures ({videos.length})</span>
                            </div>
                          </div>
                        )}

                        {pdfs.length > 0 && (
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{
                              background: '#fef3c7',
                              padding: '10px 14px',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginBottom: '8px'
                            }}>
                              <span style={{ fontSize: '1.1rem' }}>📄</span>
                              <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#92400e' }}>Type: PDF Resources ({pdfs.length})</span>
                            </div>
                          </div>
                        )}

                        {notes.length > 0 && (
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{
                              background: '#f3e8ff',
                              padding: '10px 14px',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <span style={{ fontSize: '1.1rem' }}>📝</span>
                              <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#6b21a8' }}>Type: Study Notes ({notes.length})</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      {topicContents.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {videos.length > 0 && (
                            <div>
                              {videos.map((video, vidIndex) => (
                                <button key={video.Content_Id} style={{
                                  width: '100%',
                                  padding: '12px 20px',
                                  marginBottom: '8px',
                                  background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '10px',
                                  fontSize: '0.95rem',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease',
                                  textAlign: 'left',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px'
                                }}
                                  onClick={() => {
                                    console.log('Selected video:', video);
                                    const videoData = {
                                      id: video.Content_Id,
                                      title: video.Title,
                                      url: removeAutoplay(video.File_Url),
                                      description: video.Description || video.Title,
                                      duration: video.Duration || "00:56", // Use actual duration from DB or default to 56 seconds for testing
                                      transcripts: {
                                        English: `This video lecture for "${video.Title}" covers the core objectives and technical frameworks of the topic. You will learn about key components, data flow, and industry standard implementations.`,
                                        Hindi: `"${video.Title}" के लिए यह वीडियो व्याख्यान विषय के मुख्य उद्देश्यों और तकनीकी ढांचे को कवर करता है। आप प्रमुख घटकों, डेटा प्रवाह और उद्योग मानक कार्यान्वयन के बारे में सीखेंगे।`,
                                        Gujarati: `"${video.Title}" માટેનું આ વિડિયો લેક્ચર વિષયના મુખ્ય ઉદ્દેશ્યો અને તકનીકી માળખાને આવરી લે છે. તમે મુખ્ય ઘટકો, ડેટા ફ્લો અને ઉદ્યોગ પ્રમાણભૂત અમલીકરણ વિશે શીખશો.`
                                      }
                                    };
                                    console.log('Setting video data:', videoData);
                                    setSelectedVideo(videoData);
                                    console.log('Video state updated');
                                    // Scroll to video section
                                    setTimeout(() => {
                                      if (videoSectionRef.current) {
                                        videoSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                      }
                                    }, 100);
                                  }}
                                >
                                  <span>🎥</span>
                                  <span>{video.Title}</span>
                                </button>
                              ))}
                            </div>
                          )}
                          {pdfs.length > 0 && (
                            <div>
                              {pdfs.map((pdf, pdfIndex) => (
                                <button key={pdf.Content_Id} style={{
                                  width: '100%',
                                  padding: '12px 20px',
                                  marginBottom: '8px',
                                  background: 'white',
                                  color: '#14b8a6',
                                  border: '2px solid #14b8a6',
                                  borderRadius: '10px',
                                  fontSize: '0.95rem',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease',
                                  textAlign: 'left',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px'
                                }}
                                  onClick={() => window.open(pdf.File_Url, '_blank')}
                                >
                                  <span>📄</span>
                                  <span>{pdf.Title}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{
                          textAlign: 'center',
                          padding: '20px',
                          color: '#999',
                          fontSize: '0.9rem'
                        }}>
                          No content available yet
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
            <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
              <button
                onClick={async () => {
                  const courseId = selectedCourse.Course_Id || selectedCourse.id || selectedCourse.courseId;
                  
                  // Check if certificate already exists
                  if (hasCertificate || localStorage.getItem(`cert_${courseId}_${studentId}`)) {
                    // Show existing certificate
                    setGeneratingCertificate(true);
                    try {
                      // Fetch the existing certificate without triggering email
                      const response = await fetch(`http://localhost:5000/api/certifications/generate?checkOnly=true`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                        },
                        body: JSON.stringify({
                          courseId: courseId,
                          studentId: studentId,
                          checkOnly: true
                        })
                      });
                      
                      const result = await response.json();
                      if (result.success && result.alreadyExists && result.pdfBase64) {
                        // Display the existing certificate
                        const byteCharacters = atob(result.pdfBase64);
                        const byteNumbers = new Array(byteCharacters.length);
                        for (let i = 0; i < byteCharacters.length; i++) {
                          byteNumbers[i] = byteCharacters.charCodeAt(i);
                        }
                        const byteArray = new Uint8Array(byteNumbers);
                        const blob = new Blob([byteArray], { type: 'application/pdf' });
                        const url = URL.createObjectURL(blob);
                        window.open(url, '_blank');
                        
                        setNotification({ message: 'Certificate opened successfully!', type: 'success' });
                      } else {
                        setNotification({ message: 'Certificate not found. Please try again.', type: 'error' });
                      }
                    } catch (error) {
                      console.error('Error showing certificate:', error);
                      setNotification({ message: 'Error showing certificate. Please try again.', type: 'error' });
                    } finally {
                      setGeneratingCertificate(false);
                    }
                  } else {
                    // Generate new certificate
                    setGeneratingCertificate(true);
                    try {
                      const response = await fetch('http://localhost:5000/api/certifications/generate', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                        },
                        body: JSON.stringify({
                          courseId: courseId,
                          studentId: studentId
                        })
                      });

                      const result = await response.json();
                      if (result.success) {
                        setNotification({ message: result.alreadyExists ? '🏆 Certificate sent to your email!' : '🏆 Certificate generated and sent to your email!', type: 'success' });
                        setHasCertificate(true);
                        setCertificateBase64(result.pdfBase64);

                        // PERSIST STATE IN LOCALSTORAGE FOR REFRESH RESILIENCE
                        localStorage.setItem(`cert_${courseId}_${studentId}`, result.pdfBase64);

                        // Open the certificate PDF immediately
                        if (result.pdfBase64) {
                          const byteCharacters = atob(result.pdfBase64);
                          const byteNumbers = new Array(byteCharacters.length);
                          for (let i = 0; i < byteCharacters.length; i++) {
                            byteNumbers[i] = byteCharacters.charCodeAt(i);
                          }
                          const byteArray = new Uint8Array(byteNumbers);
                          const blob = new Blob([byteArray], { type: 'application/pdf' });
                          const url = URL.createObjectURL(blob);
                          window.open(url, '_blank');
                        }
                      } else {
                        setNotification({ message: result.message || 'Failed to generate certificate', type: 'error' });
                      }
                    } catch (error) {
                      console.error('Error in certification process:', error);
                      setNotification({ message: 'Error processing certificate. Please try again.', type: 'error' });
                    } finally {
                      setGeneratingCertificate(false);
                    }
                  }
                }}
                disabled={
                  (() => {
                    const courseId = selectedCourse.Course_Id || selectedCourse.id || selectedCourse.courseId;
                    // If certificate exists, the button should NOT be disabled (to allow viewing)
                    if (hasCertificate || localStorage.getItem(`cert_${courseId}_${studentId}`)) return false;
                    // Otherwise, check if conditions are met for generating
                    const videoCompletion = videoProgress.completionPercentage !== undefined ? videoProgress.completionPercentage : (completionPercentage || 0);
                    const isMarkedCompleted = (courseInfo?.status === 'Completed' || courseInfo?.data?.status === 'Completed' || selectedCourse?.status === 'Completed');
                    return videoCompletion < 100 || !isMarkedCompleted || generatingCertificate;
                  })()
                }
                style={{
                  padding: '0.6rem 1.25rem',
                  background:
                    (() => {
                      const courseId = selectedCourse.Course_Id || selectedCourse.id || selectedCourse.courseId;
                      if (hasCertificate || localStorage.getItem(`cert_${courseId}_${studentId}`)) return 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';
                      const videoCompletion = videoProgress.completionPercentage !== undefined ? videoProgress.completionPercentage : (completionPercentage || 0);
                      const isMarkedCompleted = (courseInfo?.status === 'Completed' || courseInfo?.data?.status === 'Completed' || selectedCourse?.status === 'Completed');
                      return (videoCompletion >= 100 && isMarkedCompleted) ? 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' : '#cbd5e1';
                    })(),
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: (hasCertificate || !generatingCertificate) ? 'pointer' : 'default',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: (hasCertificate || progress >= 100) ? '0 4px 15px rgba(20, 184, 166, 0.4)' : 'none'
                }}
                onMouseEnter={(e) => {
                  const courseId = selectedCourse.Course_Id || selectedCourse.id || selectedCourse.courseId;
                  const videoCompletion = videoProgress.completionPercentage !== undefined ? videoProgress.completionPercentage : (completionPercentage || 0);
                  const isMarkedCompleted = (courseInfo?.status === 'Completed' || courseInfo?.data?.status === 'Completed' || selectedCourse?.status === 'Completed');
                  if ((hasCertificate || localStorage.getItem(`cert_${courseId}_${studentId}`) || videoCompletion >= 100) && isMarkedCompleted) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  const courseId = selectedCourse.Course_Id || selectedCourse.id || selectedCourse.courseId;
                  const videoCompletion = videoProgress.completionPercentage !== undefined ? videoProgress.completionPercentage : (completionPercentage || 0);
                  const isMarkedCompleted = (courseInfo?.status === 'Completed' || courseInfo?.data?.status === 'Completed' || selectedCourse?.status === 'Completed');
                  if ((hasCertificate || localStorage.getItem(`cert_${courseId}_${studentId}`) || videoCompletion >= 100) && isMarkedCompleted) {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <span>{generatingCertificate ? '⌛' : '🎓'}</span>
                {(() => {
                  const courseId = selectedCourse.Course_Id || selectedCourse.id || selectedCourse.courseId;
                  if (generatingCertificate) {
                    return 'Processing...';
                  } else if (hasCertificate || localStorage.getItem(`cert_${courseId}_${studentId}`)) {
                    return 'Show Certificate';
                  } else {
                    return 'Generate Certificate';
                  }
                })()}
              </button>

              <button
                onClick={() => handleQuizStart(1)}
                disabled={
                  (() => {
                    const videoCompletion = videoProgress.completionPercentage !== undefined ? videoProgress.completionPercentage : (completionPercentage || 0);
                    const submittedCount = submittedAssignmentsInCourseCount;
                    const assignmentCompletion = assignments.length > 0 ? (submittedCount / assignments.length) * 100 : 100;
                    const overallProgress = (videoCompletion + assignmentCompletion) / 2;

                    // Final Quiz Unlock Condition: 100% Progress AND Course Marked as "Completed" by Lecturer
                    const isMarkedCompleted = (courseInfo?.status === 'Completed' || courseInfo?.data?.status === 'Completed' || selectedCourse?.status === 'Completed');

                    return overallProgress < 100 || !isMarkedCompleted;
                  })()
                }
                style={{
                  padding: '0.6rem 1.25rem',
                  background:
                    (() => {
                      const videoCompletion = videoProgress.completionPercentage !== undefined ? videoProgress.completionPercentage : (completionPercentage || 0);
                      const submittedCount = submittedAssignmentsInCourseCount;
                      const assignmentCompletion = assignments.length > 0 ? (submittedCount / assignments.length) * 100 : 100;
                      const overallProgress = (videoCompletion + assignmentCompletion) / 2;
                      const isMarkedCompleted = (courseInfo?.status === 'Completed' || courseInfo?.data?.status === 'Completed' || selectedCourse?.status === 'Completed');

                      return (overallProgress >= 100 && isMarkedCompleted) ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' : '#cbd5e1';
                    })(),
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor:
                    (() => {
                      const videoCompletion = videoProgress.completionPercentage !== undefined ? videoProgress.completionPercentage : (completionPercentage || 0);
                      const submittedCount = submittedAssignmentsInCourseCount;
                      const assignmentCompletion = assignments.length > 0 ? (submittedCount / assignments.length) * 100 : 100;
                      const overallProgress = (videoCompletion + assignmentCompletion) / 2;
                      const isMarkedCompleted = (courseInfo?.status === 'Completed' || courseInfo?.data?.status === 'Completed' || selectedCourse?.status === 'Completed');

                      return (overallProgress >= 100 && isMarkedCompleted) ? 'pointer' : 'not-allowed';
                    })(),
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow:
                    (() => {
                      const videoCompletion = videoProgress.completionPercentage !== undefined ? videoProgress.completionPercentage : (completionPercentage || 0);
                      const submittedCount = submittedAssignmentsInCourseCount;
                      const assignmentCompletion = assignments.length > 0 ? (submittedCount / assignments.length) * 100 : 100;
                      const overallProgress = (videoCompletion + assignmentCompletion) / 2;
                      const isMarkedCompleted = (courseInfo?.status === 'Completed' || courseInfo?.data?.status === 'Completed' || selectedCourse?.status === 'Completed');

                      return (overallProgress >= 100 && isMarkedCompleted) ? '0 4px 15px rgba(139, 92, 246, 0.4)' : 'none';
                    })()
                }}
                onMouseEnter={(e) => {
                  const videoCompletion = videoProgress.completionPercentage !== undefined ? videoProgress.completionPercentage : (completionPercentage || 0);
                  const submittedCount = submittedAssignmentsInCourseCount;
                  const assignmentCompletion = assignments.length > 0 ? (submittedCount / assignments.length) * 100 : 100;
                  const overallProgress = (videoCompletion + assignmentCompletion) / 2;
                  const isMarkedCompleted = (courseInfo?.status === 'Completed' || courseInfo?.data?.status === 'Completed' || selectedCourse?.status === 'Completed');

                  if (overallProgress >= 100 && isMarkedCompleted) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  const videoCompletion = videoProgress.completionPercentage !== undefined ? videoProgress.completionPercentage : (completionPercentage || 0);
                  const submittedCount = submittedAssignmentsInCourseCount;
                  const assignmentCompletion = assignments.length > 0 ? (submittedCount / assignments.length) * 100 : 100;
                  const overallProgress = (videoCompletion + assignmentCompletion) / 2;
                  const isMarkedCompleted = (courseInfo?.status === 'Completed' || courseInfo?.data?.status === 'Completed' || selectedCourse?.status === 'Completed');

                  if (overallProgress >= 100 && isMarkedCompleted) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.4)';
                  }
                }}
              >
                <span>
                  {(() => {
                    const videoCompletion = videoProgress.completionPercentage !== undefined ? videoProgress.completionPercentage : (completionPercentage || 0);
                    const submittedCount = submittedAssignmentsInCourseCount;
                    const assignmentCompletion = assignments.length > 0 ? (submittedCount / assignments.length) * 100 : 100;
                    const overallProgress = (videoCompletion + assignmentCompletion) / 2;
                    const isMarkedCompleted = (courseInfo?.status === 'Completed' || courseInfo?.data?.status === 'Completed' || selectedCourse?.status === 'Completed');

                    return (overallProgress >= 100 && isMarkedCompleted) ? '📝' : '🔒';
                  })()}
                </span>
                Attempt Quiz
              </button>
            </div>
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
              <div className="stat-number">{videoProgress.totalVideos || totalVideos || 0}</div>
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
              <div className="stat-number">{totalAssignments || 0}</div>
              <div className="stat-label">ASSIGNMENTS</div>
            </div>
            <div className="progress-stat-box">
              <div className="stat-number">{progress || 0}%</div>
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
              {videoProgress.completedVideos !== undefined ? videoProgress.completedVideos : completedVideos.length} of {videoProgress.totalVideos || totalVideos || 0} videos completed
            </p>
          </div>
        </div>

        {/* Video Lectures Section */}
        <div className="nptel-section" ref={videoSectionRef}>
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
            {selectedVideo ? (
              <div key={selectedVideo.id} className="nptel-video-card">
                <div className="video-card-header">
                  <h3 className="video-lecture-number">Video Lecture</h3>
                  <span className="video-duration">{selectedVideo.duration}</span>
                </div>
                <div className="nptel-video-container">
                  <iframe
                    ref={videoPlayerRef}
                    key={selectedVideo.url}
                    src={selectedVideo.url}
                    title={selectedVideo.title}
                    frameBorder="0"
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="nptel-video-iframe"
                    sandbox="allow-scripts allow-same-origin allow-presentation"
                  ></iframe>
                </div>

                {/* Mark as Completed Button */}
                <div style={{
                  marginTop: '16px',
                  padding: '16px',
                  background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                  borderRadius: '12px',
                  border: '2px solid #bae6fd'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px'
                  }}>
                    <div>
                      <h4 style={{ margin: 0, color: '#0369a1', fontSize: '1rem' }}>Video Progress</h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#0c4a6e' }}>
                        Watch at least 80% to mark as completed
                      </p>
                    </div>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: (videoWatchProgress[selectedVideo.id] || 0) >= 80 ? '#059669' : '#0369a1'
                    }}>
                      {Math.round(videoWatchProgress[selectedVideo.id] || 0)}%
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: '#cbd5e1',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      width: `${videoWatchProgress[selectedVideo.id] || 0}%`,
                      height: '100%',
                      background: (videoWatchProgress[selectedVideo.id] || 0) >= 80
                        ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                        : 'linear-gradient(90deg, #0ea5e9 0%, #0284c7 100%)',
                      transition: 'width 0.3s ease',
                      borderRadius: '4px'
                    }}></div>
                  </div>

                  <button
                    onClick={async () => {
                      const currentWatchProgress = videoWatchProgress[selectedVideo.id] || 0;

                      // Only allow marking as completed if watched >= 80%
                      if (currentWatchProgress >= 80) {
                        // Check if already completed to prevent duplicate
                        if (completedVideos.includes(selectedVideo.id)) {
                          setNotification({ message: 'ℹ️ This video is already marked as completed!', type: 'info' });
                          return;
                        }

                        console.log('🎯 Marking video as completed:', selectedVideo.id);

                        // Mark video as completed in database (pass selectedVideo as third parameter)
                        const saved = await updateVideoProgressInDB(selectedVideo.id, true, selectedVideo);

                        if (saved) {
                          // Wait a moment for database to update
                          await new Promise(resolve => setTimeout(resolve, 500));

                          // Refresh all progress data from database (single source of truth)
                          console.log('🔄 Refreshing progress from database...');
                          await refreshVideoProgress();
                        }
                      }
                    }}
                    disabled={(videoWatchProgress[selectedVideo.id] || 0) < 80 || completedVideos.includes(selectedVideo.id)}
                    style={{
                      width: '100%',
                      padding: '14px 24px',
                      background: (videoWatchProgress[selectedVideo.id] || 0) >= 80
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                        : '#cbd5e1',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: '700',
                      cursor: (videoWatchProgress[selectedVideo.id] || 0) >= 80 ? 'pointer' : 'not-allowed',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: (videoWatchProgress[selectedVideo.id] || 0) >= 80
                        ? '0 4px 15px rgba(16, 185, 129, 0.4)'
                        : 'none',
                      opacity: completedVideos.includes(selectedVideo.id) ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if ((videoWatchProgress[selectedVideo.id] || 0) >= 80) {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.5)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if ((videoWatchProgress[selectedVideo.id] || 0) >= 80) {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)';
                      }
                    }}
                  >
                    {completedVideos.includes(selectedVideo.id) ? (
                      <>
                        <span>✅</span>
                        <span>Completed</span>
                      </>
                    ) : (
                      <>
                        <span>{(videoWatchProgress[selectedVideo.id] || 0) >= 80 ? '✓' : '🔒'}</span>
                        <span>Mark as Completed</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="video-card-footer">
                  <h4 className="video-title">{selectedVideo.title}</h4>
                  <p className="video-description">{selectedVideo.description}</p>

                  {/* Video Content/Transcript */}
                  <div className="video-content-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h5>Video Transcript ({selectedLanguage})</h5>
                      <button
                        onClick={() => handleGenerateTranscript(selectedVideo)}
                        disabled={loadingTranscript[selectedVideo.id]}
                        style={{
                          padding: '8px 16px',
                          background: loadingTranscript[selectedVideo.id] ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          cursor: loadingTranscript[selectedVideo.id] ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {loadingTranscript[selectedVideo.id] ? (
                          <>
                            <span className="spinner-small"></span>
                            Generating...
                          </>
                        ) : (
                          <>
                            📝 Generate AI Transcript
                          </>
                        )}
                      </button>
                    </div>

                    {(() => {
                      const videoKey = `${selectedVideo.id}_${selectedLanguage}`;
                      const transcriptEntry = videoTranscripts[videoKey];

                      if (transcriptEntry) {
                        return (
                          <div style={{
                            background: '#f8f9fa',
                            padding: '16px',
                            borderRadius: '8px',
                            border: '1px solid #e0e0e0'
                          }}>
                            {transcriptEntry.summary && transcriptEntry.summary !== "Transcript provided for this session." && (
                              <div style={{ marginBottom: '16px' }}>
                                <h6 style={{ color: '#667eea', marginBottom: '8px', fontSize: '0.95rem' }}>📌 Summary</h6>
                                <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#555' }}>
                                  {transcriptEntry.summary}
                                </p>
                              </div>
                            )}
                            <div>
                              <h6 style={{ color: '#667eea', marginBottom: '8px', fontSize: '0.95rem' }}>📄 Content Transcript</h6>
                              <p className="video-transcript" style={{ fontSize: '0.85rem', lineHeight: '1.6', color: '#666', maxHeight: '150px', overflow: 'auto' }}>
                                {transcriptEntry.transcript}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setCurrentTranscript({
                                  ...transcriptEntry,
                                  videoTitle: selectedVideo.title
                                });
                                setShowTranscriptModal(true);
                              }}
                              style={{
                                marginTop: '12px',
                                padding: '8px 16px',
                                background: 'white',
                                color: '#667eea',
                                border: '2px solid #667eea',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              View Full Transcript & Download PDF
                            </button>
                          </div>
                        );
                      } else {
                        return (
                          <div style={{
                            padding: '20px',
                            background: '#f0f4f8',
                            borderRadius: '8px',
                            border: '1px dashed #cbd5e1',
                            textAlign: 'center'
                          }}>
                            <p className="video-transcript" style={{ color: '#64748b', fontStyle: 'italic', margin: 0 }}>
                              {selectedLanguage === 'English' ?
                                'No English subtitles available yet. Click "Generate AI Transcript" to create them.' :
                                `No ${selectedLanguage} subtitles available. Switch language or generate AI transcript.`}
                            </p>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '48px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '1.1rem', color: '#999' }}>
                  {loadingContent ? 'Loading video content...' : 'No video lectures available. Select a week from Course Content below.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Assignments Section */}
        <div className="nptel-section">
          <h2 className="nptel-section-title">📝 Assignments</h2>

          {/* Assignment Progress Stats */}
          {assignments.length > 0 && (
            <div className="assignment-progress-stats">
              <div className="progress-stats-grid">
                <div className="stat-card">
                  <span className="stat-label">TOTAL ASSIGNMENTS</span>
                  <span className="stat-value">{assignments.length}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">SUBMITTED</span>
                  <span className="stat-value">
                    {submittedAssignmentsInCourseCount}
                  </span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">PROGRESS</span>
                  <span className="stat-value">
                    {assignments.length > 0
                      ? ((submittedAssignmentsInCourseCount / assignments.length) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar-track">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${assignments.length > 0
                        ? ((submittedAssignmentsInCourseCount / assignments.length) * 100)
                        : 0}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {assignments.length === 0 ? (
            <div className="no-assignments" style={{
              background: 'white',
              borderRadius: '16px',
              padding: '48px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '3rem' }}>📋</span>
              <p style={{ fontSize: '1.1rem', color: '#999', marginTop: '16px' }}>
                No assignments available yet.
              </p>
            </div>
          ) : (
            <div className="nptel-assignments-grid">
              {assignments.map((assignment) => (
                <div key={assignment.Assignment_Id} className="nptel-assignment-card">
                  <div className="assignment-card-header">
                    <h3 className="assignment-title">{assignment.Title}</h3>
                    <span className="assignment-marks">{assignment.Marks} Marks</span>
                  </div>
                  <p className="assignment-description">{assignment.Description}</p>
                  <div className="assignment-meta">
                    <span className="assignment-type">
                      📋 Type: {assignment.Assignment_Type || 'Assignment'}
                    </span>
                    <span className="assignment-deadline">
                      📅 Due: {new Date(assignment.Due_Date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="assignment-actions">
                    <button
                      className="nptel-btn nptel-btn-primary"
                      onClick={() => handleAssignmentStart(assignment.Assignment_Id)}
                      disabled={submittedAssignments[assignment.Assignment_Id]}
                      style={{
                        opacity: submittedAssignments[assignment.Assignment_Id] ? 0.5 : 1,
                        cursor: submittedAssignments[assignment.Assignment_Id] ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {submittedAssignments[assignment.Assignment_Id] ? '✓ Submitted' : 'Start Assignment'}
                    </button>
                    {submittedAssignments[assignment.Assignment_Id] && (
                      <button
                        className="nptel-btn nptel-btn-secondary"
                        onClick={() => handleViewSubmission(assignment.Assignment_Id)}
                      >
                        View Submission
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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

            {/* Student Reviews Display */}
            <div style={{ marginTop: '40px', paddingTop: '30px', borderTop: '2px solid #e0e0e0' }}>
              <h3 style={{
                fontSize: '1.5rem',
                marginBottom: '24px',
                color: '#1a1a1a',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                💬 Student Reviews
              </h3>

              {loadingFeedbacks ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  <div className="loading-spinner"></div>
                  <p>Loading reviews...</p>
                </div>
              ) : courseFeedbacks.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                  borderRadius: '12px',
                  color: '#666'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📝</div>
                  <h4 style={{ marginBottom: '8px', color: '#333' }}>No Reviews Yet</h4>
                  <p>Be the first to share your experience with this course!</p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {courseFeedbacks.map((feedback, index) => {
                      const isOwnFeedback = feedback.Student_Id === studentId;
                      const isEditing = editingFeedbackId === feedback.Feedback_Id;
                      const canEdit = isOwnFeedback && canEditFeedback(feedback.Posted_On);

                      return (
                        <div key={feedback.Feedback_Id || index} style={{
                          display: 'flex',
                          gap: '16px',
                          paddingBottom: '24px',
                          borderBottom: index < courseFeedbacks.length - 1 ? '1px solid #e0e0e0' : 'none'
                        }}>
                          {/* Avatar */}
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '1.2rem',
                            fontWeight: '700',
                            flexShrink: 0
                          }}>
                            {(feedback.Student_Name || 'U').charAt(0).toUpperCase()}
                          </div>

                          {/* Content */}
                          <div style={{ flex: 1 }}>
                            {/* Header */}
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              marginBottom: '8px'
                            }}>
                              <div>
                                <div style={{
                                  fontWeight: '700',
                                  fontSize: '1rem',
                                  color: '#1a1a1a',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}>
                                  {feedback.Student_Name || 'Unknown Student'}
                                  {isOwnFeedback && (
                                    <span style={{
                                      fontSize: '0.7rem',
                                      background: '#3b82f6',
                                      color: 'white',
                                      padding: '2px 8px',
                                      borderRadius: '10px',
                                      fontWeight: '600'
                                    }}>You</span>
                                  )}
                                </div>
                                {/* Stars and Date */}
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  marginTop: '4px'
                                }}>
                                  <div style={{
                                    display: 'flex',
                                    gap: '2px',
                                    fontSize: '0.9rem'
                                  }}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <span key={star} style={{
                                        color: star <= (feedback.Rating || 0) ? '#f59e0b' : '#d1d5db'
                                      }}>★</span>
                                    ))}
                                  </div>
                                  <span style={{
                                    fontSize: '0.85rem',
                                    color: '#6b7280'
                                  }}>
                                    {feedback.Posted_On ? (() => {
                                      const date = new Date(feedback.Posted_On);
                                      const now = new Date();
                                      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
                                      if (diffDays === 0) return 'Today';
                                      if (diffDays === 1) return '1 day ago';
                                      if (diffDays < 7) return `${diffDays} days ago`;
                                      if (diffDays < 30) return `${Math.floor(diffDays / 7)} ${Math.floor(diffDays / 7) === 1 ? 'week' : 'weeks'} ago`;
                                      if (diffDays < 365) return `${Math.floor(diffDays / 30)} ${Math.floor(diffDays / 30) === 1 ? 'month' : 'months'} ago`;
                                      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
                                    })() : 'Recently'}
                                  </span>
                                </div>
                              </div>

                              {/* Edit/Delete buttons */}
                              {canEdit && !isEditing && (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    onClick={() => {
                                      setEditingFeedbackId(feedback.Feedback_Id);
                                      setEditFeedbackData({
                                        rating: feedback.Rating,
                                        comment: feedback.Comment
                                      });
                                    }}
                                    style={{
                                      padding: '4px 12px',
                                      fontSize: '0.85rem',
                                      color: '#3b82f6',
                                      background: 'transparent',
                                      border: '1px solid #3b82f6',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontWeight: '500'
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => deleteFeedback(feedback.Feedback_Id)}
                                    style={{
                                      padding: '4px 12px',
                                      fontSize: '0.85rem',
                                      color: '#ef4444',
                                      background: 'transparent',
                                      border: '1px solid #ef4444',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontWeight: '500'
                                    }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Comment */}
                            {isEditing ? (
                              <div style={{ marginTop: '12px' }}>
                                {/* Rating */}
                                <div style={{ marginBottom: '12px' }}>
                                  <div style={{ fontSize: '1.5rem', display: 'flex', gap: '4px' }}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <span
                                        key={star}
                                        onClick={() => setEditFeedbackData({ ...editFeedbackData, rating: star })}
                                        style={{
                                          cursor: 'pointer',
                                          color: star <= editFeedbackData.rating ? '#ffc107' : '#e0e0e0'
                                        }}
                                      >★</span>
                                    ))}
                                  </div>
                                </div>
                                {/* Comment textarea */}
                                <textarea
                                  value={editFeedbackData.comment}
                                  onChange={(e) => setEditFeedbackData({ ...editFeedbackData, comment: e.target.value })}
                                  style={{
                                    width: '100%',
                                    minHeight: '100px',
                                    padding: '12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    fontSize: '0.95rem',
                                    fontFamily: 'inherit',
                                    resize: 'vertical'
                                  }}
                                  placeholder="Update your review..."
                                />
                                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                  <button
                                    onClick={() => updateFeedback(feedback.Feedback_Id)}
                                    style={{
                                      padding: '8px 16px',
                                      background: '#3b82f6',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      fontWeight: '600',
                                      fontSize: '0.9rem'
                                    }}
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingFeedbackId(null)}
                                    style={{
                                      padding: '8px 16px',
                                      background: '#e5e7eb',
                                      color: '#374151',
                                      border: 'none',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      fontWeight: '600',
                                      fontSize: '0.9rem'
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p style={{
                                color: '#374151',
                                fontSize: '0.95rem',
                                lineHeight: '1.6',
                                margin: '12px 0 0 0',
                                textAlign: 'left'
                              }}>
                                {feedback.Comment}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Show More Button */}
                  {!showAllReviews && (
                    <button
                      onClick={() => {
                        const courseId = selectedCourse.Course_Id || selectedCourse.id || selectedCourse.courseId;
                        fetchCourseFeedbacks(courseId, true);
                      }}
                      style={{
                        marginTop: '24px',
                        padding: '12px 24px',
                        background: 'white',
                        color: '#3b82f6',
                        border: '2px solid #3b82f6',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '1rem',
                        width: '100%',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#3b82f6';
                        e.target.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'white';
                        e.target.style.color = '#3b82f6';
                      }}
                    >
                      Show More Reviews
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transcript Modal */}
      {showTranscriptModal && currentTranscript && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '32px',
            position: 'relative',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setShowTranscriptModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                fontSize: '28px',
                cursor: 'pointer',
                color: '#999',
                lineHeight: 1,
                padding: '4px 8px'
              }}
            >
              ×
            </button>

            {/* Modal Header */}
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1a1a1a',
              marginBottom: '8px'
            }}>
              Video Transcript
            </h2>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#667eea',
              marginBottom: '24px'
            }}>
              {currentTranscript.videoTitle}
            </h3>

            {/* Language Badge */}
            <div style={{
              display: 'inline-block',
              background: '#e0f2fe',
              color: '#0369a1',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '24px'
            }}>
              Language: {currentTranscript.language}
            </div>

            {/* Summary Section */}
            <div style={{
              background: '#f0f8ff',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '24px',
              border: '2px solid #667eea'
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#667eea',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📌 Summary
              </h4>
              <p style={{
                fontSize: '15px',
                lineHeight: '1.7',
                color: '#333',
                margin: 0
              }}>
                {currentTranscript.summary}
              </p>
            </div>

            {/* Full Transcript Section */}
            <div style={{
              background: '#f8f9fa',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '24px',
              border: '1px solid #e0e0e0'
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#333',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📄 Full Transcript
              </h4>
              <div style={{
                fontSize: '14px',
                lineHeight: '1.8',
                color: '#555',
                maxHeight: '300px',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                padding: '12px',
                background: 'white',
                borderRadius: '8px'
              }}>
                {currentTranscript.transcript}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowTranscriptModal(false)}
                style={{
                  padding: '12px 24px',
                  background: 'white',
                  color: '#667eea',
                  border: '2px solid #667eea',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
              <button
                onClick={handleDownloadTranscriptPDF}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                📥 Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '450px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            animation: 'slideUp 0.3s ease',
            position: 'relative'
          }}>
            {/* Icon based on type */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              background: modalContent.type === 'error' ? '#fee' :
                modalContent.type === 'success' ? '#efe' : '#e3f2fd'
            }}>
              {modalContent.type === 'error' ? '❌' :
                modalContent.type === 'success' ? '✅' : 'ℹ️'}
            </div>

            {/* Title */}
            <h3 style={{
              margin: '0 0 16px',
              fontSize: '22px',
              fontWeight: '700',
              textAlign: 'center',
              color: '#333'
            }}>
              {modalContent.title}
            </h3>

            {/* Message */}
            <p style={{
              margin: '0 0 24px',
              fontSize: '15px',
              lineHeight: '1.6',
              textAlign: 'center',
              color: '#666',
              whiteSpace: 'pre-line'
            }}>
              {modalContent.message}
            </p>

            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              style={{
                width: '100%',
                padding: '12px',
                background: modalContent.type === 'error' ? '#ef4444' :
                  modalContent.type === 'success' ? '#10b981' : '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Quiz Generation Loading Overlay */}
      {isGeneratingQuiz && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10001,
          backdropFilter: 'blur(8px)',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '48px',
            textAlign: 'center',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 25px 70px rgba(0, 0, 0, 0.4)',
            animation: 'slideUp 0.3s ease'
          }}>
            {/* Animated Spinner */}
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 24px',
              border: '6px solid #f3f4f6',
              borderTop: '6px solid #667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>

            {/* Title */}
            <h3 style={{
              margin: '0 0 12px',
              fontSize: '24px',
              fontWeight: '700',
              color: '#333'
            }}>
              Generating Your Quiz
            </h3>

            {/* Description */}
            <p style={{
              margin: '0 0 20px',
              fontSize: '15px',
              lineHeight: '1.6',
              color: '#666'
            }}>
              AI is analyzing course materials and creating personalized questions...
            </p>

            {/* Progress Dots */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '20px'
            }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#667eea',
                animation: 'bounce 1.4s infinite ease-in-out both',
                animationDelay: '-0.32s'
              }}></div>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#667eea',
                animation: 'bounce 1.4s infinite ease-in-out both',
                animationDelay: '-0.16s'
              }}></div>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#667eea',
                animation: 'bounce 1.4s infinite ease-in-out both'
              }}></div>
            </div>

            {/* Estimated Time */}
            <p style={{
              marginTop: '24px',
              fontSize: '13px',
              color: '#999',
              fontStyle: 'italic'
            }}>
              This may take 2-3 minutes...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseLearningPage;
