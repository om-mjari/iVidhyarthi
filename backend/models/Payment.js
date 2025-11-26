const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      index: true,
    },
    courseId: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["Card", "UPI", "NetBanking", "Wallet"],
      default: "Card",
    },
    receiptNo: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    orderId: {
      type: String,
      required: true,
    },
    paymentId: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      required: true,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
      index: true,
    },
    paymentDate: {
      type: Date,
      default: null,
    },
    studentName: {
      type: String,
      default: "",
    },
    studentEmail: {
      type: String,
      default: "",
    },
    courseName: {
      type: String,
      default: "",
    },
    razorpaySignature: {
      type: String,
      default: null,
    },
    gatewayResponse: {
      type: Object,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
paymentSchema.index({ studentId: 1, status: 1 });
paymentSchema.index({ receiptNo: 1 });

const Payment = mongoose.model("Tbl_Payment", paymentSchema);

module.exports = Payment;
