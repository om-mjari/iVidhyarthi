const express = require("express");
const router = express.Router();
const Enrollment = require("../models/Tbl_Enrollments");
const Course = require("../models/Tbl_Courses");

// Create new enrollment
router.post("/create", async (req, res) => {
  try {
    const { Course_Id, Student_Id, Payment_Status } = req.body;

    // Check if enrollment already exists
    const existingEnrollment = await Enrollment.findOne({
      Course_Id,
      Student_Id,
    });

    if (existingEnrollment) {
      return res.json({
        success: true,
        message: "Already enrolled",
        data: existingEnrollment,
      });
    }

    const enrollment = new Enrollment({
      Course_Id,
      Student_Id,
      Payment_Status: Payment_Status || "Paid",
      Status: "Active",
    });

    await enrollment.save();

    res.json({
      success: true,
      message: "Enrollment created successfully",
      data: enrollment,
    });
  } catch (error) {
    console.error("Error creating enrollment:", error);
    res.status(500).json({
      success: false,
      message: "Error creating enrollment",
      error: error.message,
    });
  }
});

// Get enrollment by student
router.get("/student/:studentId", async (req, res) => {
  try {
    console.log("📚 Fetching enrollments for student:", req.params.studentId);
    
    const enrollments = await Enrollment.find({
      Student_Id: req.params.studentId,
      Payment_Status: "Paid", // Only show paid enrollments
    }).sort({ Enrolled_On: -1 }); // Most recent first

    console.log(`   Found ${enrollments.length} enrollments`);

    // Enrich with course details
    const enrichedEnrollments = await Promise.all(
      enrollments.map(async (enrollment) => {
        // Try to find course by Course_Id (handling potential type mismatch)
        let course = await Course.findOne({ Course_Id: enrollment.Course_Id });
        
        // If not found and Course_Id is numeric string, try as Number
        if (!course && !isNaN(enrollment.Course_Id)) {
           course = await Course.findOne({ Course_Id: Number(enrollment.Course_Id) });
        }

        if (!course) {
          console.log(`   ⚠️  Course not found for ID: ${enrollment.Course_Id}`);
        } else {
          console.log(`   ✅ Found course: ${course.Title}`);
        }

        return {
          ...enrollment.toObject(),
          courseDetails: course ? course.toObject() : null,
        };
      })
    );

    res.json({
      success: true,
      data: enrichedEnrollments,
    });
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching enrollments",
      error: error.message,
    });
  }
});

// Update enrollment status
router.put("/update/:enrollmentId", async (req, res) => {
  try {
    const enrollment = await Enrollment.findOneAndUpdate(
      { Enrollment_Id: req.params.enrollmentId },
      req.body,
      { new: true }
    );
    res.json({
      success: true,
      data: enrollment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating enrollment",
      error: error.message,
    });
  }
});

module.exports = router;
