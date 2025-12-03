const express = require("express");
const router = express.Router();
const Tbl_Courses = require("../models/Tbl_Courses");
const Tbl_Enrollments = require("../models/Tbl_Enrollments");
const Tbl_Students = require("../models/Tbl_Students");
const User = require("../models/User");
const Tbl_Lecturers = require("../models/Tbl_Lecturers");

// Get all students enrolled in lecturer's courses
router.get("/:lecturerId", async (req, res) => {
  try {
    const { lecturerId } = req.params;

    // Resolve lecturer identifier (email or ID) to actual lecturer identity
    let lecturerIdentifier = lecturerId;
    
    // If it's an email, find the user and then the lecturer
    if (lecturerId.includes('@')) {
      const user = await User.findOne({ email: lecturerId.toLowerCase() });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
      
      const lecturer = await Tbl_Lecturers.findOne({ User_Id: user._id });
      if (!lecturer) {
        return res.status(404).json({
          success: false,
          message: "Lecturer profile not found"
        });
      }
      
      // Use the email as the lecturer identifier for courses
      lecturerIdentifier = lecturerId.toLowerCase();
    }

    // Get all courses by this lecturer
    const lecturerCourses = await Tbl_Courses.find({ 
      Lecturer_Id: lecturerIdentifier 
    });
    
    const courseIds = lecturerCourses.map(course => course.Course_Id);

    // If no courses found, return empty array
    if (courseIds.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Get all enrollments for lecturer's courses
    const enrollments = await Tbl_Enrollments.find({
      Course_Id: { $in: courseIds }
    }).sort({ Enrolled_On: -1 });

    // Build student details array
    const studentDetails = await Promise.all(
      enrollments.map(async (enrollment) => {
        // Get student info
        const student = await Tbl_Students.findOne({ 
          User_Id: enrollment.Student_Id 
        });
        
        // Get student user info for email
        const studentUser = await User.findById(enrollment.Student_Id);
        
        // Get course info
        const course = await Tbl_Courses.findOne({ 
          Course_Id: enrollment.Course_Id 
        });

        return {
          id: enrollment.Enrollment_Id,
          enrollmentId: enrollment.Enrollment_Id,
          studentName: student ? student.Full_Name : 'Unknown Student',
          email: studentUser ? studentUser.email : 'N/A',
          course: course ? course.Title : 'Unknown Course',
          courseId: enrollment.Course_Id,
          enrollDate: enrollment.Enrolled_On,
          status: enrollment.Status,
          paymentStatus: enrollment.Payment_Status,
          progress: 0 // TODO: Calculate actual progress from course completion data
        };
      })
    );

    res.json({
      success: true,
      data: studentDetails
    });
  } catch (error) {
    console.error("Error fetching lecturer students:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching student data",
      error: error.message
    });
  }
});

module.exports = router;
