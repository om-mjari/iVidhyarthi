import React, { useState, useEffect } from 'react';
import './AssignmentPage.css';

const AssignmentPage = ({ assignment, onBack, onComplete }) => {
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [assignmentStarted, setAssignmentStarted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [answers, setAnswers] = useState({});
  const [studentId, setStudentId] = useState(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionAnimation, setSubmissionAnimation] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Comprehensive subject-specific configurations
  const subjectConfigurations = {
    'Cloud Computing': {
      videoId: 'RWgW-CgdIk0',
      videoTitle: 'Cloud Computing Fundamentals',
      color: '#4285F4',
      icon: '☁️',
      description: 'Master cloud computing concepts, deployment models, and service types',
      questions: [
        {
          id: 1,
          question: 'What is Cloud Computing?',
          type: 'mcq',
          options: [
            'A type of weather pattern used in meteorology',
            'On-demand delivery of IT resources over the internet with pay-as-you-go pricing',
            'A programming language for web development',
            'A local database management system'
          ],
          correctAnswer: 1,
          marks: 20,
          explanation: 'Cloud computing provides computing services including servers, storage, databases, networking, software over the internet.'
        },
        {
          id: 2,
          question: 'Which are the three main cloud service models?',
          type: 'mcq',
          options: [
            'HTTP, FTP, SMTP',
            'Windows, Linux, Mac OS',
            'IaaS, PaaS, SaaS',
            'HTML, CSS, JavaScript'
          ],
          correctAnswer: 2,
          marks: 20,
          explanation: 'IaaS (Infrastructure), PaaS (Platform), and SaaS (Software) are the three fundamental cloud service models.'
        },
        {
          id: 3,
          question: 'What does IaaS (Infrastructure as a Service) provide?',
          type: 'mcq',
          options: [
            'Only email services',
            'Virtualized computing resources like servers, storage, and networking',
            'Only antivirus software',
            'Social media platforms'
          ],
          correctAnswer: 1,
          marks: 20,
          explanation: 'IaaS provides fundamental computing infrastructure on-demand basis.'
        },
        {
          id: 4,
          question: 'Which cloud deployment model offers services exclusively to a single organization?',
          type: 'mcq',
          options: [
            'Public Cloud',
            'Private Cloud',
            'Hybrid Cloud',
            'Community Cloud'
          ],
          correctAnswer: 1,
          marks: 20,
          explanation: 'Private cloud is dedicated infrastructure for a single organization with enhanced security.'
        },
        {
          id: 5,
          question: 'List three major benefits of cloud computing.',
          type: 'text',
          correctAnswer: ['cost', 'scalability', 'flexibility', 'reliability', 'security'],
          marks: 20,
          explanation: 'Key benefits include cost efficiency, scalability, flexibility, and global accessibility.'
        }
      ]
    },
    'Internet of Things': {
      videoId: 'LlhmzVL5bm8',
      videoTitle: 'IoT Architecture and Applications',
      color: '#34A853',
      icon: '🔗',
      description: 'Explore IoT ecosystems, sensor networks, and communication protocols',
      questions: [
        {
          id: 1,
          question: 'What does IoT (Internet of Things) refer to?',
          type: 'mcq',
          options: [
            'Only smartphone applications',
            'Network of physical devices embedded with sensors and software to connect and exchange data',
            'A type of programming language',
            'Only wearable devices'
          ],
          correctAnswer: 1,
          marks: 20,
          explanation: 'IoT connects everyday physical objects to the internet for data collection and exchange.'
        },
        {
          id: 2,
          question: 'Which protocol is specifically designed for IoT lightweight messaging?',
          type: 'mcq',
          options: [
            'HTTP',
            'MQTT (Message Queuing Telemetry Transport)',
            'FTP',
            'SMTP'
          ],
          correctAnswer: 1,
          marks: 20,
          explanation: 'MQTT is optimized for small code footprint and minimal network bandwidth in IoT.'
        },
        {
          id: 3,
          question: 'What are the four main layers of IoT architecture?',
          type: 'mcq',
          options: [
            'Physical, Network, Transport, Application',
            'Perception, Network, Processing, Application',
            'Input, Output, Processing, Storage',
            'Client, Server, Database, Interface'
          ],
          correctAnswer: 1,
          marks: 20,
          explanation: 'IoT architecture consists of Perception (sensors), Network (connectivity), Processing (data analysis), and Application (user interface).'
        },
        {
          id: 4,
          question: 'Which is an example of IoT in smart cities?',
          type: 'mcq',
          options: [
            'Microsoft Word',
            'Smart traffic management systems',
            'Adobe Photoshop',
            'Video games'
          ],
          correctAnswer: 1,
          marks: 20,
          explanation: 'Smart cities use IoT for traffic management, waste management, energy optimization, etc.'
        },
        {
          id: 5,
          question: 'Explain how sensors collect and transmit data in IoT systems.',
          type: 'text',
          correctAnswer: ['detect', 'measure', 'transmit', 'data', 'environment'],
          marks: 20,
          explanation: 'Sensors detect environmental changes, convert to electrical signals, and transmit data via network.'
        }
      ]
    },
    'Python Programming': {
      videoId: '_uQrJ0TkZlc',
      videoTitle: 'Python Programming Essentials',
      color: '#FBBC04',
      icon: '🐍',
      description: 'Learn Python syntax, data structures, and programming fundamentals',
      questions: [
        {
          id: 1,
          question: 'What type of programming language is Python?',
          type: 'mcq',
          options: [
            'Compiled, statically-typed language',
            'Interpreted, high-level, dynamically-typed language',
            'Assembly language',
            'Machine code language'
          ],
          correctAnswer: 1,
          marks: 20,
          explanation: 'Python is interpreted, meaning code is executed line by line, and uses dynamic typing.'
        },
        {
          id: 2,
          question: 'Which keyword is used to define a function in Python?',
          type: 'mcq',
          options: [
            'function',
            'def',
            'func',
            'define'
          ],
          correctAnswer: 1,
          marks: 20,
          explanation: 'The "def" keyword is used to define functions in Python.'
        },
        {
          id: 3,
          question: 'What will be the output of: print(type([1, 2, 3]))?',
          type: 'mcq',
          options: [
            '<class \'dict\'>',
            '<class \'list\'>',
            '<class \'tuple\'>',
            '<class \'set\'>'
          ],
          correctAnswer: 1,
          marks: 20,
          explanation: 'Square brackets [] define a list in Python.'
        },
        {
          id: 4,
          question: 'What is the main difference between a list and a tuple in Python?',
          type: 'mcq',
          options: [
            'Lists use () brackets, tuples use []',
            'Lists are mutable (changeable), tuples are immutable (unchangeable)',
            'Tuples can store only numbers',
            'Lists can only store strings'
          ],
          correctAnswer: 1,
          marks: 20,
          explanation: 'Lists can be modified after creation while tuples cannot be changed once created.'
        },
        {
          id: 5,
          question: 'Name three built-in data types in Python.',
          type: 'text',
          correctAnswer: ['int', 'str', 'list', 'dict', 'tuple', 'set', 'float', 'bool'],
          marks: 20,
          explanation: 'Python has many built-in types including int, str, list, dict, tuple, set, float, and bool.'
        }
      ]
    },
    'Data Structures': {
      videoId: 'RBSGKlAvoiM',
      videoTitle: 'Data Structures Fundamentals',
      color: '#EA4335',
      icon: '📊',
      description: 'Understanding arrays, linked lists, stacks, queues, and trees',
      questions: [
        {
          id: 1,
          question: 'What principle does a Stack data structure follow?',
          type: 'mcq',
          options: [
            'FIFO (First In First Out)',
            'LIFO (Last In First Out)',
            'Random Access',
            'Priority Based'
          ],
          correctAnswer: 1,
          marks: 20,
          explanation: 'Stack follows LIFO - the last element added is the first one to be removed.'
        },
        {
          id: 2,
          question: 'Which data structure uses nodes with pointers/references?',
          type: 'mcq',
          options: [
            'Array',
            'Linked List',
            'String',
            'Integer'
          ],
          correctAnswer: 1,
          marks: 20,
          explanation: 'Linked lists use nodes that contain data and a reference to the next node.'
        },
        {
          id: 3,
          question: 'What is the time complexity of binary search in a sorted array?',
          type: 'mcq',
          options: [
            'O(n)',
            'O(log n)',
            'O(n²)',
            'O(1)'
          ],
          correctAnswer: 1,
          marks: 20,
          explanation: 'Binary search divides the search space in half each time, giving O(log n) complexity.'
        },
        {
          id: 4,
          question: 'What principle does a Queue data structure follow?',
          type: 'mcq',
          options: [
            'LIFO (Last In First Out)',
            'FIFO (First In First Out)',
            'Random Access',
            'Stack Based'
          ],
          correctAnswer: 1,
          marks: 20,
          explanation: 'Queue follows FIFO - first element added is the first one to be removed.'
        },
        {
          id: 5,
          question: 'Explain the main difference between an array and a linked list.',
          type: 'text',
          correctAnswer: ['contiguous', 'memory', 'dynamic', 'nodes', 'pointers'],
          marks: 20,
          explanation: 'Arrays use contiguous memory with fixed size, linked lists use dynamic memory with nodes and pointers.'
        }
      ]
    },
    'Web Development': {
      videoId: 'UB1O30fR-EE',
      videoTitle: 'Web Development Complete Guide',
      color: '#9C27B0',
      icon: '🌐',
      description: 'Master HTML, CSS, JavaScript, and modern web frameworks',
      questions: [
        {
          id: 1,
          question: 'What does HTML stand for?',
          type: 'mcq',
          options: [
            'Hyper Text Markup Language',
            'High Tech Modern Language',
            'Home Tool Markup Language',
            'Hyperlinks and Text Markup Language'
          ],
          correctAnswer: 0,
          marks: 20,
          explanation: 'HTML is HyperText Markup Language used to structure web content.'
        },
        {
          id: 2,
          question: 'Which language is primarily used for styling web pages?',
          type: 'mcq',
          options: [
            'JavaScript',
            'CSS (Cascading Style Sheets)',
            'Python',
            'Java'
          ],
          correctAnswer: 1,
          marks: 20,
          explanation: 'CSS is used to describe the presentation and styling of HTML documents.'
        },
        {
          id: 3,
          question: 'What is the primary purpose of JavaScript in web development?',
          type: 'mcq',
          options: [
            'Style web pages',
            'Structure web content',
            'Add interactivity and dynamic behavior to web pages',
            'Store database records'
          ],
          correctAnswer: 2,
          marks: 20,
          explanation: 'JavaScript enables interactive elements, animations, and dynamic content updates.'
        },
        {
          id: 4,
          question: 'Which HTTP method is used to retrieve data from a server?',
          type: 'mcq',
          options: [
            'POST',
            'GET',
            'PUT',
            'DELETE'
          ],
          correctAnswer: 1,
          marks: 20,
          explanation: 'GET requests retrieve data from specified resources without modifying them.'
        },
        {
          id: 5,
          question: 'Define responsive web design and its importance.',
          type: 'text',
          correctAnswer: ['adapt', 'screen', 'device', 'mobile', 'responsive'],
          marks: 20,
          explanation: 'Responsive design ensures websites adapt to different screen sizes and devices.'
        }
      ]
    },
    'Machine Learning': {
      videoId: 'ukzFI9rgwfU',
      videoTitle: 'Machine Learning Fundamentals',
      color: '#FF6F00',
      icon: '🤖',
      description: 'Explore ML algorithms, training models, and AI applications',
      questions: [
        {
          id: 1,
          question: 'What is Machine Learning?',
          type: 'mcq',
          options: [
            'Manually programming every rule and condition',
            'Systems that learn and improve from experience without being explicitly programmed',
            'A type of computer hardware',
            'A database management system'
          ],
          correctAnswer: 1,
          marks: 20,
          explanation: 'ML enables systems to learn patterns from data and make predictions or decisions.'
        },
        {
          id: 2,
          question: 'Which type of machine learning uses labeled training data?',
          type: 'mcq',
          options: [
            'Unsupervised Learning',
            'Supervised Learning',
            'Reinforcement Learning',
            'Semi-supervised Learning'
          ],
          correctAnswer: 1,
          marks: 20,
          explanation: 'Supervised learning trains models on labeled data with known input-output pairs.'
        },
        {
          id: 3,
          question: 'What is overfitting in machine learning?',
          type: 'mcq',
          options: [
            'Model performs perfectly on all datasets',
            'Model memorizes training data too well but fails to generalize to new data',
            'Model cannot learn from data at all',
            'Model is too simple to capture patterns'
          ],
          correctAnswer: 1,
          marks: 20,
          explanation: 'Overfitting occurs when a model learns noise in training data rather than general patterns.'
        },
        {
          id: 4,
          question: 'Which algorithm is commonly used for classification problems?',
          type: 'mcq',
          options: [
            'K-Means Clustering',
            'Decision Tree',
            'Principal Component Analysis',
            'Linear Regression'
          ],
          correctAnswer: 1,
          marks: 20,
          explanation: 'Decision trees are popular for classification, making decisions based on feature values.'
        },
        {
          id: 5,
          question: 'Explain the difference between classification and regression.',
          type: 'text',
          correctAnswer: ['classification', 'categories', 'regression', 'continuous', 'predict'],
          marks: 20,
          explanation: 'Classification predicts discrete categories, regression predicts continuous numerical values.'
        }
      ]
    }
  };

  const getSubjectConfig = () => {
    const courseName = assignment?.Course_Name || assignment?.course_name || '';
    const title = assignment?.Title || assignment?.title || '';
    const searchText = `${courseName} ${title}`.toLowerCase();
    
    for (const [key, config] of Object.entries(subjectConfigurations)) {
      if (searchText.includes(key.toLowerCase()) || 
          searchText.includes(key.split(' ')[0].toLowerCase())) {
        return { subjectName: key, ...config };
      }
    }
    
    // Enhanced default configuration
    return {
      subjectName: 'General Studies',
      videoId: 'dQw4w9WgXcQ',
      videoTitle: 'Educational Overview',
      color: '#17a2b8',
      icon: '📚',
      description: 'Comprehensive learning module for the assigned topic',
      questions: [
        {
          id: 1,
          question: 'Define the main concept of this topic and its significance.',
          type: 'text',
          correctAnswer: ['concept', 'definition', 'significance'],
          marks: 25,
          explanation: 'Understanding fundamental concepts is crucial for deeper learning.'
        },
        {
          id: 2,
          question: 'What are the key principles and theories?',
          type: 'text',
          correctAnswer: ['principles', 'theories', 'concepts'],
          marks: 25,
          explanation: 'Theoretical foundations provide the framework for practical applications.'
        },
        {
          id: 3,
          question: 'Describe the practical applications in real-world scenarios.',
          type: 'text',
          correctAnswer: ['practical', 'applications', 'real-world'],
          marks: 25,
          explanation: 'Applying theory to practice demonstrates comprehensive understanding.'
        },
        {
          id: 4,
          question: 'Explain the benefits and importance of learning this subject.',
          type: 'text',
          correctAnswer: ['benefits', 'importance', 'learning'],
          marks: 25,
          explanation: 'Understanding value helps motivate deeper engagement with the material.'
        }
      ]
    };
  };

  const subjectConfig = getSubjectConfig();

  const questions = subjectConfig.questions;

  // Auto-grading function
  const calculateScore = () => {
    let totalScore = 0;
    let maxScore = 0;

    questions.forEach(q => {
      maxScore += q.marks;
      const userAnswer = answers[q.id];
      
      if (!userAnswer) return;

      if (q.type === 'mcq') {
        if (parseInt(userAnswer) === q.correctAnswer) {
          totalScore += q.marks;
        }
      } else if (q.type === 'text') {
        const userText = userAnswer.toLowerCase();
        const keywords = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer.toLowerCase()];
        const matchCount = keywords.filter(keyword => 
          userText.includes(keyword.toLowerCase())
        ).length;
        
        // Award partial marks based on keyword matches
        if (matchCount > 0) {
          totalScore += Math.round((matchCount / keywords.length) * q.marks);
        }
      }
    });

    return { totalScore, maxScore, percentage: Math.round((totalScore / maxScore) * 100) };
  };

  useEffect(() => {
    // Get student ID
    try {
      const authUser = localStorage.getItem('auth_user');
      if (authUser) {
        const parsedUser = JSON.parse(authUser);
        setStudentId(parsedUser.id || parsedUser._id);
      }
    } catch (e) {
      console.error('Error getting student ID:', e);
    }

    // Track time spent
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-submit after 5 minutes (300 seconds)
  useEffect(() => {
    if (assignmentStarted && !isSubmitted && timeSpent >= 300) {
      console.log('⏰ Time limit reached - Auto-submitting assignment');
      handleSubmit(true);
    }
  }, [timeSpent, assignmentStarted, isSubmitted]);

  useEffect(() => {
    // Calculate progress based on answered questions
    const answeredCount = Object.keys(answers).length;
    const totalQuestions = questions.length;
    const newProgress = Math.round((answeredCount / totalQuestions) * 100);
    setProgress(newProgress);
  }, [answers, questions.length]);

  const handleVideoEnd = () => {
    setVideoCompleted(true);
    setAssignmentStarted(true);
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
    
    // Clear validation error for this question
    if (validationErrors[questionId]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  // Validate answer word count (minimum 20 words for text answers)
  const validateAnswers = () => {
    const errors = {};
    questions.forEach(q => {
      if (q.type === 'text') {
        const answer = answers[q.id] || '';
        const wordCount = answer.trim().split(/\s+/).filter(word => word.length > 0).length;
        if (wordCount < 20) {
          errors[q.id] = `Minimum 20 words required. Current: ${wordCount} words`;
        }
      }
    });
    return errors;
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    // Validate answers
    const errors = validateAnswers();
    if (Object.keys(errors).length > 0 && !isAutoSubmit) {
      setValidationErrors(errors);
      // Scroll to first error
      const firstErrorId = Object.keys(errors)[0];
      const errorElement = document.querySelector(`[data-question-id="${firstErrorId}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (Object.keys(answers).length < questions.length && !isAutoSubmit) {
      if (!window.confirm('You haven\'t answered all questions. Submit anyway?')) {
        return;
      }
    }

    setSubmitting(true);
    setSubmissionAnimation(true);

    try {
      const scoreData = calculateScore();
      setScore(scoreData.totalScore);
      
      const courseId = assignment.Course_Id || assignment.courseId || 'UNKNOWN';
      const assignmentId = assignment.Assignment_Id || assignment.id;

      const submissionData = {
        Assignment_Id: assignmentId,
        Student_Id: studentId,
        Course_Id: courseId,
        Submission_Content: JSON.stringify(answers),
        Submitted_On: new Date(),
        Status: 'Submitted',
        Score: scoreData.totalScore,
        Feedback: isAutoSubmit ? `Auto-submitted after 5 minutes: ${scoreData.totalScore}/${scoreData.maxScore} (${scoreData.percentage}%)` : `Submitted: ${scoreData.totalScore}/${scoreData.maxScore} (${scoreData.percentage}%)`,
        Time_Spent: timeSpent,
        Answers: answers,
        Questions: questions,
        IsAutoSubmit: isAutoSubmit
      };

      console.log('📤 Submitting Assignment Data:', {
        Assignment_Id: assignmentId,
        Student_Id: studentId,
        Course_Id: courseId,
        Score: scoreData.totalScore,
        Percentage: scoreData.percentage,
        Time_Spent: formatTime(timeSpent),
        Status: 'Submitted'
      });

      // Submit to backend - Save to BOTH Tbl_Submissions AND Tbl_Assignments
      
      // 1. Save to Tbl_Submissions
      const submissionsResponse = await fetch('http://localhost:5000/api/submissions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });

      const submissionsResult = await submissionsResponse.json();
      console.log('📥 Tbl_Submissions Response:', submissionsResult);

      // 2. Save to Tbl_Assignments
      const assignmentsResponse = await fetch('http://localhost:5000/api/assignments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });

      const assignmentsResult = await assignmentsResponse.json();
      console.log('📥 Tbl_Assignments Response:', assignmentsResult);

      // Use submissions result as primary
      const result = submissionsResult;
      
      if (result.success) {
        setShowResults(true);
        setScore(scoreData.totalScore);
        setIsSubmitted(true);
        
        // Animate for 2 seconds then show results
        setTimeout(() => {
          setSubmissionAnimation(false);
        }, 2000);
        
        console.log('✅ Assignment submitted successfully to Tbl_Submissions & Tbl_Assignments!');
        console.log('📊 Score:', scoreData.totalScore + '/' + scoreData.maxScore);
        
        if (onComplete) onComplete(scoreData.totalScore);
      } else {
        console.error('❌ Submission failed:', result.message);
        setSubmissionAnimation(false);
        alert('Failed to submit assignment: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error submitting assignment:', error);
      setSubmissionAnimation(false);
      alert('Error submitting assignment. Please check console and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="assignment-page" style={{ '--subject-color': subjectConfig.color }}>
      <div className="assignment-header" style={{ background: `linear-gradient(135deg, ${subjectConfig.color}15 0%, ${subjectConfig.color}30 100%)` }}>
        <button className="back-btn" onClick={onBack}>
          ← Back to Course
        </button>
        <div className="assignment-info">
          <div className="subject-badge" style={{ background: subjectConfig.color }}>
            <span className="subject-icon">{subjectConfig.icon}</span>
            <span>{subjectConfig.subjectName}</span>
          </div>
          <h1>{assignment?.Title || assignment?.title}</h1>
          <p className="subject-description">{subjectConfig.description}</p>
          <div className="assignment-meta-info">
            <span className="marks-badge" style={{ background: `${subjectConfig.color}20`, color: subjectConfig.color }}>
              🏆 {assignment?.Marks || assignment?.marks || 100} Marks
            </span>
            <span className="time-badge">⏱️ Time: {formatTime(timeSpent)}</span>
            <span className="progress-badge" style={{ background: `${subjectConfig.color}20`, color: subjectConfig.color }}>
              📊 Progress: {progress}%
            </span>
          </div>
        </div>
      </div>

      <div className="assignment-container">
        {!videoCompleted ? (
          <div className="video-section">
            <div className="section-header">
              <h2>📺 Tutorial Video</h2>
              <p className="section-subtitle">{subjectConfig.videoTitle}</p>
            </div>
            <p className="video-instruction">
              Watch this comprehensive tutorial to understand key concepts before attempting the assignment questions.
            </p>
            <div className="video-wrapper">
              <iframe
                src={`https://www.youtube.com/embed/${subjectConfig.videoId}?enablejsapi=1`}
                title={subjectConfig.videoTitle}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="assignment-video"
                onEnded={handleVideoEnd}
              ></iframe>
            </div>
            <button 
              className="start-assignment-btn"
              onClick={handleVideoEnd}
              style={{ background: subjectConfig.color }}
            >
              I've Watched the Video - Start Assignment →
            </button>
          </div>
        ) : (
          <div className="assignment-questions-section">
            <div className="progress-bar-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%`, background: subjectConfig.color }}
                >
                  <span className="progress-text">{progress}% Complete</span>
                </div>
              </div>
            </div>

            <div className="questions-container">
              <div className="section-header">
                <h2>📝 Assignment Questions</h2>
                <p className="section-subtitle">
                  {assignment?.Description || assignment?.description || 'Answer all questions to the best of your ability.'}
                </p>
              </div>              {questions.map((q, index) => (
                <div key={q.id} className="question-card" data-question-id={q.id}>
                  <div className="question-header">
                    <div className="question-number-badge" style={{ background: `${subjectConfig.color}20`, color: subjectConfig.color }}>
                      Question {index + 1}
                    </div>
                    <span className="question-marks" style={{ background: `${subjectConfig.color}15`, color: subjectConfig.color }}>
                      {q.marks} Marks
                    </span>
                  </div>
                  <p className="question-text">{q.question}</p>

                  {q.type === 'text' ? (
                    <div className="text-answer-container">
                      <textarea
                        className="answer-textarea"
                        rows="6"
                        placeholder="Type your detailed answer here (minimum 20 words)..."
                        value={answers[q.id] || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        style={{ borderColor: validationErrors[q.id] ? '#dc3545' : (answers[q.id] ? subjectConfig.color : '#dee2e6') }}
                        disabled={isSubmitted}
                      />
                      <div className="word-count-info">
                        <span className={`word-count ${(answers[q.id] || '').trim().split(/\s+/).filter(w => w.length > 0).length >= 20 ? 'valid' : 'invalid'}`}>
                          {(answers[q.id] || '').trim().split(/\s+/).filter(w => w.length > 0).length} / 20 words
                        </span>
                      </div>
                      {validationErrors[q.id] && (
                        <div className="validation-error">
                          ⚠️ {validationErrors[q.id]}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mcq-options">
                      {q.options.map((option, idx) => (
                        <label
                          key={idx}
                          className={`mcq-option ${answers[q.id] === idx.toString() ? 'selected' : ''}`}
                          style={answers[q.id] === idx.toString() ? {
                            borderColor: subjectConfig.color,
                            background: `${subjectConfig.color}10`
                          } : {}}
                        >
                          <input
                            type="radio"
                            name={`question-${q.id}`}
                            value={idx}
                            checked={answers[q.id] === idx.toString()}
                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                            disabled={isSubmitted}
                          />
                          <span className="option-letter" style={{ background: answers[q.id] === idx.toString() ? subjectConfig.color : '#e9ecef' }}>
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="option-text">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {isSubmitted && (
                    <div className="submitted-answer-display">
                      <div className="your-answer-section">
                        <strong>✍️ Your Answer:</strong>
                        {q.type === 'text' ? (
                          <div className="text-answer-display">
                            {answers[q.id] || 'Not answered'}
                          </div>
                        ) : (
                          <div className="mcq-answer-display">
                            {answers[q.id] !== undefined ? q.options[parseInt(answers[q.id])] : 'Not answered'}
                          </div>
                        )}
                      </div>
                      {q.type === 'mcq' && (
                        <div className="answer-feedback">
                          {parseInt(answers[q.id]) === q.correctAnswer ? (
                            <div className="feedback-correct">
                              ✅ Correct! {q.explanation}
                            </div>
                          ) : (
                            <div className="feedback-incorrect">
                              ❌ Incorrect. Correct answer: {q.options[q.correctAnswer]}. {q.explanation}
                            </div>
                          )}
                        </div>
                      )}
                      {q.type === 'text' && (
                        <div className="feedback-info">
                          💡 {q.explanation}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="submission-section">
              <div className="submission-summary" style={{ borderLeft: `4px solid ${subjectConfig.color}` }}>
                <h3>📊 Submission Summary</h3>
                <div className="summary-stats">
                  <div className="stat-item">
                    <span className="stat-label">Questions Answered:</span>
                    <span className="stat-value">{Object.keys(answers).filter(k => answers[k]?.toString().trim()).length} / {questions.length}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Time Spent:</span>
                    <span className="stat-value">{formatTime(timeSpent)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Completion:</span>
                    <span className="stat-value">{progress}%</span>
                  </div>
                  {isSubmitted && (
                    <div className="stat-item">
                      <span className="stat-label">Score:</span>
                      <span className="stat-value">{score} / {questions.reduce((sum, q) => sum + q.marks, 0)}</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                className="submit-btn"
                onClick={() => handleSubmit(false)}
                disabled={submitting || Object.keys(answers).length === 0 || isSubmitted}
                style={{ background: submitting || isSubmitted ? '#6c757d' : subjectConfig.color }}
              >
                {submitting ? 'Submitting...' : isSubmitted ? '✓ Submitted' : '✓ Submit Assignment'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Animated Submission Overlay */}
      {submissionAnimation && (
        <div className="submission-overlay">
          <div className="submission-animation-container">
            <div className="checkmark-circle">
              <div className="checkmark-stem"></div>
              <div className="checkmark-kick"></div>
            </div>
            <h2 className="submission-title">Assignment Submitted!</h2>
            <p className="submission-subtitle">Processing your answers...</p>
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentPage;
