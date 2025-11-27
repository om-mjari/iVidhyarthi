const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    Assignment_Id: {
      type: String,
      required: true,
      unique: true,
      default: () =>
        `ASSIGN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    },
    Course_Id: {
      type: String,
      required: true,
      ref: "Tbl_Courses",
    },
    Topic_Id: {
      type: String,
      required: false,
      default: null,
    },
    Title: {
      type: String,
      required: true,
      trim: true,
    },
    Description: {
      type: String,
      required: true,
    },
    Due_Date: {
      type: Date,
      required: true,
    },
    Uploaded_On: {
      type: Date,
      default: Date.now,
    },
    Assignment_Type: {
      type: String,
      enum: ["Individual", "Group", "Quiz", "Project", "Essay", "Lab", "Other"],
      default: "Individual",
    },
    Marks: {
      type: Number,
      required: true,
      min: 0,
      default: 100,
    },
  },
  {
    timestamps: true,
    collection: "Tbl_Assignments",
  }
);

// Indexes for better query performance
assignmentSchema.index({ Course_Id: 1 });
assignmentSchema.index({ Due_Date: 1 });
assignmentSchema.index({ Assignment_Id: 1 }, { unique: true });

module.exports = mongoose.model("Tbl_Assignments", assignmentSchema);
