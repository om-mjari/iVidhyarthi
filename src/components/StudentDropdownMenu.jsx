import React from 'react';
import './StudentDropdownMenu.css';

const StudentDropdownMenu = ({ user, onLogout, onClose, onNavigate }) => {

  const handleNavigation = (path) => {
    if (onNavigate) {
        onNavigate(path);
    }
    onClose();
  };

  return (
    <div className="student-dropdown-menu">
      <div className="dropdown-item" onClick={() => handleNavigation('profile')}>
        <span className="icon">👤</span> My Profile
      </div>
      <div className="dropdown-item" onClick={() => handleNavigation('my-certifications')}>
        <span className="icon">🎓</span> My Certifications
      </div>
      <div className="dropdown-divider"></div>
      <div className="dropdown-item logout" onClick={onLogout}>
        <span className="icon">🚪</span> Sign Out
      </div>
    </div>
  );
};

export default StudentDropdownMenu;