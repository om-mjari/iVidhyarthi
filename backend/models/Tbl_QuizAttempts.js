const mongoose = require("mongoose");

const quizAttemptSchema = new mongoose.Schema(
  {
    Attempt_Id: {
      type: String,
      required: true,
      unique: true,
      default: function () {
        return `QATTEMPT_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
      },
    },
    Quiz_Id: {
      type: String,
      required: true,
      ref: "Tbl_Quiz",
      index: true,
    },
    Student_Id: {
      type: String,
      required: true,
      index: true,
    },
    Course_Id: {
      type: String,
      required: true,
      index: true,
    },
    Week_Number: {
      type: Number,
      required: true,
    },
    Answers: {
      type: Object, // { question_id: selected_option_index }
      default: {},
    },
    Score: {
      type: Number,
      default: 0,
    },
    Total_Marks: {
      type: Number,
      required: true,
    },
    Percentage: {
      type: Number,
      default: 0,
    },
    Time_Spent: {
      type: Number, // in seconds
      default: 0,
    },
    Status: {
      type: String,
      enum: ["Started", "Completed", "Abandoned"],
      default: "Completed",
    },
    Started_At: {
      type: Date,
      default: Date.now,
    },
    Submitted_At: {
      type: Date,
      default: Date.now,
    },
    Feedback: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    collection: "Tbl_QuizAttempts",
  }
);

// Indexes for better query performance
quizAttemptSchema.index({ Quiz_Id: 1, Student_Id: 1 });
quizAttemptSchema.index({ Student_Id: 1, Course_Id: 1 });
quizAttemptSchema.index({ Submitted_At: -1 });

module.exports = mongoose.model("Tbl_QuizAttempts", quizAttemptSchema);
