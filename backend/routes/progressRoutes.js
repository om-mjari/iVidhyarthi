const express = require('express');
const router = express.Router();
const Progress = require('../models/Tbl_ProgressTracking');

// Get progress for a student in a course
router.get('/:courseId/:studentId', async (req, res) => {
  try {
    const progress = await Progress.findOne({
      Course_Id: req.params.courseId,
      Student_Id: req.params.studentId
    });
    
    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching progress',
      error: error.message
    });
  }
});

// Update or create progress
router.post('/update', async (req, res) => {
  try {
    const { Course_Id, Student_Id, Progress_Percent, Completed_Topics } = req.body;

    let progress = await Progress.findOne({ Course_Id, Student_Id });

    if (progress) {
      // Update existing progress
      progress.Progress_Percent = Progress_Percent;
      progress.Completed_Topics = Completed_Topics;
      progress.Last_Accessed = new Date();
      
      // Update status based on progress
      if (Progress_Percent === 0) {
        progress.Status = 'Not Started';
      } else if (Progress_Percent === 100) {
        progress.Status = 'Completed';
      } else {
        progress.Status = 'In Progress';
      }
      
      await progress.save();
    } else {
      // Create new progress record
      progress = new Progress({
        Course_Id,
        Student_Id,
        Progress_Percent,
        Completed_Topics,
        Status: Progress_Percent === 0 ? 'Not Started' : 'In Progress'
      });
      await progress.save();
    }

    res.json({
      success: true,
      message: 'Progress updated successfully',
      data: progress
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating progress',
      error: error.message
    });
  }
});

// Get all progress for a student
router.get('/student/:studentId', async (req, res) => {
  try {
    const progressList = await Progress.find({ Student_Id: req.params.studentId });
    
    res.json({
      success: true,
      data: progressList
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching progress',
      error: error.message
    });
  }
});

module.exports = router;
