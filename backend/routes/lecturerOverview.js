const express = require("express");
const router = express.Router();
const Tbl_Courses = require("../models/Tbl_Courses");
const Tbl_Enrollments = require("../models/Tbl_Enrollments");
const Tbl_CourseContent = require("../models/Tbl_CourseContent");
const Tbl_Assignments = require("../models/Tbl_Assignments");
const Tbl_Lecturers = require("../models/Tbl_Lecturers");
const Tbl_Students = require("../models/Tbl_Students");
const User = require("../models/User");

// Get lecturer overview statistics
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

    // Get all courses by this lecturer (Lecturer_Id stores email)
    const lecturerCourses = await Tbl_Courses.find({ 
      Lecturer_Id: lecturerIdentifier 
    });
    
    const courseIds = lecturerCourses.map(course => course.Course_Id);

    // If no courses found, return zero stats
    if (courseIds.length === 0) {
      return res.json({
        success: true,
        data: {
          totalStudents: 0,
          totalEnrollments: 0,
          totalCourses: 0,
          activeCourses: 0,
          totalMaterials: 0,
          totalAssignments: 0,
          recentEnrollments: 0,
          growthPercentage: '0%',
          enrollmentsByMonth: [],
          courseEnrollmentData: []
        }
      });
    }

    // Count total active students across all lecturer's courses
    const totalStudents = await Tbl_Enrollments.countDocuments({
      Course_Id: { $in: courseIds },
      Status: "Active"
    });

    // Count total enrollments (including completed, dropped, etc.)
    const totalEnrollments = await Tbl_Enrollments.countDocuments({
      Course_Id: { $in: courseIds }
    });

    // Count active courses
    const activeCourses = lecturerCourses.filter(course => 
      course.Status === 'Active' || course.Is_Active === true
    ).length;

    // Count total materials uploaded
    const totalMaterials = await Tbl_CourseContent.countDocuments({
      Course_Id: { $in: courseIds }
    });

    // Count total assignments created
    const totalAssignments = await Tbl_Assignments.countDocuments({
      Course_Id: { $in: courseIds }
    });

    // Get enrollments by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const enrollmentsByMonth = await Tbl_Enrollments.aggregate([
      {
        $match: {
          Course_Id: { $in: courseIds },
          Enrolled_On: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$Enrolled_On" },
            month: { $month: "$Enrolled_On" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    // Get enrollments by course (for chart)
    const enrollmentsByCourse = await Tbl_Enrollments.aggregate([
      {
        $match: {
          Course_Id: { $in: courseIds }
        }
      },
      {
        $group: {
          _id: "$Course_Id",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 6
      }
    ]);

    // Get course names for enrollment chart
    const courseEnrollmentData = await Promise.all(
      enrollmentsByCourse.map(async (item) => {
        const course = await Tbl_Courses.findOne({ Course_Id: item._id });
        return {
          courseId: item._id,
          courseName: course ? course.Title : "Unknown",
          enrollments: item.count
        };
      })
    );

    // Get recent enrollments (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentEnrollments = await Tbl_Enrollments.countDocuments({
      Course_Id: { $in: courseIds },
      Enrolled_On: { $gte: thirtyDaysAgo }
    });

    // Calculate growth percentage (comparing last 30 days to previous 30 days)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const previousMonthEnrollments = await Tbl_Enrollments.countDocuments({
      Course_Id: { $in: courseIds },
      Enrolled_On: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
    });

    let growthPercentage = 0;
    if (previousMonthEnrollments > 0) {
      growthPercentage = ((recentEnrollments - previousMonthEnrollments) / previousMonthEnrollments * 100).toFixed(1);
    } else if (recentEnrollments > 0) {
      growthPercentage = 100;
    }

    // Check if detailed data is requested
    const includeDetails = req.query.details === 'true';
    let detailedData = {};

    if (includeDetails) {
      // Get students detail
      const enrollmentsWithStudents = await Tbl_Enrollments.find({
        Course_Id: { $in: courseIds }
      }).sort({ Enrolled_On: -1 }).limit(100);

      const studentsDetail = await Promise.all(
        enrollmentsWithStudents.map(async (enrollment) => {
          const student = await Tbl_Students.findOne({ User_Id: enrollment.Student_Id });
          const studentUser = await User.findById(enrollment.Student_Id);
          const course = await Tbl_Courses.findOne({ Course_Id: enrollment.Course_Id });

          return {
            id: enrollment.Enrollment_Id,
            studentName: student ? student.Full_Name : 'Unknown Student',
            email: studentUser ? studentUser.email : 'N/A',
            course: course ? course.Title : 'Unknown Course',
            enrollDate: enrollment.Enrolled_On,
            status: enrollment.Status
          };
        })
      );

      // Get courses detail
      const coursesDetail = await Promise.all(
        lecturerCourses.map(async (course) => {
          const enrollmentCount = await Tbl_Enrollments.countDocuments({
            Course_Id: course.Course_Id
          });
          
          return {
            id: course.Course_Id,
            title: course.Title,
            enrollments: enrollmentCount,
            status: course.Status,
            isActive: course.Is_Active
          };
        })
      );

      // Get materials detail
      const materials = await Tbl_CourseContent.find({
        Course_Id: { $in: courseIds }
      }).sort({ Uploaded_On: -1 }).limit(100);

      const materialsDetail = await Promise.all(
        materials.map(async (material) => {
          const course = await Tbl_Courses.findOne({ Course_Id: material.Course_Id });
          
          return {
            id: material.Content_Id,
            title: material.Title,
            type: material.Content_Type,
            course: course ? course.Title : 'Unknown Course',
            uploadedDate: material.Uploaded_On,
            fileUrl: material.File_Url
          };
        })
      );

      // Get assignments detail
      const assignments = await Tbl_Assignments.find({
        Course_Id: { $in: courseIds }
      }).sort({ Due_Date: -1 }).limit(100);

      const assignmentsDetail = await Promise.all(
        assignments.map(async (assignment) => {
          const course = await Tbl_Courses.findOne({ Course_Id: assignment.Course_Id });
          
          return {
            id: assignment.Assignment_Id,
            title: assignment.Title,
            course: course ? course.Title : 'Unknown Course',
            dueDate: assignment.Due_Date,
            marks: assignment.Marks,
            fileUrl: assignment.Submission_Data?.file_url || null
          };
        })
      );

      detailedData = {
        studentsDetail,
        coursesDetail,
        materialsDetail,
        assignmentsDetail
      };
    }

    res.json({
      success: true,
      data: {
        totalStudents,
        totalEnrollments,
        totalCourses: lecturerCourses.length,
        activeCourses,
        totalMaterials,
        totalAssignments,
        recentEnrollments,
        growthPercentage: growthPercentage > 0 ? `+${growthPercentage}%` : `${growthPercentage}%`,
        enrollmentsByMonth,
        courseEnrollmentData,
        ...detailedData
      }
    });
  } catch (error) {
    console.error("Error fetching lecturer overview:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching overview data",
      error: error.message
    });
  }
});

module.exports = router;
