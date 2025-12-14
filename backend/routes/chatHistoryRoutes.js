const express = require("express");
const router = express.Router();
const ChatHistory = require("../models/Tbl_ChatHistory");

// Save chat conversation
router.post("/save", async (req, res) => {
  try {
    const {
      userId,
      userName,
      userEmail,
      question,
      answer,
      sessionId,
      responseTimeMs,
    } = req.body;

    console.log("💬 Saving chat conversation:", {
      userId,
      question: question.substring(0, 50) + "...",
    });

    // Validate required fields
    if (!userId || !question || !answer) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: userId, question, answer",
      });
    }

    const chatHistory = new ChatHistory({
      User_Id: userId,
      User_Name: userName || "Guest User",
      User_Email: userEmail || null,
      Question: question.trim(),
      Answer: answer.trim(),
      Session_Id: sessionId || null,
      Response_Time_Ms: responseTimeMs || 0,
      Timestamp: new Date(),
    });

    await chatHistory.save();

    console.log(
      "✅ Chat conversation saved successfully:",
      chatHistory.Chat_Id
    );

    res.json({
      success: true,
      message: "Chat conversation saved successfully",
      data: chatHistory,
    });
  } catch (error) {
    console.error("❌ Error saving chat conversation:", error);
    res.status(500).json({
      success: false,
      message: "Error saving chat conversation",
      error: error.message,
    });
  }
});

// Get chat history for a user
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, page = 1 } = req.query;

    console.log(`📋 Fetching chat history for user: ${userId}`);

    const skip = (page - 1) * limit;

    const chatHistory = await ChatHistory.find({ User_Id: userId })
      .sort({ Timestamp: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await ChatHistory.countDocuments({ User_Id: userId });

    console.log(
      `✅ Found ${chatHistory.length} chat records for user ${userId}`
    );

    res.json({
      success: true,
      data: chatHistory,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching chat history:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching chat history",
      error: error.message,
    });
  }
});

// Get all chat history (for admin)
router.get("/all", async (req, res) => {
  try {
    const { limit = 100, page = 1, search } = req.query;

    console.log("📋 Fetching all chat history");

    const skip = (page - 1) * limit;
    const query = {};

    // Add search functionality
    if (search) {
      query.$or = [
        { Question: { $regex: search, $options: "i" } },
        { Answer: { $regex: search, $options: "i" } },
        { User_Name: { $regex: search, $options: "i" } },
      ];
    }

    const chatHistory = await ChatHistory.find(query)
      .sort({ Timestamp: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await ChatHistory.countDocuments(query);

    console.log(`✅ Found ${chatHistory.length} total chat records`);

    res.json({
      success: true,
      data: chatHistory,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching all chat history:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching chat history",
      error: error.message,
    });
  }
});

// Update chat feedback (helpful/not helpful)
router.put("/:chatId/feedback", async (req, res) => {
  try {
    const { chatId } = req.params;
    const { isHelpful, feedbackComment } = req.body;

    console.log(`📝 Updating feedback for chat: ${chatId}`);

    const chatHistory = await ChatHistory.findOneAndUpdate(
      { Chat_Id: chatId },
      {
        Is_Helpful: isHelpful,
        Feedback_Comment: feedbackComment || null,
      },
      { new: true }
    );

    if (!chatHistory) {
      return res.status(404).json({
        success: false,
        message: "Chat record not found",
      });
    }

    console.log("✅ Feedback updated successfully");

    res.json({
      success: true,
      message: "Feedback updated successfully",
      data: chatHistory,
    });
  } catch (error) {
    console.error("❌ Error updating feedback:", error);
    res.status(500).json({
      success: false,
      message: "Error updating feedback",
      error: error.message,
    });
  }
});

// Delete chat history
router.delete("/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params;

    console.log(`🗑️ Deleting chat record: ${chatId}`);

    const chatHistory = await ChatHistory.findOneAndDelete({ Chat_Id: chatId });

    if (!chatHistory) {
      return res.status(404).json({
        success: false,
        message: "Chat record not found",
      });
    }

    console.log("✅ Chat record deleted successfully");

    res.json({
      success: true,
      message: "Chat record deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting chat record:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting chat record",
      error: error.message,
    });
  }
});

// Get chat statistics
router.get("/stats/overview", async (req, res) => {
  try {
    console.log("📊 Fetching chat statistics");

    const totalChats = await ChatHistory.countDocuments();
    const totalUsers = await ChatHistory.distinct("User_Id").then(
      (users) => users.length
    );

    const avgResponseTime = await ChatHistory.aggregate([
      {
        $group: {
          _id: null,
          avgTime: { $avg: "$Response_Time_Ms" },
        },
      },
    ]);

    const helpfulChats = await ChatHistory.countDocuments({
      Is_Helpful: true,
    });
    const unhelpfulChats = await ChatHistory.countDocuments({
      Is_Helpful: false,
    });

    const stats = {
      totalChats,
      totalUsers,
      averageResponseTimeMs:
        avgResponseTime.length > 0 ? avgResponseTime[0].avgTime : 0,
      helpfulChats,
      unhelpfulChats,
      feedbackRate:
        totalChats > 0
          ? ((helpfulChats + unhelpfulChats) / totalChats) * 100
          : 0,
    };

    console.log("✅ Chat statistics fetched successfully");

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("❌ Error fetching chat statistics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching chat statistics",
      error: error.message,
    });
  }
});

module.exports = router;
