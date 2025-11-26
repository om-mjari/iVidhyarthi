import React, { useEffect, useState } from 'react';
import './Payment.css';

export default function PaymentGateway({ method = 'card', onBack, onComplete }) {
  const [processing, setProcessing] = useState(false);
  const [course, setCourse] = useState(null);
  const [paymentType, setPaymentType] = useState('Card');
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
    if (!course) {
      alert('Course details not found!');
      return;
    }

    setProcessing(true);

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert('Razorpay SDK failed to load. Please check your internet connection.');
        setProcessing(false);
        return;
      }

      // Step 1: Create order in backend
      const orderResponse = await fetch('http://localhost:5000/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: studentInfo.id,
          courseId: course.id || course._id || '1',
          amount: total,
          type: paymentType,
          studentName: studentInfo.name,
          studentEmail: studentInfo.email,
          courseName: course.name
        })
      });

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        throw new Error(orderData.message || 'Failed to create order');
      }

      console.log('Order created:', orderData);

      // Check if demo mode
      if (orderData.demoMode) {
        alert('⚠️ DEMO MODE: Razorpay is not configured!\n\n' +
              'To enable real payments:\n' +
              '1. Sign up at razorpay.com\n' +
              '2. Get TEST API keys from Dashboard\n' +
              '3. Add keys to backend/.env file\n' +
              '4. Restart the backend server\n\n' +
              'For now, simulating successful payment...');
        
        // Simulate payment success in demo mode
        setTimeout(async () => {
          const demoPayment = {
            razorpay_order_id: orderData.data.orderId,
            razorpay_payment_id: `pay_DEMO_${Date.now()}`,
            razorpay_signature: 'demo_signature_' + Math.random()
          };
          
          try {
            const verifyResponse = await fetch('http://localhost:5000/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ...demoPayment,
                receiptNo: orderData.data.receiptNo
              })
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              localStorage.setItem('payment_success', JSON.stringify(verifyData.data));
              setProcessing(false);
              onComplete?.('final');
            } else {
              throw new Error(verifyData.message || 'Demo payment verification failed');
            }
          } catch (error) {
            console.error('Demo verification error:', error);
            alert('Demo payment failed: ' + error.message);
            setProcessing(false);
          }
        }, 2000);
        return;
      }

      // Step 2: Open Razorpay checkout (Real mode)
      const options = {
        key: orderData.data.razorpayKey,
        amount: orderData.data.amount * 100, // Convert to paise
        currency: orderData.data.currency,
        name: 'iVidhyarthi',
        description: course.name,
        order_id: orderData.data.orderId,
        handler: async function (response) {
          console.log('Payment successful:', response);
          
          // Step 3: Verify payment in backend
          try {
            const verifyResponse = await fetch('http://localhost:5000/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                receiptNo: orderData.data.receiptNo
              })
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              // Store payment details for success page
              localStorage.setItem('payment_success', JSON.stringify(verifyData.data));
              
              // Navigate to success page
              setProcessing(false);
              onComplete?.('final');
            } else {
              throw new Error(verifyData.message || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Verification error:', error);
            alert('Payment verification failed: ' + error.message);
            setProcessing(false);
          }
        },
        prefill: {
          name: studentInfo.name,
          email: studentInfo.email,
        },
        notes: {
          courseId: course.id || course._id,
          courseName: course.name
        },
        theme: {
          color: '#2E8BFF'
        },
        modal: {
          ondismiss: function() {
            setProcessing(false);
            console.log('Payment cancelled by user');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed: ' + error.message);
      setProcessing(false);
    }
  };

  return (
    <div className="pay-wrap">
      <div className="pay-container">
        <div className="pay-left">
          <div className="gateway-content">
            <h2>💳 Payment Gateway</h2>
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
              <p>🔒 Secured by Razorpay (TEST MODE)</p>
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
