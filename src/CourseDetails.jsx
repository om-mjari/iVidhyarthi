import React, { useEffect, useState } from 'react';
import './CourseDetails.css';

const CourseDetails = ({ onBack, onPay }) => {
  const [course, setCourse] = useState(null);
  const [courseTopics, setCourseTopics] = useState([]);
  const [courseContents, setCourseContents] = useState([]);
  const [topicsWithSubtopics, setTopicsWithSubtopics] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (!course) {
    return (
      <div className="course-details-wrap">
        <div className="course-details-card">
          <p>Course not found.</p>
          <button className="btn-secondary" onClick={onBack}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="course-details-wrap">
      <div className="course-hero">
        <img src={course.image} alt={course.name} />
        <div className="course-hero-overlay">
          <h1>{course.name}</h1>
          <p>by {course.instructor}</p>
        </div>
      </div>

      <div className="course-details-content">
        <div className="course-main">
          <div className="course-info">
            <div className="price">₹{course.price}</div>
            <div className="rating">⭐ {course.rating}</div>
          </div>

          <div className="course-main-inner">
            <div className="course-cover">
              <img src={course.image || course.image_url} alt={course.name || course.Title} />
            </div>
            <div className="course-text">
              <p className="course-description">
                {course.description || course.Description || "This course provides a comprehensive, hands-on curriculum designed to take you from fundamentals to practical mastery. Expect engaging lessons, real-world projects, and clear guidance throughout your learning journey."}
              </p>

              {/* What You Will Learn Section */}
              {topicsWithSubtopics.length > 0 && (
                <div style={{ marginTop: '24px', padding: '20px', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                  <h3 style={{ marginBottom: '16px', color: '#333' }}>📚 What You Will Learn</h3>
                  <div style={{ fontFamily: 'monospace', fontSize: '14px', lineHeight: '1.8', color: '#555' }}>
                    {topicsWithSubtopics.map((topic, topicIndex) => (
                      <div key={topic.Topic_Id} style={{ marginBottom: '12px' }}>
                        <div style={{ fontWeight: '600', color: '#000' }}>
                          {topicIndex + 1}. {topic.Title}
                        </div>
                        {topic.subtopics && topic.subtopics.length > 0 && (
                          <div style={{ marginLeft: '24px' }}>
                            {topic.subtopics.map((subtopic, subtopicIndex) => (
                              <div key={subtopic.SubTopic_Id}>
                                {topicIndex + 1}.{subtopicIndex + 1} {subtopic.Title}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <ul className="highlights">
                <li>📚 {countVideos} Video Lectures</li>
                <li>📄 {countPDFs} PDF Resources</li>
                <li>📝 {countNotes} Study Notes</li>
                <li>🎓 Certificate of completion</li>
                <li>💬 Mentor Q&A support</li>
                <li>🏆 Interactive assignments</li>
                <li>📱 Mobile app compatibility</li>
                <li>📊 Progress tracking dashboard</li>
              </ul>
              
              <div className="course-curriculum">
                <h3>Course Content</h3>
                {loading ? (
                  <div className="loading-content">
                    <p>Loading course content...</p>
                  </div>
                ) : courseTopics.length > 0 ? (
                  <div className="curriculum-items">
                    {courseTopics.map((topic, index) => {
                      const topicContent = getContentByTopic(topic.Topic_Id);
                      return (
                        <div key={topic.Topic_Id} className="curriculum-item">
                          <span className="item-number">{index + 1}</span>
                          <div className="item-content">
                            <h4>{topic.Title}</h4>
                            <p>{topic.Description || 'Learn essential concepts and practical skills'}</p>
                            {topic.Estimated_Hours && (
                              <span className="topic-duration">⏱️ {topic.Estimated_Hours} hours</span>
                            )}
                            {topicContent.length > 0 && (
                              <div className="topic-content-list">
                                {topicContent.map((content, idx) => (
                                  <div key={idx} className="content-item-mini">
                                    {content.Content_Type === 'video' && '🎥'}
                                    {content.Content_Type === 'pdf' && '📄'}
                                    {content.Content_Type === 'notes' && '📝'}
                                    {' '}{content.Title}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="curriculum-items">
                    <div className="curriculum-item">
                      <span className="item-number">1</span>
                      <div className="item-content">
                        <h4>Fundamentals & Setup</h4>
                        <p>Get started with the basics and set up your development environment</p>
                      </div>
                    </div>
                    <div className="curriculum-item">
                      <span className="item-number">2</span>
                      <div className="item-content">
                        <h4>Core Concepts</h4>
                        <p>Master the essential concepts and best practices</p>
                      </div>
                    </div>
                    <div className="curriculum-item">
                      <span className="item-number">3</span>
                      <div className="item-content">
                        <h4>Advanced Topics</h4>
                        <p>Dive deep into advanced techniques and real-world applications</p>
                      </div>
                    </div>
                    <div className="curriculum-item">
                      <span className="item-number">4</span>
                      <div className="item-content">
                        <h4>Final Project</h4>
                        <p>Build a complete project to showcase your skills</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="instructor-info">
                <h3>About Your Instructor</h3>
                <div className="instructor-card">
                  <div className="instructor-avatar">
                    {course.instructor.charAt(0)}
                  </div>
                  <div className="instructor-details">
                    <h4>{course.instructor}</h4>
                    <p>Expert instructor with 5+ years of experience in the field. Passionate about teaching and helping students achieve their goals.</p>
                    <div className="instructor-stats">
                      <span>⭐ 4.8 Rating</span>
                      <span>👥 10,000+ Students</span>
                      <span>🎓 50+ Courses</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="course-aside">
          <div className="cta-card">
            <div className="price-lg">₹{course.price}</div>
            <button className="btn-primary" onClick={() => onPay && onPay(course)}>Enroll Now</button>
            <button className="btn-secondary" onClick={onBack}>Back to Dashboard</button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CourseDetails;
