const express = require("express");
const router = express.Router();
const Submission = require("../models/Tbl_Submissions");
const Assignment = require("../models/Tbl_Assignments");
const ExamAttempt = require("../models/Tbl_ExamAttempts");

// Create submission
router.post("/create", async (req, res) => {
  try {
    const {
      Assignment_Id,
      Student_Id,
      Course_Id,
      Submission_Content,
      Score,
      Time_Spent,
      Status,
      Feedback,
    } = req.body;

    // Validate required fields
    if (!Assignment_Id || !Student_Id) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: Assignment_Id, Student_Id",
      });
    }

    console.log("📝 Creating Submission:", {
      Assignment_Id,
      Student_Id,
      Course_Id,
      Score,
      Time_Spent: `${Math.floor(Time_Spent / 60)}m ${Time_Spent % 60}s`,
      Status: Status || "Submitted",
    });

    // Always create a NEW submission entry (allow multiple submissions per assignment)
    const submission = new Submission({
      Assignment_Id,
      Student_Id,
      Course_Id: Course_Id || null,
      Submission_Content: Submission_Content || null,
      Score: Score || null,
      Time_Spent: Time_Spent || 0,
      Status: Status || "Submitted",
      Feedback: Feedback || "",
      Submitted_On: new Date(),
    });

    await submission.save();
    const submissionData = submission;

    console.log(
      "✅ New submission created successfully:",
      submission.Submission_Id
    );

    // Also save to Tbl_ExamAttempts for exam tracking
    try {
      const assignment = await Assignment.findOne({ Assignment_Id });
      const totalMarks = assignment?.Marks || 100;
      const percentage =
        totalMarks > 0 ? Math.round((Score / totalMarks) * 100) : 0;
      const timeTakenMinutes = Math.round(Time_Spent / 60);

      console.log("📊 Preparing exam attempt data:", {
        Exam_Id: Assignment_Id,
        Student_Id,
        Score,
        Percentage: percentage,
        Time_Taken: timeTakenMinutes + " minutes",
      });

      // Check if exam attempt exists
      const existingAttempt = await ExamAttempt.findOne({
        Exam_Id: Assignment_Id,
        Student_Id,
      });

      if (existingAttempt) {
        // Update existing attempt
        existingAttempt.Score = Score || 0;
        existingAttempt.Time_Taken = timeTakenMinutes;
        existingAttempt.Status = "Completed";
        existingAttempt.Answers = Submission_Content
          ? JSON.parse(Submission_Content)
          : {};
        existingAttempt.Percentage = percentage;
        existingAttempt.Attempt_Date = new Date();

        await existingAttempt.save();
        console.log(
          "✅ Exam attempt UPDATED in Tbl_ExamAttempts:",
          existingAttempt.Attempt_Id
        );
      } else {
        // Create new exam attempt
        const examAttempt = new ExamAttempt({
          Exam_Id: Assignment_Id,
          Student_Id,
          Score: Score || 0,
          Attempt_Date: new Date(),
          Time_Taken: timeTakenMinutes,
          Status: "Completed",
          Answers: Submission_Content ? JSON.parse(Submission_Content) : {},
          Percentage: percentage,
        });

        await examAttempt.save();
        console.log(
          "✅ Exam attempt CREATED in Tbl_ExamAttempts:",
          examAttempt.Attempt_Id
        );
      }
    } catch (examError) {
      console.warn(
        "⚠️ Error saving to Tbl_ExamAttempts (non-critical):",
        examError.message
      );
      // Don't fail the submission if exam attempt fails
    }

    console.log("\n🎉 SUBMISSION COMPLETE - Data saved to:");
    console.log(
      "   ✓ Tbl_Submissions - Submission_Id:",
      submissionData.Submission_Id
    );
    console.log("   ✓ Tbl_ExamAttempts - Exam tracking\n");

    res.json({
      success: true,
      message: "Submission created successfully",
      data: submissionData,
    });
  } catch (error) {
    console.error("❌ Error creating submission:", error.message);
    res.status(500).json({
      success: false,
      message: "Error creating submission",
      error: error.message,
    });
  }
});

// Get submissions by student
router.get("/student/:studentId", async (req, res) => {
  try {
    const submissions = await Submission.find({
      Student_Id: req.params.studentId,
    }).sort({ Submitted_On: -1 });

    res.json({
      success: true,
      data: submissions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching submissions",
      error: error.message,
    });
  }
});

// Get submissions by assignment
router.get("/assignment/:assignmentId", async (req, res) => {
  try {
    const submissions = await Submission.find({
      Assignment_Id: req.params.assignmentId,
    }).sort({ Submitted_On: -1 });

    res.json({
      success: true,
      data: submissions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching submissions",
      error: error.message,
    });
  }
});

// Get single submission
router.get("/:submissionId", async (req, res) => {
  try {
    const submission = await Submission.findOne({
      Submission_Id: req.params.submissionId,
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    res.json({
      success: true,
      data: submission,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching submission",
      error: error.message,
    });
  }
});

// Update submission (for grading)
router.put("/grade/:submissionId", async (req, res) => {
  try {
    const { Grade, Feedback, Graded_By } = req.body;

    const submission = await Submission.findOneAndUpdate(
      { Submission_Id: req.params.submissionId },
      {
        Grade,
        Feedback,
        Graded_By,
        Graded_On: new Date(),
        Status: "Graded",
      },
      { new: true }
    );

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    res.json({
      success: true,
      message: "Submission graded successfully",
      data: submission,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error grading submission",
      error: error.message,
    });
  }
});

module.exports = router;
