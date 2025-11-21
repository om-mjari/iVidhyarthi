import React, { useState, useRef, useEffect } from 'react';
import './ChatbotPremium.css';
import { IoSend, IoMic } from "react-icons/io5";



const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { text: '👋 Hello! I\'m your iVidhyarthi AI Assistant. How can I help you today?', sender: 'bot' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Show greeting when chatbot opens
    useEffect(() => {
        if (isOpen && messages.length === 1) {
            // Optional: Add additional greeting logic here
        }
    }, [isOpen]);

    // Initialize speech recognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (SpeechRecognition) {
            setSpeechSupported(true);
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onstart = () => {
                setIsListening(true);
            };

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInputValue(transcript);
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
    }, []);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        // Add user message
        const userMessage = { text: inputValue, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');

        // Show typing indicator
        setIsTyping(true);

        // Simulate bot response with typing delay
        setTimeout(() => {
            setIsTyping(false);
            const botResponse = getBotResponse(inputValue);
            const botMessage = { text: botResponse, sender: 'bot' };
            setMessages(prev => [...prev, botMessage]);
            
            // Automatically speak the bot response
            speakMessage(botResponse);
        }, 800);
    };

    const toggleSpeechRecognition = () => {
        if (!speechSupported) return;
        
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
        }
    };

    const speakMessage = (text) => {
        if (!synthRef.current) return;
        
        // Cancel any ongoing speech
        synthRef.current.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 1;
        utterance.pitch = 1;
        
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
    };

    const toggleSpeech = (text) => {
        if (isSpeaking) {
            synthRef.current.cancel();
            setIsSpeaking(false);
        } else {
            speakMessage(text);
        }
    };

    const getBotResponse = (userInput) => {
        const input = userInput.toLowerCase();

        // Website information queries
        if (input.includes('website') || input.includes('platform') || input.includes('ividhyarthi')) {
            return 'iVidhyarthi is an online learning platform offering high-quality courses in technology, programming, and more. Our mission is to make quality education accessible to everyone.';
        }

        // Course related queries
        if (input.includes('course') || input.includes('courses') || input.includes('learn')) {
            return 'We offer a variety of courses including Advanced Data Structures, Artificial Intelligence, Web Development, and more. You can browse all courses on the All Courses page.';
        }

        // Pricing information
        if (input.includes('price') || input.includes('cost') || input.includes('fee')) {
            return 'Course prices very depending on the program. Most courses range from ₹599 to ₹1299. You can find the exact pricing on each course card.';
        }

        // Instructor information
        if (input.includes('instructor') || input.includes('teacher') || input.includes('mentor')) {
            return 'Our courses are taught by experienced instructors like Bhumika Ma\'am, Rakesh Sir, and Abha Ma\'am. Each instructor brings unique expertise to their courses.';
        }

        // About iVidhyarthi
        if (input.includes('about') || input.includes('what is') || input.includes('who are you')) {
            return 'iVidhyarthi is an online learning platform offering high-quality courses in technology, programming, and more. Our mission is to make quality education accessible to everyone.';
        }

        // Contact information
        if (input.includes('contact') || input.includes('email') || input.includes('phone')) {
            return 'You can reach us at ividhyarthi123@gmail.com or call us at +91 6353778808. Our support team is available Monday to Friday, 9 AM to 6 PM.';
        }

        // Help/Support
        if (input.includes('help') || input.includes('support') || input.includes('problem')) {
            return 'How can I assist you? You can ask me about courses, pricing, instructors, or any other information about iVidhyarthi.';
        }

        // Dashboard information
        if (input.includes('dashboard') || input.includes('student dashboard')) {
            return 'The Student Dashboard is your personalized learning hub where you can browse courses, manage your profile, and track your learning progress.';
        }

        // Profile information
        if (input.includes('profile') || input.includes('account')) {
            return 'You can manage your profile information including your name, date of birth, course interests, and certifications in the profile section of your dashboard.';
        }

        // Enrollment information
        if (input.includes('enroll') || input.includes('register') || input.includes('sign up')) {
            return 'To enroll in a course, simply create an account on our platform, browse our course catalog, and click the "Enroll Now" button on any course you\'re interested in.';
        }

        // Default response
        return 'I\'m here to help! You can ask me about our courses, instructors, pricing, or any other information about iVidhyarthi. For example, try asking "What courses do you offer?" or "How much do courses cost?"';
    };

    const toggleChatbot = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className={`chatbot-premium-container ${isOpen ? 'active' : ''}`}>
            {/* Chatbot Window */}
            <div className={`chatbot-premium-window ${isOpen ? 'open' : ''}`}>
                {/* Header */}
                <div className="chatbot-premium-header">
                    <div className="chatbot-header-left">
                        <div className="chatbot-avatar-container">
                            <div className="chatbot-avatar">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2a5 5 0 0 1 5 5v4a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5z"/>
                                    <path d="M12 16v2"/>
                                    <path d="M8 22h8"/>
                                    <circle cx="12" cy="20" r="1"/>
                                </svg>
                            </div>
                            <div className="online-indicator"></div>
                        </div>
                        <div className="chatbot-header-info">
                            <h3 className="chatbot-title">iVidhyarthi Study Assistant</h3>
                            <p className="chatbot-status">
                                <span className="status-dot"></span>
                                Online now
                            </p>
                        </div>
                    </div>
                    <button onClick={toggleChatbot} className="chatbot-close-btn" aria-label="Close chat">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="X" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>X
                    </button>
                </div>

                {/* Messages Area */}
                <div className="chatbot-premium-messages">
                    {messages.map((message, index) => (
                        <div key={index} className={`chatbot-message ${message.sender}`}>
                            {message.sender === 'bot' && (
                                <div className="message-avatar">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"/>
                                        <circle cx="12" cy="12" r="3"/>
                                    </svg>
                                </div>
                            )}
                            <div className="message-content-wrapper">
                                <div className="message-bubble">
                                    {message.text}
                                </div>
                                {message.sender === 'bot' && (
                                    <button 
                                        className={`speaker-btn-premium ${isSpeaking ? 'playing' : ''}`}
                                        onClick={() => toggleSpeech(message.text)}
                                        title={isSpeaking ? "Stop speaking" : "Listen to message"}
                                    >
                                        {isSpeaking ? (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                <rect x="6" y="4" width="4" height="16"/>
                                                <rect x="14" y="4" width="4" height="16"/>
                                            </svg>
                                        ) : (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                                                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                                            </svg>
                                        )}🎙️
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {/* Typing Indicator */}
                    {isTyping && (
                        <div className="chatbot-message bot">
                            <div className="message-avatar">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <circle cx="12" cy="12" r="3"/>
                                </svg>🎤
                            </div>
                            <div className="message-content-wrapper">
                                <div className="message-bubble typing-indicator">
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
                <form onSubmit={handleSendMessage} className="chatbot-premium-input">
                    <div className="input-wrapper">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Type your message..."
                            className="chatbot-text-input"
                            autoComplete="off"
                        />
                        <div className="input-actions">
                            {speechSupported && (
                                <button 
                                    type="button"
                                    className={`action-btn mic-btn ${isListening ? 'listening' : ''}`}
                                    onClick={toggleSpeechRecognition}
                                    title={isListening ? "Stop listening" : "Voice input"}
                                >🎤<IoSend size={22} color="#fff" />
                                    {isListening ? (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                            <circle cx="12" cy="12" r="10"></circle>
                                        </svg>
                                    ) : (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                            <line x1="12" y1="19" x2="12" y2="23"></line>
                                            <line x1="8" y1="23" x2="16" y2="23"></line>
                                        </svg>
                                    )}
                                </button>
                            )}
                            <button type="submit" className="action-btn send-btn-premium" title="Send message">
                                ➤<IoSend size={22} color="#fff" />
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                </svg>
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Floating Button */}
            <button 
                className={`chatbot-premium-button ${isOpen ? 'hidden' : ''}`} 
                onClick={toggleChatbot}
                aria-label="Open chat"
            >
                <div className="button-glow"></div>
                <svg className="button-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    <path d="M8 10h.01"/>
                    <path d="M12 10h.01"/>
                    <path d="M16 10h.01"/>
                </svg>
                <div className="pulse-ring"></div>
            </button>
        </div>
    );
};

export default Chatbot;