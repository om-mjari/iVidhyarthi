import React, { useState, useEffect, useMemo } from 'react';

const UpcomingSessions = () => {
  const API_BASE_URL = 'http://localhost:5000/api';
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const student = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('student_user'));
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    fetchUpcomingSessions();
  }, []);

  const fetchUpcomingSessions = async () => {
    try {
      const studentEmail = student?.email || student?.id;
      if (!studentEmail) {
        setLoading(false);
        return;
      }

      // Fetch student's enrolled courses
      const enrollmentsResponse = await fetch(
        `${API_BASE_URL}/enrollments/my-enrollments`,
        {
          headers: {
            'x-student-email': studentEmail
          }
        }
      );

      if (!enrollmentsResponse.ok) {
        throw new Error('Failed to fetch enrollments');
      }

      const enrollmentsData = await enrollmentsResponse.json();
      const enrolledCourseIds = enrollmentsData.data?.map(e => e.Course_Id) || [];

      if (enrolledCourseIds.length === 0) {
        setSessions([]);
        setLoading(false);
        return;
      }

      // Fetch sessions for enrolled courses
      const sessionsResponse = await fetch(
        `${API_BASE_URL}/sessions/student?course_ids=${enrolledCourseIds.join(',')}`
      );

      if (!sessionsResponse.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const sessionsData = await sessionsResponse.json();
      setSessions(sessionsData.data || []);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  };

  const isToday = (dateString) => {
    const sessionDate = new Date(dateString);
    const today = new Date();
    return sessionDate.toDateString() === today.toDateString();
  };

  const isStartingSoon = (dateString) => {
    const sessionTime = new Date(dateString);
    const now = new Date();
    const diffMinutes = (sessionTime - now) / (1000 * 60);
    return diffMinutes > 0 && diffMinutes <= 30; // Within 30 minutes
  };

  const canAccessMeeting = (session) => {
    const now = new Date();
    const scheduledTime = new Date(session.scheduled_at);
    const endTime = new Date(scheduledTime.getTime() + session.duration * 60000);
    
    // Students can ONLY join when lecturer has started (status = 'Ongoing') AND within duration
    return session.status === 'Ongoing' && now <= endTime;
  };

  const getMeetingButtonText = (session) => {
    const now = new Date();
    const scheduledTime = new Date(session.scheduled_at);
    const endTime = new Date(scheduledTime.getTime() + session.duration * 60000);
    
    if (session.status === 'Completed') return 'Meeting Ended';
    if (session.status === 'Ongoing' && now <= endTime) return '🔗 Join Zoom Meeting →';
    if (session.status === 'Ongoing' && now > endTime) return 'Meeting Ended';
    return 'Waiting for lecturer to start...';
  };

  if (loading) {
    return (
      <section className="upcoming-sessions-section">
        <div className="section-header-dashboard">
          <h2 className="dashboard-section-title">Upcoming Live Sessions</h2>
        </div>
        <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
          Loading sessions...
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="upcoming-sessions-section">
        <div className="section-header-dashboard">
          <h2 className="dashboard-section-title">Upcoming Live Sessions</h2>
        </div>
        <div style={{ padding: '40px', textAlign: 'center', color: '#f44336' }}>
          ⚠️ {error}
        </div>
      </section>
    );
  }

  if (sessions.length === 0) {
    return (
      <section className="upcoming-sessions-section">
        <div className="section-header-dashboard">
          <h2 className="dashboard-section-title">Upcoming Live Sessions</h2>
        </div>
        <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
          No upcoming sessions scheduled
        </div>
      </section>
    );
  }

  return (
    <section className="upcoming-sessions-section">
      <div className="section-header-dashboard">
        <h2 className="dashboard-section-title">Upcoming Live Sessions</h2>
        <button className="view-calendar-btn">View Calendar →</button>
      </div>

      <div className="sessions-list">
        {sessions.map(session => {
          const isTodaySession = isToday(session.scheduled_at);
          const startingSoon = isStartingSoon(session.scheduled_at);
          
          return (
            <div key={session.session_id} className={`session-card ${isTodaySession ? 'today' : ''}`}>
              {startingSoon && <div className="today-badge">Starting Soon</div>}
              
              <div className="session-header">
                <div className="session-type-badge">{session.session_type || 'Live'}</div>
                <div className="session-attendees">
                  <span style={{
                    background: session.status === 'Scheduled' ? '#4caf50' : '#ff9800',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {session.status || 'Scheduled'}
                  </span>
                </div>
              </div>

              <h3 className="session-title">{session.title}</h3>
              <p className="session-instructor">📚 {session.course_name}</p>

              <div className="session-details">
                <div className="session-detail-item">
                  <span className="detail-icon">📅</span>
                  <span className="detail-text">{formatDate(session.scheduled_at)}</span>
                </div>
                <div className="session-detail-item">
                  <span className="detail-icon">🕐</span>
                  <span className="detail-text">{formatTime(session.scheduled_at)}</span>
                </div>
                <div className="session-detail-item">
                  <span className="detail-icon">⏳</span>
                  <span className="detail-text">{session.duration} minutes</span>
                </div>
              </div>

              <div className="session-actions">
                {session.session_url ? (
                  canAccessMeeting(session) ? (
                    <a 
                      href={session.session_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="join-now-btn"
                      style={{ textDecoration: 'none' }}
                    >
                      {getMeetingButtonText(session)}
                    </a>
                  ) : (
                    <button 
                      className="join-now-btn" 
                      disabled 
                      style={{ 
                        opacity: 0.6, 
                        cursor: 'not-allowed',
                        background: '#9e9e9e'
                      }}
                    >
                      {getMeetingButtonText(session)}
                    </button>
                  )
                ) : (
                  <button className="join-now-btn" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                    Link Not Available
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default UpcomingSessions;
