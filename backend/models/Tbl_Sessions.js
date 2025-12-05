const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    Session_Id: {
      type: String,
      required: true,
      unique: true,
      default: () =>
        `SESS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    },
    Course_Id: {
      type: String,
      required: true,
      ref: "Tbl_Courses",
    },
    Session_Url: {
      type: String,
      required: false,
      default: null,
    },
    Scheduled_At: {
      type: Date,
      required: true,
    },
    Duration: {
      type: Number, // in minutes
      required: true,
      default: 60,
    },
    Title: {
      type: String,
      required: true,
      trim: true,
    },
    Description: {
      type: String,
      default: "",
    },
    Session_Type: {
      type: String,
      enum: ["Live", "Recorded", "Webinar", "Workshop", "Q&A", "Other"],
      default: "Live",
    },
    Status: {
      type: String,
      enum: ["Scheduled", "Ongoing", "Completed", "Cancelled", "Postponed"],
      default: "Scheduled",
    },
    Started_At: {
      type: Date,
      default: null,
    },
    Ended_At: {
      type: Date,
      default: null,
    },
    Recording_Url: {
      type: String,
      default: null,
    },
    Attendees: {
      type: [String], // Array of Student_Ids
      default: [],
    },
    Max_Participants: {
      type: Number,
      default: 100,
    },
    Host_Id: {
      type: String,
      ref: "Tbl_Lecturers",
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "Tbl_Sessions",
  }
);

// Indexes
sessionSchema.index({ Course_Id: 1 });
sessionSchema.index({ Session_Id: 1 }, { unique: true });
sessionSchema.index({ Scheduled_At: 1 });
sessionSchema.index({ Status: 1 });

module.exports = mongoose.model("Tbl_Sessions", sessionSchema);
