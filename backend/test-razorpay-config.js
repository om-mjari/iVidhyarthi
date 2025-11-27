/**
 * Razorpay Configuration Test Script
 * ====================================
 * Run this to verify your Razorpay setup
 *
 * Usage: node test-razorpay-config.js
 */

require("dotenv").config();
const {
  razorpayInstance,
  isRazorpayConfigured,
  isDemoMode,
} = require("./config/razorpay");

console.log("\n" + "=".repeat(70));
console.log("🧪 RAZORPAY CONFIGURATION TEST");
console.log("=".repeat(70) + "\n");

console.log("📋 Environment Variables:");
console.log("   RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID || "❌ NOT SET");
console.log(
  "   RAZORPAY_KEY_SECRET:",
  process.env.RAZORPAY_KEY_SECRET ? "✅ SET (hidden)" : "❌ NOT SET"
);
console.log("");

console.log("🔧 Configuration Status:");
console.log("   Configured:", isRazorpayConfigured ? "✅ YES" : "❌ NO");
console.log("   Demo Mode:", isDemoMode ? "🎭 ACTIVE" : "❌ INACTIVE");
console.log("   Instance:", razorpayInstance ? "✅ Created" : "❌ NULL");
console.log("");

if (isRazorpayConfigured) {
  console.log("✅ SUCCESS: Razorpay is properly configured!");
  console.log("   You can now accept TEST payments through Razorpay");
  console.log("   Mode: LIVE TEST MODE");
  console.log("");
  console.log("🧪 Test Card Details:");
  console.log("   Card: 4111 1111 1111 1111");
  console.log("   CVV: 123");
  console.log("   Expiry: 12/25");
  console.log("   Name: Test User");
} else {
  console.log("⚠️  DEMO MODE: Razorpay is not configured");
  console.log("   Payments will be simulated (no real transactions)");
  console.log("");
  console.log("📝 To enable real payments:");
  console.log("   1. Sign up at https://razorpay.com (FREE)");
  console.log("   2. Get TEST API keys from dashboard");
  console.log("   3. Update backend/.env file:");
  console.log("      RAZORPAY_KEY_ID=rzp_test_YOUR_KEY");
  console.log("      RAZORPAY_KEY_SECRET=YOUR_SECRET");
  console.log("   4. Restart backend server");
}

console.log("");
console.log("=".repeat(70));
console.log("📚 For detailed setup guide, see: RAZORPAY_DEMO_SETUP.md");
console.log("=".repeat(70) + "\n");

// Test order creation (demo mode only)
if (!isRazorpayConfigured) {
  console.log("🎭 DEMO MODE TEST: Creating simulated order...\n");

  const demoOrder = {
    id: `order_DEMO_${Date.now()}`,
    amount: 235000, // ₹2,350 in paise
    currency: "INR",
    receipt: `test_receipt_${Date.now()}`,
    status: "created",
  };

  console.log("   Demo Order Created:");
  console.log("   Order ID:", demoOrder.id);
  console.log("   Amount: ₹" + demoOrder.amount / 100);
  console.log("   Currency:", demoOrder.currency);
  console.log("   Status:", demoOrder.status);
  console.log("");
  console.log("   ✅ Demo mode is working correctly!");
  console.log("");
} else {
  console.log("🔄 Testing Razorpay API connection...\n");

  // Test real API connection
  razorpayInstance.orders
    .create({
      amount: 100, // ₹1 in paise
      currency: "INR",
      receipt: `test_${Date.now()}`,
    })
    .then((order) => {
      console.log("   ✅ API Connection Successful!");
      console.log("   Test Order Created:", order.id);
      console.log("   Amount: ₹" + order.amount / 100);
      console.log("   Status:", order.status);
      console.log("");
      console.log("   🎉 Razorpay is fully operational!");
      console.log("");
    })
    .catch((error) => {
      console.log("   ❌ API Connection Failed!");
      console.log("   Error:", error.message);
      console.log("");
      console.log("   🔍 Troubleshooting:");
      console.log("   - Verify your API keys are correct");
      console.log("   - Ensure you're using TEST mode keys (rzp_test_)");
      console.log("   - Check if there are any typos in .env file");
      console.log("   - Verify your Razorpay account is active");
      console.log("");
    });
}
