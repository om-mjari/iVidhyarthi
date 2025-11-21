const express = require("express");
const University = require("../models/Tbl_University");
const Registrars = require("../models/Tbl_Registrars");
const Users = require("../models/User");
const Institutes = require("../models/Tbl_Institutes");
const Students = require("../models/Tbl_Students");
const Lecturers = require("../models/Tbl_Lecturers");

const router = express.Router();

// Middleware to authenticate admin
const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    
    // Check for mock admin token (for hardcoded admin login)
    if (token.startsWith('admin_mock_token_')) {
      req.user = { id: 'admin_001', role: 'admin', email: 'admin123@gmail.com' };
      return next();
    }
    
    // For real JWT tokens
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    
    // Check if user is admin
    const user = await Users.findById(decoded.userId);
    if (!user || user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Admin access required' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Get all pending universities
router.get("/universities/pending", authenticateAdmin, async (req, res) => {
  try {
    const pendingUniversities = await University.find({ Verification_Status: 'pending' })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: pendingUniversities.map(uni => ({
        _id: uni._id,
        University_Name: uni.University_Name,
        Location: uni.State && uni.City ? `${uni.City}, ${uni.State}` : uni.State || uni.City || '—',
        Contact_No: uni.Contact_No || '—',
        Website: uni.Website || '—',
        Verification_Status: uni.Verification_Status,
        createdAt: uni.createdAt,
        updatedAt: uni.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching pending universities:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all universities (pending, approved, rejected)
router.get("/universities/all", authenticateAdmin, async (req, res) => {
  try {
    const allUniversities = await University.find()
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: allUniversities.map(uni => ({
        _id: uni._id,
        University_Name: uni.University_Name,
        Location: uni.State && uni.City ? `${uni.City}, ${uni.State}` : uni.State || uni.City || '—',
        Contact_No: uni.Contact_No || '—',
        Website: uni.Website || '—',
        Verification_Status: uni.Verification_Status || 'pending',
        createdAt: uni.createdAt,
        updatedAt: uni.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching all universities:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all universities
router.get("/universities", authenticateAdmin, async (req, res) => {
  try {
    const universities = await University.find()
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: universities.map(uni => ({
        id: uni._id,
        name: uni.University_Name,
        email: uni.University_Email,
        state: uni.State,
        city: uni.City,
        status: uni.Verification_Status,
        createdAt: uni.createdAt,
        updatedAt: uni.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching universities:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Approve university
router.put("/universities/:id/approve", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const university = await University.findById(id);
    if (!university) {
      return res.status(404).json({ success: false, message: 'University not found' });
    }

    university.Verification_Status = 'verified';
    await university.save();

    res.json({
      success: true,
      message: 'University approved successfully',
      data: {
        id: university._id,
        name: university.University_Name,
        status: university.Verification_Status
      }
    });
  } catch (error) {
    console.error('Error approving university:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Reject university
router.put("/universities/:id/reject", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const university = await University.findById(id);
    if (!university) {
      return res.status(404).json({ success: false, message: 'University not found' });
    }

    university.Verification_Status = 'rejected';
    await university.save();

    res.json({
      success: true,
      message: 'University rejected successfully',
      data: {
        id: university._id,
        name: university.University_Name,
        status: university.Verification_Status
      }
    });
  } catch (error) {
    console.error('Error rejecting university:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get admin dashboard stats
router.get("/stats", authenticateAdmin, async (req, res) => {
  try {
    const totalUniversities = await University.countDocuments();
    const pendingUniversities = await University.countDocuments({ Verification_Status: 'pending' });
    const verifiedUniversities = await University.countDocuments({ Verification_Status: 'verified' });
    const totalRegistrars = await Registrars.countDocuments();
    const totalInstitutes = await Institutes.countDocuments();
    const totalStudents = await Students.countDocuments();
    const totalLecturers = await Lecturers.countDocuments();

    res.json({
      success: true,
      data: {
        totalUniversities,
        pendingUniversities,
        verifiedUniversities,
        totalRegistrars,
        totalInstitutes,
        totalStudents,
        totalLecturers
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all registrars
router.get("/registrars", authenticateAdmin, async (req, res) => {
  try {
    const registrars = await Registrars.find()
      .populate('User_Id', 'email role')
      .populate('University_Id', 'University_Name Verification_Status')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: registrars.map(reg => ({
        id: reg._id,
        email: reg.User_Id.email,
        contact: reg.Contact_No,
        university: reg.University_Id?.University_Name || 'Unknown',
        universityStatus: reg.University_Id?.Verification_Status || 'pending',
        createdAt: reg.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching registrars:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;