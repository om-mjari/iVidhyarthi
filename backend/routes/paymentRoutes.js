const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { isRazorpayConfigured, isDemoMode } = require("../config/razorpay");

// Check Razorpay configuration status
router.get("/config/status", (req, res) => {
  res.json({
    success: true,
    data: {
      configured: isRazorpayConfigured,
      demoMode: isDemoMode,
      status: isRazorpayConfigured ? "LIVE_TEST_MODE" : "DEMO_MODE",
      message: isRazorpayConfigured
        ? "Razorpay is configured and ready for test payments"
        : "Running in demo mode - payments are simulated",
    },
  });
});

// Create Razorpay order
router.post("/create-order", paymentController.createOrder);

// Verify Razorpay payment
router.post("/verify", paymentController.verifyPayment);
router.post("/verify-payment", paymentController.verifyPayment); // Alias for specific requirement

// Get payment by receipt number
router.get("/:receiptNo", paymentController.getPayment);

// Get all payments for a student
router.get("/student/:studentId", paymentController.getStudentPayments);

module.exports = router;
