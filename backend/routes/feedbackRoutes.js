const express = require("express");
const router = express.Router();
const Feedback = require("../models/Tbl_Feedback");

// Create feedback
router.post("/create", async (req, res) => {
  try {
    const { Course_Id, Student_Id, Rating, Comment, Status } = req.body;

    // Validate required fields
    if (!Course_Id || !Student_Id || !Rating || !Comment) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: Course_Id, Student_Id, Rating, Comment",
      });
    }

    // Validate rating range
    if (Rating < 1 || Rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    console.log("📝 Creating Feedback:", {
      Course_Id,
      Student_Id,
      Rating,
      Comment: Comment.substring(0, 50) + "...",
      Status: Status || "Pending",
    });

    const feedback = new Feedback({
      Course_Id: Course_Id.toString(),
      Student_Id: Student_Id.toString(),
      Rating: Number(Rating),
      Comment: Comment.trim(),
      Status: Status || "Pending",
      Posted_On: new Date(),
    });

    await feedback.save();

    console.log("✅ Feedback created successfully:", feedback.Feedback_Id);

    res.json({
      success: true,
      message: "Feedback submitted successfully",
      data: feedback,
    });
  } catch (error) {
    console.error("❌ Error creating feedback:", error.message);
    res.status(500).json({
      success: false,
      message: "Error submitting feedback",
      error: error.message,
    });
  }
});

// Get feedback for a course
router.get("/course/:courseId", async (req, res) => {
  try {
    const feedbacks = await Feedback.find({
      Course_Id: req.params.courseId,
    }).sort({ Posted_On: -1 });

    // Get student names and course name for each feedback
    const Student = require("../models/Tbl_Students");
    const Course = require("../models/Tbl_Course");
    
    const enrichedFeedbacks = await Promise.all(
      feedbacks.map(async (feedback) => {
        const student = await Student.findOne({
          _id: feedback.Student_Id,
        }).lean();
        
        const course = await Course.findOne({
          Course_Id: feedback.Course_Id,
        }).lean();
        
        return {
          Feedback_Id: feedback.Feedback_Id,
          Course_Id: feedback.Course_Id,
          Course_Name: course ? course.Title : "Unknown Course",
          Student_Id: feedback.Student_Id,
          Student_Name: student ? student.Full_Name : "Unknown Student",
          Rating: feedback.Rating,
          Comment: feedback.Comment,
          Status: feedback.Status,
          Posted_On: feedback.Posted_On,
          Submission_Date: feedback.Posted_On,
        };
      })
    );

    res.json({
      success: true,
      data: enrichedFeedbacks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching feedback",
      error: error.message,
    });
  }
});

// Get feedback by student
router.get("/student/:studentId", async (req, res) => {
  try {
    const feedbacks = await Feedback.find({
      Student_Id: req.params.studentId,
    }).sort({ Posted_On: -1 });

    res.json({
      success: true,
      data: feedbacks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching feedback",
      error: error.message,
    });
  }
});

// Update feedback status (for admin)
router.put("/update/:feedbackId", async (req, res) => {
  try {
    const feedback = await Feedback.findOneAndUpdate(
      { Feedback_Id: req.params.feedbackId },
      req.body,
      { new: true }
    );

    res.json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating feedback",
      error: error.message,
    });
  }
});

module.exports = router;
