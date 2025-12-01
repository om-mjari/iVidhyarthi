import React, { useState, useEffect } from 'react';
import './QuizPage.css';

const QuizPage = ({ quiz, courseId, weekNumber, onBack, onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(quiz?.Time_Limit * 60 || 1800); // Convert minutes to seconds
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [studentId, setStudentId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

  useEffect(() => {
    // Timer countdown
    if (timeLeft > 0 && !showResults) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showResults) {
      // Auto-submit when time is up
      handleSubmit(true);
    }
  }, [timeLeft, showResults]);

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
    if (!autoSubmit && Object.keys(answers).length < quiz.Questions.length) {
      if (!window.confirm('You haven\'t answered all questions. Submit anyway?')) {
        return;
      }
    }

    setSubmitting(true);

    try {
      const finalScore = calculateScore();
      const timeSpent = (quiz.Time_Limit * 60) - timeLeft;

      const attemptData = {
        Quiz_Id: quiz.Quiz_Id,
        Student_Id: studentId,
        Course_Id: courseId,
        Week_Number: weekNumber,
        Answers: answers,
        Time_Spent: timeSpent,
      };

      console.log('📤 Submitting Quiz:', attemptData);

      const response = await fetch('http://localhost:5000/api/quiz/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attemptData),
      });

      const result = await response.json();

      if (result.success) {
        setScore(result.data.score);
        setShowResults(true);
        console.log('✅ Quiz submitted successfully!');
        if (onComplete) onComplete(result.data.score);
      } else {
        alert('Failed to submit quiz: ' + result.message);
      }
    } catch (error) {
      console.error('❌ Error submitting quiz:', error);
      alert('Error submitting quiz. Please try again.');
    } finally {
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

  if (showResults) {
    const percentage = Math.round((score / quiz.Total_Marks) * 100);
    
    return (
      <div className="quiz-page quiz-results-page">
        <div className="results-container">
          <div className="results-header">
            <h1>🎉 Quiz Completed!</h1>
            <p>{quiz.Title}</p>
          </div>

          <div className="results-score">
            <div className="score-circle">
              <div className="score-percentage">{percentage}%</div>
              <div className="score-details">{score} / {quiz.Total_Marks}</div>
            </div>
          </div>

          <div className="results-stats">
            <div className="stat-item">
              <span className="stat-label">Questions Answered</span>
              <span className="stat-value">{Object.keys(answers).length} / {quiz.Total_Questions}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Time Spent</span>
              <span className="stat-value">{formatTime((quiz.Time_Limit * 60) - timeLeft)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Performance</span>
              <span className="stat-value">{percentage >= 80 ? 'Excellent' : percentage >= 60 ? 'Good' : percentage >= 40 ? 'Fair' : 'Needs Improvement'}</span>
            </div>
          </div>

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
