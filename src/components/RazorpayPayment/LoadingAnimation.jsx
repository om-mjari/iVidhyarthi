import React from 'react';
import './RazorpayPayment.css';

const LoadingAnimation = ({ text = "Processing Transaction..." }) => {
  return (
    <div className="loading-overlay">
      <div className="spinner"></div>
      <div className="loading-text">{text}</div>
    </div>
  );
};

export default LoadingAnimation;
