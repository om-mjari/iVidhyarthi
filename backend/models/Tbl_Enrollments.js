const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    Enrollment_Id: {
      type: String,
      required: true,
      unique: true,
      default: () =>
        `ENROLL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
    Enrolled_On: {
      type: Date,
      default: Date.now,
    },
    Status: {
      type: String,
      enum: ["Active", "Completed", "Dropped", "Suspended", "Pending"],
      default: "Active",
    },
    Completion_Date: {
      type: Date,
      default: null,
    },
    Payment_Status: {
      type: String,
      enum: ["Paid", "Pending", "Failed", "Refunded"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
    collection: "Tbl_Enrollments",
  }
);

// Indexes
enrollmentSchema.index({ Course_Id: 1, Student_Id: 1 }, { unique: true });
enrollmentSchema.index({ Enrollment_Id: 1 }, { unique: true });
enrollmentSchema.index({ Student_Id: 1 });
enrollmentSchema.index({ Status: 1 });

module.exports = mongoose.model("Tbl_Enrollments", enrollmentSchema);
