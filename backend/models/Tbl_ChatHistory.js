const mongoose = require("mongoose");

const chatHistorySchema = new mongoose.Schema(
  {
    Chat_Id: {
      type: String,
      unique: true,
      default: () =>
        `CHAT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    },
    User_Id: {
      type: String,
      required: true,
      ref: "Tbl_Students",
    },
    User_Name: {
      type: String,
      default: "Guest User",
    },
    User_Email: {
      type: String,
      default: null,
    },
    Question: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    Answer: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    Session_Id: {
      type: String,
      default: null,
    },
    Timestamp: {
      type: Date,
      default: Date.now,
    },
    Response_Time_Ms: {
      type: Number,
      default: 0,
    },
    Is_Helpful: {
      type: Boolean,
      default: null,
    },
    Feedback_Comment: {
      type: String,
      default: null,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    collection: "Tbl_ChatHistory",
  }
);

// Indexes
chatHistorySchema.index({ Chat_Id: 1 }, { unique: true });
chatHistorySchema.index({ User_Id: 1 });
chatHistorySchema.index({ Timestamp: -1 });
chatHistorySchema.index({ Session_Id: 1 });

module.exports = mongoose.model("Tbl_ChatHistory", chatHistorySchema);
