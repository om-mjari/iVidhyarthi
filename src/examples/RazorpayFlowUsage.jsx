/**
 * ========================================
 * RAZORPAY ANIMATED FLOW - USAGE GUIDE
 * ========================================
 * 
 * Step-by-step animated payment flow matching:
 * https://youtube.com/shorts/Rc94SK_9jv8
 * 
 * State Machine Flow:
 * idle → confirm → loadingRazorpay → razorpayOpen → processing → success/failure
 */

import React, { useState } from 'react';
import RazorpayFlow from '../components/RazorpayFlow';

/**
 * ========================================
 * EXAMPLE 1: Simple Usage
 * ========================================
 */
const SimpleExample = () => {
  const [showPayment, setShowPayment] = useState(false);

  const handlePayClick = () => {
    setShowPayment(true);
  };

  const handleSuccess = (paymentData) => {
    console.log('Payment Success:', paymentData);
    // paymentData contains:
    // - payment_id
    // - order_id
    // - amount
    // - date

    alert(`Payment Successful! ID: ${paymentData.payment_id}`);
    setShowPayment(false);
  };

  const handleCancel = () => {
    console.log('Payment Cancelled');
    setShowPayment(false);
  };

  return (
    <div>
      <button onClick={handlePayClick}>
        PAY ₹826
      </button>

      {showPayment && (
        <RazorpayFlow
          amount={826}
          courseName="Basic Python Programming"
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

/**
 * ========================================
 * EXAMPLE 2: With Course Data
 * ========================================
 */
const CoursePaymentExample = () => {
  const [showPayment, setShowPayment] = useState(false);
  
  // Example course data
  const course = {
    name: 'Basic Python Programming',
    price: 700,
    gst: 126,
    total: 826
  };

  const student = {
    name: 'John Doe',
    email: 'john@example.com',
    contact: '9876543210'
  };

  return (
    <div>
      {/* Your existing payment card UI */}
      <div className="payment-card">
        <h2>{course.name}</h2>
        <p>Base Price: ₹{course.price}</p>
        <p>GST (18%): ₹{course.gst}</p>
        <h3>Total: ₹{course.total}</h3>
        
        <button onClick={() => setShowPayment(true)}>
          PAY ₹{course.total}
        </button>
      </div>

      {/* Razorpay Animated Flow Overlay */}
      {showPayment && (
        <RazorpayFlow
          amount={course.total}
          courseName={course.name}
          customerName={student.name}
          customerEmail={student.email}
          customerContact={student.contact}
          onSuccess={(paymentData) => {
            // Store payment data
            localStorage.setItem('payment_success', JSON.stringify(paymentData));
            
            // Navigate to success page or dashboard
            window.location.href = '/dashboard';
          }}
          onCancel={() => {
            setShowPayment(false);
            alert('Payment cancelled');
          }}
        />
      )}
    </div>
  );
};

/**
 * ========================================
 * EXAMPLE 3: Integration with Existing Button
 * ========================================
 */
const ExistingButtonIntegration = () => {
  const [showPayment, setShowPayment] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Your existing payment button handler
  const handleExistingPayButton = () => {
    setProcessing(true);
    setShowPayment(true);
  };

  const handlePaymentSuccess = (paymentData) => {
    console.log('Payment completed:', paymentData);
    
    // Your existing success logic
    localStorage.setItem('payment_success', JSON.stringify(paymentData));
    setShowPayment(false);
    setProcessing(false);
    
    // Navigate or show success message
    alert('Payment successful! Redirecting to dashboard...');
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 1000);
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
    setProcessing(false);
  };

  return (
    <div>
      {/* YOUR EXISTING UI - NO CHANGES NEEDED */}
      <div className="existing-payment-ui">
        <div className="price-summary">
          <h3>Total: ₹826</h3>
        </div>
        
        {/* Your existing button - just connect the handler */}
        <button 
          className="btn-primary" 
          onClick={handleExistingPayButton}
          disabled={processing}
        >
          {processing ? 'Processing...' : 'PAY ₹826'}
        </button>
      </div>

      {/* NEW: Razorpay Flow Overlay (appears on top) */}
      {showPayment && (
        <RazorpayFlow
          amount={826}
          courseName="Basic Python Programming"
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      )}
    </div>
  );
};

/**
 * ========================================
 * PAYMENT FLOW SCREENS (Automatic)
 * ========================================
 * 
 * When user clicks PAY button:
 * 
 * 1. CONFIRM SCREEN (Step 1)
 *    - Shows: "You are paying ₹826"
 *    - Course name
 *    - "Proceed to Pay" button
 *    - User clicks → Next step
 * 
 * 2. LOADING SCREEN (Step 2)
 *    - Grey background with loading spinner
 *    - Text: "Loading Razorpay..."
 *    - Loads Razorpay script
 *    - Duration: 1-2 seconds
 * 
 * 3. RAZORPAY POPUP (Step 3)
 *    - Official Razorpay checkout opens
 *    - Shows payment options: UPI, Card, NetBanking
 *    - User completes payment
 * 
 * 4. PROCESSING SCREEN (Step 4)
 *    - Shows after payment
 *    - Text: "Processing your payment..."
 *    - Verifies on backend
 *    - Duration: 1-2 seconds
 * 
 * 5A. SUCCESS SCREEN (If successful)
 *     - Animated 3D spinning coin
 *     - Particle effects
 *     - Text: "Payment Successful!"
 *     - Shows: amount, payment_id, order_id, date
 *     - "Continue to Dashboard" button
 * 
 * 5B. FAILURE SCREEN (If failed/cancelled)
 *     - Error icon
 *     - Text: "Payment Failed"
 *     - Error message
 *     - "Try Again" button
 */

/**
 * ========================================
 * PROPS REFERENCE
 * ========================================
 * 
 * <RazorpayFlow
 *   amount={826}                    // Required: Amount in rupees
 *   courseName="Course Name"        // Optional: Shown in UI
 *   customerName="Student Name"     // Optional: Prefill in Razorpay
 *   customerEmail="email@x.com"     // Optional: Prefill in Razorpay
 *   customerContact="9999999999"    // Optional: Prefill in Razorpay
 *   onSuccess={(data) => {}}        // Required: Called on success
 *   onCancel={() => {}}             // Required: Called on cancel/failure
 * />
 * 
 * Success Data Format:
 * {
 *   payment_id: "pay_KzgNzpqGPjHWYk",
 *   order_id: "order_KzgNzpqGPjHWYk",
 *   amount: 826,
 *   date: "11/27/2025, 6:40:00 PM"
 * }
 */

/**
 * ========================================
 * TESTING
 * ========================================
 * 
 * Demo Mode (Current):
 * - Click PAY button
 * - See all animation screens
 * - Payment auto-succeeds in 3-4 seconds
 * - No real Razorpay popup
 * 
 * Live Razorpay Mode:
 * - Add real keys to backend/.env:
 *   RAZORPAY_KEY_ID=rzp_test_YOUR_KEY
 *   RAZORPAY_KEY_SECRET=YOUR_SECRET
 * - Restart backend
 * - Click PAY button
 * - Official Razorpay popup opens!
 * - Test card: 4111 1111 1111 1111
 * - CVV: 123, Expiry: 12/25
 */

/**
 * ========================================
 * CUSTOMIZATION
 * ========================================
 * 
 * Colors:
 * - Edit src/components/RazorpayFlow.css
 * - Change gradient colors, button styles
 * 
 * Animations:
 * - Coin animation: .coin class
 * - Particles: .particle class
 * - Timing: setTimeout delays in component
 * 
 * Text:
 * - All text is in the component JSX
 * - Easy to find and modify
 */

export default {
  SimpleExample,
  CoursePaymentExample,
  ExistingButtonIntegration
};
