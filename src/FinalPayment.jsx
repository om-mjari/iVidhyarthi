import React, { useEffect, useState } from 'react';
import './Payment.css';

export default function FinalPayment({ onComplete }) {
  const [course, setCourse] = useState(null);
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    try { 
      setCourse(JSON.parse(localStorage.getItem('selected_course')) || null);
      
      // Get payment success data from localStorage
      const paymentSuccess = localStorage.getItem('payment_success');
      if (paymentSuccess) {
        setPaymentData(JSON.parse(paymentSuccess));
      }
    } catch (error) { 
      console.error('Error loading payment data:', error);
      setCourse(null); 
    }
  }, []);

  const handleContinue = () => {
    // Clear payment data from localStorage
    localStorage.removeItem('payment_success');
    onComplete?.();
  };

  if (!course || !paymentData) {
    return (
      <div className="pay-wrap">
        <div className="pay-card">
          <div className="success-icon">⚠️</div>
          <p>No payment information found.</p>
          <button className="btn-primary" onClick={handleContinue}>Continue to Dashboard</button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="pay-wrap">
      <div className="pay-container">
        <div className="pay-left">
          <div className="success-section">
            <div className="success-icon">✅</div>
            <h2>Payment Successful!</h2>
            <p className="success-message">
              Your payment has been processed successfully. Welcome to {course.name}!
            </p>
            
            <div className="order-details">
              <h3>📋 Payment Details</h3>
              <div className="detail-row">
                <span>Payment ID:</span>
                <strong>{paymentData.paymentId}</strong>
              </div>
              <div className="detail-row">
                <span>Order ID:</span>
                <strong>{paymentData.orderId}</strong>
              </div>
              <div className="detail-row">
                <span>Receipt No:</span>
                <strong>{paymentData.receiptNo}</strong>
              </div>
              <div className="detail-row">
                <span>Course:</span>
                <strong>{paymentData.courseName}</strong>
              </div>
              <div className="detail-row">
                <span>Amount Paid:</span>
                <strong>₹{paymentData.amount}</strong>
              </div>
              <div className="detail-row">
                <span>Payment Date:</span>
                <strong>{formatDate(paymentData.paymentDate)}</strong>
              </div>
              <div className="detail-row">
                <span>Status:</span>
                <strong className="status-success">✓ {paymentData.status}</strong>
              </div>
            </div>

            <div className="next-steps">
              <h3>🎯 What's Next?</h3>
              <ul>
                <li>✉️ Check your email ({paymentData.studentEmail}) for course access details</li>
                <li>📚 Log in to your learning dashboard to start the course</li>
                <li>🎓 Start your learning journey today!</li>
                <li>📄 A receipt has been sent to your email</li>
              </ul>
            </div>

            <button className="btn-primary" onClick={handleContinue}>
              🏠 Continue to Dashboard
            </button>
          </div>
        </div>

        <aside className="pay-right">
          <div className="summary">
            <img src={course.image} alt={course.name} />
            <div className="title">{course.name}</div>
            <div className="student-info">
              <p><strong>Student:</strong> {paymentData.studentName}</p>
              <p><strong>Email:</strong> {paymentData.studentEmail}</p>
            </div>
            <div className="divider" />
            <div className="row-line total">
              <span>Amount Paid</span>
              <b>₹{paymentData.amount}</b>
            </div>
            <div className="status-badge success">✅ Payment Complete</div>
            <div className="receipt-note">
              <p><small>Receipt #{paymentData.receiptNo}</small></p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
