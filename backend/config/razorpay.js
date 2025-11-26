const Razorpay = require('razorpay');
require('dotenv').config();

// Check if Razorpay credentials are configured
const isRazorpayConfigured = 
  process.env.RAZORPAY_KEY_ID && 
  process.env.RAZORPAY_KEY_ID !== 'rzp_test_your_key_id_here' &&
  process.env.RAZORPAY_KEY_SECRET && 
  process.env.RAZORPAY_KEY_SECRET !== 'your_razorpay_secret_here';

let razorpayInstance = null;

if (isRazorpayConfigured) {
  // Initialize Razorpay instance with real credentials
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
  console.log('✅ Razorpay configured with real credentials');
} else {
  console.warn('⚠️  Razorpay not configured - DEMO MODE ENABLED');
  console.warn('   Get API keys from: https://dashboard.razorpay.com/app/website-app-settings/api-keys');
}

module.exports = {
  razorpayInstance,
  isRazorpayConfigured,
  demoKeyId: 'rzp_test_DEMO_MODE'
};
