const mongoose = require("mongoose");

const courseContentSchema = new mongoose.Schema(
  {
    Content_Id: {
      type: String,
      required: true,
      unique: true,
      default: () =>
        `CONTENT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    },
    Course_Id: {
      type: Number,
      required: true,
      ref: "Tbl_Courses",
    },
    Topic_Id: {
      type: Number,
      required: true,
      ref: "Tbl_CourseTopics",
    },
    Title: {
      type: String,
      required: true,
      trim: true,
    },
    Content_Type: {
      type: String,
      enum: ["pdf", "notes", "video"],
      required: true,
    },
    File_Url: {
      type: String,
      required: true,
    },
    Uploaded_On: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: "tbl_coursecontent",
  }
);

courseContentSchema.index({ Course_Id: 1 });
courseContentSchema.index({ Topic_Id: 1 });
courseContentSchema.index({ Content_Id: 1 }, { unique: true });

module.exports = mongoose.model("Tbl_CourseContent", courseContentSchema);
