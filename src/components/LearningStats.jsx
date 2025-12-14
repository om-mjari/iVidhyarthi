import React, { useState, useEffect } from 'react';

const LearningStats = () => {
  const [stats, setStats] = useState({
    coursesCompleted: 0,
    certificatesEarned: 0,
    learningHours: 0,
    skillBadges: 0,
    monthlyIncrease: 0,
    weeklyHours: 0,
    newBadges: 0
  });
  const [skillProgress, setSkillProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLearningStats();
  }, []);

  const fetchLearningStats = async () => {
    try {
      setLoading(true);
      
      // Get student ID from localStorage
      const authUser = localStorage.getItem('auth_user');
      if (!authUser) {
        console.log('No auth user found');
        setLoading(false);
        return;
      }

      const user = JSON.parse(authUser);
      const studentId = user.studentId || user.Student_Id || user.id;

      if (!studentId) {
        console.log('No student ID found');
        setLoading(false);
        return;
      }

      // Fetch enrollments to count completed courses
      const enrollmentsResponse = await fetch(`http://localhost:5000/api/enrollments/student/${studentId}`);
      const enrollmentsResult = await enrollmentsResponse.json();

      let coursesCompleted = 0;
      let totalLearningHours = 0;
      
      if (enrollmentsResult.success && enrollmentsResult.data) {
        // Count courses with 100% progress or completed status
        coursesCompleted = enrollmentsResult.data.filter(enrollment => {
          const progress = enrollment.Progress || 0;
          const status = enrollment.Status || '';
          return progress >= 95 || status.toLowerCase() === 'completed';
        }).length;

        // Calculate total learning hours (estimate: 10 hours per course)
        totalLearningHours = enrollmentsResult.data.length * 10;
      }

      // Fetch certifications
      const certificationsResponse = await fetch(`http://localhost:5000/api/certifications/student/${studentId}`);
      const certificationsResult = await certificationsResponse.json();
      
      const certificatesEarned = certificationsResult.success ? (certificationsResult.data?.length || 0) : 0;

      // Fetch video progress for detailed learning hours
      const videoProgressResponse = await fetch(`http://localhost:5000/api/video-progress/student/${studentId}/all`);
      const videoProgressResult = await videoProgressResponse.json();
      
      if (videoProgressResult.success && videoProgressResult.data) {
        // Calculate actual learning hours from completed videos (assuming average 20 min per video)
        const completedVideos = videoProgressResult.data.filter(v => v.Is_Completed === true || v.completed === true).length;
        totalLearningHours = Math.round(completedVideos * 0.33); // 20 min = 0.33 hours
      }

      // Calculate weekly hours (last 7 days)
      const weeklyHours = Math.round(totalLearningHours * 0.2); // Estimate 20% in last week

      // Set stats
      setStats({
        coursesCompleted,
        certificatesEarned,
        learningHours: totalLearningHours,
        skillBadges: certificatesEarned + coursesCompleted, // Skill badges = certs + completed courses
        monthlyIncrease: Math.min(2, coursesCompleted), // Max 2 this month
        weeklyHours,
        newBadges: Math.min(3, Math.floor(coursesCompleted / 2)) // New badges
      });

      // Fetch skill progress (based on actual video completion per course)
      if (enrollmentsResult.success && enrollmentsResult.data && enrollmentsResult.data.length > 0) {
        const skillMap = {};
        
        // Fetch video progress for detailed calculation
        const videoProgressResponse = await fetch(`http://localhost:5000/api/video-progress/student/${studentId}/all`);
        const videoProgressResult = await videoProgressResponse.json();
        
        // Map video progress by course ID
        const progressMap = {};
        if (videoProgressResult.success && videoProgressResult.data) {
          videoProgressResult.data.forEach(progress => {
            const courseId = progress.Course_Id || progress.courseId;
            if (!progressMap[courseId]) {
              progressMap[courseId] = [];
            }
            progressMap[courseId].push(progress);
          });
        }

        // Calculate progress for each enrolled course
        for (const enrollment of enrollmentsResult.data) {
          const course = enrollment.courseDetails;
          if (course) {
            const skillName = course.Title || course.name || course.Category || 'General';
            const courseId = enrollment.Course_Id;
            
            // Fetch course content to count total videos
            try {
              const courseContentResponse = await fetch(`http://localhost:5000/api/course-content/course/${courseId}`);
              const courseContentResult = await courseContentResponse.json();
              
              let totalVideos = 0;
              let completedVideos = 0;
              
              if (courseContentResult.success && courseContentResult.data) {
                // Count total videos
                courseContentResult.data.forEach(content => {
                  if (content.Content_Type === 'video' || content.Content_Type === 'Video') {
                    totalVideos++;
                  }
                });
                
                // Count completed videos
                if (progressMap[courseId]) {
                  completedVideos = progressMap[courseId].filter(vp => vp.Is_Completed === true || vp.completed === true).length;
                }
              }
              
              const progress = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;
              
              if (!skillMap[skillName]) {
                skillMap[skillName] = { 
                  totalProgress: 0, 
                  count: 0,
                  avgProgress: 0 
                };
              }
              
              skillMap[skillName].totalProgress += progress;
              skillMap[skillName].count += 1;
              skillMap[skillName].avgProgress = Math.round(skillMap[skillName].totalProgress / skillMap[skillName].count);
              
            } catch (error) {
              console.error(`Error calculating progress for course ${courseId}:`, error);
            }
          }
        }

        // Sort by progress and take top skills
        const skills = Object.keys(skillMap)
          .map((skillName, index) => {
            const colors = [
              '#14b8a6', // Teal
              '#0891b2', // Cyan
              '#06b6d4', // Sky
              '#8b5cf6', // Purple
              '#f59e0b', // Amber
              '#ef4444', // Red
              '#10b981', // Green
              '#3b82f6'  // Blue
            ];
            
            return {
              skill: skillName,
              progress: skillMap[skillName].avgProgress,
              color: colors[index % colors.length],
              courseCount: skillMap[skillName].count
            };
          })
          .sort((a, b) => b.progress - a.progress) // Sort by progress descending
          .slice(0, 8); // Take top 8 skills

        setSkillProgress(skills.length > 0 ? skills : [
          { skill: 'Web Development', progress: 0, color: '#14b8a6', courseCount: 0 },
          { skill: 'Data Science', progress: 0, color: '#0891b2', courseCount: 0 },
          { skill: 'Cloud Computing', progress: 0, color: '#06b6d4', courseCount: 0 },
          { skill: 'Machine Learning', progress: 0, color: '#8b5cf6', courseCount: 0 }
        ]);
      } else {
        // Default empty state
        setSkillProgress([
          { skill: 'Web Development', progress: 0, color: '#14b8a6', courseCount: 0 },
          { skill: 'Data Science', progress: 0, color: '#0891b2', courseCount: 0 },
          { skill: 'Cloud Computing', progress: 0, color: '#06b6d4', courseCount: 0 },
          { skill: 'Machine Learning', progress: 0, color: '#8b5cf6', courseCount: 0 }
        ]);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching learning stats:', error);
      setLoading(false);
    }
  };

  const statsData = [
    {
      id: 1,
      label: 'Courses Completed',
      value: stats.coursesCompleted,
      icon: '✅',
      color: '#14b8a6',
      badge: stats.monthlyIncrease > 0 ? `+${stats.monthlyIncrease} this month` : 'Keep going!'
    },
    {
      id: 2,
      label: 'Certificates Earned',
      value: stats.certificatesEarned,
      icon: '🏆',
      color: '#f59e0b',
      badge: stats.certificatesEarned >= 5 ? 'Top Performer' : 'Great progress!'
    },
    {
      id: 3,
      label: 'Learning Hours',
      value: stats.learningHours,
      icon: '⏱️',
      color: '#0891b2',
      badge: stats.weeklyHours > 0 ? `${stats.weeklyHours}hrs this week` : 'Start learning!'
    },
    {
      id: 4,
      label: 'Skill Badges',
      value: stats.skillBadges,
      icon: '🎖️',
      color: '#8b5cf6',
      badge: stats.newBadges > 0 ? `${stats.newBadges} new` : 'Earn more!'
    }
  ];

  if (loading) {
    return (
      <section className="learning-stats-section">
        <div className="section-header-dashboard">
          <h2 className="dashboard-section-title">My Learning Statistics</h2>
        </div>
        <div className="stats-loading">
          <div className="loading-spinner"></div>
          <p>Loading your statistics...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="learning-stats-section">
      <div className="section-header-dashboard">
        <h2 className="dashboard-section-title">My Learning Statistics</h2>
      </div>

      {/* Stats Cards */}
      <div className="stats-cards-grid">
        {statsData.map(stat => (
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
        {skillProgress.length === 0 ? (
          <div className="no-skills-message">
            <p>🎯 Start enrolling in courses to track your skill progress!</p>
          </div>
        ) : (
          <div className="skills-list">
            {skillProgress.map((skill, index) => (
              <div key={index} className="skill-item">
                <div className="skill-header">
                  <span className="skill-name">
                    {skill.skill}
                    {skill.courseCount > 0 && (
                      <span className="skill-course-count"> ({skill.courseCount} course{skill.courseCount > 1 ? 's' : ''})</span>
                    )}
                  </span>
                  <span className="skill-percentage" style={{ color: skill.color }}>
                    {skill.progress}%
                  </span>
                </div>
                <div className="skill-progress-bar">
                  <div 
                    className="skill-progress-fill" 
                    style={{ 
                      width: `${skill.progress}%`,
                      background: skill.color,
                      boxShadow: `0 2px 8px ${skill.color}40`
                    }}
                  >
                    {skill.progress > 5 && (
                      <span className="progress-label">{skill.progress}%</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default LearningStats;
