import React, { useState, useMemo, useEffect, useRef } from 'react';
import './StudentDashboard.css';
import Logo from './Logo';
import Chatbot from './Chatbot';

const Home = ({ onNavigateLogin, onNavigateAdmin, onNavigateToPage }) => {
  // State for courses (raw approved list)
  const [courses, setCourses] = useState([]);
  // State for filtered/sorted operations (approved only)
  const [filteredCourses, setFilteredCourses] = useState([]);

  // State for filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [priceRange, setPriceRange] = useState('all');
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // State for dropdown menus
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Voice search state
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef(null);

  // Fetch courses from API on mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/tbl-courses');
        const result = await response.json();
        // Extract array exactly from result.data
        const allCourses = Array.isArray(result.data) ? result.data : [];
        // Keep only admin approved courses
        const approvedCourses = allCourses.filter((course) => {
          const statusValue = course.Status || course.status;
          return typeof statusValue === 'string' && statusValue.toLowerCase() === 'approved';
        });
        setCourses(approvedCourses);
        setFilteredCourses(approvedCourses);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setCourses([]);
        setFilteredCourses([]);
      }
    };
    fetchCourses();
  }, []);

  // Voice search setup
  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setVoiceSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        // Clean up the transcript by removing punctuation at the end
        const cleanTranscript = transcript.replace(/[.!?,\s]+$/, '').trim();
        setSearchTerm(cleanTranscript);
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

  const handleEnroll = (course) => {
    // Navigate to Login page when Enroll button is clicked
    onNavigateLogin && onNavigateLogin();
  };

  // Filter and sort courses
  const filteredAndSortedCourses = useMemo(() => {
    console.log('Debug - Total courses:', courses.length);
    console.log('Debug - Search term:', searchTerm);
    console.log('Debug - Price range:', priceRange);
    console.log('Debug - Min rating:', minRating);

    let filtered = filteredCourses.filter(course => {
      const matchesSearch = (course.Title || course.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.Lecturer_Id || course.instructor || '').toLowerCase().includes(searchTerm.toLowerCase());
      let matchesPrice = true;
      const coursePrice = course.Price || course.price || 0;
      switch (priceRange) {
        case 'under500':
          matchesPrice = coursePrice < 500;
          break;
        case '500to1000':
          matchesPrice = coursePrice >= 500 && coursePrice <= 1000;
          break;
        case 'over1000':
          matchesPrice = coursePrice > 1000;
          break;
        default:
          matchesPrice = true;
      }
      const courseRating = course.rating || 4.5;
      const matchesRating = courseRating >= minRating;
      return matchesSearch && matchesPrice && matchesRating;
    });

    console.log('Debug - Filtered courses:', filtered.length);

    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'price':
          aValue = a.Price || a.price || 0;
          bValue = b.Price || b.price || 0;
          break;
        case 'rating':
          aValue = a.rating || 4.5;
          bValue = b.rating || 4.5;
          break;
        case 'name':
        default:
          aValue = (a.Title || a.name || '').toLowerCase();
          bValue = (b.Title || b.name || '').toLowerCase();
          break;
      }
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [searchTerm, sortBy, sortOrder, priceRange, minRating, filteredCourses]);

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setSortBy('name');
    setSortOrder('asc');
    setPriceRange('all');
    setMinRating(0);
    setShowFilters(false);
  };

  // Voice search functions
  const startVoiceSearch = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  };

  const stopVoiceSearch = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  // Render star rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    for (let i = 0; i < fullStars; i++) stars.push(<span key={i} className="star filled">★</span>);
    if (hasHalfStar) stars.push(<span key="half" className="star half">★</span>);
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) stars.push(<span key={`empty-${i}`} className="star empty">☆</span>);
    return (
      <div className="rating">
        {stars}
        <span className="rating-number">({rating})</span>
      </div>
    );
  };

  // Apply filters handler for mobile (just closes panel since filters auto-apply)
  const applyFiltersAndClose = () => setShowFilters(false);

  // Dropdown menu handlers
  const handleDropdownToggle = (dropdownName) => {
    setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
  };

  const handleDropdownClose = () => {
    setActiveDropdown(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.nav-dropdown')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-inner">
          <div className="header-brand">
            <Logo size="large" showText={true} onClick={() => window.location.reload()} style={{ cursor: 'pointer' }} />
          </div>

          <nav className="main-navigation">
            {/* About iVidhyarthi Dropdown */}
            <div className="nav-dropdown">
              <button
                className={`nav-dropdown-btn ${activeDropdown === 'about' ? 'active' : ''}`}
                onClick={() => handleDropdownToggle('about')}
              >
                About iVidhyarthi <span className="dropdown-arrow">▼</span>
              </button>
              {activeDropdown === 'about' && (
                <div className="dropdown-menu">
                  <button className="dropdown-item" onClick={() => onNavigateToPage && onNavigateToPage('LearnAboutIVidhyarthi')}>Learn about iVidhyarthi</button>
                  <button className="dropdown-item" onClick={() => onNavigateToPage && onNavigateToPage('OurMission')}>Our Mission</button>
                  <button className="dropdown-item" onClick={() => onNavigateToPage && onNavigateToPage('Team')}>Team</button>
                  <button className="dropdown-item" onClick={() => onNavigateToPage && onNavigateToPage('ContactUs')}>Contact Us</button>
                </div>
              )}
            </div>

            {/* All Courses Dropdown */}
            <div className="nav-dropdown">
              <button
                className={`nav-dropdown-btn ${activeDropdown === 'courses' ? 'active' : ''}`}
                onClick={() => handleDropdownToggle('courses')}
              >
                All Courses <span className="dropdown-arrow">▼</span>
              </button>
              {activeDropdown === 'courses' && (
                <div className="dropdown-menu">
                  <button className="dropdown-item" onClick={() => onNavigateToPage && onNavigateToPage('CourseCatalog')}>iVidhyarthi Courses</button>
                  <button className="dropdown-item" onClick={() => onNavigateToPage && onNavigateToPage('CourseCatalog')}>Course Catalog</button>
                  <button className="dropdown-item" onClick={() => onNavigateToPage && onNavigateToPage('Coordinators')}>Coordinators</button>
                  <button className="dropdown-item" onClick={() => onNavigateToPage && onNavigateToPage('HelpVideos')}>Help Videos</button>
                </div>
              )}
            </div>

            {/* Initiatives Dropdown */}
            <div className="nav-dropdown">
              <button
                className={`nav-dropdown-btn ${activeDropdown === 'initiatives' ? 'active' : ''}`}
                onClick={() => handleDropdownToggle('initiatives')}
              >
                Initiatives <span className="dropdown-arrow">▼</span>
              </button>
              {activeDropdown === 'initiatives' && (
                <div className="dropdown-menu">
                  <button className="dropdown-item" onClick={() => onNavigateToPage && onNavigateToPage('LocalChapters')}>Local Chapters</button>
                  <button className="dropdown-item" onClick={() => onNavigateToPage && onNavigateToPage('Translation')}>Translation</button>
                  <button className="dropdown-item" onClick={() => onNavigateToPage && onNavigateToPage('FacultyInitiatives')}>Faculty Initiatives</button>
                  <button className="dropdown-item" onClick={() => onNavigateToPage && onNavigateToPage('StudentPrograms')}>Student Programs</button>
                </div>
              )}
            </div>

            {/* FAQ Dropdown */}
            <div className="nav-dropdown">
              <button
                className={`nav-dropdown-btn ${activeDropdown === 'faq' ? 'active' : ''}`}
                onClick={() => handleDropdownToggle('faq')}
              >
                FAQ <span className="dropdown-arrow">▼</span>
              </button>
              {activeDropdown === 'faq' && (
                <div className="dropdown-menu">
                  <button className="dropdown-item" onClick={() => onNavigateToPage && onNavigateToPage('FAQ')}>General FAQ</button>
                  <button className="dropdown-item" onClick={() => onNavigateToPage && onNavigateToPage('FAQ')}>Course FAQ</button>
                  <button className="dropdown-item" onClick={() => onNavigateToPage && onNavigateToPage('FAQ')}>Technical Support</button>
                  <button className="dropdown-item" onClick={() => onNavigateToPage && onNavigateToPage('FAQ')}>Enrollment FAQ</button>
                </div>
              )}
            </div>

            {/* More Dropdown */}
            <div className="nav-dropdown">
              <button
                className={`nav-dropdown-btn ${activeDropdown === 'more' ? 'active' : ''}`}
                onClick={() => handleDropdownToggle('more')}
              >
                More <span className="dropdown-arrow">▼</span>
              </button>
              {activeDropdown === 'more' && (
                <div className="dropdown-menu">
                  <button className="dropdown-item" onClick={() => onNavigateToPage && onNavigateToPage('Blog')}>iVidhyarthi Blog</button>
                  <button className="dropdown-item" onClick={() => onNavigateToPage && onNavigateToPage('Certification')}>Certification Courses</button>
                  <button className="dropdown-item" onClick={() => onNavigateToPage && onNavigateToPage('Careers')}>Careers</button>
                  <button className="dropdown-item" onClick={() => onNavigateToPage && onNavigateToPage('Documents')}>Documents</button>
                  <button className="dropdown-item" onClick={() => onNavigateToPage && onNavigateToPage('Books')}>Books</button>
                  <button className="dropdown-item" onClick={() => onNavigateToPage && onNavigateToPage('Resources')}>Resources</button>
                </div>
              )}
            </div>
          </nav>

          <div className="header-actions">
            <button className="login-signup-btn" onClick={onNavigateLogin}>
              Login/Signup
            </button>
          </div>
        </div>

        <div className="header-subtitle">
          <p>Discover and enroll in amazing courses</p>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Search and Controls */}
        <div className="controls-section">
          <div className="search-section">
            <div className="search-input-container">
              <input
                type="text"
                placeholder="Search courses or instructors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {voiceSupported && (
                <button
                  className={`voice-search-btn ${isListening ? 'listening' : ''}`}
                  onClick={isListening ? stopVoiceSearch : startVoiceSearch}
                  title={isListening ? 'Stop listening' : 'Start voice search'}
                  aria-label={isListening ? 'Stop voice search' : 'Start voice search'}
                >
                  {isListening ? '🔴' : '🎤'}
                </button>
              )}
            </div>
            {isListening && (
              <div className="voice-status">
                <span className="listening-indicator">🎤 Listening...</span>
              </div>
            )}
          </div>

          <div className="sort-section">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split('-');
                setSortBy(sort);
                setSortOrder(order);
              }}
              className="sort-select"
              aria-label="Sort courses"
            >
              <option value="name-asc">Name (A → Z)</option>
              <option value="name-desc">Name (Z → A)</option>
              <option value="price-asc">Price (Low → High)</option>
              <option value="price-desc">Price (High → Low)</option>
              <option value="rating-desc">Rating (High → Low)</option>
            </select>
          </div>

          <button onClick={resetFilters} className="reset-btn">
            Reset Filters
          </button>

          <button
            className="filters-toggle-btn"
            onClick={() => setShowFilters(prev => !prev)}
            aria-expanded={showFilters}
            aria-controls="filtersSidebar"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {/* Overlay backdrop */}
        <div className={`filters-overlay ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(false)}></div>

        <div className={`main-content ${showFilters ? 'filters-open' : 'no-filters'}`}>
          {/* Filters Sidebar */}
          <aside
            id="filtersSidebar"
            className={`filters-sidebar ${showFilters ? 'open' : ''}`}
          >
            <h3>Filters</h3>

            <div className="filter-group">
              <h4>Price Range</h4>
              <label className="filter-option">
                <input
                  type="radio"
                  name="priceRange"
                  value="all"
                  checked={priceRange === 'all'}
                  onChange={(e) => setPriceRange(e.target.value)}
                />
                All Prices
              </label>
              <label className="filter-option">
                <input
                  type="radio"
                  name="priceRange"
                  value="under500"
                  checked={priceRange === 'under500'}
                  onChange={(e) => setPriceRange(e.target.value)}
                />
                Under ₹500
              </label>
              <label className="filter-option">
                <input
                  type="radio"
                  name="priceRange"
                  value="500to1000"
                  checked={priceRange === '500to1000'}
                  onChange={(e) => setPriceRange(e.target.value)}
                />
                ₹500 - ₹1000
              </label>
              <label className="filter-option">
                <input
                  type="radio"
                  name="priceRange"
                  value="over1000"
                  checked={priceRange === 'over1000'}
                  onChange={(e) => setPriceRange(e.target.value)}
                />
                Over ₹1000
              </label>
            </div>

            <div className="filter-group">
              <h4>Minimum Rating</h4>
              <label className="filter-option">
                <input
                  type="radio"
                  name="minRating"
                  value="0"
                  checked={minRating === 0}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                />
                All Ratings
              </label>
              <label className="filter-option">
                <input
                  type="radio"
                  name="minRating"
                  value="3"
                  checked={minRating === 3}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                />
                3+ Stars
              </label>
              <label className="filter-option">
                <input
                  type="radio"
                  name="minRating"
                  value="4"
                  checked={minRating === 4}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                />
                4+ Stars
              </label>
              <label className="filter-option">
                <input
                  type="radio"
                  name="minRating"
                  value="4.5"
                  checked={minRating === 4.5}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                />
                4.5+ Stars
              </label>
            </div>

            <div className="mobile-apply-wrap">
              <button className="apply-filters-btn" onClick={applyFiltersAndClose}>Apply Filters</button>
            </div>
          </aside>

          {/* Course Grid */}
          <main className="courses-section">
            {/* NPTEL-Style Introduction Section */}
            <div className="platform-intro-section">
              <div className="intro-header">
                <h1 className="intro-title">Welcome to iVidhyarthi Online Courses</h1>
                <p className="intro-subtitle">Enhance skills that meet your learning goals</p>
                <div className="intro-divider"></div>
              </div>
              
              <div className="intro-content">
                <p className="intro-description">
                  iVidhyarthi is a comprehensive online learning platform designed to provide quality education to anyone interested in upskilling. 
                  Our courses are created by expert educators and industry professionals, ensuring you receive the best learning experience 
                  with practical knowledge and real-world applications.
                </p>
                
                <div className="intro-announcements">
                  <div className="announcement-item">
                    <span className="announcement-label">Current Session:</span>
                    <span className="announcement-value">Jan - April 2026</span>
                  </div>
                  <div className="announcement-divider">|</div>
                  <div className="announcement-item highlight">
                    <span className="announcement-label">📢 Enrollments are Open!</span>
                  </div>
                  <div className="announcement-divider">|</div>
                  <div className="announcement-item">
                    <span className="announcement-label">New Batch:</span>
                    <span className="announcement-value">Starting Soon</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="courses-header">
              <h2>Available Courses ({filteredAndSortedCourses.length})</h2>
            </div>

            {filteredAndSortedCourses.length > 0 ? (
              <div className="courses-grid">
                {(searchTerm || priceRange !== 'all' || minRating > 0) && (
                  <div className="filter-warning">
                    <p>Showing {filteredAndSortedCourses.length} courses matching your filters</p>
                  </div>
                )}
                {filteredAndSortedCourses.map(course => (
                  <div key={course.Course_Id || course.id} className="course-card">
                    <div className="course-image">
                      <img src={course.image_url || course.image || 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=300&fit=crop'} alt={course.Title || course.name} />
                    </div>
                    <div className="course-content">
                      <div className="course-info-row">
                        <h3 className="course-name">{course.Title || course.name}</h3>
                        <p className="course-instructor">by {course.Lecturer_Id || course.instructor}</p>
                      </div>
                      <div className="price-button-row">
                        <div className="course-price">
                          ₹{course.Price || course.price}
                        </div>
                        <button className="enroll-btn" onClick={() => handleEnroll(course)}>Enroll Now</button>
                      </div>
                      <div className="course-rating">
                        {renderStars(course.rating || 4.5)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-courses">
                <p>No courses found matching your criteria.</p>
                <p style={{ fontSize: '1rem', marginTop: '1rem', opacity: 0.7 }}>
                  Try adjusting your search terms or filters.
                </p>
                <button onClick={resetFilters} className="reset-btn">
                  Clear Filters
                </button>
              </div>
            )}
          </main>

          {/* Minimal Premium Footer */}
          <footer className="ividhyarthi-minimal-footer">
            <div className="footer-content-minimal">
              <p className="footer-copyright">
                © 2025 iVidhyarthi — Empowering Digital Learning for Everyone.
              </p>
              <div className="footer-links-minimal">
                <a href="#privacy" className="footer-link">Privacy Policy</a>
                <span className="footer-dot">•</span>
                <a href="#terms" className="footer-link">Terms of Use</a>
                <span className="footer-dot">•</span>
                <a href="#contact" className="footer-link">Contact</a>
              </div>
              <p className="footer-tagline">
                An initiative to make education accessible and future-ready.
              </p>
            </div>
          </footer>
        </div>
      </div>
      <Chatbot />
    </div>
  );
};

export default Home;
