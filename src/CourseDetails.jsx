import React, { useEffect, useState } from 'react';
import './CourseDetails.css';

const CourseDetails = ({ onBack, onPay }) => {
  const [course, setCourse] = useState(null);
  const [courseTopics, setCourseTopics] = useState([]);
  const [courseContents, setCourseContents] = useState([]);
  const [topicsWithSubtopics, setTopicsWithSubtopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTopics, setExpandedTopics] = useState({});
  const [allExpanded, setAllExpanded] = useState(false);

  const toggleTopic = (topicId) => {
    setExpandedTopics(prev => ({
      ...prev,
      [topicId]: !prev[topicId]
    }));
  };

  const toggleExpandAll = () => {
    if (allExpanded) {
      setExpandedTopics({});
    } else {
      const allIds = {};
      courseTopics.forEach(t => allIds[t.Topic_Id] = true);
      setExpandedTopics(allIds);
    }
    setAllExpanded(!allExpanded);
  };

  useEffect(() => {
    const raw = localStorage.getItem('selected_course');
    try {
      const parsedCourse = raw ? JSON.parse(raw) : null;
      setCourse(parsedCourse);
      if (parsedCourse) {
        fetchCourseData(parsedCourse.id || parsedCourse.Course_Id);
      }
    } catch {
      setCourse(null);
      setLoading(false);
    }
  }, []);

  const fetchCourseData = async (courseId) => {
    try {
      setLoading(true);

      // Fetch course topics
      const topicsResponse = await fetch(`http://localhost:5000/api/course-topics/course/${courseId}`);
      const topicsResult = await topicsResponse.json();
      if (topicsResult.success) {
        setCourseTopics(topicsResult.data);

        // Fetch subtopics for each topic
        const topicsWithSubs = await Promise.all(
          topicsResult.data.map(async (topic) => {
            const subtopicsResponse = await fetch(`http://localhost:5000/api/course-subtopics/topic/${topic.Topic_Id}`);
            const subtopicsResult = await subtopicsResponse.json();
            return {
              ...topic,
              subtopics: subtopicsResult.success ? subtopicsResult.data : []
            };
          })
        );
        setTopicsWithSubtopics(topicsWithSubs);
      }

      // Fetch course content
      const contentResponse = await fetch(`http://localhost:5000/api/course-content/course/${courseId}`);
      const contentResult = await contentResponse.json();
      if (contentResult.success) {
        setCourseContents(contentResult.data);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching course data:', error);
      setLoading(false);
    }
  };

  // Group content by topic
  const getContentByTopic = (topicId) => {
    return courseContents.filter(content => content.Topic_Id === topicId);
  };

  // Count content types
  const countVideos = courseContents.filter(c => c.Content_Type === 'video').length;
  const countPDFs = courseContents.filter(c => c.Content_Type === 'pdf').length;
  const countNotes = courseContents.filter(c => c.Content_Type === 'notes').length;

  // Derive curriculum stats
  const totalLectures = courseContents.length;
  const totalSections = courseTopics.length;
  // Placeholder duration calculation (can be improved if DB has actual durations)
  const totalDuration = `${Math.floor(totalLectures * 8.5 / 60)}h ${Math.round((totalLectures * 8.5) % 60)}m`;

  if (!course) {
    return (
      <div className="course-details-udemy">
        <div className="container" style={{ padding: '50px 0', textAlign: 'center' }}>
          <h2>Course not found</h2>
          <button className="back-to-dashboard-btn" onClick={onBack}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="course-details-container">
      {/* Top Banner (Dark Background) */}
      <div className="course-header-banner">
        <div className="container banner-inner">
          <div className="banner-content">
            <div className="breadcrumb">
              <span>Courses</span> <span className="separator">›</span>
              <span>{course.category || course.Category || 'Professional Development'}</span> <span className="separator">›</span>
              <span>{course.name || course.Title}</span>
            </div>
            <h1 className="course-title-lg">{course.name || course.Title}</h1>
            <p className="course-subtitle">
              {course.description || "Master the fundamentals and advanced concepts with hands-on projects and expert guidance. This comprehensive curriculum is designed for modern professionals."}
            </p>
            <div className="course-meta-row">
              <span className="rating-badge">
                <span className="rating-num">{course.rating || '4.8'}</span>
                <span className="stars">★★★★★</span>
                <span className="rating-count">(1,245 ratings)</span>
              </span>
              <span className="student-count">{course.students || '5,420'} students</span>
            </div>
            <div className="course-creator">
              Created by <span className="creator-link">{course.instructor}</span>
            </div>

          </div>
        </div>
      </div>

      <div className="container main-layout">
        {/* Main Content Column */}
        <div className="content-column">

          {/* What You'll Learn */}
          <section className="learning-objectives-card">
            <h2>What you'll learn</h2>
            <div className="objectives-grid">
              {topicsWithSubtopics.length > 0 ? (
                topicsWithSubtopics.slice(0, 8).map((topic, i) => (
                  <div key={i} className="objective-item">
                    <span className="check-icon">✓</span>
                    <span className="objective-text">{topic.Title}</span>
                  </div>
                ))
              ) : (
                <>
                  <div className="objective-item"><span className="check-icon">✓</span> <span>Comprehensive understanding of core concepts</span></div>
                  <div className="objective-item"><span className="check-icon">✓</span> <span>Hands-on experience with real-world projects</span></div>
                  <div className="objective-item"><span className="check-icon">✓</span> <span>Industry best practices and advanced techniques</span></div>
                  <div className="objective-item"><span className="check-icon">✓</span> <span>Problem-solving skills and professional workflow</span></div>
                </>
              )}
            </div>
          </section>



          {/* This Course Includes */}
          <section className="course-features-section">
            <h3>This course includes:</h3>
            <div className="features-grid">
              <div className="feature-item">
                <span className="feature-icon">🎬</span>
                <span>{totalDuration} on-demand video</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📱</span>
                <span>Access on mobile and TV</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📄</span>
                <span>{countPDFs || 12} articles</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🏆</span>
                <span>Certificate of completion</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📥</span>
                <span>{countNotes || 15} downloadable resources</span>
              </div>
            </div>
          </section>

          {/* Course Content */}
          <section className="course-curriculum-section">
            <div className="section-header">
              <h2>Course content</h2>
              <div className="curriculum-meta-row">
                <div className="curriculum-stats">
                  {totalSections} sections • {totalLectures} lectures • {totalDuration} total length
                </div>
                <button className="expand-toggle-btn" onClick={toggleExpandAll}>
                  {allExpanded ? 'Collapse all sections' : 'Expand all sections'}
                </button>
              </div>
            </div>

            <div className="curriculum-accordion">
              {loading ? (
                <div className="curriculum-loading">Loading content...</div>
              ) : courseTopics.length > 0 ? (
                courseTopics.map((topic, index) => {
                  const topicContent = getContentByTopic(topic.Topic_Id);
                  const isExpanded = expandedTopics[topic.Topic_Id];
                  return (
                    <div key={topic.Topic_Id} className={`accordion-item ${isExpanded ? 'active' : ''}`}>
                      <div className="accordion-trigger" onClick={() => toggleTopic(topic.Topic_Id)}>
                        <span className={`chevron ${isExpanded ? 'up' : 'down'}`}>▼</span>
                        <span className="section-title">{topic.Title}</span>
                        <span className="section-stats">{topicContent.length} lectures • {topicContent.length * 8}m</span>
                      </div>
                      {isExpanded && (
                        <div className="accordion-panel">
                          {topicContent.map((content, idx) => (
                            <div key={idx} className="lecture-row">
                              <span className="icon">
                                {content.Content_Type === 'video' ? '▶' : '📄'}
                              </span>
                              <span className="lecture-title">{content.Title}</span>
                              <span className="lecture-duration">08:24</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="no-content">Curriculum information will be available soon.</div>
              )}
            </div>
          </section>

          {/* Instructor Section */}
          <section className="instructor-profile-section">
            <h2>Instructor</h2>
            <div className="instructor-header">
              <h3 className="instructor-name-link">{course.instructor}</h3>
              <p className="instructor-headline">Senior Industry Professional & Expert Educator</p>
            </div>
            <div className="instructor-info-block">
              <div className="instructor-photo-stats">
                <div className="instructor-image">
                  {course.instructor.charAt(0)}
                </div>
                <div className="instructor-quick-stats">
                  <div className="stat"><span className="icon">⭐</span> 4.8 Instructor Rating</div>
                  <div className="stat"><span className="icon">💬</span> 12,450 Reviews</div>
                  <div className="stat"><span className="icon">👥</span> 85,200 Students</div>
                  <div className="stat"><span className="icon">▶</span> 12 Courses</div>
                </div>
              </div>
              <div className="instructor-bio">
                <p>
                  With over 10 years of experience in the industry, {course.instructor} has helped thousands of students achieve their professional goals.
                  My teaching philosophy focuses on practical, project-based learning that delivers immediate value.
                </p>
                <p>
                  I specialize in making complex concepts easy to understand, ensuring that even beginners can master advanced topics.
                  Join me in this course and let's unlock your full potential together.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Column (Fixed Scroll) */}
        <aside className="sidebar-column">
          <div className="floating-cta-card">
            <div className="video-preview-thumbnail">
              <img src={course.image || course.image_url || course.Thumbnail_URL || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop'} alt="Preview" />
            </div>

            <div className="cta-content">
              <div className="tabs">
                <div className="tab active">For Students</div>
              </div>

              <div className="pricing-section">
                <div className="price-row">
                  <span className="current-price">₹{course.price || course.Price || '0'}</span>
                  <span className="original-price">₹{Math.round((course.price || course.Price || 0) * 1.5)}</span>
                  <span className="discount-pct">33% off</span>
                </div>
                <div className="urgency-timer">
                  <span className="icon">⏳</span> <strong>22 hours</strong> left at this price!
                </div>
              </div>

              <div className="button-group">
                <button className="buy-now-btn full-width" onClick={() => onPay && onPay(course)}>Buy now</button>
              </div>

              <div className="guarantee-text">30-Day Money-Back Guarantee</div>
              <div className="lifetime-text">Full Lifetime Access</div>
            </div>
          </div>
        </aside>
      </div>

      {/* Floating Back Button */}
      <button className="floating-back-dashboard" onClick={onBack}>
        ← Back to Dashboard
      </button>
    </div>
  );
};

export default CourseDetails;
