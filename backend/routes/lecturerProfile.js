const express = require('express');
const router = express.Router();
const Lecturers = require('../models/Tbl_Lecturers');
const User = require('../models/User');

// GET lecturer profile by email or user ID
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // First, try to find user by email or _id
    let user;
    if (identifier.includes('@')) {
      user = await User.findOne({ email: identifier });
    } else {
      user = await User.findById(identifier);
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Find lecturer profile
    const lecturer = await Lecturers.findOne({ User_Id: user._id })
      .populate('Institute_Id', 'Institute_Name')
      .lean();
    
    if (!lecturer) {
      return res.status(404).json({
        success: false,
        message: 'Lecturer profile not found'
      });
    }
    
    // Combine user and lecturer data
    const profileData = {
      _id: lecturer._id,
      User_Id: user._id,
      Full_Name: lecturer.Full_Name,
      email: user.email,
      Mobile_No: lecturer.Mobile_No,
      DOB: lecturer.DOB,
      Gender: lecturer.Gender,
      Institute_Id: lecturer.Institute_Id,
      Institute_Name: lecturer.Institute_Id?.Institute_Name,
      Highest_Qualification: lecturer.Highest_Qualification,
      Specialization: lecturer.Specialization,
      Designation: lecturer.Designation,
      Experience_Years: lecturer.Experience_Years,
      createdAt: lecturer.createdAt,
      updatedAt: lecturer.updatedAt
    };
    
    res.json({
      success: true,
      data: profileData
    });
  } catch (error) {
    console.error('Error fetching lecturer profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile',
      error: error.message
    });
  }
});

// PUT update lecturer profile
router.put('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const updates = req.body;
    
    // Find user
    let user;
    if (identifier.includes('@')) {
      user = await User.findOne({ email: identifier });
    } else {
      user = await User.findById(identifier);
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update user email and name if provided
    if (updates.email && updates.email !== user.email) {
      user.email = updates.email;
    }
    if (updates.Full_Name) {
      user.name = updates.Full_Name;
    }
    await user.save();
    
    // Update lecturer profile
    const lecturerUpdates = {};
    
    if (updates.Full_Name !== undefined) lecturerUpdates.Full_Name = updates.Full_Name;
    if (updates.Mobile_No !== undefined) lecturerUpdates.Mobile_No = updates.Mobile_No;
    if (updates.DOB !== undefined) lecturerUpdates.DOB = updates.DOB;
    if (updates.Gender !== undefined) lecturerUpdates.Gender = updates.Gender.toLowerCase();
    if (updates.Highest_Qualification !== undefined) lecturerUpdates.Highest_Qualification = updates.Highest_Qualification;
    if (updates.Specialization !== undefined) lecturerUpdates.Specialization = updates.Specialization;
    if (updates.Designation !== undefined) lecturerUpdates.Designation = updates.Designation;
    if (updates.Experience_Years !== undefined) lecturerUpdates.Experience_Years = updates.Experience_Years;
    
    const updatedLecturer = await Lecturers.findOneAndUpdate(
      { User_Id: user._id },
      { $set: lecturerUpdates },
      { new: true, runValidators: true }
    ).populate('Institute_Id', 'Institute_Name');
    
    if (!updatedLecturer) {
      return res.status(404).json({
        success: false,
        message: 'Lecturer profile not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: updatedLecturer._id,
        User_Id: user._id,
        Full_Name: updatedLecturer.Full_Name,
        email: user.email,
        Mobile_No: updatedLecturer.Mobile_No,
        DOB: updatedLecturer.DOB,
        Gender: updatedLecturer.Gender,
        Institute_Id: updatedLecturer.Institute_Id,
        Institute_Name: updatedLecturer.Institute_Id?.Institute_Name,
        Highest_Qualification: updatedLecturer.Highest_Qualification,
        Specialization: updatedLecturer.Specialization,
        Designation: updatedLecturer.Designation,
        Experience_Years: updatedLecturer.Experience_Years
      }
    });
  } catch (error) {
    console.error('Error updating lecturer profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile',
      error: error.message
    });
  }
});

module.exports = router;
