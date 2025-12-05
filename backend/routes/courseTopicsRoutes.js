const express = require("express");
const router = express.Router();
const Tbl_CourseTopics = require("../models/Tbl_CourseTopics");
const Tbl_CourseSubTopics = require("../models/Tbl_CourseSubTopics");

// GET - Get all topics for a course
router.get("/course/:courseId", async (req, res) => {
  try {
    const topics = await Tbl_CourseTopics.find({
      Course_Id: Number(req.params.courseId),
    }).sort({ Order_Number: 1 });

    res.json({
      success: true,
      data: topics,
    });
  } catch (error) {
    console.error("Error fetching course topics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch course topics",
      error: error.message,
    });
  }
});

// GET - Get subtopics for a specific topic
router.get("/:topicId/subtopics", async (req, res) => {
  try {
    const subtopics = await Tbl_CourseSubTopics.find({
      Topic_Id: Number(req.params.topicId),
    }).sort({ Order_Number: 1 });

    res.json({
      success: true,
      data: subtopics,
    });
  } catch (error) {
    console.error("Error fetching subtopics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch subtopics",
      error: error.message,
    });
  }
});

// GET - Get a specific topic by ID
router.get("/:topicId", async (req, res) => {
  try {
    const topic = await Tbl_CourseTopics.findOne({
      Topic_Id: Number(req.params.topicId),
    });

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }

    res.json({
      success: true,
      data: topic,
    });
  } catch (error) {
    console.error("Error fetching topic:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch topic",
      error: error.message,
    });
  }
});

// POST - Create a new course topic
router.post("/", async (req, res) => {
  try {
    const { Course_Id, Title, Description, Order_Number, Estimated_Hours } =
      req.body;

    if (!Course_Id || !Title || !Order_Number) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: Course_Id, Title, Order_Number",
      });
    }

    // Get the next Topic_Id
    const lastTopic = await Tbl_CourseTopics.findOne().sort({ Topic_Id: -1 });
    const newTopicId = lastTopic ? lastTopic.Topic_Id + 1 : 1;

    const newTopic = new Tbl_CourseTopics({
      Topic_Id: newTopicId,
      Course_Id: Number(Course_Id),
      Title,
      Description: Description || "",
      Order_Number: Number(Order_Number),
      Estimated_Hours: Estimated_Hours ? Number(Estimated_Hours) : null,
    });

    await newTopic.save();

    res.status(201).json({
      success: true,
      message: "Topic created successfully",
      data: newTopic,
    });
  } catch (error) {
    console.error("Error creating topic:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create topic",
      error: error.message,
    });
  }
});

// PUT - Update a topic
router.put("/:topicId", async (req, res) => {
  try {
    const { Title, Description, Order_Number, Estimated_Hours } = req.body;

    const topic = await Tbl_CourseTopics.findOneAndUpdate(
      { Topic_Id: Number(req.params.topicId) },
      {
        ...(Title && { Title }),
        ...(Description !== undefined && { Description }),
        ...(Order_Number && { Order_Number: Number(Order_Number) }),
        ...(Estimated_Hours !== undefined && {
          Estimated_Hours: Estimated_Hours ? Number(Estimated_Hours) : null,
        }),
      },
      { new: true }
    );

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }

    res.json({
      success: true,
      message: "Topic updated successfully",
      data: topic,
    });
  } catch (error) {
    console.error("Error updating topic:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update topic",
      error: error.message,
    });
  }
});

// DELETE - Delete a topic
router.delete("/:topicId", async (req, res) => {
  try {
    const topic = await Tbl_CourseTopics.findOneAndDelete({
      Topic_Id: Number(req.params.topicId),
    });

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }

    res.json({
      success: true,
      message: "Topic deleted successfully",
      data: topic,
    });
  } catch (error) {
    console.error("Error deleting topic:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete topic",
      error: error.message,
    });
  }
});

module.exports = router;
