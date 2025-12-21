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
    const Tbl_Students = require('../models/Tbl_Students');
    const Tbl_Courses = require('../models/Tbl_Courses');
    
    console.log('📋 Fetching feedbacks for courseId:', req.params.courseId);
    
    const limit = parseInt(req.query.limit) || 5;
    const skip = parseInt(req.query.skip) || 0;
    
    const feedbacks = await Feedback.find({
      Course_Id: req.params.courseId.toString(),
    }).sort({ Posted_On: -1 }).skip(skip).limit(limit).lean().catch(err => {
      console.error('Database query error:', err);
      return [];
    });

    // Populate student names
    const enrichedFeedbacks = await Promise.all(
      feedbacks.map(async (feedback) => {
        try {
          console.log('Processing feedback with Student_Id:', feedback.Student_Id);
          let student = null;
          
          // Handle seed data format (STU_001, STU_002, etc.)
          const seedDataMap = {
            'STU_001': 'Demo Student',
            'STU_002': 'Test Student',
            'STU_003': 'Sample Student'
          };
          
          if (feedback.Student_Id && feedback.Student_Id.startsWith('STU_')) {
            console.log('✅ Matched seed data format:', feedback.Student_Id, '→', seedDataMap[feedback.Student_Id]);
            return {
              ...feedback,
              Student_Name: seedDataMap[feedback.Student_Id] || 'Student'
            };
          }
          
          // Try finding by User_Id first (Student_Id in feedback is actually User_Id)
          try {
            student = await Tbl_Students.findOne({ User_Id: feedback.Student_Id }).lean();
            if (student) {
              console.log('✅ Found student by User_Id:', student.Full_Name);
            }
          } catch (e) {
            console.log('Error finding by User_Id:', e.message);
          }
          
          // If not found by User_Id, try _id
          if (!student) {
            try {
              student = await Tbl_Students.findById(feedback.Student_Id);
              if (student) {
                console.log('✅ Found student by _id:', student.Full_Name);
              }
            } catch (e) {
              console.log('Not found by _id');
            }
          }
          
          // If still not found, try email lookup
          if (!student) {
            const User = require('../models/User');
            const user = await User.findOne({ email: feedback.Student_Id }).lean();
            if (user) {
              student = await Tbl_Students.findOne({ User_Id: user._id }).lean();
              if (student) {
                console.log('✅ Found student by email lookup:', student.Full_Name);
              }
            }
          }
          
          const finalName = student ? student.Full_Name : 'Unknown Student';
          console.log('Final student name:', finalName);
          
          return {
            ...feedback,
            Student_Name: finalName
          };
        } catch (err) {
          console.error('❌ Error fetching student for ID:', feedback.Student_Id, err);
          return {
            ...feedback,
            Student_Name: 'Unknown Student'
          };
        }
      })
    );

    const totalCount = await Feedback.countDocuments({
      Course_Id: req.params.courseId.toString(),
    });

    console.log('✅ Found', enrichedFeedbacks.length, 'feedbacks out of', totalCount);

    res.json({
      success: true,
      data: enrichedFeedbacks || [],
      total: totalCount,
      hasMore: skip + limit < totalCount
    });
  } catch (error) {
    console.error('❌ Error fetching feedback:', error);
    console.error('Stack:', error.stack);
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

// Update user's own comment (within 24 hours)
router.put("/update-comment/:feedbackId", async (req, res) => {
  try {
    const { Student_Id, Comment, Rating } = req.body;

    if (!Student_Id || !Comment) {
      return res.status(400).json({
        success: false,
        message: "Student_Id and Comment are required",
      });
    }

    // Find the feedback
    const feedback = await Feedback.findOne({ Feedback_Id: req.params.feedbackId });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    // Check if the user owns this feedback
    if (feedback.Student_Id.toString() !== Student_Id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own feedback",
      });
    }

    // Check if feedback was posted within last 2 hours
    const hoursSincePosted = (new Date() - new Date(feedback.Posted_On)) / (1000 * 60 * 60);
    if (hoursSincePosted > 2) {
      return res.status(403).json({
        success: false,
        message: "You can only update feedback within 2 hours of posting",
      });
    }

    // Update the feedback
    feedback.Comment = Comment.trim();
    if (Rating) {
      feedback.Rating = Number(Rating);
    }
    await feedback.save();

    res.json({
      success: true,
      message: "Feedback updated successfully",
      data: feedback,
    });
  } catch (error) {
    console.error("Error updating feedback:", error);
    res.status(500).json({
      success: false,
      message: "Error updating feedback",
      error: error.message,
    });
  }
});

// Delete user's own comment (within 24 hours)
router.delete("/delete/:feedbackId", async (req, res) => {
  try {
    const { Student_Id } = req.body;

    if (!Student_Id) {
      return res.status(400).json({
        success: false,
        message: "Student_Id is required",
      });
    }

    // Find the feedback
    const feedback = await Feedback.findOne({ Feedback_Id: req.params.feedbackId });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    // Check if the user owns this feedback
    if (feedback.Student_Id.toString() !== Student_Id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own feedback",
      });
    }

    // Check if feedback was posted within last 2 hours
    const hoursSincePosted = (new Date() - new Date(feedback.Posted_On)) / (1000 * 60 * 60);
    if (hoursSincePosted > 2) {
      return res.status(403).json({
        success: false,
        message: "You can only delete feedback within 2 hours of posting",
      });
    }

    // Delete the feedback
    await Feedback.deleteOne({ Feedback_Id: req.params.feedbackId });

    res.json({
      success: true,
      message: "Feedback deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting feedback",
      error: error.message,
    });
  }
});

module.exports = router;
