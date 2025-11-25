import React from 'react';

const UpcomingSessions = () => {
  const sessions = [
    {
      id: 1,
      title: 'React Advanced Patterns Workshop',
      instructor: 'Dr. Rajesh Kumar',
      date: 'Dec 28, 2025',
      time: '10:00 AM - 12:00 PM',
      duration: '2 hours',
      type: 'Live Workshop',
      attendees: 124,
      isToday: true
    },
    {
      id: 2,
      title: 'ML Model Deployment Q&A Session',
      instructor: 'Prof. Anita Desai',
      date: 'Dec 29, 2025',
      time: '03:00 PM - 04:30 PM',
      duration: '1.5 hours',
      type: 'Q&A Session',
      attendees: 89,
      isToday: false
    },
    {
      id: 3,
      title: 'AWS Cloud Architecture Masterclass',
      instructor: 'Mr. Vikram Singh',
      date: 'Dec 30, 2025',
      time: '11:00 AM - 01:00 PM',
      duration: '2 hours',
      type: 'Masterclass',
      attendees: 156,
      isToday: false
    }
  ];

  return (
    <section className="upcoming-sessions-section">
      <div className="section-header-dashboard">
        <h2 className="dashboard-section-title">Upcoming Live Sessions</h2>
        <button className="view-calendar-btn">View Calendar →</button>
      </div>

      <div className="sessions-list">
        {sessions.map(session => (
          <div key={session.id} className={`session-card ${session.isToday ? 'today' : ''}`}>
            {session.isToday && <div className="today-badge">Starting Soon</div>}
            
            <div className="session-header">
              <div className="session-type-badge">{session.type}</div>
              <div className="session-attendees">👥 {session.attendees} registered</div>
            </div>

            <h3 className="session-title">{session.title}</h3>
            <p className="session-instructor">with {session.instructor}</p>

            <div className="session-details">
              <div className="session-detail-item">
                <span className="detail-icon">📅</span>
                <span className="detail-text">{session.date}</span>
              </div>
              <div className="session-detail-item">
                <span className="detail-icon">🕐</span>
                <span className="detail-text">{session.time}</span>
              </div>
              <div className="session-detail-item">
                <span className="detail-icon">⏳</span>
                <span className="detail-text">{session.duration}</span>
              </div>
            </div>

            <div className="session-actions">
              {session.isToday ? (
                <button className="join-now-btn">Join Now →</button>
              ) : (
                <>
                  <button className="add-calendar-btn">Add to Calendar</button>
                  <button className="set-reminder-btn">Set Reminder</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default UpcomingSessions;
