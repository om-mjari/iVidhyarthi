const express = require('express');
const router = express.Router();
const Earnings = require('../models/Tbl_Earnings');

// Create earnings record
router.post('/create', async (req, res) => {
  try {
    const earning = new Earnings(req.body);
    await earning.save();
    
    res.json({
      success: true,
      message: 'Earnings record created successfully',
      data: earning
    });
  } catch (error) {
    console.error('Error creating earnings:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating earnings record',
      error: error.message
    });
  }
});

// Get earnings by lecturer
router.get('/lecturer/:lecturerId', async (req, res) => {
  try {
    const earnings = await Earnings.find({ Lecturer_Id: req.params.lecturerId })
      .sort({ Transaction_Date: -1 });
    
    // Calculate total earnings
    const totalEarnings = earnings.reduce((sum, earning) => sum + earning.Amount, 0);
    const pendingEarnings = earnings
      .filter(e => e.Status === 'Pending')
      .reduce((sum, earning) => sum + earning.Amount, 0);
    
    res.json({
      success: true,
      data: {
        earnings,
        totalEarnings,
        pendingEarnings
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching earnings',
      error: error.message
    });
  }
});

// Update earning status
router.put('/update/:earningId', async (req, res) => {
  try {
    const earning = await Earnings.findOneAndUpdate(
      { Earning_Id: req.params.earningId },
      req.body,
      { new: true }
    );
    
    res.json({
      success: true,
      data: earning
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating earning',
      error: error.message
    });
  }
});

module.exports = router;
