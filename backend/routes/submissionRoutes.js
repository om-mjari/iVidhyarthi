const express = require("express");
const router = express.Router();
const Submission = require("../models/Tbl_Submissions");
const Assignment = require("../models/Tbl_Assignments");
const ExamAttempt = require("../models/Tbl_ExamAttempts");
const multer = require("multer");
const path = require("path");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/assignments/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /pdf|txt|jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, text, and image files are allowed'));
    }
  }
});

// Create submission
router.post("/create", async (req, res) => {
  try {
    const {
      Assignment_Id,
      Student_Id,
      Course_Id,
      Submission_Content,
      Score,
      Grade,
      LetterGrade,
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
      Grade,
      LetterGrade,
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
      Grade: Grade || null,
      LetterGrade: LetterGrade || "",
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

// Get submissions by lecturer (with student names and assignment info)
router.get("/lecturer/:lecturerId", async (req, res) => {
  try {
    const Assignment = require('../models/Tbl_Assignments');
    const Tbl_Courses = require('../models/Tbl_Courses');
    const Tbl_Students = require('../models/Tbl_Students');
    const User = require('../models/User');
    
    const lecturerId = req.params.lecturerId;
    
    // Find all courses by this lecturer
    const courses = await Tbl_Courses.find({ Lecturer_Id: lecturerId });
    const courseIds = courses.map(c => c.Course_Id);
    
    if (courseIds.length === 0) {
      return res.json({ success: true, data: [] });
    }
    
    // Get all assignments for these courses
    const assignments = await Assignment.find({
      Course_Id: { $in: courseIds }
    });
    
    const assignmentIds = assignments.map(a => a.Assignment_Id);
    
    if (assignmentIds.length === 0) {
      return res.json({ success: true, data: [] });
    }
    
    // Get all submissions for these assignments
    const submissions = await Submission.find({
      Assignment_Id: { $in: assignmentIds }
    }).sort({ Submitted_On: -1 });
    
    // Get all unique student IDs
    const studentIds = [...new Set(submissions.map(s => s.Student_Id))];
    
    // Fetch student details
    const students = await Tbl_Students.find({
      _id: { $in: studentIds.map(id => {
        try { return mongoose.Types.ObjectId(id); } catch { return id; }
      })}
    }).populate('User_Id', 'email');
    
    // Also try to get users by email (if Student_Id is email)
    const users = await User.find({
      email: { $in: studentIds }
    });
    
    // Create lookup maps
    const studentMap = {};
    students.forEach(s => {
      studentMap[s._id.toString()] = s.Full_Name;
      if (s.User_Id && s.User_Id.email) {
        studentMap[s.User_Id.email] = s.Full_Name;
      }
    });
    
    users.forEach(u => {
      if (!studentMap[u.email]) {
        studentMap[u.email] = u.full_name || u.email.split('@')[0];
      }
    });
    
    // Enrich submissions with student names and assignment info
    const enrichedSubmissions = submissions.map(sub => {
      const assignment = assignments.find(a => a.Assignment_Id === sub.Assignment_Id);
      const course = courses.find(c => c.Course_Id === sub.Course_Id);
      const studentName = studentMap[sub.Student_Id] || sub.Student_Id;
      
      return {
        ...sub.toObject(),
        studentName,
        assignmentTitle: assignment?.Title || 'Unknown Assignment',
        assignmentMarks: assignment?.Marks || 0,
        courseName: course?.Title || 'Unknown Course'
      };
    });
    
    res.json({
      success: true,
      data: enrichedSubmissions
    });
  } catch (error) {
    console.error("Error fetching lecturer submissions:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching submissions",
      error: error.message
    });
  }
});

// Update submission marks only
router.put("/marks/:submissionId", async (req, res) => {
  try {
    const { Grade, Graded_By } = req.body;

    if (Grade === undefined || Grade === null) {
      return res.status(400).json({
        success: false,
        message: "Grade is required"
      });
    }

    const submission = await Submission.findOneAndUpdate(
      { Submission_Id: req.params.submissionId },
      {
        Grade: Number(Grade),
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
      message: "Marks saved successfully",
      data: submission,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error saving marks",
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

// Submit assignment with file upload and reflective questions
router.post("/submit", upload.single('file'), async (req, res) => {
  try {
    const { Student_Id, Assignment_Id, Course_Id, Submission_Data } = req.body;

    // Validate required fields
    if (!Assignment_Id || !Student_Id) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: Assignment_Id, Student_Id",
      });
    }

    console.log("📝 Submitting Assignment:", {
      Assignment_Id,
      Student_Id,
      Course_Id,
      HasFile: !!req.file,
      FileName: req.file?.originalname
    });

    // Parse submission data
    let submissionContent = {};
    try {
      submissionContent = JSON.parse(Submission_Data);
    } catch (e) {
      submissionContent = { textSubmission: Submission_Data };
    }

    // Add file information if uploaded
    if (req.file) {
      submissionContent.uploadedFile = {
        filename: req.file.filename,
        originalname: req.file.originalname,
        path: `/uploads/assignments/${req.file.filename}`,
        size: req.file.size,
        mimetype: req.file.mimetype
      };
    }

    // Create submission
    const submission = new Submission({
      Assignment_Id,
      Student_Id,
      Course_Id: Course_Id || null,
      Submission_Content: JSON.stringify(submissionContent),
      Submission_Data: submissionContent,
      File_Url: req.file ? `/uploads/assignments/${req.file.filename}` : null,
      Status: "Submitted",
      Submitted_On: new Date(),
    });

    await submission.save();

    console.log("✅ Assignment submission created successfully:", submission.Submission_Id);

    res.json({
      success: true,
      message: "Assignment submitted successfully",
      data: submission,
    });
  } catch (error) {
    console.error("❌ Error submitting assignment:", error.message);
    res.status(500).json({
      success: false,
      message: "Error submitting assignment",
      error: error.message,
    });
  }
});

module.exports = router;
