const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema(
  {
    Quiz_Id: {
      type: String,
      required: true,
      unique: true,
      default: function () {
        return `QUIZ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      },
    },
    Course_Id: {
      type: String,
      required: true,
      index: true,
    },
    Week_Number: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    Title: {
      type: String,
      required: true,
    },
    Topic: {
      type: String,
      required: true,
    },
    Description: {
      type: String,
      default: "",
    },
    Time_Limit: {
      type: Number, // in minutes
      required: true,
      default: 30,
    },
    Total_Marks: {
      type: Number,
      required: true,
      default: 50,
    },
    Total_Questions: {
      type: Number,
      required: true,
      default: 10,
    },
    Questions: [
      {
        question_id: {
          type: Number,
          required: true,
        },
        question: {
          type: String,
          required: true,
        },
        options: {
          type: [String],
          required: true,
          validate: {
            validator: function (arr) {
              return arr.length === 4;
            },
            message: "Must have exactly 4 options",
          },
        },
        correct_answer: {
          type: Number,
          required: true,
          min: 0,
          max: 3,
        },
        marks: {
          type: Number,
          required: true,
          default: 5,
        },
        difficulty: {
          type: String,
          enum: ["Easy", "Medium", "Hard"],
          default: "Medium",
        },
        explanation: {
          type: String,
          default: "",
        },
      },
    ],
    Status: {
      type: String,
      enum: ["Active", "Inactive", "Draft"],
      default: "Active",
    },
    Created_By: {
      type: String,
      default: "System",
    },
    AI_Generated: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "Tbl_Quiz",
  }
);

// Indexes for better query performance
quizSchema.index({ Course_Id: 1, Week_Number: 1 });
quizSchema.index({ Quiz_Id: 1 }, { unique: true });
quizSchema.index({ Status: 1 });

module.exports = mongoose.model("Tbl_Quiz", quizSchema);
