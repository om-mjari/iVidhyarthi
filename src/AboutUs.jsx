import React from 'react';
import './StudentDashboard.css';
import Logo from './Logo';

const AboutUs = ({ onNavigateHome, onNavigateLogin }) => {
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-inner">
          <div className="header-brand">
            <Logo size="large" showText={true} onClick={onNavigateHome} style={{ cursor: 'pointer' }} />
          </div>
          <div className="header-actions">
            <button className="login-signup-btn" onClick={onNavigateLogin}>
              Login/Signup
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content" style={{ padding: '4rem 2rem' }}>
        <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '3rem', color: '#1e293b', marginBottom: '1.5rem', textAlign: 'center' }}>About iVidhyarthi</h1>
          
          <div style={{ background: 'white', padding: '3rem', borderRadius: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', marginBottom: '2rem' }}>
            <h2 style={{ color: '#14b8a6', fontSize: '2rem', marginBottom: '1.5rem' }}>Our Story</h2>
            <p style={{ fontSize: '1.125rem', lineHeight: '1.8', color: '#475569', marginBottom: '1.5rem' }}>
              iVidhyarthi is India's leading online learning platform, dedicated to making quality education accessible to everyone. 
              Founded with the vision of democratizing education, we bridge the gap between aspirations and achievements through 
              innovative, flexible, and affordable learning solutions.
            </p>
            <p style={{ fontSize: '1.125rem', lineHeight: '1.8', color: '#475569' }}>
              Our platform brings together expert instructors, cutting-edge curriculum, and a vibrant community of learners 
              to create an unparalleled learning experience that empowers individuals to reach their full potential.
            </p>
          </div>

          <div style={{ background: 'white', padding: '3rem', borderRadius: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', marginBottom: '2rem' }}>
            <h2 style={{ color: '#14b8a6', fontSize: '2rem', marginBottom: '1.5rem' }}>What We Offer</h2>
            <ul style={{ fontSize: '1.125rem', lineHeight: '2', color: '#475569', paddingLeft: '2rem' }}>
              <li>Expert-led courses in technology, business, design, and more</li>
              <li>Industry-relevant curriculum designed by professionals</li>
              <li>Flexible learning schedules that fit your lifestyle</li>
              <li>Recognized certificates to boost your career</li>
              <li>Affordable pricing with financial aid options</li>
              <li>Interactive learning with live sessions and projects</li>
            </ul>
          </div>

          <div style={{ background: 'white', padding: '3rem', borderRadius: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
            <h2 style={{ color: '#14b8a6', fontSize: '2rem', marginBottom: '1.5rem' }}>Our Impact</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', textAlign: 'center' }}>
              <div>
                <h3 style={{ fontSize: '3rem', color: '#14b8a6', marginBottom: '0.5rem' }}>50,000+</h3>
                <p style={{ fontSize: '1.125rem', color: '#64748b' }}>Active Learners</p>
              </div>
              <div>
                <h3 style={{ fontSize: '3rem', color: '#14b8a6', marginBottom: '0.5rem' }}>500+</h3>
                <p style={{ fontSize: '1.125rem', color: '#64748b' }}>Expert Instructors</p>
              </div>
              <div>
                <h3 style={{ fontSize: '3rem', color: '#14b8a6', marginBottom: '0.5rem' }}>1,000+</h3>
                <p style={{ fontSize: '1.125rem', color: '#64748b' }}>Courses Available</p>
              </div>
              <div>
                <h3 style={{ fontSize: '3rem', color: '#14b8a6', marginBottom: '0.5rem' }}>95%</h3>
                <p style={{ fontSize: '1.125rem', color: '#64748b' }}>Satisfaction Rate</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
