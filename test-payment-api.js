// Test Payment API Endpoints
// Run with: node test-payment-api.js

const testCreateOrder = async () => {
  console.log('\n📝 Testing Create Order API...\n');
  
  try {
    const response = await fetch('http://localhost:5000/api/payments/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studentId: '1',
        courseId: '1',
        amount: 1499,
        type: 'Card',
        studentName: 'Test Student',
        studentEmail: 'test@ividhyarthi.com',
        courseName: 'Maths with AI'
      })
    });

    const data = await response.json();
    console.log('✅ Create Order Response:');
    console.log(JSON.stringify(data, null, 2));
    
    return data.data;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
};

const testVerifyPayment = async (orderId, receiptNo) => {
  console.log('\n🔍 Testing Verify Payment API...\n');
  
  try {
    // Simulate payment response
    const response = await fetch('http://localhost:5000/api/payments/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        razorpay_order_id: orderId,
        razorpay_payment_id: 'pay_test_' + Date.now(),
        razorpay_signature: 'test_signature_' + Date.now(),
        receiptNo: receiptNo
      })
    });

    const data = await response.json();
    console.log('✅ Verify Payment Response:');
    console.log(JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
};

const testGetPayment = async (receiptNo) => {
  console.log('\n📄 Testing Get Payment API...\n');
  
  try {
    const response = await fetch(`http://localhost:5000/api/payments/${receiptNo}`);
    const data = await response.json();
    
    console.log('✅ Get Payment Response:');
    console.log(JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
};

// Run all tests
const runTests = async () => {
  console.log('🚀 Starting Payment API Tests...');
  console.log('='.repeat(50));
  
  // Test 1: Create Order
  const orderData = await testCreateOrder();
  
  if (orderData) {
    // Test 2: Verify Payment (Note: This will fail signature check, but tests the endpoint)
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testVerifyPayment(orderData.orderId, orderData.receiptNo);
    
    // Test 3: Get Payment
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testGetPayment(orderData.receiptNo);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Tests Complete!\n');
};

// Check if backend is running
const checkBackend = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/health');
    const data = await response.json();
    console.log('✅ Backend is running');
    console.log('DB Status:', data.db);
    return true;
  } catch (error) {
    console.error('❌ Backend is not running!');
    console.error('   Start it with: cd backend && npm start');
    return false;
  }
};

// Main execution
(async () => {
  const backendRunning = await checkBackend();
  if (backendRunning) {
    await runTests();
  }
})();
