import React, { useState, useMemo, useEffect, useRef } from 'react';
import './StudentDashboard.css';
import './MyProfilePremium.css';
import Logo from './Logo';
import Chatbot from './Chatbot';

const StudentDashboard = ({ onNavigateCourse, onLogout }) => {
  // State for courses (raw approved list)
  const [courses, setCourses] = useState([]);
  // State for filtered operations (approved only)
  const [filteredCourses, setFilteredCourses] = useState([]);

  // State for filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [priceRange, setPriceRange] = useState('all');
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Voice search state
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef(null);

  // Profile state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    birthdate: '',
    courseDetails: '',
    certificateDetails: '',
    gender: ''
  });
  const [editProfile, setEditProfile] = useState({
    name: '',
    birthdate: '',
    courseDetails: '',
    certificateDetails: '',
    gender: ''
  });
  const [isProfileDirty, setIsProfileDirty] = useState(false);

  // Auto-populate profile with logged-in user data
  useEffect(() => {
    const authUser = localStorage.getItem('auth_user');
    const savedProfile = localStorage.getItem('student_profile');

    if (authUser) {
      try {
        const user = JSON.parse(authUser);
        const defaultProfile = {
          name: user.name || '',
          birthdate: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
          courseDetails: 'React, JavaScript, Node.js',
          certificateDetails: 'Coursera, Udemy',
          gender: user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : 'Male'
        };

        // If no saved profile exists, use the default populated data
        if (!savedProfile) {
          setProfile(defaultProfile);
          setEditProfile(defaultProfile);
          localStorage.setItem('student_profile', JSON.stringify(defaultProfile));
        } else {
          // Merge saved profile with user data, prioritizing saved data
          const parsed = JSON.parse(savedProfile);
          const mergedProfile = {
            ...defaultProfile,
            ...parsed,
            // Always use the latest name from auth_user
            name: user.name || parsed.name
          };
          setProfile(mergedProfile);
          setEditProfile(mergedProfile);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        // Fallback to saved profile if exists
        if (savedProfile) {
          try {
            const parsed = JSON.parse(savedProfile);
            setProfile(parsed);
            setEditProfile(parsed);
          } catch { }
        }
      }
    } else if (savedProfile) {
      // No auth user but saved profile exists
      try {
        const parsed = JSON.parse(savedProfile);
        setProfile(parsed);
        setEditProfile(parsed);
      } catch { }
    }
  }, []);

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

  const avatarInitials = (name) => {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] || '';
    const second = parts[1]?.[0] || '';
    return (first + second).toUpperCase();
  };

  const logout = () => {
    if (onLogout) {
      onLogout(); // This will handle navigation to home and cleanup
    } else {
      // Fallback if onLogout prop is not provided
      localStorage.removeItem('auth_user');
      localStorage.removeItem('student_profile');
      window.location.reload();
    }
  };

  const openProfile = () => {
    setEditProfile(profile);
    setIsProfileDirty(false);
    setIsProfileOpen(true);
  };

  const handleEnroll = (course) => {
    // Normalize course data to ensure consistent field names throughout the flow
    const normalizedCourse = {
      id: course.Course_Id || course.id,
      name: course.Title || course.name,
      price: course.Price || course.price,
      instructor: course.Lecturer_Id || course.instructor,
      image: course.image_url || course.image || 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=300&fit=crop',
      rating: course.rating || 4.5
    };
    localStorage.setItem('selected_course', JSON.stringify(normalizedCourse));
    onNavigateCourse && onNavigateCourse();
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

  const handleEditProfileChange = (e) => {
    const { name, value } = e.target;
    setEditProfile(prev => {
      const next = { ...prev, [name]: value };
      setIsProfileDirty(JSON.stringify(next) !== JSON.stringify(profile));
      return next;
    });
  };

  const updateProfile = () => {
    setProfile(editProfile);
    localStorage.setItem('student_profile', JSON.stringify(editProfile));
    setIsProfileDirty(false);
    setIsProfileOpen(false);
  };

  const closeProfile = () => setIsProfileOpen(false);

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

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-inner">
          <div className="header-titles">
            <Logo size="large" showText={true} style={{ marginBottom: '0.5rem' }} />
            <h1>Student Dashboard</h1>
            <p>Discover and enroll in amazing courses</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button className="logout-btn-modern" onClick={logout} title="Logout">
              <span className="logout-icon">🚪</span>
              Logout
            </button>
            <button
              className="avatar-btn-modern"
              aria-label="Open profile"
              onClick={openProfile}
              title={profile.name ? profile.name : 'Profile'}
            >
              <div className="avatar-container">
                {profile.name ? (
                  <span className="avatar-initials-modern">{avatarInitials(profile.name)}</span>
                ) : (
                  <span className="avatar-icon-modern" aria-hidden>👤</span>
                )}
                <div className="avatar-status-dot"></div>
              </div>
              <span className="avatar-name">{profile.name || 'Guest'}</span>
            </button>
          </div>
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

      {/* Profile Slide-over - Premium Modern UI */}
      <div className={`profile-overlay ${isProfileOpen ? 'open' : ''}`} onClick={closeProfile} />
      <aside className={`profile-panel-premium ${isProfileOpen ? 'open' : ''}`} aria-hidden={!isProfileOpen}>
        
        {/* Close Button - Floating Top Right */}
        <button className="profile-close-premium" onClick={closeProfile} aria-label="Close profile">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Profile Header with Gradient Avatar */}
        <div className="profile-header-premium">
          <div className="profile-avatar-premium">
            <div className="avatar-glow"></div>
            <div className="avatar-content">
              {profile.name ? (
                <span className="avatar-initials-premium">{avatarInitials(profile.name)}</span>
              ) : (
                <svg className="avatar-icon-premium" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              )}
            </div>
          </div>
          <h2 className="profile-title-premium">My Profile</h2>
          <p className="profile-subtitle-premium">Manage your personal information</p>
        </div>

        {/* Profile Form */}
        <form className="profile-form-premium" onSubmit={(e) => e.preventDefault()}>
          
          {/* Personal Information Section */}
          <div className="glass-section">
            <div className="section-header">
              <h3 className="section-title-premium">Personal Information</h3>
              <div className="section-divider"></div>
            </div>
            
            <div className="form-group-premium">
              <label className="field-label-premium">Full Name</label>
              <input
                type="text"
                name="name"
                value={editProfile.name}
                onChange={handleEditProfileChange}
                placeholder="Enter your full name"
                className="input-premium"
              />
            </div>

            <div className="form-group-premium">
              <label className="field-label-premium">Date of Birth</label>
              <input
                type="date"
                name="birthdate"
                value={editProfile.birthdate}
                onChange={handleEditProfileChange}
                className="input-premium"
              />
            </div>

            <div className="form-group-premium">
              <label className="field-label-premium">Gender</label>
              <div className="pill-selector">
                <label className={`pill-option ${editProfile.gender === 'Male' ? 'active' : ''}`}>
                  <input type="radio" name="gender" value="Male" checked={editProfile.gender === 'Male'} onChange={handleEditProfileChange} />
                  <span className="pill-text">Male</span>
                </label>
                <label className={`pill-option ${editProfile.gender === 'Female' ? 'active' : ''}`}>
                  <input type="radio" name="gender" value="Female" checked={editProfile.gender === 'Female'} onChange={handleEditProfileChange} />
                  <span className="pill-text">Female</span>
                </label>
                <label className={`pill-option ${editProfile.gender === 'Other' ? 'active' : ''}`}>
                  <input type="radio" name="gender" value="Other" checked={editProfile.gender === 'Other'} onChange={handleEditProfileChange} />
                  <span className="pill-text">Other</span>
                </label>
              </div>
            </div>
          </div>

          {/* Academic Information Section */}
          <div className="glass-section">
            <div className="section-header">
              <h3 className="section-title-premium">Academic Information</h3>
              <div className="section-divider"></div>
            </div>
            
            <div className="form-group-premium">
              <label className="field-label-premium">Course Interests</label>
              <textarea
                name="courseDetails"
                value={editProfile.courseDetails}
                onChange={handleEditProfileChange}
                rows="3"
                placeholder="e.g., React, Machine Learning, UI/UX Design"
                className="textarea-premium"
              />
            </div>

            <div className="form-group-premium">
              <label className="field-label-premium">Certifications</label>
              <textarea
                name="certificateDetails"
                value={editProfile.certificateDetails}
                onChange={handleEditProfileChange}
                rows="3"
                placeholder="e.g., Coursera, Udemy, Google Certificates"
                className="textarea-premium"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="profile-actions-premium">
            <button type="button" className="btn-cancel-premium" onClick={closeProfile}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Cancel
            </button>
            <button type="button" className="btn-save-premium" disabled={!isProfileDirty} onClick={updateProfile}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Save Changes
            </button>
          </div>
        </form>
      </aside>

      {/* Chatbot Component */}
      <Chatbot />
    </div>
  );
};

export default StudentDashboard;
