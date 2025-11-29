const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    Submission_Id: {
      type: String,
      required: true,
      unique: true,
      default: () =>
        `SUB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    },
    Assignment_Id: {
      type: String,
      required: true,
      ref: "Tbl_Assignments",
    },
    Student_Id: {
      type: String,
      required: true,
      ref: "Tbl_Students",
    },
    Course_Id: {
      type: String,
      required: false,
      ref: "Tbl_Courses",
    },
    Submission_Content: {
      type: String,
      required: false,
      default: null,
    },
    File_Url: {
      type: String,
      required: false,
      default: null,
    },
    Submitted_On: {
      type: Date,
      default: Date.now,
    },
    Score: {
      type: Number,
      default: null,
      min: 0,
    },
    Grade: {
      type: Number,
      default: null,
      min: 0,
    },
    Feedback: {
      type: String,
      default: "",
    },
    Status: {
      type: String,
      enum: ["Submitted", "Graded", "Late", "Resubmitted", "Pending"],
      default: "Submitted",
    },
    Time_Spent: {
      type: Number,
      default: 0,
    },
    Graded_On: {
      type: Date,
      default: null,
    },
    Graded_By: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "Tbl_Submissions",
  }
);

// Indexes
submissionSchema.index({ Assignment_Id: 1, Student_Id: 1 });
submissionSchema.index({ Submission_Id: 1 }, { unique: true });
submissionSchema.index({ Student_Id: 1 });
submissionSchema.index({ Status: 1 });

module.exports = mongoose.model("Tbl_Submissions", submissionSchema);
