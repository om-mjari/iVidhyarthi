import React, { useEffect, useMemo, useState, useCallback } from 'react';
import './Auth.css';

// Security CSS to prevent text selection and enhance security
const securityStyles = {
  userSelect: 'none',
  webkitUserSelect: 'none',
  MozUserSelect: 'none',
  msUserSelect: 'none',
  KhtmlUserSelect: 'none',
  webkitTouchCallout: 'none',
  webkitUserDrag: 'none',
  khtmlUserSelect: 'none',
  userSelect: 'none',
  pointerEvents: 'auto',
  webkitTapHighlightColor: 'transparent',
};

// Function to detect dev tools
const isDevToolsOpen = () => {
  const widthThreshold = window.outerWidth - window.innerWidth > 160;
  const heightThreshold = window.outerHeight - window.innerHeight > 160;
  return widthThreshold || heightThreshold;
};

// Function to prevent context menu
const preventContextMenu = (e) => {
  e.preventDefault();
  return false;
};

// Function to prevent keyboard shortcuts
const preventShortcuts = (e) => {
  // Block F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U, Ctrl+S, PrintScreen, etc.
  if (
    e.keyCode === 123 || // F12
    (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) || // Ctrl+Shift+I/J/C
    (e.ctrlKey && (e.keyCode === 85 || e.keyCode === 83 || e.keyCode === 80)) || // Ctrl+U/S/P
    (e.key === 'PrintScreen') ||
    (e.altKey && e.key === 'PrintScreen')
  ) {
    e.preventDefault();
    e.returnValue = false;
    return false;
  }
  return true;
};

// Function to show warning when user tries to take a screenshot (Windows + Shift + S or other methods)
const showScreenshotWarning = (e) => {
  if (e.key === 'PrintScreen' || (e.ctrlKey && e.shiftKey && e.key === 'S')) {
    alert('⚠️ Screenshots are disabled during the quiz for security reasons.');
    e.preventDefault();
    e.returnValue = false;
    return false;
  }
};

const LecturerEligibility = ({ onCancel }) => {
  const seed = useMemo(() => Math.random().toString(36).slice(2), []);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [isEligible, setIsEligible] = useState(null);
  const [meta, setMeta] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('lecturer_pending_quiz')) || {};
      // Ensure we have required fields with fallbacks
      return {
        id: stored.id || `temp_${Date.now()}`,
        name: stored.name || 'Lecturer',
        email: stored.email || 'lecturer@example.com',
        specialization: stored.specialization || 'Computer Science',
        ...stored
      };
    } catch {
      return {
        id: `temp_${Date.now()}`,
        name: 'Lecturer',
        email: 'lecturer@example.com',
        specialization: 'Computer Science'
      };
    }
  });
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  const [revealed, setRevealed] = useState({}); // qid -> true when first choice picked
  const [submitting, setSubmitting] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking'); // 'checking', 'available', 'unavailable'

  // Add security event listeners
  useEffect(() => {
    // Prevent right-click
    document.addEventListener('contextmenu', preventContextMenu);

    // Prevent keyboard shortcuts
    document.addEventListener('keydown', preventShortcuts);
    document.addEventListener('keydown', showScreenshotWarning);

    // Prevent drag and drop
    document.addEventListener('dragstart', (e) => e.preventDefault());

    // Prevent text selection
    document.addEventListener('selectstart', (e) => {
      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        return false;
      }
    });

    // Detect dev tools
    const checkDevTools = setInterval(() => {
      if (isDevToolsOpen()) {
        alert('⚠️ Developer tools are not allowed during the quiz. The page will now reload.');
        handleSubmit(); // Auto-submit if dev tools detected
      }
    }, 1000);

    // Handle tab switching - DISABLED
    // const handleVisibilityChange = () => {
    //   if (document.hidden) {
    //     const newCount = tabSwitchCount + 1;
    //     setTabSwitchCount(newCount);

    //     if (newCount > 2) {
    //       // Auto-submit the quiz if switched tabs more than twice
    //       alert('⚠️ You have switched tabs too many times. Submitting your quiz automatically.');
    //       handleSubmit();
    //     } else {
    //       alert(`⚠️ Warning: Tab switching is not allowed. ${3 - newCount} attempts remaining.`);
    //     }
    //   }
    // };

    // document.addEventListener('visibilitychange', handleVisibilityChange); // DISABLED

    // Prevent page navigation - DISABLED
    // const handleBeforeUnload = (e) => {
    //   e.preventDefault();
    //   e.returnValue = 'Are you sure you want to leave? Your progress will be lost.';
    //   return e.returnValue;
    // };

    // window.addEventListener('beforeunload', handleBeforeUnload); // DISABLED

    // Cleanup function to remove event listeners
    return () => {
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('keydown', preventShortcuts);
      document.removeEventListener('keydown', showScreenshotWarning);
      document.removeEventListener('dragstart', (e) => e.preventDefault());
      document.removeEventListener('selectstart', (e) => e.preventDefault());
      // document.removeEventListener('visibilitychange', handleVisibilityChange); // DISABLED
      // window.removeEventListener('beforeunload', handleBeforeUnload); // DISABLED
      clearInterval(checkDevTools);
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      const count = 10; // could be 10 or 15 based on specialization, keep 10 for now
      try {
        const res = await fetch('http://localhost:5000/api/auth/lecturer/quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ specialization: meta.specialization || 'Computer Science', numQuestions: count, seed }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed to load quiz');
        setQuestions(data.data.questions || []);
        setBackendStatus('available');
      } catch (e) {
        console.warn('Backend not available, using fallback questions:', e);
        setBackendStatus('unavailable');
        // Use fallback questions if backend is not available
        setQuestions([
          {
            id: 1,
            q: "HTTP is stateless. What maintains sessions?",
            options: ["IP", "UDP", "Cookies", "ICMP"],
            answer: 2
          },
          {
            id: 2,
            q: "Gradient descent is used for?",
            options: ["Optimization", "Sorting", "Compilation", "Routing"],
            answer: 0
          },
          {
            id: 3,
            q: "Which model is best for changing requirements?",
            options: ["Waterfall", "V-Model", "Spiral", "Big Bang"],
            answer: 2
          },
          {
            id: 4,
            q: "Mutex is used for?",
            options: ["Scheduling", "Mutual exclusion", "Deadlock detection", "Paging"],
            answer: 1
          },
          {
            id: 5,
            q: "Big-O of traversing a linked list of n?",
            options: ["O(log n)", "O(n)", "O(1)", "O(n log n)"],
            answer: 1
          },
          {
            id: 6,
            q: "TCP works at which OSI layer?",
            options: ["Transport", "Session", "Network", "Application"],
            answer: 0
          },
          {
            id: 7,
            q: "Which data structure for BFS?",
            options: ["Stack", "Queue", "Heap", "Tree"],
            answer: 1
          },
          {
            id: 8,
            q: "What is the time complexity of binary search?",
            options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
            answer: 1
          },
          {
            id: 9,
            q: "Which is NOT a sorting algorithm?",
            options: ["Quick Sort", "Merge Sort", "Bubble Sort", "Binary Search"],
            answer: 3
          },
          {
            id: 10,
            q: "What does SQL stand for?",
            options: ["Structured Query Language", "Simple Query Language", "Standard Query Language", "System Query Language"],
            answer: 0
          }
        ]);
      }
    };
    load();
  }, [meta.specialization, seed]);

  const handleSelect = (qid, optionIndex) => {
    // If already answered, ignore further changes
    if (revealed[qid]) return;
    setAnswers(prev => ({ ...prev, [qid]: optionIndex }));
    setRevealed(prev => ({ ...prev, [qid]: true }));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      // Debug logging
      console.log('Submitting quiz with meta:', meta);
      console.log('Answers:', answers);
      console.log('Questions count:', questions.length);

      // Validate required data
      if (!meta.id) {
        throw new Error('User ID is missing. Please try logging in again.');
      }

      const orderedAnswers = questions.map(q => answers[q.id] ?? -1);
      console.log('Ordered answers:', orderedAnswers);

      // Calculate score
      const total = questions.length;
      const correctCount = questions.reduce((acc, q) => acc + (answers[q.id] === q.answer ? 1 : 0), 0);
      const required = Math.ceil(total * 0.6); // 60% required to pass
      const passed = correctCount >= required;

      // Set eligibility
      setIsEligible(passed);

      if (passed) {
        // Store eligibility and user data in localStorage
        localStorage.setItem('lecturer_eligible', 'true');
        localStorage.setItem('lecturer_data', JSON.stringify({
          id: meta.id,
          name: meta.name,
          email: meta.email,
          specialization: meta.specialization
        }));
        setCelebration('pass');
        // Remove event listener before redirecting to prevent tab switch warnings
        // window.removeEventListener('visibilitychange', handleVisibilityChange); // DISABLED
        // Redirect to Login page
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      } else {
        // Clear any previous eligibility
        localStorage.removeItem('lecturer_eligible');
        localStorage.removeItem('lecturer_data');
        setCelebration('fail');
        // Remove event listener before showing message
        // window.removeEventListener('visibilitychange', handleVisibilityChange); // DISABLED
        // Show fail message - handled by celebration modal
      }

      // Try to submit to backend first
      try {
        const res = await fetch('http://localhost:5000/api/auth/lecturer/quiz/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: meta.id, answers: orderedAnswers, specialization: meta.specialization, seed }),
        });

        if (!res.ok) {
          throw new Error(`Server error: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Submission failed');

        // Process backend response
        if (data.data.passed) {
          setCelebration('pass');
          setTimeout(() => {
            // Store eligibility status and redirect to login
            localStorage.setItem('lecturer_eligible', JSON.stringify({
              id: meta.id,
              name: meta.name,
              email: meta.email,
              specialization: meta.specialization,
              passed: true
            }));
            window.location.href = '/login';
          }, 1500);
        } else {
          setCelebration('fail');
          // Show fail message - handled by celebration modal, no auto-redirect
        }
        return;
      } catch (backendError) {
        console.warn('Backend submission failed, using fallback logic:', backendError);

        // Fallback: Calculate result locally
        const correctAnswers = questions.reduce((acc, q) => {
          return acc + (answers[q.id] === q.answer ? 1 : 0);
        }, 0);

        const passed = correctAnswers >= required;

        if (passed) {
          setCelebration('pass');
          setTimeout(() => {
            // Store eligibility status and redirect to login
            localStorage.setItem('lecturer_eligible', JSON.stringify({
              id: meta.id,
              name: meta.name,
              email: meta.email,
              specialization: meta.specialization,
              passed: true
            }));
            window.location.href = '/login';
          }, 1500);
        } else {
          setCelebration('fail');
          // Show fail message - handled by celebration modal, no auto-redirect
        }
        return;
      }
    } catch (e) {
      console.error('Quiz submission error:', e);
      setError(`Failed to submit quiz: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const total = questions.length;
  const correctCount = questions.reduce((acc, q) => acc + (answers[q.id] === q.answer ? 1 : 0), 0);
  const wrongCount = Object.keys(answers).length - correctCount;
  // Passing rule: 10->5, 15->7, otherwise 50%
  const required = total === 5 ? 10 : total === 7 ? 15 : Math.ceil(total * 0.5);

  const [celebration, setCelebration] = useState('');

  return (
    <div
      className="eligibility-page auth-wrap"
      style={securityStyles}
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
    >
      <div className="auth-card">
        <div className="auth-form-area" style={{ width: '100%' }}>
          <h2>Lecturer Eligibility Test</h2>
          <p className="subtitle">Specialization: <b>{meta.specialization || 'Computer Science'}</b> • Answer at least {required} of {total} correctly • Selected: {Object.keys(answers).length} • Correct: {correctCount} • Wrong: {wrongCount}</p>

          {backendStatus === 'unavailable' && (
            <div style={{ background: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
              <strong>⚠️ Backend server is not available.</strong>
              <br />
              Using offline mode - quiz will be evaluated locally.
            </div>
          )}

          {Object.keys(answers).length < total && (
            <div style={{ background: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
              <strong>⚠️ Please answer all {total} questions before submitting.</strong>
              <br />
              You have answered {Object.keys(answers).length} out of {total} questions.
            </div>
          )}

          {error && <div className="msg error" role="alert">{error}</div>}
          {isEligible === false && (
            <div className="msg error" style={{ marginTop: '1rem' }}>
              You are not eligible to access the Lecturer Dashboard. Please contact support if you believe this is an error.
            </div>
          )}

          <div style={{ display: 'grid', gap: '12px' }}>
            {questions.map((q) => (
              <div
                key={q.id}
                className={`question-card ${answers[q.id] !== undefined ? 'answered' : ''}`}
                style={securityStyles}
                onContextMenu={(e) => e.preventDefault()}
              >
                <div style={{ fontWeight: 700, marginBottom: 8 }}>{q.q}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                  {q.options.map((opt, i) => (
                    <div
                      key={i}
                      className={`option ${answers[q.id] === i ? 'selected' : ''} ${revealed[q.id] ? (q.answer === i ? 'correct' : answers[q.id] === i ? 'wrong' : '') : ''}`}
                      onClick={() => handleSelect(q.id, i)}
                      style={securityStyles}
                      onContextMenu={(e) => e.preventDefault()}
                    >
                      <input
                        type="radio"
                        name={`q_${q.id}`}
                        style={{ marginRight: 8 }}
                        onChange={() => handleSelect(q.id, i)}
                        checked={answers[q.id] === i}
                        disabled={revealed[q.id]}
                      />
                      {opt}
                      {revealed[q.id] && answers[q.id] === i && answers[q.id] !== q.answer && (
                        <span style={{ marginLeft: 8, color: '#ef4444', fontWeight: 700 }}>✕ Wrong</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button type="button" className="link" onClick={onCancel}>Cancel</button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || Object.keys(answers).length < total}
              style={{
                marginLeft: 'auto',
                background: Object.keys(answers).length < total ? '#ccc' : '#10b981',
                color: '#fff',
                border: 'none',
                padding: '10px 16px',
                borderRadius: 8,
                fontWeight: 700,
                cursor: Object.keys(answers).length < total ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? 'Submitting...' : Object.keys(answers).length < total ? `Answer ${total - Object.keys(answers).length} more questions` : 'Submit Quiz'}
            </button>
          </div>
          {celebration && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
              <div style={{ background: '#fff', borderRadius: 16, padding: 24, textAlign: 'center', width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
                {celebration === 'pass' ? (
                  <>
                    <div style={{ fontSize: 64, marginBottom: 12 }}>🎉</div>
                    <h3 style={{ margin: 0 }}>Eligible!</h3>
                    <p>You passed the test. Redirecting to login...</p>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 64, marginBottom: 12 }}>😔</div>
                    <h3 style={{ margin: 0 }}>Not Eligible</h3>
                    <p>You are not eligible. Please give the test again.</p>
                    <button
                      onClick={() => window.location.href = '/'}
                      style={{
                        marginTop: '16px',
                        background: '#3b82f6',
                        color: '#fff',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      Back to Home Page
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div >
  );
};

export default LecturerEligibility;