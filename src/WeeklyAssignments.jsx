import React, { useState, useEffect } from 'react';
import './WeeklyAssignments.css';
import AssignmentPage from './AssignmentPage';
import { generateTopicVideos, generateAssignmentQuestions, generateStudyMaterials } from './services/aiContentService';

const WeeklyAssignments = ({ courseId, courseName, onBack }) => {
  const [weeklyAssignments, setWeeklyAssignments] = useState([]);
  const [progressData, setProgressData] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showAssignmentPage, setShowAssignmentPage] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [expandedWeek, setExpandedWeek] = useState(null);
  const [aiVideos, setAiVideos] = useState({});
  const [aiQuestions, setAiQuestions] = useState({});
  const [studyMaterials, setStudyMaterials] = useState({});
  const [loadingContent, setLoadingContent] = useState({});
  const [viewingSubmission, setViewingSubmission] = useState(false);
  const [selectedSubmissionData, setSelectedSubmissionData] = useState(null);

  // Weeks Structure - All 7 Weeks
  const weeksStructure = [
    {
      week: 1,
      title: "Week 01: Assignment",
      topics: "Introduction and Fundamentals",
      description: "Basic concepts, definitions, and overview of the subject",
      releaseDate: "2025-07-23",
      dueDate: "2025-08-06",
      marks: 100,
      status: "Open"
    },
    {
      week: 2,
      title: "Week 02: Assignment",
      topics: "Core Concepts and Principles",
      description: "Deep dive into fundamental principles and methodologies",
      releaseDate: "2025-07-30",
      dueDate: "2025-08-13",
      marks: 100,
      status: "Open"
    },
    {
      week: 3,
      title: "Week 03: Assignment",
      topics: "Practical Applications - Part I",
      description: "Real-world applications and case studies",
      releaseDate: "2025-08-06",
      dueDate: "2025-08-20",
      marks: 100,
      status: "Open"
    },
    {
      week: 4,
      title: "Week 04: Assignment",
      topics: "Practical Applications - Part II",
      description: "Advanced implementations and problem-solving",
      releaseDate: "2025-08-13",
      dueDate: "2025-08-27",
      marks: 100,
      status: "Open"
    },
    {
      week: 5,
      title: "Week 05: Assignment",
      topics: "Advanced Topics and Techniques",
      description: "Complex scenarios and optimization strategies",
      releaseDate: "2025-08-20",
      dueDate: "2025-09-03",
      marks: 100,
      status: "Open"
    },
    {
      week: 6,
      title: "Week 06: Assignment",
      topics: "Integration and Analysis",
      description: "System integration and performance analysis",
      releaseDate: "2025-08-27",
      dueDate: "2025-09-10",
      marks: 100,
      status: "Open"
    },
    {
      week: 7,
      title: "Week 07: Assignment",
      topics: "Final Assessment and Project",
      description: "Comprehensive evaluation and capstone project",
      releaseDate: "2025-09-03",
      dueDate: "2025-09-17",
      marks: 100,
      status: "Open"
    }
  ];

  useEffect(() => {
    // Get student ID
    try {
      const authUser = localStorage.getItem('auth_user');
      if (authUser) {
        const parsedUser = JSON.parse(authUser);
        const id = parsedUser.id || parsedUser._id;
        setStudentId(id);
        fetchAssignmentsAndProgress(id);
      }
    } catch (e) {
      console.error('Error getting student ID:', e);
      setLoading(false);
    }
  }, [courseId]);

  const fetchAssignmentsAndProgress = async (stuId) => {
    try {
      setLoading(true);

      // Fetch assignments from backend
      const assignmentsResponse = await fetch(`http://localhost:5000/api/assignments/course/${courseId}`);
      const assignmentsData = await assignmentsResponse.json();
      
      // Fetch student submissions from BOTH Tbl_Submissions AND Tbl_Assignments
      // 1. Get from Tbl_Submissions
      const submissionsResponse = await fetch(`http://localhost:5000/api/submissions/student/${stuId}`);
      const submissionsData = await submissionsResponse.json();
      
      // 2. Get from Tbl_Assignments (submitted assignments)
      const tblAssignmentsResponse = await fetch(`http://localhost:5000/api/assignments/course/${courseId}`);
      const tblAssignmentsData = await tblAssignmentsResponse.json();
      
      // Filter submitted assignments for this student from Tbl_Assignments
      const tblAssignmentSubmissions = tblAssignmentsData.success 
        ? tblAssignmentsData.data.filter(a => 
            a.Status === 'Submitted' && 
            (a.Assignment_Id?.includes(`_${stuId}`) || a.Submission_Data?.Student_Id === stuId)
          )
        : [];

      // Combine submissions from both sources and get latest for each assignment
      let allSubmissions = [];
      if (submissionsData.success) {
        allSubmissions = [...submissionsData.data];
      }
      // Add Tbl_Assignments submissions
      allSubmissions = [...allSubmissions, ...tblAssignmentSubmissions];

      // Group by Assignment_Id and keep only the latest submission for each
      const latestSubmissions = {};
      allSubmissions.forEach(submission => {
        const assignmentId = submission.Assignment_Id;
        if (!latestSubmissions[assignmentId] || 
            new Date(submission.Submitted_On || submission.Submission_Data?.Submitted_On) > 
            new Date(latestSubmissions[assignmentId].Submitted_On || latestSubmissions[assignmentId].Submission_Data?.Submitted_On)) {
          latestSubmissions[assignmentId] = submission;
        }
      });

      // Fetch progress tracking
      const progressResponse = await fetch(`http://localhost:5000/api/progress/${courseId}/${stuId}`);
      const progressResult = await progressResponse.json();

      if (assignmentsData.success) {
        // Filter out submissions, keep only original assignments
        const originalAssignments = assignmentsData.data.filter(a => 
          a.Status !== 'Submitted' && !a.Assignment_Id?.includes('_')
        );
        setWeeklyAssignments(originalAssignments);
      }

      setSubmissions(Object.values(latestSubmissions));

      if (progressResult.success) {
        setProgressData(progressResult.data);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const getAssignmentStatus = (week) => {
    const assignment = weeklyAssignments.find(a => 
      a.Title?.includes(`Week 0${week}`) || a.Title?.includes(`Week ${week}`)
    );

    if (!assignment) return { status: 'Not Available', color: '#6c757d', icon: '🔒' };

    // Check for submission in Tbl_Assignments with key format: AssignmentId_StudentId
    const assignmentKey = `${assignment.Assignment_Id}_${studentId}`;
    const submission = submissions.find(s => 
      s.Assignment_Id === assignment.Assignment_Id || s.Assignment_Id === assignmentKey
    );
    
    if (submission) {
      return { 
        status: 'Submitted', 
        color: '#28a745', 
        icon: '✅',
        score: submission.Submission_Data?.Score || submission.Score || 0,
        submittedOn: new Date(submission.Submission_Data?.Submitted_On || submission.Submitted_On || new Date()).toLocaleDateString()
      };
    }

    const dueDate = new Date(assignment.Due_Date);
    const today = new Date();

    if (today > dueDate) {
      return { status: 'Overdue', color: '#dc3545', icon: '⚠️' };
    }

    return { status: 'Pending', color: '#ffc107', icon: '📝' };
  };

  const calculateOverallProgress = () => {
    const totalWeeks = 7;
    const completedWeeks = weeksStructure.filter(week => {
      const status = getAssignmentStatus(week.week);
      return status.status === 'Submitted';
    }).length;

    return Math.round((completedWeeks / totalWeeks) * 100);
  };

  const handleStartAssignment = async (week) => {
    const assignment = weeklyAssignments.find(a => 
      a.Title?.includes(`Week 0${week}`) || a.Title?.includes(`Week ${week}`)
    );

    if (!assignment) {
      alert('Assignment not available yet. Please check back later.');
      return;
    }

    // Check if already submitted
    const assignmentKey = `${assignment.Assignment_Id}_${studentId}`;
    const submission = submissions.find(s => 
      s.Assignment_Id === assignment.Assignment_Id || s.Assignment_Id === assignmentKey
    );

    if (submission) {
      // If submitted, view the submission instead
      await handleViewSubmission(assignment.Assignment_Id);
    } else {
      // Start new assignment
      setSelectedAssignment(assignment);
      setShowAssignmentPage(true);
    }
  };

  const handleExpandWeek = async (week) => {
    if (expandedWeek === week) {
      setExpandedWeek(null);
      return;
    }

    setExpandedWeek(week);
    
    // Load AI content if not already loaded
    if (!aiVideos[week]) {
      await loadAIContent(week);
    }
  };

  const loadAIContent = async (week) => {
    const weekData = weeksStructure.find(w => w.week === week);
    if (!weekData) return;

    setLoadingContent(prev => ({ ...prev, [week]: true }));

    try {
      // Generate AI content in parallel
      const [videos, questions, materials] = await Promise.all([
        generateTopicVideos(weekData.topics, courseName),
        generateAssignmentQuestions(weekData.topics, 'medium', 10),
        generateStudyMaterials(weekData.topics, week)
      ]);

      setAiVideos(prev => ({ ...prev, [week]: videos }));
      setAiQuestions(prev => ({ ...prev, [week]: questions }));
      setStudyMaterials(prev => ({ ...prev, [week]: materials }));
    } catch (error) {
      console.error('Error loading AI content:', error);
    } finally {
      setLoadingContent(prev => ({ ...prev, [week]: false }));
    }
  };

  const handleAssignmentComplete = async (score) => {
    // Refresh data after submission
    if (studentId) {
      await fetchAssignmentsAndProgress(studentId);
      await updateProgress();
    }
    setShowAssignmentPage(false);
    setSelectedAssignment(null);
  };

  const handleAssignmentBack = () => {
    setShowAssignmentPage(false);
    setSelectedAssignment(null);
    setViewingSubmission(false);
    setSelectedSubmissionData(null);
  };

  const handleViewSubmission = async (assignmentId) => {
    if (!studentId) return;
    
    try {
      // Try to get submission from Tbl_Assignments first
      const assignmentsResponse = await fetch(
        `http://localhost:5000/api/assignments/submission/${assignmentId}/${studentId}`
      );
      const assignmentsResult = await assignmentsResponse.json();
      
      if (assignmentsResult.success && assignmentsResult.data) {
        setSelectedSubmissionData(assignmentsResult.data);
        setViewingSubmission(true);
        return;
      }

      // If not found, try Tbl_Submissions
      const submissionsResponse = await fetch(
        `http://localhost:5000/api/submissions/student/${studentId}`
      );
      const submissionsResult = await submissionsResponse.json();
      
      if (submissionsResult.success && submissionsResult.data) {
        const submission = submissionsResult.data.find(s => s.Assignment_Id === assignmentId);
        if (submission) {
          // Convert Tbl_Submissions format to expected format
          const convertedData = {
            Assignment_Id: submission.Assignment_Id,
            Marks: 100, // Default marks
            Submission_Data: {
              Student_Id: submission.Student_Id,
              Course_Id: submission.Course_Id,
              Score: submission.Score,
              Time_Spent: submission.Time_Spent,
              Submitted_On: submission.Submitted_On,
              Feedback: submission.Feedback,
              Answers: JSON.parse(submission.Submission_Content || '{}'),
              Questions: [] // Will need to fetch questions separately
            }
          };
          setSelectedSubmissionData(convertedData);
          setViewingSubmission(true);
          return;
        }
      }
      
      alert('No submission found for this assignment.');
    } catch (error) {
      console.error('Error fetching submission:', error);
      alert('Error loading submission.');
    }
  };

  const updateProgress = async () => {
    if (!studentId || !courseId) return;

    try {
      const completedAssignments = submissions.length;
      const progressPercent = calculateOverallProgress();

      const progressPayload = {
        Course_Id: courseId,
        Student_Id: studentId,
        Progress_Percent: progressPercent,
        Completed_Topics: submissions.map(s => s.Assignment_Id),
        Last_Accessed: new Date(),
        Status: progressPercent === 0 ? 'Not Started' : progressPercent === 100 ? 'Completed' : 'In Progress'
      };

      const response = await fetch('http://localhost:5000/api/progress/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(progressPayload)
      });

      const result = await response.json();
      if (result.success) {
        console.log('✅ Progress updated:', result.data);
        setProgressData(result.data);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  if (showAssignmentPage && selectedAssignment) {
    return (
      <AssignmentPage
        assignment={selectedAssignment}
        onBack={handleAssignmentBack}
        onComplete={handleAssignmentComplete}
      />
    );
  }

  // Show Submission Viewer
  if (viewingSubmission && selectedSubmissionData) {
    const submissionData = selectedSubmissionData.Submission_Data || {};
    const answers = submissionData.Answers || {};
    const questions = submissionData.Questions || [];
    const score = submissionData.Score || 0;
    const marks = selectedSubmissionData.Marks || 100;
    const timeSpent = submissionData.Time_Spent || 0;
    const submittedOn = new Date(submissionData.Submitted_On || selectedSubmissionData.createdAt).toLocaleString();

    return (
      <div className="submission-viewer-page">
        <div className="submission-viewer-header">
          <button className="back-button" onClick={handleAssignmentBack}>
            ← Back to Assignments
          </button>
          <h1>Assignment Submission</h1>
        </div>

        <div className="submission-viewer-container">
          <div className="submission-info-card">
            <h2>📊 Submission Details</h2>
            <div className="submission-stats">
              <div className="stat-item">
                <span className="stat-label">Score:</span>
                <span className="stat-value">{score} / {marks}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Percentage:</span>
                <span className="stat-value">{Math.round((score / marks) * 100)}%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Time Spent:</span>
                <span className="stat-value">
                  {Math.floor(timeSpent / 60)}m {timeSpent % 60}s
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Submitted On:</span>
                <span className="stat-value">{submittedOn}</span>
              </div>
            </div>

            {submissionData.Feedback && (
              <div className="feedback-section">
                <h3>💬 Feedback</h3>
                <p>{submissionData.Feedback}</p>
              </div>
            )}
          </div>

          <div className="submission-answers-section">
            <h2>📝 Your Answers</h2>
            {questions && questions.length > 0 ? (
              questions.map((question, index) => {
                const questionId = question.id || index + 1;
                const userAnswer = answers[questionId];
                const correctAnswer = question.correctAnswer;
                const isCorrect = String(userAnswer) === String(correctAnswer);

                return (
                  <div key={questionId} className={`question-review-card ${isCorrect ? 'correct' : 'incorrect'}`}>
                    <div className="question-header">
                      <span className="question-number">Question {index + 1}</span>
                      <span className={`answer-badge ${isCorrect ? 'correct' : 'incorrect'}`}>
                        {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                      </span>
                      <span className="question-marks">
                        {isCorrect ? question.marks : 0} / {question.marks} marks
                      </span>
                    </div>

                    <div className="question-content">
                      <p className="question-text">{question.question}</p>

                      {question.type === 'MCQ' && question.options && (
                        <div className="options-list">
                          {question.options.map((option, optIdx) => {
                            const optionValue = optIdx + 1;
                            const isUserAnswer = String(userAnswer) === String(optionValue);
                            const isCorrectOption = String(correctAnswer) === String(optionValue);

                            return (
                              <div
                                key={optIdx}
                                className={`option-item ${isUserAnswer ? 'user-answer' : ''} ${isCorrectOption ? 'correct-answer' : ''}`}
                              >
                                <span className="option-label">{optionValue}.</span>
                                <span className="option-text">{option}</span>
                                {isUserAnswer && <span className="badge">Your Answer</span>}
                                {isCorrectOption && <span className="badge correct">Correct Answer</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {question.type === 'Short Answer' && (
                        <div className="text-answer-section">
                          <div className="answer-box">
                            <strong>Your Answer:</strong>
                            <p>{userAnswer || 'Not answered'}</p>
                          </div>
                          {question.sampleAnswer && (
                            <div className="sample-answer-box">
                              <strong>Sample Answer:</strong>
                              <p>{question.sampleAnswer}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p>No question data available.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="weekly-assignments-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading assignments...</p>
        </div>
      </div>
    );
  }

  const overallProgress = calculateOverallProgress();

  return (
    <div className="weekly-assignments-page">
      {/* Header Section */}
      <div className="assignments-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Course
        </button>
        <div className="header-content">
          <h1 className="course-title">{courseName}</h1>
          <p className="course-subtitle">Weekly Assignments - 7 Week Course</p>
        </div>
      </div>

      {/* Progress Overview Card */}
      <div className="progress-overview-card">
        <div className="progress-header">
          <h2>📊 Your Progress</h2>
          <div className="progress-stats">
            <span className="stat-badge">
              {submissions.length}/7 Completed
            </span>
            <span className="progress-percentage">{overallProgress}%</span>
          </div>
        </div>
        
        <div className="progress-bar-container">
          <div className="progress-bar-track">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${overallProgress}%` }}
            >
              <span className="progress-label">{overallProgress}% Complete</span>
            </div>
          </div>
        </div>

        <div className="progress-milestones">
          {weeksStructure.map(week => (
            <div 
              key={week.week} 
              className={`milestone ${getAssignmentStatus(week.week).status === 'Submitted' ? 'completed' : ''}`}
            >
              <div className="milestone-marker">
                {getAssignmentStatus(week.week).status === 'Submitted' ? '✓' : week.week}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Announcements Banner */}
      <div className="announcements-banner">
        <div className="announcement-icon">📢</div>
        <div className="announcement-text">
          <strong>Important:</strong> All assignments must be completed before the due date. 
          Late submissions will not be accepted.
        </div>
      </div>

      {/* Weekly Assignments Grid */}
      <div className="assignments-grid-container">
        <div className="assignments-grid">
          {weeksStructure.map(week => {
            const status = getAssignmentStatus(week.week);
            const assignment = weeklyAssignments.find(a => 
              a.Title?.includes(`Week 0${week.week}`) || a.Title?.includes(`Week ${week.week}`)
            );
            const isExpanded = expandedWeek === week.week;
            const weekVideos = aiVideos[week.week] || [];
            const weekQuestions = aiQuestions[week.week] || [];
            const weekMaterials = studyMaterials[week.week];
            const isLoadingContent = loadingContent[week.week];

            return (
              <div key={week.week} className={`assignment-card ${isExpanded ? 'expanded' : ''}`}>
                <div className="assignment-card-header" style={{ borderLeftColor: status.color }}>
                  <div className="week-badge" style={{ background: status.color }}>
                    Week {week.week}
                  </div>
                  <div className="status-badge" style={{ background: `${status.color}20`, color: status.color }}>
                    <span className="status-icon">{status.icon}</span>
                    {status.status}
                  </div>
                </div>

                <div className="assignment-card-body">
                  <h3 className="assignment-title">{week.title}</h3>
                  <p className="assignment-topics">
                    <strong>📚 Topics:</strong> {week.topics}
                  </p>
                  <p className="assignment-description">{week.description}</p>

                  <div className="assignment-meta">
                    <div className="meta-item">
                      <span className="meta-label">📅 Release:</span>
                      <span className="meta-value">{new Date(week.releaseDate).toLocaleDateString()}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">⏰ Due:</span>
                      <span className="meta-value">{new Date(week.dueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">🎯 Marks:</span>
                      <span className="meta-value">{week.marks}</span>
                    </div>
                  </div>

                  {status.status === 'Submitted' && (
                    <div className="submission-info">
                      <div className="score-display">
                        <span className="score-label">Your Score:</span>
                        <span className="score-value">{status.score}/{week.marks}</span>
                      </div>
                      <div className="submission-date">
                        Submitted on: {status.submittedOn}
                      </div>
                    </div>
                  )}

                  {/* Expandable Content Section */}
                  {isExpanded && (
                    <div className="expanded-content">
                      {isLoadingContent ? (
                        <div className="loading-content">
                          <div className="spinner-small"></div>
                          <p>Loading AI-generated content...</p>
                        </div>
                      ) : (
                        <>
                          {/* Study Materials */}
                          {weekMaterials && (
                            <div className="study-materials-section">
                              <h4 className="section-heading">📖 Study Materials</h4>
                              <p className="materials-summary">{weekMaterials.summary}</p>
                              
                              <div className="learning-objectives">
                                <h5>🎯 Learning Objectives:</h5>
                                <ul>
                                  {weekMaterials.learningObjectives.map((obj, idx) => (
                                    <li key={idx}>{obj}</li>
                                  ))}
                                </ul>
                              </div>

                              <div className="key-points">
                                <h5>✨ Key Points:</h5>
                                <ul>
                                  {weekMaterials.keyPoints.map((point, idx) => (
                                    <li key={idx}>{point}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}

                          {/* AI-Generated Videos */}
                          {weekVideos.length > 0 && (
                            <div className="ai-videos-section">
                              <h4 className="section-heading">🎥 Recommended Video Lectures</h4>
                              <div className="videos-grid">
                                {weekVideos.map((video, idx) => (
                                  <div key={idx} className="video-card-compact">
                                    <div className="video-thumbnail">
                                      <img src={video.thumbnail} alt={video.title} />
                                      <div className="video-duration">{video.duration}</div>
                                      <div className="play-overlay">▶️</div>
                                    </div>
                                    <div className="video-info">
                                      <h5 className="video-title">{video.title}</h5>
                                      <p className="video-description">{video.description}</p>
                                      <div className="video-meta">
                                        <span className="difficulty-badge">{video.difficulty}</span>
                                        <div className="video-tags">
                                          {video.tags.map((tag, tagIdx) => (
                                            <span key={tagIdx} className="tag">{tag}</span>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* AI-Generated Questions Preview */}
                          {weekQuestions.length > 0 && (
                            <div className="ai-questions-section">
                              <h4 className="section-heading">❓ Sample Questions (AI Generated)</h4>
                              <div className="questions-preview">
                                {weekQuestions.slice(0, 3).map((question, idx) => (
                                  <div key={idx} className="question-preview-card">
                                    <div className="question-header">
                                      <span className="question-type-badge">{question.type}</span>
                                      <span className="question-marks">{question.marks} marks</span>
                                    </div>
                                    <p className="question-text">{question.question}</p>
                                    {question.type === 'MCQ' && question.options && (
                                      <div className="options-preview">
                                        {question.options.slice(0, 2).map((opt, optIdx) => (
                                          <div key={optIdx} className="option-preview">{opt}</div>
                                        ))}
                                        <span className="more-options">... and {question.options.length - 2} more options</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                                <p className="preview-note">
                                  💡 This is a preview. Full {weekQuestions.length} questions available when you start the assignment.
                                </p>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="assignment-card-footer">
                  <div className="footer-actions">
                    {status.status === 'Submitted' ? (
                      <button 
                        className="action-button completed"
                        onClick={() => handleStartAssignment(week.week)}
                      >
                        <span className="button-icon">👁️</span>
                        View Submission
                      </button>
                    ) : status.status === 'Not Available' ? (
                      <button className="action-button disabled" disabled>
                        <span className="button-icon">🔒</span>
                        Not Available
                      </button>
                    ) : status.status === 'Overdue' ? (
                      <button className="action-button overdue" disabled>
                        <span className="button-icon">⚠️</span>
                        Overdue
                      </button>
                    ) : (
                      <button 
                        className="action-button start"
                        onClick={() => handleStartAssignment(week.week)}
                      >
                        <span className="button-icon">▶️</span>
                        Start Assignment
                      </button>
                    )}
                    
                    <button 
                      className="action-button expand"
                      onClick={() => handleExpandWeek(week.week)}
                    >
                      <span className="button-icon">{isExpanded ? '🔼' : '🔽'}</span>
                      {isExpanded ? 'Hide' : 'View'} Content
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Footer */}
      <div className="assignments-summary">
        <div className="summary-card">
          <h3>📈 Performance Summary</h3>
          <div className="summary-stats">
            <div className="summary-stat">
              <span className="stat-number">{submissions.length}</span>
              <span className="stat-label">Completed</span>
            </div>
            <div className="summary-stat">
              <span className="stat-number">{7 - submissions.length}</span>
              <span className="stat-label">Pending</span>
            </div>
            <div className="summary-stat">
              <span className="stat-number">{overallProgress}%</span>
              <span className="stat-label">Progress</span>
            </div>
            <div className="summary-stat">
              <span className="stat-number">
                {submissions.length > 0 
                  ? Math.round(submissions.reduce((sum, s) => sum + (s.Score || 0), 0) / submissions.length)
                  : 0
                }
              </span>
              <span className="stat-label">Avg Score</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyAssignments;
