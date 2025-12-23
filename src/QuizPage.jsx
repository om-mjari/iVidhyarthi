import React, { useState, useEffect, useRef } from 'react';
import './QuizPage.css';
import Notification from './components/Notification';

const QuizPage = ({ quiz, courseId, weekNumber, onBack, onComplete }) => {
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(50 * 60); // 50 minutes in seconds
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [studentId, setStudentId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [warningShown, setWarningShown] = useState(false);
  const tabSwitchRef = useRef(0);
  const [isPassed, setIsPassed] = useState(false);
  const [percentage, setPercentage] = useState(0);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // Get student ID from localStorage
    const authUser = localStorage.getItem('auth_user');
    if (authUser) {
      try {
        const user = JSON.parse(authUser);
        setStudentId(user.id || user._id);
      } catch (e) {
        console.error('Error parsing auth_user:', e);
      }
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!quizStarted || !timeLeft || showResults || submitting) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, timeLeft, showResults, submitting]);

  // Tab switching & screenshot detection
  useEffect(() => {
    if (!quizStarted || showResults) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        tabSwitchRef.current += 1;

        if (tabSwitchRef.current === 1 && !warningShown) {
          setWarningShown(true);
          setNotification({
            message: '⚠️ WARNING: Tab switching is not allowed! If you switch again, your quiz will be auto-submitted.',
            type: 'warning'
          });
        } else if (tabSwitchRef.current >= 2) {
          setNotification({ message: '🚫 Quiz auto-submitted due to multiple tab switches!', type: 'error' });
          handleSubmit(true);
        }
      }
    };

    const handleKeyDown = (e) => {
      // Prevent screenshot shortcuts
      if (
        (e.key === 'PrintScreen') ||
        (e.ctrlKey && e.shiftKey && e.key === 'S') ||
        (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key))
      ) {
        e.preventDefault();
        setNotification({ message: '🚫 Screenshots are not allowed during the quiz!', type: 'error' });
        return false;
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [quizStarted, showResults, warningShown]);

  const handleAnswerSelect = (questionId, optionIndex) => {
    setAnswers({
      ...answers,
      [questionId]: optionIndex,
    });
  };

  const handleNext = () => {
    if (currentQuestion < quiz.Questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateScore = () => {
    let totalScore = 0;
    quiz.Questions.forEach((question) => {
      const studentAnswer = answers[question.question_id];
      if (studentAnswer === question.correct_answer) {
        totalScore += question.marks;
      }
    });
    return totalScore;
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (submitting) return;

    if (!autoSubmit && Object.keys(answers).length < quiz.Questions.length) {
      if (!window.confirm('You haven\'t answered all questions. Submit anyway?')) {
        return;
      }
    }

    setSubmitting(true);

    try {
      const timeSpent = (50 * 60) - timeLeft;
      const authToken = localStorage.getItem('auth_token');

      const attemptData = {
        studentId: studentId,
        courseId: courseId,
        quizId: quiz.Quiz_Id,
        answers: answers,
      };

      console.log('📤 Submitting Quiz:', attemptData);

      const response = await fetch('http://localhost:5000/api/auto-quiz/attempt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(attemptData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit quiz');
      }

      const result = await response.json();

      console.log('Quiz submission result:', result);

      setScore(result.score);
      setPercentage(result.percentage);
      setIsPassed(result.isPassed);
      setShowResults(true);

      if (result.isPassed) {
        setNotification({
          message: `🎉 Congratulations! You PASSED! Score: ${result.score}/${result.totalMarks} (${result.percentage}%)`,
          type: 'success'
        });
      } else {
        setNotification({
          message: `❌ You did not pass. Score: ${result.score}/${result.totalMarks} (${result.percentage}%). Need 70% to pass.`,
          type: 'error'
        });
      }
    } catch (error) {
      console.error('❌ Error submitting quiz:', error);
      setNotification({ message: 'Error submitting quiz: ' + error.message, type: 'error' });
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!quiz) {
    return (
      <div className="quiz-page">
        <div className="quiz-loading">Loading quiz...</div>
      </div>
    );
  }

  // Quiz Start Screen
  if (!quizStarted) {
    return (
      <div className="quiz-page quiz-start-page">
        <div className="quiz-start-container">
          <div className="quiz-start-header">
            <h1>📝 {quiz.Title}</h1>
            <p className="quiz-description">{quiz.Description}</p>
          </div>

          <div className="quiz-instructions">
            <h2>📋 Instructions</h2>
            <ul>
              <li>⏱️ <strong>Time Limit:</strong> 50 minutes</li>
              <li>❓ <strong>Total Questions:</strong> {quiz.Total_Questions}</li>
              <li>✅ <strong>Passing Score:</strong> 70%</li>
              <li>🚫 <strong>No Tab Switching:</strong> First time = Warning, Second time = Auto-submit</li>
              <li>📸 <strong>No Screenshots:</strong> Not allowed during the quiz</li>
              <li>⚠️ <strong>Auto-Submit:</strong> Quiz will auto-submit when timer reaches 0</li>
              <li>💾 <strong>Save Progress:</strong> Your answers are saved as you go</li>
            </ul>
          </div>

          <div className="quiz-start-actions">
            <button className="btn-back" onClick={onBack}>
              ← Cancel
            </button>
            <button
              className="btn-start-quiz"
              onClick={() => setQuizStarted(true)}
            >
              Start Quiz 🚀
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="quiz-page quiz-results-page">
        <div className="results-container">
          <div className="results-header">
            <h1>{isPassed ? '🎉 Congratulations!' : '❌ Quiz Completed'}</h1>
            <p>{quiz.Title}</p>
          </div>

          <div className="results-score">
            <div className={`score-circle ${isPassed ? 'passed' : 'failed'}`}>
              <div className="score-percentage">{percentage}%</div>
              <div className="score-details">{score} / {quiz.Total_Marks}</div>
              <div className="pass-status">{isPassed ? 'PASSED' : 'FAILED'}</div>
            </div>
          </div>

          <div className="results-stats">
            <div className="stat-item">
              <span className="stat-label">Questions Answered</span>
              <span className="stat-value">{Object.keys(answers).length} / {quiz.Total_Questions}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Time Spent</span>
              <span className="stat-value">{formatTime((50 * 60) - timeLeft)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Result</span>
              <span className="stat-value">{isPassed ? 'Certificate Issued ✅' : 'Try Again'}</span>
            </div>
          </div>

          {isPassed && (
            <div className="certificate-notice">
              <p>🎓 Your certificate has been generated and sent to your email!</p>
            </div>
          )}

          <button className="back-to-course-btn" onClick={onBack}>
            ← Back to Course
          </button>
        </div>
      </div>
    );
  }

  const question = quiz.Questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.Questions.length) * 100;

  return (
    <div className="quiz-page">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      <div className="quiz-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1>{quiz.Title}</h1>
        <div className="quiz-timer">
          <span className="timer-icon">⏱️</span>
          <span className="timer-value">{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="quiz-progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="quiz-container">
        <div className="question-info">
          <span className="question-number">Question {currentQuestion + 1} of {quiz.Total_Questions}</span>
          <span className="question-marks">{question.marks} Marks</span>
        </div>

        <div className="question-text">
          <h2>{question.question}</h2>
        </div>

        <div className="options-container">
          {question.options.map((option, index) => (
            <div
              key={index}
              className={`option-card ${answers[question.question_id] === index ? 'selected' : ''}`}
              onClick={() => handleAnswerSelect(question.question_id, index)}
            >
              <div className="option-radio">
                {answers[question.question_id] === index && <div className="radio-dot"></div>}
              </div>
              <div className="option-text">
                <span className="option-label">{String.fromCharCode(65 + index)}.</span>
                {option}
              </div>
            </div>
          ))}
        </div>

        <div className="question-navigation">
          <button
            className="nav-btn prev-btn"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            ← Previous
          </button>

          <div className="question-indicators">
            {quiz.Questions.map((_, index) => (
              <div
                key={index}
                className={`indicator ${index === currentQuestion ? 'current' : ''} ${answers[index + 1] !== undefined ? 'answered' : ''}`}
                onClick={() => setCurrentQuestion(index)}
              >
                {index + 1}
              </div>
            ))}
          </div>

          {currentQuestion < quiz.Questions.length - 1 ? (
            <button className="nav-btn next-btn" onClick={handleNext}>
              Next →
            </button>
          ) : (
            <button
              className="nav-btn submit-btn"
              onClick={() => handleSubmit(false)}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
