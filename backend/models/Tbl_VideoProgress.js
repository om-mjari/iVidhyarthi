const mongoose = require("mongoose");

const videoProgressSchema = new mongoose.Schema(
  {
    Progress_Id: {
      type: String,
      required: true,
      unique: true,
      default: () =>
        `VP${Date.now()}${Math.random()
          .toString(36)
          .substr(2, 9)
          .toUpperCase()}`,
    },
    Student_Id: {
      type: String,
      required: true,
      index: true,
    },
    Student_Email: {
      type: String,
      required: true,
      index: true,
    },
    Course_Id: {
      type: String,
      required: true,
      index: true,
    },
    Course_Name: {
      type: String,
      required: true,
    },
    Video_Id: {
      type: String,
      required: true,
    },
    Video_Title: {
      type: String,
      required: true,
    },
    Watch_Duration: {
      type: Number,
      default: 0,
      comment: "Duration watched in seconds",
    },
    Total_Duration: {
      type: Number,
      required: true,
      comment: "Total video duration in seconds",
    },
    Completion_Percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    Is_Completed: {
      type: Boolean,
      default: false,
    },
    First_Watched: {
      type: Date,
      default: Date.now,
    },
    Last_Watched: {
      type: Date,
      default: Date.now,
    },
    Watch_Count: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
videoProgressSchema.index({ Student_Id: 1, Course_Id: 1 });
videoProgressSchema.index({ Student_Email: 1, Course_Id: 1 });
videoProgressSchema.index(
  { Student_Id: 1, Course_Id: 1, Video_Id: 1 },
  { unique: true }
);

// Update completion status before saving
videoProgressSchema.pre("save", function (next) {
  if (this.Watch_Duration && this.Total_Duration) {
    this.Completion_Percentage = Math.min(
      100,
      Math.round((this.Watch_Duration / this.Total_Duration) * 100)
    );
    this.Is_Completed = this.Completion_Percentage >= 80; // 80% watched = completed
  }
  next();
});

module.exports = mongoose.model("Tbl_VideoProgress", videoProgressSchema);
