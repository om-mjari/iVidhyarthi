import React, { useState, useRef, useEffect } from 'react';
import './ChatbotAssistant.css';

const ChatbotAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: "👋 Hello! I'm your iVidhyarthi AI Assistant. How can I help you today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const handleSendMessage = () => {
    if (inputText.trim() === '') return;

    const userMessage = {
      type: 'user',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botResponseText = getBotResponse(inputText);
      const botResponse = {
        type: 'bot',
        text: botResponseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
      
      // Speak the bot response
      speakText(botResponseText);
    }, 1500);
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      synthRef.current.cancel();
      
      // Remove emojis for better speech
      const cleanText = text.replace(/[^\w\s.,!?-]/g, '');
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.lang = 'en-US';

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      synthRef.current.speak(utterance);
    }
  };

  const getBotResponse = (userInput) => {
    const input = userInput.toLowerCase();
    
    // iVidhyarthi related keywords
    const ividhyarthiKeywords = [
      'course', 'courses', 'learn', 'learning', 'study', 'education', 'enroll', 'enrollment',
      'register', 'registration', 'price', 'pricing', 'cost', 'fee', 'payment', 'certificate',
      'instructor', 'teacher', 'lecture', 'video', 'assignment', 'exam', 'test', 'quiz',
      'programming', 'coding', 'python', 'java', 'javascript', 'c++', 'ai', 'artificial intelligence',
      'machine learning', 'data science', 'cloud', 'aws', 'blockchain', 'web development',
      'app development', 'database', 'networking', 'cybersecurity', 'help', 'support',
      'contact', 'about', 'mission', 'team', 'student', 'dashboard', 'login', 'signup',
      'account', 'profile', 'progress', 'vidhyarthi', 'platform', 'online', 'virtual'
    ];
    
    // Check if the input contains any iVidhyarthi related keywords
    const isRelevant = ividhyarthiKeywords.some(keyword => input.includes(keyword));
    
    // If not relevant to iVidhyarthi, reject the query
    if (!isRelevant && input.length > 3) {
      return "❌ I'm sorry, but I can only assist with questions related to iVidhyarthi platform, our courses, enrollment, pricing, and learning services. Please ask me something about iVidhyarthi!";
    }
    
    // Specific responses for iVidhyarthi queries
    if (input.includes('course') || input.includes('courses') || input.includes('learn')) {
      return "📚 We offer a wide range of courses including Programming (Python, Java, C++), AI & Machine Learning, Cloud Computing (AWS), Blockchain Development, Web Development, and more! Would you like to browse our course catalog?";
    } else if (input.includes('help') || input.includes('support')) {
      return "💁‍♂️ I'm here to help! You can ask me about courses, enrollment, pricing, assignments, certificates, or anything else related to iVidhyarthi platform.";
    } else if (input.includes('price') || input.includes('cost') || input.includes('fee')) {
      return "💰 Our courses range from ₹700 to ₹2000. Each course offers great value with lifetime access, video lectures, assignments, and certificate of completion! Which course are you interested in?";
    } else if (input.includes('enroll') || input.includes('register') || input.includes('signup')) {
      return "✅ Enrolling is easy! Just browse our courses, click 'Enroll Now', complete the payment, and start learning immediately. Need help with a specific course?";
    } else if (input.includes('certificate') || input.includes('certification')) {
      return "🎓 Yes! All our courses come with a Certificate of Completion. Once you finish the course and complete all assignments, you'll receive your certificate.";
    } else if (input.includes('instructor') || input.includes('teacher')) {
      return "👨‍🏫 Our courses are taught by industry professionals and experienced educators. Each course has detailed instructor information on the course page.";
    } else if (input.includes('assignment') || input.includes('exam') || input.includes('test')) {
      return "📝 Our courses include assignments and assessments to test your knowledge. You can track your progress in the student dashboard.";
    } else if (input.includes('video') || input.includes('lecture')) {
      return "🎬 All courses include high-quality video lectures that you can watch anytime. Videos are organized by topics for easy learning.";
    } else if (input.includes('contact') || input.includes('email') || input.includes('phone')) {
      return "📧 You can contact us through the Contact Us page. Our team is here to help you with any questions!";
    } else if (input.includes('about') || input.includes('mission') || input.includes('vidhyarthi')) {
      return "🎯 iVidhyarthi is a comprehensive online learning platform designed to provide quality education to anyone interested in upskilling. We offer practical knowledge and real-world applications!";
    } else if (input.includes('login') || input.includes('account') || input.includes('dashboard')) {
      return "🔐 You can login or create your account using the Login/Signup button. Your student dashboard will show all your enrolled courses and progress.";
    } else if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
      return "👋 Hello! Welcome to iVidhyarthi! How can I assist you today? Feel free to ask about our courses, enrollment process, pricing, or anything related to our platform!";
    } else if (input.includes('thank')) {
      return "😊 You're welcome! If you have any more questions about iVidhyarthi, feel free to ask. Happy learning!";
    } else {
      return "I'm here to help you with iVidhyarthi! You can ask me about our courses, enrollment process, pricing, certificates, or any other questions related to our learning platform. What would you like to know?";
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Voice input is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setIsListening(false);
      }
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      <button 
        className={`chatbot-toggle-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Chat Assistant"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
            <circle cx="12" cy="10" r="1.5"/>
            <circle cx="8" cy="10" r="1.5"/>
            <circle cx="16" cy="10" r="1.5"/>
          </svg>
        )}
      </button>

      {/* Chatbot Window */}
      <div className={`chatbot-container ${isOpen ? 'chatbot-open' : ''}`}>
        {/* Header */}
        <div className="chatbot-header">
          <div className="chatbot-header-content">
            <div className="chatbot-avatar">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
              <span className="chatbot-status-indicator"></span>
            </div>
            <div className="chatbot-header-text">
              <h3>iVidhyarthi Study Assistant</h3>
              <p className="chatbot-status">
                <span className="status-dot"></span>
                Online now
              </p>
            </div>
          </div>
          <button 
            className="chatbot-close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="Close Chat"
          >
            ✕
          </button>
        </div>

        {/* Messages Area */}
        <div className="chatbot-messages">
          {messages.map((message, index) => (
            <div key={index} className={`message-wrapper ${message.type}`}>
              <div className={`message-bubble ${message.type}`}>
                {message.type === 'bot' && (
                  <div className="message-avatar bot-avatar">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                )}
                <div className="message-content">
                  <p>{message.text}</p>
                  <span className="message-time">{message.time}</span>
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="message-wrapper bot">
              <div className="message-bubble bot typing-indicator">
                <div className="message-avatar bot-avatar">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="chatbot-input-area">
          <div className="chatbot-input-container">
            <button 
              className={`chatbot-voice-btn ${isListening ? 'listening' : ''}`}
              onClick={handleVoiceInput}
              aria-label="Voice Input"
              title={isListening ? 'Stop listening...' : 'Click to speak'}
            >
              {isListening ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="pulse-animation">
                  <circle cx="12" cy="12" r="8"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              )}🎙️
            </button>
            <input
              ref={inputRef}
              type="text"
              className="chatbot-input"
              placeholder={isListening ? "Listening..." : "Type your message..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            {isSpeaking && (
              <button 
                className="chatbot-stop-btn"
                onClick={stopSpeaking}
                aria-label="Stop Speaking"
                title="Stop speaking"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 6h12v12H6z"/>
                </svg>
              </button>
            )}
            <button 
              className="chatbot-send-btn"
              onClick={handleSendMessage}
              disabled={inputText.trim() === ''}
              aria-label="Send Message"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            ➤</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatbotAssistant;
