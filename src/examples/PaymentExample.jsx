/**
 * Example: How to Use Razorpay Payment Handler
 * =============================================
 * Copy this code into your payment component
 */

import React, { useState } from 'react';
import { handlePayment } from './utils/razorpayHandler';

const PaymentButtonExample = () => {
  const [processing, setProcessing] = useState(false);

  /**
   * Example 1: Simple Payment (Minimal)
   */
  const handleSimplePayment = async () => {
    setProcessing(true);
    
    try {
      const result = await handlePayment(826); // Amount in rupees
      
      console.log('Payment Success:', result);
      // result = {
      //   payment_id: "pay_xxx",
      //   order_id: "order_xxx",
      //   amount: 826,
      //   payment_status: "SUCCESS"
      // }
      
      alert(`Payment Successful!\nPayment ID: ${result.payment_id}`);
      
    } catch (error) {
      console.error('Payment Failed:', error);
      alert('Payment failed: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Example 2: Full Payment (With All Options)
   */
  const handleFullPayment = async () => {
    setProcessing(true);
    
    const amount = 826; // ₹826
    
    const options = {
      // Course details
      courseId: '12345',
      courseName: 'Basic Python Programming',
      description: 'Payment for Basic Python Programming',
      
      // Student details
      studentId: 'student_001',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerContact: '9876543210',
      
      // Payment type
      paymentType: 'Card', // Card, UPI, NetBanking, Wallet
      
      // Optional: Pre-created order ID (if you created order separately)
      // orderId: 'order_xxx',
    };
    
    try {
      const result = await handlePayment(amount, options);
      
      // Store payment details
      localStorage.setItem('last_payment', JSON.stringify(result));
      
      // Navigate to success page or show success message
      alert(`✅ Payment Successful!\n\nPayment ID: ${result.payment_id}\nOrder ID: ${result.order_id}\nAmount: ₹${result.amount}\nStatus: ${result.payment_status}`);
      
    } catch (error) {
      if (error.payment_status === 'CANCELLED') {
        alert('Payment was cancelled');
      } else {
        alert('Payment failed: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Example 3: Payment with Course from State
   */
  const handleCoursePayment = async (course) => {
    setProcessing(true);
    
    // Calculate total with GST
    const basePrice = course.price;
    const gst = Math.round(basePrice * 0.18);
    const total = basePrice + gst;
    
    try {
      const result = await handlePayment(total, {
        courseId: course.id || course._id,
        courseName: course.name,
        description: `Payment for ${course.name}`,
        studentId: localStorage.getItem('user_id') || '1',
        customerName: localStorage.getItem('user_name') || 'Student',
        customerEmail: localStorage.getItem('user_email') || 'student@example.com',
        paymentType: 'Card',
      });
      
      console.log('Payment completed:', result);
      
      // Store for success page
      localStorage.setItem('payment_success', JSON.stringify({
        ...result,
        courseName: course.name,
        basePrice: basePrice,
        gst: gst,
        total: total,
        paymentDate: new Date().toISOString(),
      }));
      
      // Navigate to success/learning page
      window.location.href = '/success';
      
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Payment Examples</h2>
      
      {/* Example 1: Simple Button */}
      <button 
        onClick={handleSimplePayment}
        disabled={processing}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          background: '#2E8BFF',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: processing ? 'not-allowed' : 'pointer',
          marginRight: '10px'
        }}
      >
        {processing ? 'Processing...' : 'Pay ₹826 (Simple)'}
      </button>

      {/* Example 2: Full Options Button */}
      <button 
        onClick={handleFullPayment}
        disabled={processing}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          background: '#10B981',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: processing ? 'not-allowed' : 'pointer',
          marginRight: '10px'
        }}
      >
        {processing ? 'Processing...' : 'Pay ₹826 (Full Options)'}
      </button>

      {/* Example 3: With Demo Course */}
      <button 
        onClick={() => handleCoursePayment({
          id: 'course_123',
          name: 'Basic Python Programming',
          price: 700
        })}
        disabled={processing}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          background: '#8B5CF6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: processing ? 'not-allowed' : 'pointer',
        }}
      >
        {processing ? 'Processing...' : 'Pay Course (₹826)'}
      </button>

      {/* Payment Status Indicator */}
      {processing && (
        <div style={{ marginTop: '20px', color: '#666' }}>
          🔄 Payment in progress... (Razorpay popup or coin animation will show)
        </div>
      )}
    </div>
  );
};

export default PaymentButtonExample;


/**
 * INTEGRATION GUIDE
 * =================
 * 
 * 1. Import the handler:
 *    import { handlePayment } from './utils/razorpayHandler';
 * 
 * 2. Call it with amount and options:
 *    const result = await handlePayment(826, { 
 *      courseId: 'xxx',
 *      courseName: 'xxx',
 *      studentId: 'xxx'
 *    });
 * 
 * 3. Handle success:
 *    result contains:
 *    - payment_id
 *    - order_id
 *    - amount
 *    - payment_status
 * 
 * 4. Handle errors:
 *    catch block receives error with payment_status:
 *    - 'CANCELLED' - User cancelled
 *    - 'FAILED' - Payment failed
 *    - 'ERROR' - System error
 * 
 * 5. Automatic features:
 *    - Razorpay script loading
 *    - Popup opening
 *    - Fallback coin animation (if script fails)
 *    - Backend verification
 *    - Demo mode handling
 * 
 * That's it! The function handles everything automatically.
 */
