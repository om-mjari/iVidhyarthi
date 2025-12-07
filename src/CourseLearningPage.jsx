import React, { useState, useEffect } from 'react';
import AssignmentPage from './AssignmentPage';
import WeeklyAssignments from './WeeklyAssignments';
import QuizPage from './QuizPage';
import AssignmentViewer from './AssignmentViewer';
import './CourseLearningPage.css';

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

  // Course content from database
  const [courseTopics, setCourseTopics] = useState([]);
  const [courseSubTopics, setCourseSubTopics] = useState([]);
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

  // Track video playback progress and prevent skipping
  useEffect(() => {
    if (!selectedVideo) return;

    const videoId = selectedVideo.id;
    let accumulatedTime = 0;
    let hasReachedMax = false;
    let isPageVisible = !document.hidden;

    // Initialize progress for this video if not exists
    if (videoWatchProgress[videoId] === undefined) {
      setVideoWatchProgress(prev => ({ ...prev, [videoId]: 0 }));
      setMaxWatchedTime(prev => ({ ...prev, [videoId]: 0 }));
    } else {
      // Resume from previous progress
      const previousProgress = videoWatchProgress[videoId] || 0;
      if (previousProgress >= 100) {
        hasReachedMax = true;
      }
    }

    // Parse video duration from MM:SS format to seconds
    const parseDuration = (durationStr) => {
      if (!durationStr) return 56; // Default 56 seconds if no duration
      const parts = durationStr.split(':').map(Number);
      if (parts.length === 2) {
        return (parts[0] * 60) + parts[1]; // MM:SS format
      } else if (parts.length === 3) {
        return (parts[0] * 3600) + (parts[1] * 60) + parts[2]; // HH:MM:SS format
      } else if (parts.length === 1) {
        return parts[0]; // Just seconds
      }
      return 56; // Default fallback to 56 seconds
    };

    const videoDuration = parseDuration(selectedVideo.duration);

    // Get starting accumulated time from current progress - initialize to 0 for fresh tracking
    if (videoWatchProgress[videoId] && videoWatchProgress[videoId] >= 100) {
      hasReachedMax = true;
      accumulatedTime = videoDuration;
    } else {
      accumulatedTime = 0; // Always start from 0 for proper tracking
    }

    // Handle page visibility change
    const handleVisibilityChange = () => {
      isPageVisible = !document.hidden;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Update progress every second - only when actively watching
    const trackingInterval = setInterval(() => {


      if (isPageVisible && !hasReachedMax) {
        // Increment by 1 second
        accumulatedTime += 1;

        // Check if reached or exceeded video duration
        if (accumulatedTime >= videoDuration) {
          hasReachedMax = true;
          accumulatedTime = videoDuration;

          setVideoWatchProgress(prev => ({
            ...prev,
            [videoId]: 100
          }));
          setMaxWatchedTime(prev => ({
            ...prev,
            [videoId]: 100
          }));
          return;
        }

        // Calculate progress based on actual video duration
        const progressPercentage = (accumulatedTime / videoDuration) * 100;

        setVideoWatchProgress(prev => ({
          ...prev,
          [videoId]: progressPercentage
        }));

        setMaxWatchedTime(prev => ({
          ...prev,
          [videoId]: Math.max(prev[videoId] || 0, progressPercentage)
        }));
      }
    }, 1000);

    return () => {
      clearInterval(trackingInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedVideo]);

  // Generate transcript for a video
  const handleGenerateTranscript = async (video) => {
    const videoKey = video.id || video.title;

    // Check if transcript already exists
    if (videoTranscripts[videoKey]) {
      setCurrentTranscript({
        ...videoTranscripts[videoKey],
        videoTitle: video.title
      });
      setShowTranscriptModal(true);
      return;
    }

    setLoadingTranscript(prev => ({ ...prev, [videoKey]: true }));

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
        alert('Failed to generate transcript: ' + result.message);
      }
    } catch (error) {
      console.error('Error generating transcript:', error);
      alert('Failed to generate transcript. Please try again.');
    } finally {
      setLoadingTranscript(prev => ({ ...prev, [videoKey]: false }));
    }
  };

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
        alert('Failed to download PDF');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
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
                  const instituteResponse = await fetch(`http://localhost:5000/api/institutes/${lecturerResult.data.Institute_Id}`);
                  const instituteResult = await instituteResponse.json();
                  if (instituteResult.success && instituteResult.data) {
                    setInstituteInfo(instituteResult.data);
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
              English: "Transcript not available",
              Hindi: "ट्रांसक्रिप्ट उपलब्ध नहीं है",
              Gujarati: "ટ્રાન્સક્રિપ્ટ ઉપલબ્ધ નથી"
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

  // Fetch course feedbacks
  const fetchCourseFeedbacks = async (courseId) => {
    try {
      setLoadingFeedbacks(true);
      const response = await fetch(`http://localhost:5000/api/feedback/course/${courseId}`);
      const result = await response.json();

      if (result.success) {
        setCourseFeedbacks(result.data || []);
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
        // Refresh feedbacks after submission
        fetchCourseFeedbacks(courseId);
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
      duration: content.Duration || "00:56",
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
      description: courseDescription || courseInfo?.Description || selectedCourse?.description || "This course covers the fundamentals of IoT, including sensors, actuators, networking protocols, and real-world applications. Learn how to build smart connected devices and understand the IoT ecosystem.",
      objectives: learningObjectives.length > 0 ? learningObjectives : (courseInfo?.Objectives || [
        "Understand the basic architecture and components of IoT systems",
        "Learn about various sensors, actuators, and communication protocols",
        "Develop skills to design and implement IoT applications",
        "Explore real-world IoT use cases and industry applications"
      ]),
      instructor: lecturerInfo?.Name || courseInfo?.Instructor || selectedCourse?.instructor || "Instructor",
      institution: instituteInfo?.Institute_Name || courseInfo?.Institution || "IIT Kharagpur",
      duration: selectedCourse?.duration || courseInfo?.Duration || "12 Weeks",
      level: courseInfo?.Level || "Beginner to Intermediate"
    },
    videos: processedVideos.length > 0 ? processedVideos : [],
    assignments: assignments.length > 0 ? assignments : [],
    quizzes: []
  };

  const totalVideos = courseContent.videos.length || 0;
  const totalAssignments = courseContent.assignments.length || 0;
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
            File_Url: latestSubmission.File_Url,
            Submission_Data: {
              Student_Id: latestSubmission.Student_Id,
              Course_Id: latestSubmission.Course_Id,
              Score: latestSubmission.Score,
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
      <AssignmentViewer
        assignment={selectedAssignment}
        onBack={handleAssignmentBack}
        studentId={studentId}
        totalAssignments={assignments.length}
        submittedCount={Object.keys(submittedAssignments).filter(key => submittedAssignments[key]).length}
        onSubmissionComplete={() => {
          fetchSubmittedAssignments();
          fetchAssignments(selectedCourse?.Course_Id || selectedCourse?.id);
        }}
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
                                        English: "Transcript not available",
                                        Hindi: "ट्रांसक्रिप्ट उपलब्ध नहीं है",
                                        Gujarati: "ટ્રાન્સક્રિપ્ટ ઉપલબ્ધ નથી"
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
              <div className="stat-number">{videoProgress.completionPercentage !== undefined ? videoProgress.completionPercentage : (completionPercentage || 0)}%</div>
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

            {/* Attempt Quiz Button - Unlocks at 100% video AND assignment completion */}
            <button
              onClick={() => handleQuizStart(1)}
              disabled={
                (videoProgress.completionPercentage !== undefined ? videoProgress.completionPercentage : (completionPercentage || 0)) < 100 ||
                (assignments.length > 0 && (Object.keys(submittedAssignments).filter(key => submittedAssignments[key]).length / assignments.length) < 1)
              }
              style={{
                marginTop: '16px',
                width: '100%',
                padding: '12px',
                background:
                  (videoProgress.completionPercentage !== undefined ? videoProgress.completionPercentage : (completionPercentage || 0)) >= 100 &&
                    (assignments.length === 0 || (Object.keys(submittedAssignments).filter(key => submittedAssignments[key]).length / assignments.length) >= 1)
                    ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                    : '#cbd5e1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor:
                  (videoProgress.completionPercentage !== undefined ? videoProgress.completionPercentage : (completionPercentage || 0)) >= 100 &&
                    (assignments.length === 0 || (Object.keys(submittedAssignments).filter(key => submittedAssignments[key]).length / assignments.length) >= 1)
                    ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow:
                  (videoProgress.completionPercentage !== undefined ? videoProgress.completionPercentage : (completionPercentage || 0)) >= 100 &&
                    (assignments.length === 0 || (Object.keys(submittedAssignments).filter(key => submittedAssignments[key]).length / assignments.length) >= 1)
                    ? '0 4px 15px rgba(139, 92, 246, 0.4)'
                    : 'none'
              }}
            >
              <span>
                {(videoProgress.completionPercentage !== undefined ? videoProgress.completionPercentage : (completionPercentage || 0)) >= 100 &&
                  (assignments.length === 0 || (Object.keys(submittedAssignments).filter(key => submittedAssignments[key]).length / assignments.length) >= 1)
                  ? '📝' : '🔒'}
              </span>
              Attempt Quiz
            </button>
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
                      if ((videoWatchProgress[selectedVideo.id] || 0) >= 80) {
                        // Mark video as completed
                        await updateVideoProgressInDB(selectedVideo.id, true);
                        if (!completedVideos.includes(selectedVideo.id)) {
                          setCompletedVideos(prev => [...prev, selectedVideo.id]);
                        }
                        // Recalculate progress locally for immediate UI update
                        const totalVids = courseContent.videos.length || 1;
                        const currentCompletedCount = completedVideos.includes(selectedVideo.id) ? completedVideos.length : completedVideos.length + 1;
                        const newPercentage = Math.round((currentCompletedCount / totalVids) * 100);

                        setVideoProgress(prev => ({
                          ...prev,
                          completedVideos: currentCompletedCount,
                          completionPercentage: newPercentage
                        }));
                        setProgress(newPercentage);

                        alert('✅ Video marked as completed!');
                      }
                    }}
                    disabled={(videoWatchProgress[selectedVideo.id] || 0) < 80}
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
                            📝 Generate Transcript
                          </>
                        )}
                      </button>
                    </div>
                    {videoTranscripts[selectedVideo.id] ? (
                      <div style={{
                        background: '#f8f9fa',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid #e0e0e0'
                      }}>
                        <div style={{ marginBottom: '16px' }}>
                          <h6 style={{ color: '#667eea', marginBottom: '8px', fontSize: '0.95rem' }}>📌 Summary</h6>
                          <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#555' }}>
                            {videoTranscripts[selectedVideo.id].summary}
                          </p>
                        </div>
                        <div>
                          <h6 style={{ color: '#667eea', marginBottom: '8px', fontSize: '0.95rem' }}>📄 Full Transcript</h6>
                          <p className="video-transcript" style={{ fontSize: '0.85rem', lineHeight: '1.6', color: '#666', maxHeight: '150px', overflow: 'auto' }}>
                            {videoTranscripts[selectedVideo.id].transcript}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setCurrentTranscript({
                              ...videoTranscripts[selectedVideo.id],
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
                    ) : (
                      <p className="video-transcript" style={{ color: '#999', fontStyle: 'italic' }}>
                        Click "Generate Transcript" to get AI-powered transcription with summary
                      </p>
                    )}
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
                    {Object.keys(submittedAssignments).filter(key => submittedAssignments[key]).length}
                  </span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">PROGRESS</span>
                  <span className="stat-value">
                    {assignments.length > 0
                      ? ((Object.keys(submittedAssignments).filter(key => submittedAssignments[key]).length / assignments.length) * 100).toFixed(1)
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
                        ? ((Object.keys(submittedAssignments).filter(key => submittedAssignments[key]).length / assignments.length) * 100)
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
                {courseFeedbacks.length > 0 && (
                  <span style={{
                    fontSize: '0.9rem',
                    color: '#666',
                    fontWeight: 'normal'
                  }}>
                    ({courseFeedbacks.length})
                  </span>
                )}
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
                <div style={{
                  display: 'grid',
                  gap: '20px'
                }}>
                  {courseFeedbacks.map((feedback, index) => {
                    const isOwnFeedback = feedback.Student_Id === studentId;
                    return (
                      <div key={feedback.Feedback_Id || index} style={{
                        background: isOwnFeedback ? '#f0f9ff' : 'white',
                        borderRadius: '8px',
                        padding: '20px',
                        border: isOwnFeedback ? '2px solid #3b82f6' : '1px solid #e0e0e0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                      }}>
                        {/* Student Name and Course Name */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '12px'
                        }}>
                          <div>
                            <div style={{
                              fontWeight: '700',
                              fontSize: '1.1rem',
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
                                  padding: '3px 10px',
                                  borderRadius: '12px',
                                  fontWeight: '600'
                                }}>You</span>
                              )}
                            </div>
                            <div style={{
                              fontSize: '0.9rem',
                              color: '#666',
                              marginTop: '4px'
                            }}>
                              {feedback.Course_Name || 'Course'}
                            </div>
                          </div>
                        </div>

                        {/* Comment */}
                        <div style={{
                          color: '#333',
                          fontSize: '0.95rem',
                          lineHeight: '1.6',
                          marginBottom: '12px',
                          padding: '12px',
                          background: '#f8f9fa',
                          borderRadius: '6px',
                          borderLeft: '3px solid #3b82f6'
                        }}>
                          {feedback.Comment}
                        </div>

                        {/* Rating and Date */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          {/* Rating Stars */}
                          <div style={{
                            display: 'flex',
                            gap: '3px',
                            fontSize: '1.1rem'
                          }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span key={star} style={{
                                color: star <= (feedback.Rating || 0) ? '#ffc107' : '#e0e0e0'
                              }}>
                                ★
                              </span>
                            ))}
                          </div>

                          {/* Date */}
                          <div style={{
                            fontSize: '0.85rem',
                            color: '#999'
                          }}>
                            {feedback.Posted_On ? new Date(feedback.Posted_On).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            }) : 'Recently'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
    </div>
  );
};

export default CourseLearningPage;
