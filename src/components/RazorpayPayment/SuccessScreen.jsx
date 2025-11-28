import React from 'react';
import './RazorpayPayment.css';

const SuccessScreen = ({ paymentDetails, onContinue }) => {
  return (
    <div className="success-screen">
      <div className="success-icon">✓</div>
      <h1>Payment Successful</h1>
      <p>Thank you for your enrollment.</p>

      <div className="success-details">
        <div className="detail-row">
          <span>Amount Paid:</span>
          <strong>₹{paymentDetails.amount}</strong>
        </div>
        <div className="detail-row">
          <span>Payment ID:</span>
          <strong>{paymentDetails.paymentId}</strong>
        </div>
        <div className="detail-row">
          <span>Date:</span>
          <strong>{new Date(paymentDetails.date).toLocaleString()}</strong>
        </div>
      </div>

      <button className="dashboard-btn" onClick={onContinue}>
        Continue to Dashboard
      </button>
    </div>
  );
};

export default SuccessScreen;
