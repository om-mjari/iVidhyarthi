import React from 'react';
import DashboardHeader from './components/DashboardHeader';
import EnrolledCoursesList from './components/EnrolledCoursesList';
import './MyCourses.css';

const MyCourses = ({ user, onNavigate, onLogout }) => {
  return (
    <div className="my-courses-page">
      <DashboardHeader user={user} onNavigate={onNavigate} onLogout={onLogout} />
      <div className="courses-container">
        <EnrolledCoursesList studentId={user?.id || user?._id} onNavigate={onNavigate} />
      </div>
    </div>
  );
};

export default MyCourses;