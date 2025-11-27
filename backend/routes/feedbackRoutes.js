const express = require('express');
const router = express.Router();
const Feedback = require('../models/Tbl_Feedback');

// Create feedback
router.post('/create', async (req, res) => {
  try {
    const feedback = new Feedback(req.body);
    await feedback.save();
    
    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback
    });
  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting feedback',
      error: error.message
    });
  }
});

// Get feedback for a course
router.get('/course/:courseId', async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ 
      Course_Id: req.params.courseId,
      Status: 'Approved'
    }).sort({ Posted_On: -1 });
    
    res.json({
      success: true,
      data: feedbacks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching feedback',
      error: error.message
    });
  }
});

// Get feedback by student
router.get('/student/:studentId', async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ Student_Id: req.params.studentId })
      .sort({ Posted_On: -1 });
    
    res.json({
      success: true,
      data: feedbacks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching feedback',
      error: error.message
    });
  }
});

// Update feedback status (for admin)
router.put('/update/:feedbackId', async (req, res) => {
  try {
    const feedback = await Feedback.findOneAndUpdate(
      { Feedback_Id: req.params.feedbackId },
      req.body,
      { new: true }
    );
    
    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating feedback',
      error: error.message
    });
  }
});

module.exports = router;
