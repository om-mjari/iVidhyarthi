const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    Notification_Id: {
      type: String,
      unique: true,
      default: () =>
        `NOTIF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    },
    User_Id: {
      type: String,
      required: true,
      ref: "Tbl_Students",
    },
    Type: {
      type: String,
      required: true,
      enum: [
        "Feedback Response",
        "Course Update",
        "Payment Success",
        "Assignment",
        "Session",
        "General",
      ],
      default: "General",
    },
    Title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    Message: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    Link: {
      type: String,
      default: null,
    },
    Is_Read: {
      type: Boolean,
      default: false,
    },
    Created_At: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: "Tbl_Notifications",
  }
);

// Indexes
notificationSchema.index({ Notification_Id: 1 }, { unique: true });
notificationSchema.index({ User_Id: 1 });
notificationSchema.index({ Is_Read: 1 });
notificationSchema.index({ Created_At: -1 });

module.exports = mongoose.model("Tbl_Notifications", notificationSchema);
