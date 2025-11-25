import React from 'react';
import './StudentDashboard.css';
import Logo from './Logo';

const HelpCenter = ({ onNavigateHome, onNavigateLogin }) => {
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
          <h1 style={{ fontSize: '3rem', color: '#1e293b', marginBottom: '2rem', textAlign: 'center' }}>Help Center</h1>
          
          <div style={{ background: 'white', padding: '3rem', borderRadius: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', marginBottom: '2rem' }}>
            <h2 style={{ color: '#14b8a6', fontSize: '2rem', marginBottom: '1.5rem' }}>Getting Started</h2>
            <div style={{ fontSize: '1.125rem', lineHeight: '2', color: '#475569' }}>
              <h3 style={{ color: '#1e293b', marginTop: '1.5rem', marginBottom: '1rem' }}>📚 How to Enroll in a Course</h3>
              <ol style={{ paddingLeft: '2rem' }}>
                <li>Browse our course catalog and select a course</li>
                <li>Click "Enroll Now" button</li>
                <li>Sign up or log in to your account</li>
                <li>Complete payment process</li>
                <li>Start learning immediately!</li>
              </ol>

              <h3 style={{ color: '#1e293b', marginTop: '2rem', marginBottom: '1rem' }}>🎓 Accessing Your Courses</h3>
              <p>After enrollment, access your courses from your Student Dashboard. Click on any course to continue learning from where you left off.</p>

              <h3 style={{ color: '#1e293b', marginTop: '2rem', marginBottom: '1rem' }}>📄 Downloading Certificates</h3>
              <p>Certificates are automatically generated upon course completion. You can download them from your dashboard under the "Certificates" section.</p>
            </div>
          </div>

          <div style={{ background: 'white', padding: '3rem', borderRadius: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', marginBottom: '2rem' }}>
            <h2 style={{ color: '#14b8a6', fontSize: '2rem', marginBottom: '1.5rem' }}>Common Issues</h2>
            <div style={{ fontSize: '1.125rem', lineHeight: '2', color: '#475569' }}>
              <h3 style={{ color: '#1e293b', marginTop: '1.5rem', marginBottom: '1rem' }}>❓ Can't log in to my account</h3>
              <p>Try resetting your password using the "Forgot Password" link on the login page. If issues persist, contact support.</p>

              <h3 style={{ color: '#1e293b', marginTop: '2rem', marginBottom: '1rem' }}>📹 Video not playing</h3>
              <p>Ensure you have a stable internet connection. Try refreshing the page or clearing your browser cache.</p>

              <h3 style={{ color: '#1e293b', marginTop: '2rem', marginBottom: '1rem' }}>💳 Payment failed</h3>
              <p>Verify your payment details and try again. Contact your bank if the issue continues.</p>
            </div>
          </div>

          <div style={{ background: 'white', padding: '3rem', borderRadius: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', textAlign: 'center' }}>
            <h2 style={{ color: '#14b8a6', fontSize: '2rem', marginBottom: '1.5rem' }}>Still Need Help?</h2>
            <p style={{ fontSize: '1.125rem', color: '#475569', marginBottom: '2rem' }}>Our support team is here to help you 24/7</p>
            <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: '1rem', color: '#64748b', marginBottom: '0.5rem' }}>Email Us</p>
                <p style={{ fontSize: '1.25rem', color: '#14b8a6', fontWeight: '600' }}>support@ividhyarthi.edu.in</p>
              </div>
              <div>
                <p style={{ fontSize: '1rem', color: '#64748b', marginBottom: '0.5rem' }}>Call Us</p>
                <p style={{ fontSize: '1.25rem', color: '#14b8a6', fontWeight: '600' }}>+91-1800-XXX-XXXX</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
