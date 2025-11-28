import React, { useState, useEffect, useRef } from 'react';
import Logo from '../Logo';
import StudentDropdownMenu from './StudentDropdownMenu';
import './DashboardHeader.css';

const DashboardHeader = ({ user, onLogout, onNavigate }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="dashboard-header">
      <div className="header-inner" style={{ gap: '1rem' }}>
        <div className="header-brand" onClick={() => onNavigate('dashboard')} style={{ cursor: 'pointer' }}>
           <Logo size="large" showText={true} />
        </div>
        
        <nav className="main-navigation" style={{ justifyContent: 'flex-end' }}>
          <div className="nav-dropdown">
             <button className="nav-dropdown-btn" onClick={() => onNavigate('AboutUs')}>
                About iVidhyarthi
             </button>
          </div>
          <div className="nav-dropdown">
             <button className="nav-dropdown-btn" onClick={() => onNavigate('home')}>
                All Courses
             </button>
          </div>
        </nav>
      
        <div className="header-actions" ref={dropdownRef}>
           <div 
              className="user-email-trigger" 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{ 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                color: 'white', 
                fontWeight: '500',
                background: 'rgba(255,255,255,0.1)',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                backdropFilter: 'blur(5px)'
              }}
            >
              {user?.email || 'student@example.com'}
              <span className={`arrow ${isDropdownOpen ? 'up' : 'down'}`} style={{ fontSize: '0.8rem' }}>▼</span>
            </div>
            
            {isDropdownOpen && (
              <StudentDropdownMenu 
                user={user} 
                onLogout={onLogout} 
                onNavigate={onNavigate}
                onClose={() => setIsDropdownOpen(false)} 
              />
            )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;