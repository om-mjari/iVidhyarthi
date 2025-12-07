const express = require("express");
const University = require("../models/Tbl_University");
const Registrars = require("../models/Tbl_Registrars");
const Users = require("../models/User");
const Institutes = require("../models/Tbl_Institutes");
const Students = require("../models/Tbl_Students");
const Lecturers = require("../models/Tbl_Lecturers");
const Courses = require("../models/Tbl_Courses");
const Payments = require("../models/Payment");

const router = express.Router();

// Middleware to authenticate admin
const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });
    }

    const token = authHeader.substring(7);

    // Check for mock admin token (for hardcoded admin login)
    if (token.startsWith("admin_mock_token_")) {
      req.user = {
        id: "admin_001",
        role: "admin",
        email: "admin123@gmail.com",
      };
      return next();
    }

    // For real JWT tokens
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");

    // Check if user is admin
    const user = await Users.findById(decoded.userId);
    if (!user || user.role !== "admin") {
      return res
        .status(401)
        .json({ success: false, message: "Admin access required" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

// Get all pending universities
router.get("/universities/pending", authenticateAdmin, async (req, res) => {
  try {
    const pendingUniversities = await University.find({
      Verification_Status: "pending",
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: pendingUniversities.map((uni) => ({
        _id: uni._id,
        University_Name: uni.University_Name,
        Location:
          uni.State && uni.City
            ? `${uni.City}, ${uni.State}`
            : uni.State || uni.City || "—",
        Contact_No: uni.Contact_No || "—",
        Website: uni.Website || "—",
        Verification_Status: uni.Verification_Status,
        createdAt: uni.createdAt,
        updatedAt: uni.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching pending universities:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get all universities (pending, approved, rejected)
router.get("/universities/all", authenticateAdmin, async (req, res) => {
  try {
    const allUniversities = await University.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: allUniversities.map((uni) => ({
        _id: uni._id,
        University_Name: uni.University_Name,
        Location:
          uni.State && uni.City
            ? `${uni.City}, ${uni.State}`
            : uni.State || uni.City || "—",
        Contact_No: uni.Contact_No || "—",
        Website: uni.Website || "—",
        Verification_Status: uni.Verification_Status || "pending",
        createdAt: uni.createdAt,
        updatedAt: uni.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching all universities:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get all universities
router.get("/universities", authenticateAdmin, async (req, res) => {
  try {
    const universities = await University.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: universities.map((uni) => ({
        id: uni._id,
        name: uni.University_Name,
        email: uni.University_Email,
        state: uni.State,
        city: uni.City,
        status: uni.Verification_Status,
        createdAt: uni.createdAt,
        updatedAt: uni.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching universities:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Approve university
router.put("/universities/:id/approve", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const university = await University.findById(id);
    if (!university) {
      return res
        .status(404)
        .json({ success: false, message: "University not found" });
    }

    university.Verification_Status = "verified";
    await university.save();

    res.json({
      success: true,
      message: "University approved successfully",
      data: {
        id: university._id,
        name: university.University_Name,
        status: university.Verification_Status,
      },
    });
  } catch (error) {
    console.error("Error approving university:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Reject university
router.put("/universities/:id/reject", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const university = await University.findById(id);
    if (!university) {
      return res
        .status(404)
        .json({ success: false, message: "University not found" });
    }

    university.Verification_Status = "rejected";
    await university.save();

    res.json({
      success: true,
      message: "University rejected successfully",
      data: {
        id: university._id,
        name: university.University_Name,
        status: university.Verification_Status,
      },
    });
  } catch (error) {
    console.error("Error rejecting university:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get admin dashboard stats
router.get("/stats", authenticateAdmin, async (req, res) => {
  try {
    const totalUniversities = await University.countDocuments();
    const pendingUniversities = await University.countDocuments({
      Verification_Status: "pending",
    });
    const verifiedUniversities = await University.countDocuments({
      Verification_Status: "verified",
    });
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
        totalLecturers,
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get all registrars
router.get("/registrars", authenticateAdmin, async (req, res) => {
  try {
    const registrars = await Registrars.find()
      .populate("User_Id", "email role")
      .populate("University_Id", "University_Name Verification_Status")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: registrars.map((reg) => ({
        id: reg._id,
        email: reg.User_Id.email,
        contact: reg.Contact_No,
        university: reg.University_Id?.University_Name || "Unknown",
        universityStatus: reg.University_Id?.Verification_Status || "pending",
        createdAt: reg.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching registrars:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ============================================
// DASHBOARD STATISTICS ENDPOINTS
// ============================================

// Get total users stats
router.get("/stats/users", authenticateAdmin, async (req, res) => {
  try {
    const totalUsers = await Users.countDocuments();
    const activeUsers = await Users.countDocuments({ isActive: true });

    console.log("📊 Users Stats - Total:", totalUsers, "Active:", activeUsers);

    res.json({
      success: true,
      data: {
        total: totalUsers,
        active: activeUsers,
        count: totalUsers,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching users stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users stats",
      error: error.message,
    });
  }
});

// Get courses stats
router.get("/stats/courses", authenticateAdmin, async (req, res) => {
  try {
    const totalCourses = await Courses.countDocuments();
    const activeCourses = await Courses.countDocuments({ Is_Active: true });

    console.log(
      "📊 Courses Stats - Total:",
      totalCourses,
      "Active:",
      activeCourses
    );

    res.json({
      success: true,
      data: {
        total: totalCourses,
        active: activeCourses,
        count: activeCourses,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching courses stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching courses stats",
      error: error.message,
    });
  }
});

// Get revenue stats
router.get("/stats/revenue", authenticateAdmin, async (req, res) => {
  try {
    const payments = await Payments.find({
      status: "SUCCESS",
    });

    const totalRevenue = payments.reduce((sum, payment) => {
      return sum + (parseFloat(payment.amount) || 0);
    }, 0);

    console.log(
      "📊 Revenue Stats - Total:",
      totalRevenue,
      "Payments:",
      payments.length
    );

    res.json({
      success: true,
      data: {
        total: Math.round(totalRevenue),
        currency: "INR",
        transactionCount: payments.length,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching revenue stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching revenue stats",
      error: error.message,
    });
  }
});

// Get all users (for User Management page)
router.get("/users", authenticateAdmin, async (req, res) => {
  try {
    console.log("📋 Fetching all users for admin dashboard...");

    // Fetch all users from the database
    const users = await Users.find()
      .select("name email role status isActive createdAt updatedAt")
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${users.length} users`);

    // Fetch names from respective tables
    const formattedUsers = await Promise.all(
      users.map(async (user) => {
        let fullName = user.name || "N/A";

        try {
          // Fetch name based on role
          if (user.role === "student") {
            const student = await Students.findOne({
              User_Id: user._id,
            }).select("Full_Name");
            if (student && student.Full_Name) {
              fullName = student.Full_Name;
            }
          } else if (user.role === "instructor" || user.role === "lecturer") {
            const lecturer = await Lecturers.findOne({
              User_Id: user._id,
            }).select("Full_Name");
            if (lecturer && lecturer.Full_Name) {
              fullName = lecturer.Full_Name;
            }
          } else if (user.role === "registrar") {
            const registrar = await Registrars.findOne({
              User_Id: user._id,
            }).select("Contact_No");
            // For registrar, we'll use the User.name since Registrars table doesn't have Full_Name
            // but we can mark it as verified if found
            if (registrar) {
              fullName = user.name || "Registrar";
            }
          }
        } catch (err) {
          console.error(`Error fetching details for user ${user._id}:`, err);
        }

        return {
          _id: user._id,
          id: user._id,
          name: fullName,
          email: user.email || "N/A",
          role: user.role || "user",
          status: user.isActive ? "active" : "inactive",
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };
      })
    );

    res.json({
      success: true,
      data: formattedUsers,
      count: formattedUsers.length,
    });
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
});

// Update user
router.put("/users/:userId", authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, role, status } = req.body;

    console.log(`📝 Updating user ${userId}...`);

    // Find and update the user
    const user = await Users.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update user fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (status) user.isActive = status === "active";

    await user.save();

    console.log(`✅ User ${userId} updated successfully`);

    res.json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("❌ Error updating user:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user",
      error: error.message,
    });
  }
});

// Delete user
router.delete("/users/:userId", authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`🗑️ Deleting user ${userId}...`);

    // Find the user
    const user = await Users.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete related records based on role
    if (user.role === "student") {
      await Students.deleteOne({ User_Id: userId });
    } else if (user.role === "instructor" || user.role === "lecturer") {
      await Lecturers.deleteOne({ User_Id: userId });
    } else if (user.role === "registrar") {
      await Registrars.deleteOne({ User_Id: userId });
    }

    // Delete the user
    await Users.findByIdAndDelete(userId);

    console.log(`✅ User ${userId} deleted successfully`);

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting user",
      error: error.message,
    });
  }
});

// Get all payments/transactions
router.get("/payments", authenticateAdmin, async (req, res) => {
  try {
    console.log("💳 Fetching all payments...");

    // Fetch all payments
    const payments = await Payments.find()
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✅ Found ${payments.length} payments`);

    // Fetch course details for all payments
    const formattedPayments = await Promise.all(
      payments.map(async (payment) => {
        let courseName = payment.courseName || "N/A";
        
        // If courseName is not in payment, fetch from Tbl_Courses
        if (!payment.courseName || payment.courseName === "") {
          try {
            // courseId in payment is a string, Course_Id in Tbl_Courses is a number
            const courseIdNum = parseInt(payment.courseId);
            const course = await Courses.findOne({ Course_Id: courseIdNum }).select("Title");
            if (course && course.Title) {
              courseName = course.Title;
            }
          } catch (err) {
            console.error(`Error fetching course for payment ${payment._id}:`, err);
          }
        }

        return {
          _id: payment._id,
          transactionId: payment.receiptNo || payment.orderId,
          studentId: payment.studentId,
          studentName: payment.studentName || "N/A",
          courseId: payment.courseId,
          courseName: courseName,
          amount: payment.amount,
          status: payment.status,
          type: payment.type,
          paymentDate: payment.paymentDate || payment.createdAt,
          orderId: payment.orderId,
          paymentId: payment.paymentId,
          receiptNo: payment.receiptNo,
          createdAt: payment.createdAt,
        };
      })
    );

    // Calculate stats
    const totalRevenue = payments
      .filter((p) => p.status === "SUCCESS")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const pendingPayments = payments
      .filter((p) => p.status === "PENDING")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const failedPayments = payments
      .filter((p) => p.status === "FAILED")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    res.json({
      success: true,
      data: formattedPayments,
      stats: {
        totalRevenue: Math.round(totalRevenue),
        pendingPayments: Math.round(pendingPayments),
        failedPayments: Math.round(failedPayments),
        totalCount: payments.length,
        successCount: payments.filter((p) => p.status === "SUCCESS").length,
        pendingCount: payments.filter((p) => p.status === "PENDING").length,
        failedCount: payments.filter((p) => p.status === "FAILED").length,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching payments:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching payments",
      error: error.message,
    });
  }
});

module.exports = router;
