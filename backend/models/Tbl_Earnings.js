const mongoose = require("mongoose");

const earningsSchema = new mongoose.Schema(
  {
    Earning_Id: {
      type: String,
      required: true,
      unique: true,
      default: () =>
        `EARN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    },
    Lecturer_Id: {
      type: String,
      required: true,
      ref: "Tbl_Lecturers",
    },
    Amount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    Course_Id: {
      type: String,
      ref: "Tbl_Courses",
      default: null,
    },
    Transaction_Type: {
      type: String,
      enum: ["Course Sale", "Bonus", "Referral", "Adjustment", "Other"],
      default: "Course Sale",
    },
    Transaction_Date: {
      type: Date,
      default: Date.now,
    },
    Status: {
      type: String,
      enum: ["Pending", "Processed", "Paid", "Cancelled"],
      default: "Pending",
    },
    Payment_Method: {
      type: String,
      enum: ["Bank Transfer", "UPI", "Wallet", "Cheque", "Other", null],
      default: null,
    },
    Payment_Date: {
      type: Date,
      default: null,
    },
    Notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    collection: "Tbl_Earnings",
  }
);

// Indexes
earningsSchema.index({ Lecturer_Id: 1 });
earningsSchema.index({ Earning_Id: 1 }, { unique: true });
earningsSchema.index({ Transaction_Date: -1 });
earningsSchema.index({ Status: 1 });

module.exports = mongoose.model("Tbl_Earnings", earningsSchema);
