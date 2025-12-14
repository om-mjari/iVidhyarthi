const express = require("express");
const router = express.Router();
const Progress = require("../models/Tbl_ProgressTracking");

// Get progress for a student in a course
router.get("/:courseId/:studentId", async (req, res) => {
  try {
    const progress = await Progress.findOne({
      Course_Id: req.params.courseId,
      Student_Id: req.params.studentId,
    });

    res.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    console.error("Error fetching progress:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching progress",
      error: error.message,
    });
  }
});

// Update or create progress
router.post("/update", async (req, res) => {
  try {
    const { Course_Id, Student_Id, Progress_Percent, Completed_Topics } =
      req.body;

    let progress = await Progress.findOne({ Course_Id, Student_Id });

    if (progress) {
      // Update existing progress
      progress.Progress_Percent = Progress_Percent;
      progress.Completed_Topics = Completed_Topics;
      progress.Last_Accessed = new Date();

      // Update status based on progress
      if (Progress_Percent === 0) {
        progress.Status = "Not Started";
      } else if (Progress_Percent === 100) {
        progress.Status = "Completed";
      } else {
        progress.Status = "In Progress";
      }

      await progress.save();
    } else {
      // Create new progress record
      progress = new Progress({
        Course_Id,
        Student_Id,
        Progress_Percent,
        Completed_Topics,
        Status: Progress_Percent === 0 ? "Not Started" : "In Progress",
      });
      await progress.save();
    }

    res.json({
      success: true,
      message: "Progress updated successfully",
      data: progress,
    });
  } catch (error) {
    console.error("Error updating progress:", error);
    res.status(500).json({
      success: false,
      message: "Error updating progress",
      error: error.message,
    });
  }
});

// Get all progress for a student
router.get("/student/:studentId", async (req, res) => {
  try {
    const progressList = await Progress.find({
      Student_Id: req.params.studentId,
    });

    res.json({
      success: true,
      data: progressList,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching progress",
      error: error.message,
    });
  }
});

// Calculate and update overall course progress (videos + assignments)
router.post("/calculate", async (req, res) => {
  try {
    const { courseId, studentId } = req.body;

    console.log('📊 Progress calculation request:', { courseId, studentId });

    if (!courseId || !studentId) {
      return res.status(400).json({
        success: false,
        message: "courseId and studentId are required",
      });
    }

    // Get video progress
    const Tbl_VideoProgress = require("../models/Tbl_VideoProgress");
    const Tbl_Submissions = require("../models/Tbl_Submissions");
    const Tbl_Assignments = require("../models/Tbl_Assignments");
    const Tbl_Courses = require("../models/Tbl_Courses");
    const Tbl_CourseContent = require("../models/Tbl_CourseContent");

    const course = await Tbl_Courses.findOne({ Course_Id: courseId }).catch(err => {
      console.error('Error finding course:', err);
      return null;
    });
    
    if (!course) {
      console.log('⚠️ Course not found for courseId:', courseId);
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Calculate video completion percentage - count actual videos from Tbl_CourseContent
    console.log('🔍 Querying videos with courseId:', courseId, 'Type:', typeof courseId);
    const totalVideos = await Tbl_CourseContent.countDocuments({
      Course_Id: courseId,
      Content_Type: "video"
    });
    const completedVideos = await Tbl_VideoProgress.countDocuments({
      Student_Id: studentId,
      Course_Id: courseId,
      Is_Completed: true,
    });
    const videoCompletionPercentage = totalVideos > 0 ? (completedVideos / totalVideos) * 100 : 0;

    console.log('📹 Video Progress:', {
      totalVideos,
      completedVideos,
      percentage: videoCompletionPercentage
    });

    // Calculate assignment completion percentage - ensure courseId is string for assignments
    console.log('🔍 Querying assignments with courseId:', String(courseId), 'Type: String');
    const assignments = await Tbl_Assignments.find({ Course_Id: String(courseId) });
    const totalAssignments = assignments.length;
    
    console.log('📝 Found assignments:', assignments.map(a => ({ id: a.Assignment_Id, courseId: a.Course_Id })));
    
    // Get assignment IDs for this course
    const assignmentIds = assignments.map(a => a.Assignment_Id);
    
    // Count submissions for these assignments by this student
    const completedAssignments = await Tbl_Submissions.countDocuments({
      Student_Id: studentId,
      Assignment_Id: { $in: assignmentIds }
    });
    
    const assignmentCompletionPercentage = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;
    
    console.log('📊 Assignment Progress:', {
      totalAssignments,
      completedAssignments,
      assignmentIds,
      percentage: assignmentCompletionPercentage
    });

    // Calculate overall progress (based on total completed items out of total items)
    const totalItems = totalVideos + totalAssignments;
    const completedItems = completedVideos + completedAssignments;
    const overallProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    console.log('Overall Progress Calculation:', {
      totalVideos,
      completedVideos,
      totalAssignments,
      completedAssignments,
      totalItems,
      completedItems,
      overallProgress
    });

    // Update progress in Tbl_ProgressTracking
    let progress = await Progress.findOne({
      Course_Id: courseId,
      Student_Id: studentId,
    });

    if (progress) {
      progress.Progress_Percent = overallProgress;
      progress.Last_Accessed = new Date();
      progress.Status =
        overallProgress === 0
          ? "Not Started"
          : overallProgress === 100
          ? "Completed"
          : "In Progress";
      await progress.save();
    } else {
      progress = new Progress({
        Course_Id: courseId,
        Student_Id: studentId,
        Progress_Percent: overallProgress,
        Status: overallProgress === 0 ? "Not Started" : "In Progress",
      });
      await progress.save();
    }

    res.json({
      success: true,
      data: {
        overallProgress,
        videoProgress: Math.round(videoCompletionPercentage),
        assignmentProgress: Math.round(assignmentCompletionPercentage),
        completedVideos,
        totalVideos,
        completedAssignments,
        totalAssignments,
      },
    });
  } catch (error) {
    console.error("Error calculating progress:", error);
    console.error("Request body:", req.body);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Error calculating progress",
      error: error.message,
    });
  }
});

module.exports = router;
