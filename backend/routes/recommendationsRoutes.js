const express = require("express");
const router = express.Router();
const Tbl_Courses = require("../models/Tbl_Courses");
const Tbl_Enrollments = require("../models/Tbl_Enrollments");
const recommendationEngine = require("../utils/recommendationEngine");

/**
 * GET /api/recommendations/student/:studentId
 * Get personalized course recommendations for a student
 */
router.get("/student/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    // 1. Get student's enrolled courses
    const enrollments = await Tbl_Enrollments.find({ Student_Id: studentId });
    const enrolledCourseIds = enrollments.map((e) => e.Course_Id);

    // 2. Get all courses
    const allCourses = await Tbl_Courses.find({ Status: "Active" });

    // 3. Get courses that student is NOT enrolled in
    const unenrolledCourses = allCourses.filter(
      (course) => !enrolledCourseIds.includes(course.Course_Id)
    );

    // 4. Get enrolled course details
    const enrolledCourses = allCourses.filter((course) =>
      enrolledCourseIds.includes(course.Course_Id)
    );

    // 5. Generate recommendations
    const recommendations =
      recommendationEngine.generateMultiCourseRecommendations(
        enrolledCourses,
        unenrolledCourses,
        limit
      );

    res.json({
      success: true,
      count: recommendations.length,
      data: recommendations,
    });
  } catch (error) {
    console.error("Error generating recommendations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate recommendations",
      error: error.message,
    });
  }
});

/**
 * GET /api/recommendations/course/:courseId
 * Get similar courses for a specific course
 */
router.get("/course/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    // 1. Get the target course
    const targetCourse = await Tbl_Courses.findOne({ Course_Id: courseId });

    if (!targetCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // 2. Get all other active courses
    const allCourses = await Tbl_Courses.find({
      Status: "Active",
      Course_Id: { $ne: courseId },
    });

    // 3. Generate recommendations
    const recommendations = recommendationEngine.generateRecommendations(
      targetCourse,
      allCourses,
      limit
    );

    res.json({
      success: true,
      basedOn: {
        courseId: targetCourse.Course_Id,
        title: targetCourse.Title,
        category: targetCourse.Category,
      },
      count: recommendations.length,
      data: recommendations,
    });
  } catch (error) {
    console.error("Error generating course recommendations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate recommendations",
      error: error.message,
    });
  }
});

/**
 * POST /api/recommendations/bulk
 * Get recommendations based on multiple course IDs
 */
router.post("/bulk", async (req, res) => {
  try {
    const { courseIds, limit = 10 } = req.body;

    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of course IDs",
      });
    }

    // 1. Get the enrolled courses
    const enrolledCourses = await Tbl_Courses.find({
      Course_Id: { $in: courseIds },
      Status: "Active",
    });

    // 2. Get all other courses
    const unenrolledCourses = await Tbl_Courses.find({
      Course_Id: { $nin: courseIds },
      Status: "Active",
    });

    // 3. Generate recommendations
    const recommendations =
      recommendationEngine.generateMultiCourseRecommendations(
        enrolledCourses,
        unenrolledCourses,
        limit
      );

    res.json({
      success: true,
      basedOn: enrolledCourses.map((c) => ({
        id: c.Course_Id,
        title: c.Title,
      })),
      count: recommendations.length,
      data: recommendations,
    });
  } catch (error) {
    console.error("Error generating bulk recommendations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate recommendations",
      error: error.message,
    });
  }
});

/**
 * GET /api/recommendations/popular
 * Get popular courses (fallback when no personalization data)
 */
router.get("/popular", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get courses sorted by rating and enrollment count
    const popularCourses = await Tbl_Courses.find({ Status: "Active" })
      .sort({ Rating: -1, Enrolled_Students: -1 })
      .limit(limit);

    res.json({
      success: true,
      count: popularCourses.length,
      data: popularCourses.map((course) => ({
        ...course.toObject(),
        matchScore: "85",
        matchDetails: { reason: "Trending Course" },
      })),
    });
  } catch (error) {
    console.error("Error fetching popular courses:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch popular courses",
      error: error.message,
    });
  }
});

module.exports = router;
