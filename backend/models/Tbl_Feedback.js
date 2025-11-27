const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    Feedback_Id: {
      type: String,
      required: true,
      unique: true,
      default: () =>
        `FEED_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
    Rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      default: 5,
    },
    Comment: {
      type: String,
      required: false,
      default: "",
      maxlength: 1000,
    },
    Posted_On: {
      type: Date,
      default: Date.now,
    },
    Status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Flagged"],
      default: "Pending",
    },
    Helpful_Count: {
      type: Number,
      default: 0,
      min: 0,
    },
    Response: {
      type: String,
      default: null,
    },
    Responded_On: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "Tbl_Feedback",
  }
);

// Indexes
feedbackSchema.index({ Course_Id: 1 });
feedbackSchema.index({ Feedback_Id: 1 }, { unique: true });
feedbackSchema.index({ Student_Id: 1 });
feedbackSchema.index({ Rating: 1 });
feedbackSchema.index({ Posted_On: -1 });

module.exports = mongoose.model("Tbl_Feedback", feedbackSchema);
