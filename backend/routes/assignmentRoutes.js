const express = require('express');
const router = express.Router();
const Assignment = require('../models/Tbl_Assignments');

// Get assignments by course
router.get('/course/:courseId', async (req, res) => {
  try {
    const assignments = await Assignment.find({ Course_Id: req.params.courseId })
      .sort({ Due_Date: 1 });
    
    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assignments',
      error: error.message
    });
  }
});

// Create assignment
router.post('/create', async (req, res) => {
  try {
    const assignment = new Assignment(req.body);
    await assignment.save();
    
    res.json({
      success: true,
      message: 'Assignment created successfully',
      data: assignment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating assignment',
      error: error.message
    });
  }
});

// Get single assignment
router.get('/:assignmentId', async (req, res) => {
  try {
    const assignment = await Assignment.findOne({ Assignment_Id: req.params.assignmentId });
    
    res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching assignment',
      error: error.message
    });
  }
});

module.exports = router;
