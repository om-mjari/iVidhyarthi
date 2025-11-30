import React, { useEffect, useState } from 'react';
import './RazorpayPayment.css';

const SuccessScreen = ({ paymentDetails, onContinue }) => {
  const [showContent, setShowContent] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Trigger content animation after checkmark appears
    setTimeout(() => setShowContent(true), 600);
    
    // Hide confetti after animation
    setTimeout(() => setShowConfetti(false), 3000);
  }, []);

  // Generate confetti particles
  const confettiColors = ['#14b8a6', '#0891b2', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const confettiParticles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 1
  }));

  return (
    <div className="success-screen">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="confetti-container">
          {confettiParticles.map(particle => (
            <div
              key={particle.id}
              className="confetti-piece"
              style={{
                left: `${particle.left}%`,
                backgroundColor: particle.color,
                animationDelay: `${particle.delay}s`,
                animationDuration: `${particle.duration}s`
              }}
            />
          ))}
        </div>
      )}

      {/* 3D Success Icon with Pulse */}
      <div className="success-icon-3d">
        <div className="success-icon-inner">
          <svg viewBox="0 0 52 52" className="checkmark-svg">
            <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
            <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
        </div>
      </div>

      {/* Animated Content */}
      <div className={`success-content ${showContent ? 'show' : ''}`}>
        <h1 className="success-title">Payment Successful</h1>
        <p className="success-subtitle">Thank you for your enrollment.</p>

        <div className="success-details-3d">
          <div className="detail-card">
            <div className="detail-icon">💰</div>
            <div className="detail-info">
              <span className="detail-label">Amount Paid:</span>
              <strong className="detail-value">₹{paymentDetails.amount}</strong>
            </div>
          </div>
          
          <div className="detail-card">
            <div className="detail-icon">🔑</div>
            <div className="detail-info">
              <span className="detail-label">Payment ID:</span>
              <strong className="detail-value">{paymentDetails.paymentId}</strong>
            </div>
          </div>
          
          <div className="detail-card">
            <div className="detail-icon">📅</div>
            <div className="detail-info">
              <span className="detail-label">Date:</span>
              <strong className="detail-value">{new Date(paymentDetails.date).toLocaleString()}</strong>
            </div>
          </div>
        </div>

        <button className="dashboard-btn-3d" onClick={onContinue}>
          <span className="btn-text">Continue to Dashboard</span>
          <span className="btn-arrow">→</span>
        </button>
      </div>
    </div>
  );
};

export default SuccessScreen;
