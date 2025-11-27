import React, { useEffect, useState } from 'react';
import './Payment.css';
import { handlePayment } from './utils/razorpayHandler';
import RazorpayFlow from './components/RazorpayFlow';

export default function PaymentGateway({ method = 'card', onBack, onComplete }) {
  const [processing, setProcessing] = useState(false);
  const [course, setCourse] = useState(null);
  const [paymentType, setPaymentType] = useState('Card');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);
  const [studentInfo, setStudentInfo] = useState({
    id: '',
    name: '',
    email: ''
  });

  useEffect(() => {
    try {
      const savedCourse = JSON.parse(localStorage.getItem('selected_course')) || null;
      setCourse(savedCourse);
      
      // Get student info from localStorage (stored after login)
      const authUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
      const authToken = localStorage.getItem('auth_token');
      
      // Decode JWT to get userId
      let userId = '';
      if (authToken) {
        try {
          const tokenParts = authToken.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            userId = payload.userId || '';
          }
        } catch (e) {
          console.error('Error decoding token:', e);
        }
      }
      
      // Fallback to old localStorage keys if needed
      const userName = authUser.name || localStorage.getItem('user_name') || 'Student';
      const userEmail = authUser.email || localStorage.getItem('user_email') || 'student@ividhyarthi.com';
      
      setStudentInfo({
        id: userId || localStorage.getItem('user_id') || '1',
        name: userName,
        email: userEmail
      });
      
      console.log('💳 Payment Gateway - Student Info:', { userId, userName, userEmail });
    } catch (error) {
      console.error('Error loading payment data:', error);
      setCourse(null);
    }
  }, []);

  const taxes = Math.round((course?.price || 0) * 0.18);
  const total = (course?.price || 0) + taxes;

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePay = async () => {
    console.log('💰 PAY button clicked!');
    if (!course) {
      alert('Course details not found!');
      return;
    }

    // Show the animated payment flow
    console.log('🚀 Opening payment flow...');
    setShowPaymentFlow(true);
  };

  // Handle payment success from RazorpayFlow
  const handlePaymentSuccess = (paymentData) => {
    console.log('✅ Payment completed:', paymentData);
    
    // Store payment details for success page
    localStorage.setItem('payment_success', JSON.stringify({
      ...paymentData,
      courseName: course.name,
      studentName: studentInfo.name,
      studentEmail: studentInfo.email,
    }));

    // Close flow and navigate
    setShowPaymentFlow(false);
    setProcessing(false);
    onComplete?.('final');
  };

  // Handle payment cancellation
  const handlePaymentCancel = () => {
    console.log('❌ Payment cancelled');
    setShowPaymentFlow(false);
    setProcessing(false);
  };

  return (
    <div className="pay-wrap">
      {/* Animated Payment Flow Overlay */}
      {showPaymentFlow && (
        <RazorpayFlow
          amount={total}
          courseName={course?.name || 'Course'}
          customerName={studentInfo.name}
          customerEmail={studentInfo.email}
          customerContact="9999999999"
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      )}

      <div className="pay-container">
        <div className="pay-left">
          <div className="gateway-content">
            <h2>💳 Payment Gateway</h2>
            
            {/* Demo Mode Banner */}
            {isDemoMode && (
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '15px 20px',
                borderRadius: '10px',
                marginBottom: '20px',
                border: '2px solid #5a67d8',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '24px' }}>🎭</span>
                  <strong style={{ fontSize: '16px' }}>DEMO MODE - Testing Environment</strong>
                </div>
                <p style={{ margin: '5px 0', fontSize: '13px', opacity: '0.95' }}>
                  ✓ Simulated payment • No real charges • Safe for testing
                </p>
              </div>
            )}
            
            <p className="gateway-message">Choose payment method and click Pay Now</p>
            
            {/* Payment Method Selection */}
            <div className="payment-methods">
              <h3>Select Payment Method:</h3>
              <div className="payment-type-options">
                <label className={paymentType === 'Card' ? 'active' : ''}>
                  <input
                    type="radio"
                    name="paymentType"
                    value="Card"
                    checked={paymentType === 'Card'}
                    onChange={(e) => setPaymentType(e.target.value)}
                  />
                  💳 Credit/Debit Card
                </label>
                <label className={paymentType === 'UPI' ? 'active' : ''}>
                  <input
                    type="radio"
                    name="paymentType"
                    value="UPI"
                    checked={paymentType === 'UPI'}
                    onChange={(e) => setPaymentType(e.target.value)}
                  />
                  📱 UPI
                </label>
                <label className={paymentType === 'NetBanking' ? 'active' : ''}>
                  <input
                    type="radio"
                    name="paymentType"
                    value="NetBanking"
                    checked={paymentType === 'NetBanking'}
                    onChange={(e) => setPaymentType(e.target.value)}
                  />
                  🏦 Net Banking
                </label>
                <label className={paymentType === 'Wallet' ? 'active' : ''}>
                  <input
                    type="radio"
                    name="paymentType"
                    value="Wallet"
                    checked={paymentType === 'Wallet'}
                    onChange={(e) => setPaymentType(e.target.value)}
                  />
                  👛 Wallet
                </label>
              </div>
            </div>
            
            <div className="course-summary-left">
              <img src={course?.image} alt={course?.name || 'Course'} />
              <div className="title">{course?.name || 'Selected course'}</div>
              <div className="price-breakdown">
                <div className="row-line"><span>Base Price</span><b>₹{course?.price || 0}</b></div>
                <div className="row-line"><span>GST (18%)</span><b>₹{taxes}</b></div>
                <div className="divider" />
                <div className="row-line total"><span>Total</span><b>₹{total}</b></div>
              </div>
            </div>

            <div className="gateway-actions">
              <button className="btn-secondary" onClick={onBack} disabled={processing}>Back</button>
              <button className="btn-primary" disabled={processing} onClick={handlePay}>
                {processing ? '⏳ Processing...' : `💰 Pay ₹${total}`}
              </button>
            </div>
            
            <div className="razorpay-badge">
              <p style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                justifyContent: 'center'
              }}>
                <span>🔒</span>
                <span>Secured by Razorpay</span>
                {isDemoMode && <span style={{
                  background: '#667eea',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}>TEST MODE</span>}
              </p>
            </div>
          </div>
        </div>

        <aside className="pay-right">
          <div className="summary">
            <img src={course?.image} alt={course?.name || 'Course'} />
            <div className="title">{course?.name || 'Selected course'}</div>
            <div className="row-line"><span>Base Price</span><b>₹{course?.price || 0}</b></div>
            <div className="row-line"><span>GST (18%)</span><b>₹{taxes}</b></div>
            <div className="divider" />
            <div className="row-line total"><span>Total</span><b>₹{total}</b></div>
          </div>
        </aside>
      </div>
    </div>
  );
}
