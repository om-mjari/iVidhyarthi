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

  // Handle receipt download
  const handleDownloadReceipt = () => {
    // Create receipt content
    const receiptContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Payment Receipt - iVidhyarthi</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 40px;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }
    .receipt-container {
      background: white;
      padding: 40px;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #14b8a6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 2.5rem;
      color: #14b8a6;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .title {
      font-size: 1.8rem;
      color: #1e293b;
      margin: 0;
    }
    .success-badge {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 8px 20px;
      border-radius: 20px;
      font-size: 0.9rem;
      margin-top: 10px;
    }
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 30px 0;
    }
    .detail-item {
      padding: 20px;
      background: #f8fafc;
      border-radius: 12px;
      border-left: 4px solid #14b8a6;
    }
    .detail-label {
      font-size: 0.85rem;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .detail-value {
      font-size: 1.2rem;
      color: #1e293b;
      font-weight: 700;
      margin-top: 5px;
      word-break: break-all;
    }
    .amount-highlight {
      text-align: center;
      background: linear-gradient(135deg, #14b8a6 0%, #0891b2 100%);
      color: white;
      padding: 30px;
      border-radius: 12px;
      margin: 30px 0;
    }
    .amount-label {
      font-size: 1rem;
      opacity: 0.9;
      margin-bottom: 10px;
    }
    .amount-value {
      font-size: 3rem;
      font-weight: 900;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      color: #64748b;
      font-size: 0.9rem;
    }
    .thank-you {
      font-size: 1.5rem;
      color: #14b8a6;
      margin-bottom: 10px;
      font-weight: 600;
    }
    @media print {
      body { background: white; margin: 0; padding: 20px; }
      .receipt-container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="header">
      <div class="logo">🎓 iVidhyarthi</div>
      <h1 class="title">Payment Receipt</h1>
      <span class="success-badge">✓ Payment Successful</span>
    </div>

    <div class="amount-highlight">
      <div class="amount-label">Total Amount Paid</div>
      <div class="amount-value">₹${paymentDetails.amount}</div>
    </div>

    <div class="details-grid">
      <div class="detail-item">
        <div class="detail-label">Payment ID</div>
        <div class="detail-value">${paymentDetails.paymentId}</div>
      </div>
      
      <div class="detail-item">
        <div class="detail-label">Order ID</div>
        <div class="detail-value">${paymentDetails.orderId || 'N/A'}</div>
      </div>
      
      <div class="detail-item">
        <div class="detail-label">Transaction Date</div>
        <div class="detail-value">${new Date(paymentDetails.date).toLocaleString('en-IN', {
          dateStyle: 'full',
          timeStyle: 'short'
        })}</div>
      </div>
      
      <div class="detail-item">
        <div class="detail-label">Payment Status</div>
        <div class="detail-value" style="color: #10b981;">Completed</div>
      </div>
      
      <div class="detail-item">
        <div class="detail-label">Course Name</div>
        <div class="detail-value">${paymentDetails.courseName || 'Course Enrollment'}</div>
      </div>
      
      <div class="detail-item">
        <div class="detail-label">Student Email</div>
        <div class="detail-value">${paymentDetails.studentEmail || 'N/A'}</div>
      </div>
    </div>

    <div class="footer">
      <div class="thank-you">Thank You for Your Enrollment!</div>
      <p>This is a computer-generated receipt and does not require a signature.</p>
      <p>For any queries, contact us at support@ividhyarthi.com</p>
      <p style="margin-top: 20px; font-size: 0.8rem;">
        © ${new Date().getFullYear()} iVidhyarthi. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    // Create blob and download
    const blob = new Blob([receiptContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `iVidhyarthi_Receipt_${paymentDetails.paymentId}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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

        <div className="success-actions">
          <button className="receipt-btn-3d" onClick={handleDownloadReceipt}>
            <span className="btn-icon">📄</span>
            <span className="btn-text">Download Receipt</span>
          </button>
          
          <button className="dashboard-btn-3d" onClick={onContinue}>
            <span className="btn-text">Continue to Dashboard</span>
            <span className="btn-arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessScreen;
