/**
 * Razorpay Animated Payment Flow Component
 * ==========================================
 * Complete step-by-step payment flow with animations
 * Matches YouTube short: https://youtube.com/shorts/Rc94SK_9jv8
 * 
 * State Machine:
 * idle → confirm → loadingRazorpay → razorpayOpen → processing → success/failure
 */

import React, { useState, useEffect } from 'react';
import './RazorpayFlow.css';

const RazorpayFlow = ({ 
  amount, 
  courseName = 'Course',
  onSuccess, 
  onCancel,
  customerName = 'Student',
  customerEmail = 'student@ividhyarthi.com',
  customerContact = '9999999999',
}) => {
  // State machine for payment flow
  const [step, setStep] = useState('confirm'); // idle, confirm, loadingRazorpay, razorpayOpen, processing, success, failure
  const [paymentData, setPaymentData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState(5);

  /**
   * Auto-redirect countdown on success
   */
  useEffect(() => {
    if (step === 'success') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleContinue();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [step]);

  /**
   * STEP 1: Load Razorpay script dynamically
   */
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  /**
   * STEP 2: Create backend order and initialize Razorpay
   */
  const initiateRazorpayPayment = async () => {
    try {
      // Create order on backend
      const orderResponse = await fetch('http://localhost:5000/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: localStorage.getItem('user_id') || '1',
          courseId: '1',
          amount: amount,
          type: 'Card',
          studentName: customerName,
          studentEmail: customerEmail,
          courseName: courseName,
        })
      });

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        throw new Error(orderData.message || 'Order creation failed');
      }

      // Configure Razorpay options
      const options = {
        key: 'rzp_test_DEMO_MODE', // Demo test key
        amount: Math.round(amount * 100), // Convert to paise
        currency: 'INR',
        name: 'iVidhyarthi',
        description: courseName,
        order_id: orderData.data.orderId,
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerContact,
        },
        theme: {
          color: '#2E8BFF',
        },
        handler: async function (response) {
          // Payment successful - move to processing state
          console.log('✅ Payment Success:', response);
          setStep('processing');
          
          // Simulate processing delay
          setTimeout(async () => {
            try {
              // Verify payment on backend
              const verifyResponse = await fetch('http://localhost:5000/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  receiptNo: orderData.data.receiptNo
                })
              });

              const verifyData = await verifyResponse.json();

              if (verifyData.success) {
                // Store payment data and show success
                setPaymentData({
                  payment_id: response.razorpay_payment_id,
                  order_id: response.razorpay_order_id,
                  amount: amount,
                  date: new Date().toLocaleString(),
                });
                setStep('success');
              } else {
                throw new Error('Payment verification failed');
              }
            } catch (error) {
              console.error('Verification error:', error);
              setErrorMessage(error.message);
              setStep('failure');
            }
          }, 2000); // 2 second processing delay
        },
        modal: {
          ondismiss: function() {
            console.log('Payment cancelled by user');
            setErrorMessage('Payment was cancelled');
            setStep('failure');
          }
        }
      };

      // Check if demo mode - simulate payment
      if (orderData.demoMode) {
        console.log('🎭 Demo mode - simulating payment');
        setStep('processing');
        
        setTimeout(async () => {
          // Create demo payment data
          const demoPayment = {
            razorpay_order_id: orderData.data.orderId,
            razorpay_payment_id: `pay_DEMO_${Date.now()}`,
            razorpay_signature: `sig_DEMO_${Date.now()}`,
          };

          // Verify demo payment
          const verifyResponse = await fetch('http://localhost:5000/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...demoPayment,
              receiptNo: orderData.data.receiptNo
            })
          });

          const verifyData = await verifyResponse.json();

          if (verifyData.success) {
            setPaymentData({
              payment_id: demoPayment.razorpay_payment_id,
              order_id: demoPayment.razorpay_order_id,
              amount: amount,
              date: new Date().toLocaleString(),
            });
            setStep('success');
          } else {
            setErrorMessage('Demo payment verification failed');
            setStep('failure');
          }
        }, 2500);
        return;
      }

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();
      setStep('razorpayOpen');

    } catch (error) {
      console.error('Payment error:', error);
      setErrorMessage(error.message || 'Payment initialization failed');
      setStep('failure');
    }
  };

  /**
   * Main payment handler function
   */
  const handleRazorpayPayment = async () => {
    // Step 1: Show confirm screen
    setStep('confirm');
  };

  /**
   * Proceed from confirm to loading Razorpay
   */
  const handleProceedToPay = async () => {
    // Step 2: Show loading screen
    setStep('loadingRazorpay');

    // Step 3: Load Razorpay script
    const scriptLoaded = await loadRazorpayScript();

    if (!scriptLoaded) {
      setErrorMessage('Failed to load Razorpay. Please check your connection.');
      setStep('failure');
      return;
    }

    // Step 4: Initialize payment
    setTimeout(() => {
      initiateRazorpayPayment();
    }, 1500); // Simulate loading delay
  };

  /**
   * Handle try again from failure
   */
  const handleTryAgain = () => {
    setStep('idle');
    setErrorMessage('');
    if (onCancel) onCancel();
  };

  /**
   * Handle continue from success
   */
  const handleContinue = () => {
    if (onSuccess) onSuccess(paymentData);
    setStep('idle');
  };

  // Render nothing when idle
  if (step === 'idle') {
    return null;
  }

  return (
    <div className="razorpay-flow-overlay">
      {/* STEP 1: Confirm Payment Screen */}
      {step === 'confirm' && (
        <div className="flow-screen confirm-screen">
          <div className="confirm-card">
            <div className="confirm-icon">💳</div>
            <h2>Confirm Payment</h2>
            <div className="confirm-details">
              <p className="confirm-label">You are paying</p>
              <h1 className="confirm-amount">₹{amount}</h1>
              <p className="confirm-course">{courseName}</p>
            </div>
            <div className="confirm-actions">
              <button 
                className="btn-proceed" 
                onClick={handleProceedToPay}
              >
                Proceed to Pay
              </button>
              <button 
                className="btn-cancel" 
                onClick={handleTryAgain}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Loading Razorpay Screen */}
      {step === 'loadingRazorpay' && (
        <div className="flow-screen loading-screen">
          <div className="loading-content">
            <div className="loading-spinner">
              <div className="spinner-circle"></div>
            </div>
            <h3>Loading Razorpay...</h3>
            <p>Please wait</p>
          </div>
        </div>
      )}

      {/* STEP 3: Processing Payment Screen */}
      {step === 'processing' && (
        <div className="flow-screen processing-screen">
          <div className="processing-content">
            <div className="processing-spinner">
              <div className="spinner-circle"></div>
            </div>
            <h3>Processing your payment...</h3>
            <p>Please do not close this window</p>
          </div>
        </div>
      )}

      {/* STEP 4: Success Screen with Coin Animation */}
      {step === 'success' && (
        <div className="flow-screen success-screen">
          <div className="success-content">
            {/* Coin Animation */}
            <div className="coin-animation">
              <div className="coin">
                <div className="coin-face front">₹</div>
                <div className="coin-face back">✓</div>
              </div>
              <div className="success-particles">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="particle" style={{
                    '--angle': `${(360 / 12) * i}deg`,
                    '--delay': `${i * 0.1}s`
                  }}></div>
                ))}
              </div>
            </div>

            {/* Success Message */}
            <div className="success-message">
              <h2>Payment Successful!</h2>
              <div className="success-amount">
                <span className="amount-label">You paid</span>
                <span className="amount-value">₹{paymentData?.amount}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="payment-details">
              <div className="detail-row">
                <span className="detail-label">Payment ID</span>
                <span className="detail-value">{paymentData?.payment_id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Order ID</span>
                <span className="detail-value">{paymentData?.order_id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date & Time</span>
                <span className="detail-value">{paymentData?.date}</span>
              </div>
            </div>

            {/* Auto-redirect Countdown */}
            <div className="auto-redirect">
              <div className="countdown-circle">
                <svg className="countdown-svg" viewBox="0 0 100 100">
                  <circle className="countdown-bg" cx="50" cy="50" r="45" />
                  <circle 
                    className="countdown-progress" 
                    cx="50" 
                    cy="50" 
                    r="45"
                    style={{
                      strokeDashoffset: `${283 * (1 - countdown / 5)}`
                    }}
                  />
                </svg>
                <div className="countdown-number">{countdown}</div>
              </div>
              <p className="redirect-text">Redirecting to dashboard...</p>
              <button className="btn-continue-now" onClick={handleContinue}>
                Continue Now →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: Failure Screen */}
      {step === 'failure' && (
        <div className="flow-screen failure-screen">
          <div className="failure-content">
            <div className="failure-icon">❌</div>
            <h2>Payment Failed</h2>
            <p className="failure-message">
              {errorMessage || 'Payment was cancelled or failed. Please try again.'}
            </p>
            <button 
              className="btn-try-again" 
              onClick={handleTryAgain}
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Hook to trigger payment flow
 * Usage: const { startPayment } = useRazorpayFlow();
 */
export const useRazorpayFlow = () => {
  const [showFlow, setShowFlow] = useState(false);
  const [flowProps, setFlowProps] = useState({});

  const startPayment = (props) => {
    setFlowProps(props);
    setShowFlow(true);
  };

  const closeFlow = () => {
    setShowFlow(false);
    setFlowProps({});
  };

  return {
    startPayment,
    showFlow,
    flowProps,
    closeFlow,
    FlowComponent: showFlow ? (
      <RazorpayFlow 
        {...flowProps} 
        onSuccess={(data) => {
          if (flowProps.onSuccess) flowProps.onSuccess(data);
          closeFlow();
        }}
        onCancel={() => {
          if (flowProps.onCancel) flowProps.onCancel();
          closeFlow();
        }}
      />
    ) : null
  };
};

export default RazorpayFlow;
