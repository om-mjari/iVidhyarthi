const express = require("express");
const router = express.Router();
const Tbl_VideoProgress = require("../models/Tbl_VideoProgress");
const Tbl_Courses = require("../models/Tbl_Courses");

/**
 * GET /api/video-progress/student/:studentId/course/:courseId
 * Get video progress for a specific student and course
 */
router.get("/student/:studentId/course/:courseId", async (req, res) => {
  try {
    const { studentId, courseId } = req.params;

    // Get all video progress for this student and course
    const videoProgress = await Tbl_VideoProgress.find({
      Student_Id: studentId,
      Course_Id: courseId,
    }).sort({ Last_Watched: -1 });

    // Get course details to know total videos
    const course = await Tbl_Courses.findOne({ Course_Id: courseId });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Calculate statistics
    const totalVideos = course.Videos ? course.Videos.length : 4; // Default to 4 if not set
    const completedVideos = videoProgress.filter(
      (vp) => vp.Is_Completed
    ).length;
    const watchedVideos = videoProgress.length;
    const completionPercentage =
      totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalVideos,
        completedVideos,
        watchedVideos,
        completionPercentage,
        videoProgress,
        courseId,
        studentId,
      },
    });
  } catch (error) {
    console.error("Error fetching video progress:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching video progress",
      error: error.message,
    });
  }
});

/**
 * GET /api/video-progress/student/:studentId/course/:courseId/summary
 * Get summary statistics only
 */
router.get("/student/:studentId/course/:courseId/summary", async (req, res) => {
  try {
    const { studentId, courseId } = req.params;

    const course = await Tbl_Courses.findOne({ Course_Id: courseId });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const totalVideos = course.Videos ? course.Videos.length : 4;
    const completedCount = await Tbl_VideoProgress.countDocuments({
      Student_Id: studentId,
      Course_Id: courseId,
      Is_Completed: true,
    });

    const completionPercentage =
      totalVideos > 0 ? Math.round((completedCount / totalVideos) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalVideos,
        completedVideos: completedCount,
        completionPercentage,
      },
    });
  } catch (error) {
    console.error("Error fetching progress summary:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching progress summary",
      error: error.message,
    });
  }
});

/**
 * POST /api/video-progress/update
 * Update or create video watch progress
 */
router.post("/update", async (req, res) => {
  try {
    const {
      studentId,
      studentEmail,
      courseId,
      courseName,
      videoId,
      videoTitle,
      watchDuration,
      totalDuration,
    } = req.body;

    // Validate required fields
    if (!studentId || !courseId || !videoId || totalDuration === undefined) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: studentId, courseId, videoId, totalDuration",
      });
    }

    // Find existing progress or create new
    let videoProgress = await Tbl_VideoProgress.findOne({
      Student_Id: studentId,
      Course_Id: courseId,
      Video_Id: videoId,
    });

    if (videoProgress) {
      // Update existing progress
      videoProgress.Watch_Duration = Math.max(
        videoProgress.Watch_Duration,
        watchDuration || 0
      );
      videoProgress.Total_Duration = totalDuration;
      videoProgress.Last_Watched = new Date();
      videoProgress.Watch_Count += 1;

      if (videoTitle) videoProgress.Video_Title = videoTitle;
      if (courseName) videoProgress.Course_Name = courseName;
      if (studentEmail) videoProgress.Student_Email = studentEmail;

      await videoProgress.save();
    } else {
      // Create new progress record
      videoProgress = new Tbl_VideoProgress({
        Student_Id: studentId,
        Student_Email: studentEmail,
        Course_Id: courseId,
        Course_Name: courseName,
        Video_Id: videoId,
        Video_Title: videoTitle,
        Watch_Duration: watchDuration || 0,
        Total_Duration: totalDuration,
      });

      await videoProgress.save();
    }

    res.json({
      success: true,
      message: "Video progress updated successfully",
      data: videoProgress,
    });
  } catch (error) {
    console.error("Error updating video progress:", error);
    res.status(500).json({
      success: false,
      message: "Error updating video progress",
      error: error.message,
    });
  }
});

/**
 * POST /api/video-progress/mark-complete
 * Mark a video as completed
 */
router.post("/mark-complete", async (req, res) => {
  try {
    const {
      studentId,
      studentEmail,
      courseId,
      courseName,
      videoId,
      videoTitle,
      totalDuration,
    } = req.body;

    if (!studentId || !courseId || !videoId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    let videoProgress = await Tbl_VideoProgress.findOne({
      Student_Id: studentId,
      Course_Id: courseId,
      Video_Id: videoId,
    });

    if (videoProgress) {
      videoProgress.Watch_Duration =
        totalDuration || videoProgress.Total_Duration;
      videoProgress.Is_Completed = true;
      videoProgress.Completion_Percentage = 100;
      videoProgress.Last_Watched = new Date();
      await videoProgress.save();
    } else {
      videoProgress = new Tbl_VideoProgress({
        Student_Id: studentId,
        Student_Email: studentEmail,
        Course_Id: courseId,
        Course_Name: courseName,
        Video_Id: videoId,
        Video_Title: videoTitle,
        Watch_Duration: totalDuration || 0,
        Total_Duration: totalDuration || 0,
        Is_Completed: true,
        Completion_Percentage: 100,
      });
      await videoProgress.save();
    }

    res.json({
      success: true,
      message: "Video marked as complete",
      data: videoProgress,
    });
  } catch (error) {
    console.error("Error marking video complete:", error);
    res.status(500).json({
      success: false,
      message: "Error marking video complete",
      error: error.message,
    });
  }
});

/**
 * DELETE /api/video-progress/student/:studentId/course/:courseId
 * Reset progress for a course (optional - for testing)
 */
router.delete("/student/:studentId/course/:courseId", async (req, res) => {
  try {
    const { studentId, courseId } = req.params;

    await Tbl_VideoProgress.deleteMany({
      Student_Id: studentId,
      Course_Id: courseId,
    });

    res.json({
      success: true,
      message: "Course progress reset successfully",
    });
  } catch (error) {
    console.error("Error resetting progress:", error);
    res.status(500).json({
      success: false,
      message: "Error resetting progress",
      error: error.message,
    });
  }
});

module.exports = router;
