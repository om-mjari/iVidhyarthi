const express = require('express');
const router = express.Router();
const Enrollment = require('../models/Tbl_Enrollments');

// Create new enrollment
router.post('/create', async (req, res) => {
  try {
    const { Course_Id, Student_Id, Payment_Status } = req.body;

    // Check if enrollment already exists
    const existingEnrollment = await Enrollment.findOne({ Course_Id, Student_Id });
    
    if (existingEnrollment) {
      return res.json({
        success: true,
        message: 'Already enrolled',
        data: existingEnrollment
      });
    }

    const enrollment = new Enrollment({
      Course_Id,
      Student_Id,
      Payment_Status: Payment_Status || 'Paid',
      Status: 'Active'
    });

    await enrollment.save();

    res.json({
      success: true,
      message: 'Enrollment created successfully',
      data: enrollment
    });
  } catch (error) {
    console.error('Error creating enrollment:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating enrollment',
      error: error.message
    });
  }
});

// Get enrollment by student
router.get('/student/:studentId', async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ Student_Id: req.params.studentId });
    res.json({
      success: true,
      data: enrollments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollments',
      error: error.message
    });
  }
});

// Update enrollment status
router.put('/update/:enrollmentId', async (req, res) => {
  try {
    const enrollment = await Enrollment.findOneAndUpdate(
      { Enrollment_Id: req.params.enrollmentId },
      req.body,
      { new: true }
    );
    res.json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating enrollment',
      error: error.message
    });
  }
});

module.exports = router;
