import React, { useState } from 'react';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([
    {
      id: 1,
      type: 'info',
      title: 'New Course Released!',
      message: 'Check out our latest course on Advanced AI & Machine Learning. Early bird discount available!',
      date: '2 hours ago',
      isNew: true,
      icon: '🎉'
    },
    {
      id: 2,
      type: 'warning',
      title: 'Assignment Due Soon',
      message: 'Your React Advanced project submission is due in 2 days. Complete it to maintain your progress streak!',
      date: '5 hours ago',
      isNew: true,
      icon: '⚠️'
    },
    {
      id: 3,
      type: 'success',
      title: 'Certificate Ready!',
      message: 'Congratulations! Your certificate for "Cloud Computing Fundamentals" is ready to download.',
      date: '1 day ago',
      isNew: false,
      icon: '🏆'
    },
    {
      id: 4,
      type: 'info',
      title: 'Platform Maintenance',
      message: 'Scheduled maintenance on Dec 30, 2025 from 2:00 AM to 4:00 AM IST. Services will be temporarily unavailable.',
      date: '2 days ago',
      isNew: false,
      icon: '🔧'
    }
  ]);

  const dismissAnnouncement = (id) => {
    setAnnouncements(announcements.filter(ann => ann.id !== id));
  };

  const getAnnouncementClass = (type) => {
    const baseClass = 'announcement-card';
    const typeClasses = {
      info: 'announcement-info',
      warning: 'announcement-warning',
      success: 'announcement-success',
      error: 'announcement-error'
    };
    return `${baseClass} ${typeClasses[type] || typeClasses.info}`;
  };

  return (
    <section className="announcements-section">
      <div className="section-header-dashboard">
        <h2 className="dashboard-section-title">📢 Announcements</h2>
        <button className="mark-all-read-btn">Mark All as Read</button>
      </div>

      <div className="announcements-list">
        {announcements.length > 0 ? (
          announcements.map(announcement => (
            <div key={announcement.id} className={getAnnouncementClass(announcement.type)}>
              {announcement.isNew && <span className="new-badge">NEW</span>}
              
              <div className="announcement-icon">{announcement.icon}</div>
              
              <div className="announcement-content">
                <h3 className="announcement-title">{announcement.title}</h3>
                <p className="announcement-message">{announcement.message}</p>
                <span className="announcement-date">{announcement.date}</span>
              </div>

              <button 
                className="dismiss-btn" 
                onClick={() => dismissAnnouncement(announcement.id)}
                aria-label="Dismiss announcement"
              >
                ✕
              </button>
            </div>
          ))
        ) : (
          <div className="no-announcements">
            <p>🎊 All caught up! No new announcements.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Announcements;
