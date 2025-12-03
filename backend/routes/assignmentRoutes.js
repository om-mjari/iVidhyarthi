const express = require("express");
const router = express.Router();
const Assignment = require("../models/Tbl_Assignments");

// Get assignments by course
router.get("/course/:courseId", async (req, res) => {
  try {
    const assignments = await Assignment.find({
      Course_Id: req.params.courseId,
    }).sort({ Due_Date: 1 });

    res.json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching assignments",
      error: error.message,
    });
  }
});

// Create assignment (root route)
router.post("/", async (req, res) => {
  try {
    const assignment = new Assignment(req.body);
    await assignment.save();

    res.status(201).json({
      success: true,
      message: "Assignment created successfully",
      data: assignment,
    });
  } catch (error) {
    console.error("Error creating assignment:", error);
    res.status(500).json({
      success: false,
      message: "Error creating assignment",
      error: error.message,
    });
  }
});

// Create assignment (legacy /create route)
router.post("/create", async (req, res) => {
  try {
    const assignment = new Assignment(req.body);
    await assignment.save();

    res.status(201).json({
      success: true,
      message: "Assignment created successfully",
      data: assignment,
    });
  } catch (error) {
    console.error("Error creating assignment:", error);
    res.status(500).json({
      success: false,
      message: "Error creating assignment",
      error: error.message,
    });
  }
});

// Get single assignment
router.get("/:assignmentId", async (req, res) => {
  try {
    const assignment = await Assignment.findOne({
      Assignment_Id: req.params.assignmentId,
    });

    res.json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching assignment",
      error: error.message,
    });
  }
});

// Submit assignment (save student submission to Tbl_Assignments)
router.post("/submit", async (req, res) => {
  try {
    const {
      Assignment_Id,
      Student_Id,
      Course_Id,
      Answers,
      Questions,
      Score,
      Time_Spent,
      IsAutoSubmit,
      Feedback
    } = req.body;

    console.log("📝 Submitting Assignment to Tbl_Assignments:", {
      Assignment_Id,
      Student_Id,
      Score,
      Time_Spent: `${Math.floor(Time_Spent / 60)}m ${Time_Spent % 60}s`
    });

    // Find existing assignment or create new submission entry
    const assignmentKey = `${Assignment_Id}_${Student_Id}`;
    
    // Check if this student already submitted this assignment
    const existingSubmission = await Assignment.findOne({
      Assignment_Id: assignmentKey
    });

    if (existingSubmission) {
      // Update existing submission
      existingSubmission.Submission_Data = {
        Student_Id,
        Course_Id,
        Answers,
        Questions,
        Score,
        Time_Spent,
        IsAutoSubmit,
        Submitted_On: new Date(),
        Feedback
      };
      existingSubmission.Status = 'Submitted';
      await existingSubmission.save();
      
      console.log("✅ Assignment submission UPDATED:", assignmentKey);
      
      return res.json({
        success: true,
        message: "Assignment updated successfully",
        data: existingSubmission
      });
    }

    // Create new submission record
    const submission = new Assignment({
      Assignment_Id: assignmentKey,
      Course_Id,
      Title: `${Assignment_Id} - Student Submission`,
      Description: `Submission by Student ${Student_Id}`,
      Due_Date: new Date(),
      Marks: Score || 0,
      Assignment_Type: 'Individual',
      Submission_Data: {
        Student_Id,
        Course_Id,
        Answers,
        Questions,
        Score,
        Time_Spent,
        IsAutoSubmit,
        Submitted_On: new Date(),
        Feedback
      },
      Status: 'Submitted'
    });

    await submission.save();
    
    console.log("✅ Assignment submission CREATED in Tbl_Assignments:", assignmentKey);

    res.json({
      success: true,
      message: "Assignment submitted successfully",
      data: submission
    });
  } catch (error) {
    console.error("❌ Error submitting assignment:", error);
    res.status(500).json({
      success: false,
      message: "Error submitting assignment",
      error: error.message
    });
  }
});

// Get student submission for an assignment
router.get("/submission/:assignmentId/:studentId", async (req, res) => {
  try {
    const assignmentKey = `${req.params.assignmentId}_${req.params.studentId}`;
    
    const submission = await Assignment.findOne({
      Assignment_Id: assignmentKey
    });

    res.json({
      success: true,
      data: submission,
      hasSubmission: !!submission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching submission",
      error: error.message
    });
  }
});

module.exports = router;
