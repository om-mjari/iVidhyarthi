import React from 'react';

const EnhancedFooter = ({ onNavigateToPage }) => {
  const handleNavigation = (page) => {
    if (onNavigateToPage) {
      onNavigateToPage(page);
    }
  };

  return (
    <footer className="enhanced-footer">
      {/* Row 1: About Section */}
      <div className="footer-row footer-about">
        <div className="footer-container">
          <div className="footer-brand">
            <h3 className="footer-brand-name">iVidhyarthi</h3>
            <p className="footer-brand-tagline">Empowering Digital Learning for Everyone</p>
          </div>
          <p className="footer-description">
            iVidhyarthi is India's leading online learning platform, offering world-class education in technology, 
            business, design, and more. Learn from expert instructors, earn recognized certificates, and advance 
            your career with flexible, affordable courses designed for the modern learner.
          </p>
        </div>
      </div>

      {/* Row 2: Links Section */}
      <div className="footer-row footer-links-row">
        <div className="footer-container">
          <div className="footer-columns">
            {/* Column 1: Quick Links */}
            <div className="footer-column">
              <h4 className="footer-column-title">Quick Links</h4>
              <ul className="footer-link-list">
                <li><a onClick={() => handleNavigation('AboutUs')} className="footer-link-item" style={{ cursor: 'pointer' }}>About Us</a></li>
                <li><a onClick={() => handleNavigation('CourseCatalog')} className="footer-link-item" style={{ cursor: 'pointer' }}>All Courses</a></li>
                <li><a onClick={() => handleNavigation('CourseCatalog')} className="footer-link-item" style={{ cursor: 'pointer' }}>Categories</a></li>
                <li><a onClick={() => handleNavigation('LecturerEligibility')} className="footer-link-item" style={{ cursor: 'pointer' }}>Become an Instructor</a></li>
                <li><a onClick={() => handleNavigation('Blog')} className="footer-link-item" style={{ cursor: 'pointer' }}>Blog</a></li>
                <li><a onClick={() => handleNavigation('Careers')} className="footer-link-item" style={{ cursor: 'pointer' }}>Careers</a></li>
              </ul>
            </div>

            {/* Column 2: Help & Support */}
            <div className="footer-column">
              <h4 className="footer-column-title">Help & Support</h4>
              <ul className="footer-link-list">
                <li><a onClick={() => handleNavigation('HelpCenter')} className="footer-link-item" style={{ cursor: 'pointer' }}>Help Center</a></li>
                <li><a onClick={() => handleNavigation('FAQ')} className="footer-link-item" style={{ cursor: 'pointer' }}>FAQs</a></li>
                <li><a onClick={() => handleNavigation('ContactUs')} className="footer-link-item" style={{ cursor: 'pointer' }}>Contact Us</a></li>
                <li><a onClick={() => handleNavigation('HelpCenter')} className="footer-link-item" style={{ cursor: 'pointer' }}>Technical Support</a></li>
                <li><a onClick={() => handleNavigation('ContactUs')} className="footer-link-item" style={{ cursor: 'pointer' }}>Feedback</a></li>
                <li><a onClick={() => handleNavigation('HelpCenter')} className="footer-link-item" style={{ cursor: 'pointer' }}>Accessibility</a></li>
              </ul>
            </div>

            {/* Column 3: Community */}
            <div className="footer-column">
              <h4 className="footer-column-title">Community</h4>
              <ul className="footer-link-list">
                <li><a onClick={() => handleNavigation('ContactUs')} className="footer-link-item" style={{ cursor: 'pointer' }}>Student Forum</a></li>
                <li><a onClick={() => handleNavigation('HelpVideos')} className="footer-link-item" style={{ cursor: 'pointer' }}>Events & Webinars</a></li>
                <li><a onClick={() => handleNavigation('LocalChapters')} className="footer-link-item" style={{ cursor: 'pointer' }}>Local Chapters</a></li>
                <li><a onClick={() => handleNavigation('StudentPrograms')} className="footer-link-item" style={{ cursor: 'pointer' }}>Student Programs</a></li>
                <li><a onClick={() => handleNavigation('Team')} className="footer-link-item" style={{ cursor: 'pointer' }}>Success Stories</a></li>
                <li><a onClick={() => handleNavigation('ContactUs')} className="footer-link-item" style={{ cursor: 'pointer' }}>Newsletter</a></li>
              </ul>
            </div>

            {/* Column 4: Connect */}
            <div className="footer-column">
              <h4 className="footer-column-title">Connect With Us</h4>
              <div className="footer-social-links">
                <a href="#facebook" className="social-link" aria-label="Facebook">📘</a>
                <a href="#twitter" className="social-link" aria-label="Twitter">🐦</a>
                <a href="#linkedin" className="social-link" aria-label="LinkedIn">💼</a>
                <a href="#instagram" className="social-link" aria-label="Instagram">📷</a>
                <a href="#youtube" className="social-link" aria-label="YouTube">📺</a>
              </div>
              <div className="footer-contact-info">
                <p className="contact-item">📧 support@ividhyarthi.edu.in</p>
                <p className="contact-item">📞 +91-1800-XXX-XXXX</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Legal & Copyright */}
      <div className="footer-row footer-bottom">
        <div className="footer-container">
          <div className="footer-bottom-content">
            <p className="footer-copyright">
              © 2025 iVidhyarthi — Empowering Digital Learning for Everyone
            </p>
            <div className="footer-legal-links">
              <a href="#privacy" className="footer-legal-link">Privacy Policy</a>
              <span className="footer-divider">•</span>
              <a href="#terms" className="footer-legal-link">Terms of Use</a>
              <span className="footer-divider">•</span>
              <a href="#cookies" className="footer-legal-link">Cookie Policy</a>
              <span className="footer-divider">•</span>
              <a href="#help" className="footer-legal-link">Help Center</a>
            </div>
          </div>
          <p className="footer-tagline">
            An initiative to make education accessible and future-ready.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default EnhancedFooter;
