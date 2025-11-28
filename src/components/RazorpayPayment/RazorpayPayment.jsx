import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoadingAnimation from './LoadingAnimation';
import CoinAnimation from './CoinAnimation';
import SuccessScreen from './SuccessScreen';
import './RazorpayPayment.css';

const RazorpayPayment = ({ onPaymentSuccess }) => {
  const [amount, setAmount] = useState(500);
  const [gstAmount, setGstAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(500);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showCoins, setShowCoins] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [userDetails, setUserDetails] = useState({
    name: "Student",
    email: "student@example.com",
    contact: "9999999999",
    userId: `user_${Date.now()}`, // Fallback unique ID
    courseId: "course_456"
  });

  // Calculate GST whenever amount changes
  useEffect(() => {
    const base = parseFloat(amount) || 0;
    const gst = base * 0.18; // 18% GST
    setGstAmount(gst);
    setTotalAmount(base + gst);
  }, [amount]);

  useEffect(() => {
    // 1. Get logged in user details
    try {
      const authUser = localStorage.getItem('auth_user');
      if (authUser) {
        const parsedUser = JSON.parse(authUser);
        setUserDetails(prev => ({
          ...prev,
          name: parsedUser.name || prev.name,
          email: parsedUser.email || prev.email,
          // Ensure we get a valid ID, fallback to random if missing to avoid "1" collision
          userId: parsedUser.id || parsedUser._id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        }));
      } else {
        // No user logged in - generate unique guest ID
        setUserDetails(prev => ({
          ...prev,
          userId: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
        }));
      }
      
      // 2. Get selected course details
      const selectedCourse = localStorage.getItem('selected_course');
      if (selectedCourse) {
         const parsedCourse = JSON.parse(selectedCourse);
         setUserDetails(prev => ({
            ...prev,
            courseId: parsedCourse.id || parsedCourse._id || parsedCourse.courseId || prev.courseId
         }));
         if (parsedCourse.price) {
            // Remove non-numeric characters if price is like "₹500"
            const numericPrice = parseFloat(parsedCourse.price.toString().replace(/[^0-9.]/g, ''));
            if (!isNaN(numericPrice)) {
              setAmount(numericPrice);
            }
         }
      }
    } catch (error) {
      console.error("Error loading details:", error);
    }
  }, []);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);

    // 1. Load Razorpay Script
    const res = await loadRazorpayScript();
    if (!res) {
      alert('Razorpay SDK failed to load. Are you online?');
      setLoading(false);
      return;
    }

    // 2. Create Order on Backend
    try {
      const orderUrl = 'http://localhost:5000/api/payments/create-order';
      const { data } = await axios.post(orderUrl, {
        amount: totalAmount, // Send total amount including GST
        studentId: userDetails.userId, // Matching backend expectation
        courseId: userDetails.courseId,
        type: 'Card', // Changed from 'course_enrollment' to match backend enum ["Card", "UPI", "NetBanking", "Wallet"]
        studentName: userDetails.name,
        studentEmail: userDetails.email
      });

      if (!data.success) {
        alert('Server error. Are you online?');
        setLoading(false);
        return;
      }

      const { amount: orderAmount, orderId: order_id, currency, razorpayKey } = data.data;

      // Define handler function
      const handlePaymentSuccess = async (response) => {
          setLoading(false);
          setProcessing(true); // Show processing animation

          const verifyUrl = 'http://localhost:5000/api/payments/verify-payment';
          try {
            const verifyRes = await axios.post(verifyUrl, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: userDetails.userId,
              courseId: userDetails.courseId,
              amount: totalAmount,
              email: userDetails.email,
              contact: userDetails.contact,
              receiptNo: data.data.receiptNo // Pass receiptNo if needed by backend
            });

            if (verifyRes.data.success) {
              setPaymentDetails({
                amount: totalAmount,
                paymentId: response.razorpay_payment_id,
                date: new Date()
              });
              
              // Show Coin Animation after processing
              setTimeout(() => {
                setProcessing(false);
                setShowCoins(true);
              }, 2000);
            } else {
              alert('Payment verification failed');
              setProcessing(false);
            }
          } catch (error) {
            console.error(error);
            alert('Payment verification failed on server');
            setProcessing(false);
          }
      };

      // Check for Demo Mode
      if (order_id.startsWith('order_DEMO_')) {
        console.log("⚠️ Demo Mode Detected: Simulating payment flow");
        
        // Simulate Razorpay opening delay
        setTimeout(() => {
          // Automatically proceed without popup
          const demoResponse = {
            razorpay_order_id: order_id,
            razorpay_payment_id: `pay_DEMO_${Date.now()}`,
            razorpay_signature: 'sig_DEMO_bypass' // Backend must accept this in demo mode
          };
          handlePaymentSuccess(demoResponse);
        }, 1500);
        return;
      }

      // 3. Open Razorpay Checkout
      const options = {
        key: razorpayKey,
        amount: orderAmount.toString(),
        currency: currency,
        name: 'iVidhyarthi',
        description: 'Course Enrollment',
        order_id: order_id,
        handler: handlePaymentSuccess,
        prefill: {
          name: userDetails.name,
          email: userDetails.email,
          contact: userDetails.contact,
        },
        theme: {
          color: '#3399cc',
        },
      };

      const paymentObject = new window.Razorpay(options);
      
      // Simulate 1-2 seconds loading before opening checkout as requested
      setTimeout(() => {
        setLoading(false); // Hide our loading
        paymentObject.open();
      }, 1500);

    } catch (error) {
      console.error("Payment Error:", error);
      const errorMsg = error.response?.data?.message || error.message || 'Error creating order';
      alert(`Payment Failed: ${errorMsg}`);
      setLoading(false);
    }
  };

  const handleCoinComplete = () => {
    setShowCoins(false);
    setSuccess(true);
    // Set flag for CourseLearningPage
    localStorage.setItem('payment_success', 'true');
  };

  if (success) {
    return <SuccessScreen paymentDetails={paymentDetails} onContinue={() => {
      if (onPaymentSuccess) {
        onPaymentSuccess();
      } else {
        window.location.href = '/learning';
      }
    }} />;
  }

  return (
    <div className="razorpay-payment-container">
      {loading && <LoadingAnimation text="Initiating Payment..." />}
      {processing && <LoadingAnimation text="Processing Transaction..." />}
      {showCoins && <CoinAnimation onComplete={handleCoinComplete} />}

      <div className="payment-card">
        <h2>Complete Your Enrollment</h2>
        <div className="amount-selection">
          <label>Course Price (₹)</label>
          <input
            type="number"
            className="amount-input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          
          <div className="price-breakdown" style={{ marginTop: '15px', textAlign: 'left', background: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span>Base Price:</span>
              <span>₹{parseFloat(amount || 0).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: '#666' }}>
              <span>GST (18%):</span>
              <span>₹{gstAmount.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ddd', paddingTop: '5px', fontWeight: 'bold', fontSize: '1.1em' }}>
              <span>Total Payable:</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <button className="pay-btn" onClick={handlePayment}>
          PAY NOW (₹{totalAmount.toFixed(2)})
        </button>
      </div>
    </div>
  );
};

export default RazorpayPayment;
