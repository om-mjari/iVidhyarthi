const mongoose = require("mongoose");

const examSchema = new mongoose.Schema(
  {
    Exam_Id: {
      type: String,
      required: true,
      unique: true,
      default: () =>
        `EXAM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    },
    Course_Id: {
      type: String,
      required: true,
      ref: "Tbl_Courses",
    },
    Title: {
      type: String,
      required: true,
      trim: true,
    },
    Total_Marks: {
      type: Number,
      required: true,
      min: 0,
      default: 100,
    },
    Duration: {
      type: Number, // in minutes
      default: 60,
    },
    Exam_Date: {
      type: Date,
      default: null,
    },
    Instructions: {
      type: String,
      default: "",
    },
    Status: {
      type: String,
      enum: ["Draft", "Published", "Completed", "Cancelled"],
      default: "Draft",
    },
  },
  {
    timestamps: true,
    collection: "Tbl_Exams",
  }
);

// Indexes
examSchema.index({ Course_Id: 1 });
examSchema.index({ Exam_Id: 1 }, { unique: true });
examSchema.index({ Status: 1 });

module.exports = mongoose.model("Tbl_Exams", examSchema);
