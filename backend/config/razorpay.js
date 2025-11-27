const Razorpay = require("razorpay");
require("dotenv").config();

/**
 * Razorpay Configuration Module
 * ==============================
 * Handles both DEMO mode (for testing) and LIVE mode (with real credentials)
 */

// Demo mode indicators
const DEMO_INDICATORS = [
  "rzp_test_your_key_id_here",
  "your_razorpay_secret_here",
  "rzp_test_DEMO_MODE",
  "demo_secret_key",
  "DEMO",
  "demo",
];

/**
 * Check if Razorpay is properly configured with real credentials
 */
const isRazorpayConfigured = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  // Check if credentials exist
  if (!keyId || !keySecret) {
    return false;
  }

  // Check if credentials are demo placeholders
  const isDemoKey = DEMO_INDICATORS.some(
    (indicator) =>
      keyId.includes(indicator) || keySecret.includes(indicator)
  );

  return !isDemoKey && keyId.startsWith("rzp_test_");
};

const configured = isRazorpayConfigured();
let razorpayInstance = null;

if (configured) {
  try {
    // Initialize Razorpay instance with real credentials
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log("\n" + "=".repeat(60));
    console.log("✅ RAZORPAY CONFIGURED - LIVE TEST MODE");
    console.log("   Key ID: " + process.env.RAZORPAY_KEY_ID.substring(0, 15) + "...");
    console.log("   Payments will be processed through Razorpay");
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    console.error("❌ Error initializing Razorpay:", error.message);
    console.log("   Falling back to DEMO MODE\n");
  }
} else {
  console.log("\n" + "=".repeat(60));
  console.log("⚠️  RAZORPAY DEMO MODE - FOR TESTING ONLY");
  console.log("=".repeat(60));
  console.log("📋 Current Status: Payment simulation enabled");
  console.log("💡 All transactions will be simulated successfully\n");
  console.log("🔧 To enable REAL payments:");
  console.log("   1. Sign up at https://razorpay.com (FREE)");
  console.log("   2. Get TEST API keys from dashboard");
  console.log("   3. Update backend/.env file:");
  console.log("      RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_HERE");
  console.log("      RAZORPAY_KEY_SECRET=YOUR_SECRET_HERE");
  console.log("   4. Restart backend server");
  console.log("=".repeat(60) + "\n");
}

module.exports = {
  razorpayInstance,
  isRazorpayConfigured: configured,
  demoKeyId: "rzp_test_DEMO_MODE",
  isDemoMode: !configured,
};
