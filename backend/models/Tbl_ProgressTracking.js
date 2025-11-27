const mongoose = require("mongoose");

const progressTrackingSchema = new mongoose.Schema(
  {
    Progress_Id: {
      type: String,
      required: true,
      unique: true,
      default: () =>
        `PROG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
    Progress_Percent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },
    Completed_Topics: {
      type: [String],
      default: [],
    },
    Last_Accessed: {
      type: Date,
      default: Date.now,
    },
    Time_Spent: {
      type: Number, // in minutes
      default: 0,
    },
    Status: {
      type: String,
      enum: ["Not Started", "In Progress", "Completed"],
      default: "Not Started",
    },
  },
  {
    timestamps: true,
    collection: "Tbl_ProgressTracking",
  }
);

// Indexes
progressTrackingSchema.index({ Course_Id: 1, Student_Id: 1 }, { unique: true });
progressTrackingSchema.index({ Progress_Id: 1 }, { unique: true });
progressTrackingSchema.index({ Student_Id: 1 });

module.exports = mongoose.model("Tbl_ProgressTracking", progressTrackingSchema);
