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
    Course_Id: {
      type: String,
      required: true,
      ref: "Tbl_Courses",
    },
    Student_Id: {
      type: String,
      required: true,
      ref: "Tbl_Students",
    },
    Enrollment_Id: {
      type: String,
      default: null,
    },
    Total_Amount: {
      type: Number,
      required: true,
      min: 0,
    },
    Amount: {
      type: Number,
      required: true, // This will store the 70% share
      min: 0,
    },
    Transaction_Type: {
      type: String,
      default: "Course Sale",
    },
    Transaction_Date: {
      type: Date,
      default: Date.now,
    },
    Status: {
      type: String,
      enum: ["Pending", "Processed", "Paid", "Cancelled"],
      default: "Paid",
    },
    Payment_Method: {
      type: String,
      default: "Online",
    },
    Payment_Date: {
      type: Date,
      default: Date.now,
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
