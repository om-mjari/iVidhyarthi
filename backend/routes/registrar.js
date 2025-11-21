const express = require("express");
const Registrars = require("../models/Tbl_Registrars");
const Users = require("../models/User");
const Institutes = require("../models/Tbl_Institutes");
const Students = require("../models/Tbl_Students");
const Lecturers = require("../models/Tbl_Lecturers");
const University = require("../models/Tbl_University");

const router = express.Router();

// Middleware to authenticate registrar
const authenticateRegistrar = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    
    // Find registrar by user_id
    const registrar = await Registrars.findOne({ User_Id: decoded.userId }).populate('User_Id');
    if (!registrar) {
      return res.status(401).json({ success: false, message: 'Registrar not found' });
    }

    req.registrar = registrar;
    req.user = registrar.User_Id;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Get registrar profile
router.get("/profile", authenticateRegistrar, async (req, res) => {
  try {
    const registrar = await Registrars.findOne({ User_Id: req.user._id })
      .populate('User_Id')
      .populate('University_Id');

    if (!registrar) {
      return res.status(404).json({ success: false, message: 'Registrar profile not found' });
    }

    // Check if university is approved
    const isUniversityApproved = registrar.University_Id?.Verification_Status === 'verified';

    res.json({
      success: true,
      data: {
        name: registrar.User_Id.email.split('@')[0],
        email: registrar.User_Id.email,
        contact: registrar.Contact_No,
        university: registrar.University_Id?.University_Name || 'Unknown University',
        universityId: registrar.University_Id?._id,
        role: 'registrar',
        universityApproved: isUniversityApproved,
        universityStatus: registrar.University_Id?.Verification_Status || 'pending'
      }
    });
  } catch (error) {
    console.error('Error fetching registrar profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update registrar profile (only contact info)
router.put("/profile", authenticateRegistrar, async (req, res) => {
  try {
    const { contact } = req.body;
    
    const registrar = await Registrars.findOne({ User_Id: req.user._id });
    if (!registrar) {
      return res.status(404).json({ success: false, message: 'Registrar not found' });
    }

    // Update contact if provided
    if (contact) {
      registrar.Contact_No = contact;
      await registrar.save();
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        contact: registrar.Contact_No
      }
    });
  } catch (error) {
    console.error('Error updating registrar profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Change password
router.put("/change-password", authenticateRegistrar, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password and new password are required' 
      });
    }

    const user = await Users.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }

    // Update password
    user.password = newPassword; // This will be hashed by the pre-save middleware
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all registrars with their university IDs and contact numbers
router.get("/get-registrars", async (req, res) => {
  try {
    const registrars = await Registrars.find()
      .select('University_Id Contact_No')
      .lean();

    res.json({
      success: true,
      data: registrars
    });
  } catch (error) {
    console.error('Error fetching registrars:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get dashboard stats
router.get("/stats", authenticateRegistrar, async (req, res) => {
  try {
    const registrar = await Registrars.findOne({ User_Id: req.user._id });
    if (!registrar) {
      return res.status(404).json({ success: false, message: 'Registrar not found' });
    }

    // Get institutes under this registrar's university
    const institutes = await Institutes.find({ University_Id: registrar.University_Id });
    
    // Get students from these institutes
    const instituteIds = institutes.map(inst => inst._id);
    const students = await Students.find({ Institution_Id: { $in: instituteIds } });
    
    // Get lecturers from these institutes
    const lecturers = await Lecturers.find({ Institute_Id: { $in: instituteIds } });

    // Calculate stats
    const totalInstitutes = institutes.length;
    const totalStudents = students.length;
    const totalLecturers = lecturers.length;
    const activeCourses = institutes.reduce((sum, inst) => sum + (inst.Courses_Offered?.length || 0), 0);

    res.json({
      success: true,
      data: {
        totalInstitutes,
        totalStudents,
        totalLecturers,
        activeCourses,
        pendingApprovals: 0 // You can implement approval logic
      }
    });
  } catch (error) {
    console.error('Error fetching registrar stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get institutes under registrar's university
router.get("/institutes", authenticateRegistrar, async (req, res) => {
  try {
    const registrar = await Registrars.findOne({ User_Id: req.user._id });
    if (!registrar) {
      return res.status(404).json({ success: false, message: 'Registrar not found' });
    }

    const institutes = await Institutes.find({ University_Id: registrar.University_Id })
      .populate('University_Id', 'University_Name');

    res.json({
      success: true,
      data: institutes.map(inst => ({
        id: inst._id,
        name: inst.Institute_Name,
        contact: inst.Contact_No || '',
        courses: inst.Courses_Offered || [],
        status: inst.Verification_Status || 'Active',
        university: inst.University_Id?.University_Name || 'Unknown'
      }))
    });
  } catch (error) {
    console.error('Error fetching institutes:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add new institute
router.post("/institutes", authenticateRegistrar, async (req, res) => {
  try {
    const { name, contact, courses } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'Institute name is required' });
    }

    const registrar = await Registrars.findOne({ User_Id: req.user._id }).populate('University_Id');
    if (!registrar) {
      return res.status(404).json({ success: false, message: 'Registrar not found' });
    }

    // Check if university is approved
    if (registrar.University_Id?.Verification_Status !== 'verified') {
      return res.status(403).json({ 
        success: false, 
        message: 'Your university is not approved yet. You cannot add institutes until your university is verified by admin.' 
      });
    }

    const institute = await Institutes.create({
      Institute_Name: name,
      Contact_No: contact,
      Courses_Offered: courses ? courses.split(',').map(c => c.trim()).filter(Boolean) : [],
      University_Id: registrar.University_Id._id,
      Verification_Status: 'Active'
    });

    res.json({
      success: true,
      message: 'Institute added successfully',
      data: {
        id: institute._id,
        name: institute.Institute_Name,
        contact: institute.Contact_No,
        courses: institute.Courses_Offered,
        status: institute.Verification_Status
      }
    });
  } catch (error) {
    console.error('Error adding institute:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update institute
router.put("/institutes/:id", authenticateRegistrar, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact, courses, status } = req.body;

    const registrar = await Registrars.findOne({ User_Id: req.user._id }).populate('University_Id');
    if (!registrar) {
      return res.status(404).json({ success: false, message: 'Registrar not found' });
    }

    // Check if university is approved
    if (registrar.University_Id?.Verification_Status !== 'verified') {
      return res.status(403).json({ 
        success: false, 
        message: 'Your university is not approved yet. You cannot update institutes until your university is verified by admin.' 
      });
    }

    const institute = await Institutes.findOne({ 
      _id: id, 
      University_Id: registrar.University_Id 
    });

    if (!institute) {
      return res.status(404).json({ success: false, message: 'Institute not found' });
    }

    if (name) institute.Institute_Name = name;
    if (contact !== undefined) institute.Contact_No = contact;
    if (courses) institute.Courses_Offered = courses.split(',').map(c => c.trim()).filter(Boolean);
    if (status) institute.Verification_Status = status;

    await institute.save();

    res.json({
      success: true,
      message: 'Institute updated successfully',
      data: {
        id: institute._id,
        name: institute.Institute_Name,
        contact: institute.Contact_No,
        courses: institute.Courses_Offered,
        status: institute.Verification_Status
      }
    });
  } catch (error) {
    console.error('Error updating institute:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete institute
router.delete("/institutes/:id", authenticateRegistrar, async (req, res) => {
  try {
    const { id } = req.params;

    const registrar = await Registrars.findOne({ User_Id: req.user._id }).populate('University_Id');
    if (!registrar) {
      return res.status(404).json({ success: false, message: 'Registrar not found' });
    }

    // Check if university is approved
    if (registrar.University_Id?.Verification_Status !== 'verified') {
      return res.status(403).json({ 
        success: false, 
        message: 'Your university is not approved yet. You cannot delete institutes until your university is verified by admin.' 
      });
    }

    const institute = await Institutes.findOneAndDelete({ 
      _id: id, 
      University_Id: registrar.University_Id 
    });

    if (!institute) {
      return res.status(404).json({ success: false, message: 'Institute not found' });
    }

    res.json({
      success: true,
      message: 'Institute deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting institute:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get analytics data
router.get("/analytics", authenticateRegistrar, async (req, res) => {
  try {
    const registrar = await Registrars.findOne({ User_Id: req.user._id });
    if (!registrar) {
      return res.status(404).json({ success: false, message: 'Registrar not found' });
    }

    const institutes = await Institutes.find({ University_Id: registrar.University_Id });
    const instituteIds = institutes.map(inst => inst._id);
    
    const students = await Students.find({ Institution_Id: { $in: instituteIds } });
    const lecturers = await Lecturers.find({ Institute_Id: { $in: instituteIds } });

    // Group students by institute
    const studentsByInstitute = {};
    students.forEach(student => {
      const instituteId = student.Institution_Id.toString();
      if (!studentsByInstitute[instituteId]) {
        studentsByInstitute[instituteId] = [];
      }
      studentsByInstitute[instituteId].push(student);
    });

    // Create analytics data
    const analytics = institutes.map(inst => {
      const instituteStudents = studentsByInstitute[inst._id.toString()] || [];
      const instituteLecturers = lecturers.filter(lec => lec.Institute_Id.toString() === inst._id.toString());
      
      return {
        instituteId: inst._id,
        instituteName: inst.Institute_Name,
        totalStudents: instituteStudents.length,
        totalLecturers: instituteLecturers.length,
        courses: inst.Courses_Offered || [],
        students: instituteStudents.map(s => ({
          name: s.Full_Name,
          course: s.Course,
          enrollmentYear: s.Enrollment_Year
        }))
      };
    });

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;