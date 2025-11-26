const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

// Create Razorpay order
router.post("/create-order", paymentController.createOrder);

// Verify Razorpay payment
router.post("/verify", paymentController.verifyPayment);

// Get payment by receipt number
router.get("/:receiptNo", paymentController.getPayment);

// Get all payments for a student
router.get("/student/:studentId", paymentController.getStudentPayments);

module.exports = router;
