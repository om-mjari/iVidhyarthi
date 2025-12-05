import React, { useState, useEffect } from 'react';
import './AssignmentViewer.css';

const AssignmentViewer = ({ 
  assignment, 
  onBack, 
  studentId, 
  totalAssignments, 
  submittedCount,
  onSubmissionComplete 
}) => {
  // Submission form states
  const [learningAnswer, setLearningAnswer] = useState('');
  const [challengeAnswer, setChallengeAnswer] = useState('');
  const [applicationAnswer, setApplicationAnswer] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [textSubmission, setTextSubmission] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionData, setSubmissionData] = useState(null);

  // Word count states
  const [learningWordCount, setLearningWordCount] = useState(0);
  const [challengeWordCount, setChallengeWordCount] = useState(0);
  const [applicationWordCount, setApplicationWordCount] = useState(0);

  // Check if assignment is past due date
  const isPastDueDate = new Date() > new Date(assignment.Due_Date);
  const progressPercentage = totalAssignments > 0 ? ((submittedCount / totalAssignments) * 100).toFixed(1) : 0;

  // Word counter function
  const countWords = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Update word counts
  useEffect(() => {
    setLearningWordCount(countWords(learningAnswer));
  }, [learningAnswer]);

  useEffect(() => {
    setChallengeWordCount(countWords(challengeAnswer));
  }, [challengeAnswer]);

  useEffect(() => {
    setApplicationWordCount(countWords(applicationAnswer));
  }, [applicationAnswer]);

  // Check if submission is already made
  useEffect(() => {
    fetchSubmissionStatus();
  }, [assignment.Assignment_Id, studentId]);

  const fetchSubmissionStatus = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/submissions/student/${studentId}`
      );
      const result = await response.json();

      if (result.success && result.data) {
        const submission = result.data.find(
          s => s.Assignment_Id === assignment.Assignment_Id
        );
        
        if (submission) {
          setIsSubmitted(true);
          setSubmissionData(submission);
          
          // Pre-fill the form with submission data if available
          if (submission.Submission_Data) {
            setLearningAnswer(submission.Submission_Data.learningAnswer || '');
            setChallengeAnswer(submission.Submission_Data.challengeAnswer || '');
            setApplicationAnswer(submission.Submission_Data.applicationAnswer || '');
            setTextSubmission(submission.Submission_Data.textSubmission || '');
            
            // If there's an uploaded file, show its info
            if (submission.Submission_Data.uploadedFile) {
              setUploadedFile({
                name: submission.Submission_Data.uploadedFile.originalname,
                path: submission.Submission_Data.uploadedFile.path
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching submission status:', error);
    }
  };

  // Validation for submit button
  const canSubmit = () => {
    if (isPastDueDate || isSubmitted) return false;
    
    const hasValidAnswers = 
      learningWordCount >= 20 && 
      challengeWordCount >= 10 && 
      applicationWordCount >= 10;
    
    const hasContent = uploadedFile || textSubmission.trim().length > 0;
    
    return hasValidAnswers && hasContent;
  };

  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['application/pdf', 'text/plain', 'image/jpeg', 'image/png', 'image/jpg'];
      if (validTypes.includes(file.type)) {
        setUploadedFile(file);
      } else {
        alert('Please upload only PDF, Text, or Image files');
      }
    }
  };

  // Handle submission
  const handleSubmit = async () => {
    if (!canSubmit()) return;

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('Student_Id', studentId);
      formData.append('Assignment_Id', assignment.Assignment_Id);
      formData.append('Course_Id', assignment.Course_Id);
      
      const submissionContent = {
        learningAnswer,
        challengeAnswer,
        applicationAnswer,
        textSubmission
      };
      
      formData.append('Submission_Data', JSON.stringify(submissionContent));

      if (uploadedFile) {
        formData.append('file', uploadedFile);
      }

      const response = await fetch('http://localhost:5000/api/submissions/submit', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setIsSubmitted(true);
        setSubmissionData(result.data);
        alert('✅ Assignment submitted successfully!');
        
        // Notify parent component and redirect back
        if (onSubmissionComplete) {
          onSubmissionComplete();
        }
        
        // Redirect back to course page
        if (onBack) {
          setTimeout(() => onBack(), 1000);
        }
      } else {
        alert('❌ Failed to submit assignment. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      alert('❌ Error submitting assignment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="assignment-viewer-container">
      <div className="assignment-viewer-header">
        <button className="back-button" onClick={onBack}>
          <span className="back-icon">←</span> Back to Course
        </button>
      </div>

      <div className="assignment-viewer-content">
        {/* Assignment Content Section */}
        <div className="assignment-content-section">
          <div className="assignment-header-info">
            <h2 className="assignment-title-main">{assignment.Title}</h2>
            <div className="assignment-meta-info">
              <span className="meta-badge">
                <span className="badge-icon">📋</span>
                {assignment.Assignment_Type}
              </span>
              <span className="meta-badge">
                <span className="badge-icon">🎯</span>
                {assignment.Marks} Marks
              </span>
              <span className={`meta-badge ${isPastDueDate ? 'overdue' : ''}`}>
                <span className="badge-icon">📅</span>
                Due: {formatDate(assignment.Due_Date)}
              </span>
            </div>
          </div>

          <h3 className="section-title">📄 Assignment Description</h3>
          <div className="assignment-description-box">
            <p>{assignment.Description}</p>
          </div>

          {/* PDF or Task Display */}
          {assignment.File_URL && (
            <div className="assignment-pdf-viewer">
              <h4 className="subsection-title">📑 Assignment Material</h4>
              <button
                onClick={() => {
                  const url = assignment.File_URL.startsWith('http') 
                    ? assignment.File_URL 
                    : `http://localhost:5000${assignment.File_URL}`;
                  window.open(url, '_blank');
                }}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '20px'
                }}
              >
                📄 View Assignment PDF
              </button>
            </div>
          )}
        </div>

        {/* Submission Panel */}
        <div className="submission-panel">
          <h3 className="section-title">
            ✍️ Your Submission
            {isSubmitted && <span className="submitted-badge">✓ Submitted</span>}
          </h3>

          {isPastDueDate && !isSubmitted && (
            <div className="alert alert-warning">
              <span className="alert-icon">⚠️</span>
              <div className="alert-content">
                <strong>Submission Closed</strong>
                <p>The due date for this assignment has passed.</p>
              </div>
            </div>
          )}

          {isSubmitted && (
            <div className="alert alert-success">
              <span className="alert-icon">✓</span>
              <div className="alert-content">
                <strong>Successfully Submitted</strong>
                <p>Submitted on: {formatDate(submissionData?.Submitted_On)}</p>
              </div>
            </div>
          )}

          {/* Reflective Questions */}
          <div className="reflective-questions">
            <h4 className="subsection-title">Reflective Questions (Mandatory)</h4>

            {/* Question 1 */}
            <div className="question-box">
              <label className="question-label">
                1. What did you learn from this assignment? *
                <span className="word-requirement">(Minimum 20 words)</span>
              </label>
              <textarea
                className="question-textarea"
                value={learningAnswer}
                onChange={(e) => setLearningAnswer(e.target.value)}
                placeholder="Describe your key learnings and insights..."
                disabled={isPastDueDate || isSubmitted}
                rows={4}
              />
              <div className="word-counter">
                <span className={learningWordCount >= 20 ? 'valid' : 'invalid'}>
                  {learningWordCount} / 20 words
                  {learningWordCount >= 20 && ' ✓'}
                </span>
              </div>
            </div>

            {/* Question 2 */}
            <div className="question-box">
              <label className="question-label">
                2. What challenges did you face while completing this assignment? *
                <span className="word-requirement">(Minimum 10 words)</span>
              </label>
              <textarea
                className="question-textarea"
                value={challengeAnswer}
                onChange={(e) => setChallengeAnswer(e.target.value)}
                placeholder="Share the difficulties or obstacles you encountered..."
                disabled={isPastDueDate || isSubmitted}
                rows={3}
              />
              <div className="word-counter">
                <span className={challengeWordCount >= 10 ? 'valid' : 'invalid'}>
                  {challengeWordCount} / 10 words
                  {challengeWordCount >= 10 && ' ✓'}
                </span>
              </div>
            </div>

            {/* Question 3 */}
            <div className="question-box">
              <label className="question-label">
                3. How will you apply this learning in the real world? *
                <span className="word-requirement">(Minimum 10 words)</span>
              </label>
              <textarea
                className="question-textarea"
                value={applicationAnswer}
                onChange={(e) => setApplicationAnswer(e.target.value)}
                placeholder="Explain practical applications of your learning..."
                disabled={isPastDueDate || isSubmitted}
                rows={3}
              />
              <div className="word-counter">
                <span className={applicationWordCount >= 10 ? 'valid' : 'invalid'}>
                  {applicationWordCount} / 10 words
                  {applicationWordCount >= 10 && ' ✓'}
                </span>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <div className="upload-section">
            <h4 className="subsection-title">📎 Upload Your Work</h4>
            
            {isSubmitted && uploadedFile && uploadedFile.path ? (
              <div className="submitted-file-display">
                <div className="file-info">
                  <span className="file-icon">📄</span>
                  <div className="file-details">
                    <span className="file-name">{uploadedFile.name}</span>
                    <a 
                      href={`http://localhost:5000${uploadedFile.path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="view-file-link"
                    >
                      View Submitted File
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="upload-options">
                <div className="file-upload-box">
                  <label className="file-upload-label">
                    <input
                      type="file"
                      accept=".pdf,.txt,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      disabled={isPastDueDate || isSubmitted}
                      className="file-input"
                    />
                    <div className="file-upload-content">
                      <span className="upload-icon">📁</span>
                      <span className="upload-text">
                        {uploadedFile ? uploadedFile.name : 'Choose File'}
                      </span>
                      <span className="upload-hint">PDF, Text, or Image</span>
                    </div>
                  </label>
                </div>

                <div className="text-submission-box">
                  <label className="question-label">Or submit text:</label>
                  <textarea
                    className="question-textarea"
                    value={textSubmission}
                    onChange={(e) => setTextSubmission(e.target.value)}
                    placeholder="Type or paste your submission here..."
                    disabled={isPastDueDate || isSubmitted}
                    rows={6}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="submit-section">
            <button
              className={`submit-button ${canSubmit() ? 'active' : 'disabled'}`}
              onClick={handleSubmit}
              disabled={!canSubmit() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Submitting...
                </>
              ) : isSubmitted ? (
                <>
                  <span>✓</span>
                  Submitted
                </>
              ) : (
                <>
                  <span>📤</span>
                  Submit Assignment
                </>
              )}
            </button>

            {!canSubmit() && !isPastDueDate && !isSubmitted && (
              <p className="submit-hint">
                Complete all required questions and upload your work to enable submission
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentViewer;
