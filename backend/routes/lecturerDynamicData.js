const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// Helper function to get or create model
const getModel = (name, collectionName) => {
  try {
    return mongoose.model(name);
  } catch (e) {
    return mongoose.model(
      name,
      new mongoose.Schema({}, { strict: false, collection: collectionName })
    );
  }
};

// Get comprehensive dynamic data for lecturer dashboard
router.get("/:lecturerId", async (req, res) => {
  try {
    const lecturerId = req.params.lecturerId;
    console.log(`📊 Fetching dynamic data for lecturer: ${lecturerId}`);

    // Get lecturer's courses
    const Tbl_Courses = getModel("Tbl_Courses", "Tbl_Courses");
    const lecturerCourses = await Tbl_Courses.find({
      Lecturer_Id: lecturerId,
    }).lean();
    const courseIds = lecturerCourses.map((c) => c.Course_Id);
    console.log(`   Found ${courseIds.length} courses:`, courseIds);

    // Get Feedback
    const Tbl_Feedback = getModel("Tbl_Feedback", "Tbl_Feedback");
    const feedbackRecords = await Tbl_Feedback.find({
      Course_Id: { $in: courseIds.map((id) => id.toString()) },
    })
      .sort({ Created_At: -1 })
      .limit(50)
      .lean();
    console.log(`   Found ${feedbackRecords.length} feedback records`);

    // Enrich feedback with student names and course names
    const Student = require("../models/Tbl_Students");
    const feedbackList = await Promise.all(
      feedbackRecords.map(async (feedback) => {
        const student = await Student.findOne({
          _id: feedback.Student_Id,
        }).lean();
        const courseId =
          typeof feedback.Course_Id === "string"
            ? parseInt(feedback.Course_Id)
            : feedback.Course_Id;
        const course = lecturerCourses.find((c) => c.Course_Id === courseId);

        return {
          id: feedback.Feedback_Id || feedback._id,
          studentName: student ? student.Full_Name : "Unknown Student",
          courseName: course ? course.Title : "Unknown Course",
          rating: feedback.Rating || 0,
          comment: feedback.Comments || feedback.Comment || "",
          date: feedback.Created_At || feedback.Posted_On || new Date(),
        };
      })
    );

    // Get Earnings
    const Tbl_Earnings = getModel("Tbl_Earnings", "Tbl_Earnings");
    const earningsRecords = await Tbl_Earnings.find({})
      .sort({ createdAt: -1 })
      .lean();
    console.log(`   Found ${earningsRecords.length} earnings records`);

    // Filter and enrich earnings for lecturer's courses
    const earningsTable = earningsRecords
      .filter((earning) => {
        const courseId =
          typeof earning.Course_Id === "string"
            ? parseInt(earning.Course_Id)
            : earning.Course_Id;
        return courseIds.includes(courseId);
      })
      .map((earning) => {
        const courseId =
          typeof earning.Course_Id === "string"
            ? parseInt(earning.Course_Id)
            : earning.Course_Id;
        const course = lecturerCourses.find((c) => c.Course_Id === courseId);

        return {
          id: earning.Earning_Id || earning._id,
          date: earning.Earning_Date || earning.createdAt || new Date(),
          amount: earning.Amount || 0,
          status: earning.Status || "Pending",
          course: course ? course.Title : "Unknown Course",
        };
      });

    // Calculate total earnings
    const totalEarnings = earningsTable.reduce(
      (sum, e) => sum + (e.amount || 0),
      0
    );

    // Group earnings by month for chart (last 6 months)
    const monthlyEarnings = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleString("en-US", { month: "short" });
      monthlyEarnings[monthKey] = 0;
    }

    earningsTable.forEach((earning) => {
      const date = new Date(earning.date);
      const monthKey = date.toLocaleString("en-US", { month: "short" });
      if (monthlyEarnings.hasOwnProperty(monthKey)) {
        monthlyEarnings[monthKey] += earning.amount;
      }
    });

    // Get Enrollments for this month
    const Tbl_Enrollments = getModel("Tbl_Enrollments", "Tbl_Enrollments");
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const enrollmentsThisMonth = await Tbl_Enrollments.find({
      Course_Id: { $in: courseIds.map((id) => id.toString()) },
      Enrollment_Date: { $gte: startOfMonth, $lte: endOfMonth },
    }).lean();

    console.log(`   Enrollments this month: ${enrollmentsThisMonth.length}`);

    // Group enrollments by week
    const weeklyEnrollments = [0, 0, 0, 0];
    enrollmentsThisMonth.forEach((enrollment) => {
      const date = new Date(enrollment.Enrollment_Date);
      const weekNum = Math.floor((date.getDate() - 1) / 7);
      if (weekNum >= 0 && weekNum < 4) {
        weeklyEnrollments[weekNum]++;
      }
    });

    // Calculate average rating
    const avgRating =
      feedbackList.length > 0
        ? (
            feedbackList.reduce((sum, f) => sum + (f.rating || 0), 0) /
            feedbackList.length
          ).toFixed(1)
        : "0.0";

    // Prepare response
    const responseData = {
      // Stats
      totalEarnings,
      activeCourses: courseIds.length,
      avgRating,

      // Feedback section
      feedbackList,

      // Earnings section
      earningsTable,

      // Charts
      monthlyEarningsChart: {
        labels: Object.keys(monthlyEarnings),
        data: Object.values(monthlyEarnings),
      },
      enrollmentsThisMonthChart: {
        labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
        data: weeklyEnrollments,
      },
    };

    console.log("✅ Dynamic data generated successfully");
    res.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("❌ Error fetching dynamic data:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dynamic data",
      error: error.message,
    });
  }
});

module.exports = router;
