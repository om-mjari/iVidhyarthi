import React from 'react';

const LearningStats = () => {
  const stats = [
    {
      id: 1,
      label: 'Courses Completed',
      value: 8,
      icon: '✅',
      color: '#14b8a6',
      badge: '+2 this month'
    },
    {
      id: 2,
      label: 'Certificates Earned',
      value: 6,
      icon: '🏆',
      color: '#f59e0b',
      badge: 'Top Performer'
    },
    {
      id: 3,
      label: 'Learning Hours',
      value: 156,
      icon: '⏱️',
      color: '#0891b2',
      badge: '12hrs this week'
    },
    {
      id: 4,
      label: 'Skill Badges',
      value: 12,
      icon: '🎖️',
      color: '#8b5cf6',
      badge: '3 new'
    }
  ];

  const skillProgress = [
    { skill: 'Web Development', progress: 85, color: '#14b8a6' },
    { skill: 'Data Science', progress: 68, color: '#0891b2' },
    { skill: 'Cloud Computing', progress: 92, color: '#06b6d4' },
    { skill: 'Machine Learning', progress: 54, color: '#8b5cf6' }
  ];

  return (
    <section className="learning-stats-section">
      <div className="section-header-dashboard">
        <h2 className="dashboard-section-title">My Learning Statistics</h2>
      </div>

      {/* Stats Cards */}
      <div className="stats-cards-grid">
        {stats.map(stat => (
          <div key={stat.id} className="stat-card">
            <div className="stat-icon" style={{ background: `${stat.color}20`, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-content">
              <h3 className="stat-value">{stat.value}</h3>
              <p className="stat-label">{stat.label}</p>
              {stat.badge && <span className="stat-badge">{stat.badge}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Skill Progress Bars */}
      <div className="skills-progress-container">
        <h3 className="skills-title">Skill Proficiency</h3>
        <div className="skills-list">
          {skillProgress.map((skill, index) => (
            <div key={index} className="skill-item">
              <div className="skill-header">
                <span className="skill-name">{skill.skill}</span>
                <span className="skill-percentage">{skill.progress}%</span>
              </div>
              <div className="skill-progress-bar">
                <div 
                  className="skill-progress-fill" 
                  style={{ 
                    width: `${skill.progress}%`,
                    background: skill.color
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LearningStats;
