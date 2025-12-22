const express = require("express");
const University = require("../models/Tbl_University");
const Registrars = require("../models/Tbl_Registrars");
const Users = require("../models/User");
const Institutes = require("../models/Tbl_Institutes");
const Students = require("../models/Tbl_Students");
const Lecturers = require("../models/Tbl_Lecturers");
const Courses = require("../models/Tbl_Courses");
const Payments = require("../models/Payment");
const Feedback = require("../models/Tbl_Feedback");

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
    const payments = await Payments.find().sort({ createdAt: -1 }).lean();

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
            const course = await Courses.findOne({
              Course_Id: courseIdNum,
            }).select("Title");
            if (course && course.Title) {
              courseName = course.Title;
            }
          } catch (err) {
            console.error(
              `Error fetching course for payment ${payment._id}:`,
              err
            );
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

// GET /api/admin/feedback - Fetch all feedback
router.get("/feedback", authenticateAdmin, async (req, res) => {
  try {
    console.log("📝 Fetching feedback data...");

    const feedbacks = await Feedback.find({}).lean();
    console.log(`✅ Found ${feedbacks.length} feedback entries`);

    // Populate student and course names
    const populatedFeedbacks = await Promise.all(
      feedbacks.map(async (feedback) => {
        // Fetch student name
        let studentName = "N/A";
        if (feedback.Student_Id) {
          try {
            // Try finding by Student_Id (integer)
            const studentId = parseInt(feedback.Student_Id);
            if (!isNaN(studentId)) {
              const student = await Students.findOne(
                { Student_Id: studentId }
              ).lean();
              if (student) {
                studentName = student.Full_Name || `${student.First_Name || ''} ${student.Last_Name || ''}`.trim();
                console.log(`Found student by Student_Id: ${studentName}`);
              }
            }

            // If not found, try by User_Id
            if (studentName === "N/A") {
              const studentByUserId = await Students.findOne({
                User_Id: feedback.Student_Id.toString()
              }).lean();

              if (studentByUserId) {
                studentName = studentByUserId.Full_Name || `${studentByUserId.First_Name || ''} ${studentByUserId.Last_Name || ''}`.trim();
                console.log(`Found student by User_Id: ${studentName}`);
              }
            }

            // If still not found, try finding user by email or _id
            if (studentName === "N/A") {
              const Users = require('../models/User');
              const user = await Users.findOne({
                $or: [
                  { email: feedback.Student_Id },
                  { _id: feedback.Student_Id }
                ]
              }).lean();

              if (user) {
                // Now find student by this user's ID
                const studentByUser = await Students.findOne({
                  User_Id: user._id.toString()
                }).lean();

                if (studentByUser) {
                  studentName = studentByUser.Full_Name || `${studentByUser.First_Name || ''} ${studentByUser.Last_Name || ''}`.trim();
                  console.log(`Found student via User lookup: ${studentName}`);
                } else {
                  studentName = user.name || studentName;
                  console.log(`Using User name: ${studentName}`);
                }
              }
            }
          } catch (err) {
            console.error(`Error fetching student for feedback ${feedback.Feedback_Id}:`, err);
          }
        }

        // Fetch course title
        let courseTitle = "N/A";
        if (feedback.Course_Id) {
          try {
            // Try parsing as number first
            const courseId = parseInt(feedback.Course_Id);

            if (!isNaN(courseId)) {
              // Numeric Course_Id
              const course = await Courses.findOne({ Course_Id: courseId }).lean();

              if (course) {
                courseTitle = course.Title || course.Course_Name || course.Name || courseTitle;
                console.log(`Found course: ${courseTitle}`);
              }
            }

            // If not found by integer, try string format
            if (courseTitle === "N/A") {
              const courseByString = await Courses.findOne({
                Course_Id: feedback.Course_Id.toString()
              }).lean();

              if (courseByString) {
                courseTitle = courseByString.Title || courseByString.Course_Name || courseByString.Name || courseTitle;
                console.log(`Found course by string ID: ${courseTitle}`);
              }
            }

            // Try COURSE_XXX format
            if (courseTitle === "N/A" && /COURSE_(\d+)/.test(feedback.Course_Id)) {
              const match = feedback.Course_Id.match(/COURSE_(\d+)/);
              const extractedId = parseInt(match[1]);
              const course = await Courses.findOne({ Course_Id: extractedId }).lean();

              if (course) {
                courseTitle = course.Title || course.Course_Name || course.Name || courseTitle;
                console.log(`Found course by COURSE_XXX format: ${courseTitle}`);
              }
            }
          } catch (err) {
            console.error(`Error fetching course for feedback ${feedback.Feedback_Id}:`, err);
          }
        }

        return {
          ...feedback,
          studentName,
          courseTitle,
        };
      })
    );

    // Calculate feedback stats
    const stats = {
      total: feedbacks.length,
      pending: feedbacks.filter((f) => f.Status === "Pending").length,
      approved: feedbacks.filter((f) => f.Status === "Approved").length,
      rejected: feedbacks.filter((f) => f.Status === "Rejected").length,
      flagged: feedbacks.filter((f) => f.Status === "Flagged").length,
      averageRating:
        feedbacks.length > 0
          ? (
            feedbacks.reduce((sum, f) => sum + (f.Rating || 0), 0) /
            feedbacks.length
          ).toFixed(2)
          : 0,
    };

    console.log("📊 Feedback stats:", stats);

    res.json({
      success: true,
      feedbacks: populatedFeedbacks,
      stats,
    });
  } catch (error) {
    console.error("❌ Error fetching feedback:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching feedback",
      error: error.message,
    });
  }
});

// Approve feedback
router.put("/feedback/:id/approve", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`✅ Approving feedback: ${id}`);

    const Feedback = require("../models/Tbl_Feedback");
    const feedback = await Feedback.findOne({ Feedback_Id: id });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    feedback.Status = "Approved";
    await feedback.save();

    console.log(`✅ Feedback ${id} approved successfully`);

    res.json({
      success: true,
      message: "Feedback approved successfully",
      data: feedback,
    });
  } catch (error) {
    console.error("❌ Error approving feedback:", error);
    res.status(500).json({
      success: false,
      message: "Error approving feedback",
      error: error.message,
    });
  }
});

// Reject feedback
router.put("/feedback/:id/reject", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`❌ Rejecting feedback: ${id}`);

    const Feedback = require("../models/Tbl_Feedback");
    const feedback = await Feedback.findOne({ Feedback_Id: id });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    feedback.Status = "Rejected";
    await feedback.save();

    console.log(`❌ Feedback ${id} rejected successfully`);

    res.json({
      success: true,
      message: "Feedback rejected successfully",
      data: feedback,
    });
  } catch (error) {
    console.error("❌ Error rejecting feedback:", error);
    res.status(500).json({
      success: false,
      message: "Error rejecting feedback",
      error: error.message,
    });
  }
});

// Respond to feedback
router.put("/feedback/:id/respond", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { response, studentId } = req.body;

    console.log(`💬 Responding to feedback: ${id}`);

    if (!response || !response.trim()) {
      return res.status(400).json({
        success: false,
        message: "Response message is required",
      });
    }

    const Feedback = require("../models/Tbl_Feedback");
    const feedback = await Feedback.findOne({ Feedback_Id: id });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    feedback.Response = response.trim();
    feedback.Responded_On = new Date();
    await feedback.save();

    // Create notification for student
    const Notification = require("../models/Tbl_Notifications");
    try {
      const notification = new Notification({
        User_Id: studentId,
        Type: "Feedback Response",
        Title: "Admin Responded to Your Feedback",
        Message: `Admin has responded to your feedback: "${response.substring(
          0,
          100
        )}${response.length > 100 ? "..." : ""}"`,
        Link: `/student/feedback`,
        Is_Read: false,
        Created_At: new Date(),
      });
      await notification.save();
      console.log(`🔔 Notification created for student ${studentId}`);
    } catch (notifError) {
      console.warn("⚠️ Failed to create notification:", notifError.message);
      // Don't fail the request if notification fails
    }

    console.log(`💬 Response sent successfully to feedback ${id}`);

    res.json({
      success: true,
      message: "Response sent successfully. Student has been notified.",
      data: feedback,
    });
  } catch (error) {
    console.error("❌ Error responding to feedback:", error);
    res.status(500).json({
      success: false,
      message: "Error sending response",
      error: error.message,
    });
  }
});

// Delete feedback (admin only)
router.delete("/feedback/:id", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deleting feedback: ${id}`);

    const Feedback = require("../models/Tbl_Feedback");
    const feedback = await Feedback.findOne({ Feedback_Id: id });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    await Feedback.deleteOne({ Feedback_Id: id });

    console.log(`✅ Feedback ${id} deleted successfully`);

    res.json({
      success: true,
      message: "Feedback deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting feedback:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting feedback",
      error: error.message,
    });
  }
});

// Get all sessions for admin dashboard
router.get("/sessions", authenticateAdmin, async (req, res) => {
  try {
    console.log("📋 Fetching all sessions for admin...");

    const Tbl_Sessions = require("../models/Tbl_Sessions");
    const Tbl_Courses = require("../models/Tbl_Courses");
    const Tbl_Lecturers = require("../models/Tbl_Lecturers");
    const Tbl_Enrollments = require("../models/Tbl_Enrollments");
    const Users = require("../models/User");

    // Fetch all sessions sorted by scheduled date (most recent first)
    const sessions = await Tbl_Sessions.find()
      .sort({ Scheduled_At: -1 })
      .lean();

    console.log(`✅ Found ${sessions.length} sessions`);

    // Enrich sessions with course and instructor information
    const enrichedSessions = await Promise.all(
      sessions.map(async (session) => {
        let courseName = "Unknown Course";
        let instructorName = "Unknown Instructor";
        let enrolledCount = 0;

        try {
          // Get course details - try both Course_Id formats
          let course = await Tbl_Courses.findOne({
            Course_Id: parseInt(session.Course_Id),
          }).lean();

          // If not found by integer, try string format
          if (!course) {
            course = await Tbl_Courses.findOne({
              Course_Id: session.Course_Id.toString(),
            }).lean();
          }

          if (course) {
            courseName = course.Title || course.Course_Name || course.Name || courseName;

            // Get enrollment count for this course
            enrolledCount = await Tbl_Enrollments.countDocuments({
              $or: [
                { Course_Id: course.Course_Id.toString() },
                { Course_Id: parseInt(course.Course_Id) }
              ],
              Status: 'Active'
            });

            // Get lecturer details from course
            if (course.Lecturer_Id) {
              // Try finding by email in Users table first (very common in this project)
              const user = await Users.findOne({
                email: course.Lecturer_Id.toLowerCase(),
              }).lean();

              if (user) {
                // Find lecturer by User_Id
                const lecturer = await Tbl_Lecturers.findOne({ User_Id: user._id }).lean();
                instructorName = lecturer ? lecturer.Full_Name : (user.name || instructorName);
              } else {
                // Try finding lecturer directly by ID if Lecturer_Id is an ObjectId string or Number
                try {
                  const lecturer = await Tbl_Lecturers.findOne({
                    $or: [
                      { _id: course.Lecturer_Id },
                      { Lecturer_Id: parseInt(course.Lecturer_Id) || -1 }
                    ]
                  }).lean();

                  if (lecturer) {
                    instructorName = lecturer.Full_Name || instructorName;
                  }
                } catch (e) {
                  // Ignore invalid ID errors
                }
              }
            }
          }
        } catch (err) {
          console.error(`Error enriching session ${session.Session_Id}:`, err);
        }

        return {
          id: session.Session_Id,
          session_id: session.Session_Id,
          title: session.Title,
          course_name: courseName,
          instructor: instructorName,
          participants: enrolledCount, // Display enrollment count as participants count
          enrolled_students: enrolledCount,
          status: (() => {
            const now = new Date();
            let schedDate = new Date(session.Scheduled_At);

            // Handle potentially invalid date formats
            if (isNaN(schedDate.getTime()) && typeof session.Scheduled_At === 'string') {
              const parts = session.Scheduled_At.split(/[\/\- \:]/);
              if (parts.length >= 3) {
                const d = parseInt(parts[0]);
                const m = parseInt(parts[1]) - 1;
                const y = parts[2].length === 2 ? 2000 + parseInt(parts[2]) : parseInt(parts[2]);
                const h = parseInt(parts[3]) || 0;
                const min = parseInt(parts[4]) || 0;
                const tempDate = new Date(y, m, d, h, min);
                if (!isNaN(tempDate.getTime())) schedDate = tempDate;
              }
            }

            if (isNaN(schedDate.getTime())) return session.Status || 'Upcoming';

            const durationMins = parseInt(session.Duration) || 60;
            const sessionEnd = new Date(schedDate.getTime() + (durationMins * 60000));
            const isWayPast = now.getTime() > (sessionEnd.getTime() + (60 * 60 * 1000)); // 1 hour buffer

            if (session.Status === 'Completed') return 'Completed';
            if (session.Status === 'Cancelled') return 'Cancelled';

            if (session.Status === 'Ongoing') {
              return isWayPast ? 'Completed' : 'Ongoing';
            }

            if (schedDate > now) {
              return 'Upcoming';
            }
            return 'Never Started';
          })(),
          scheduled_at: session.Scheduled_At,
          duration: session.Duration,
          session_url: session.Session_Url,
          meeting_link: session.Session_Url,
          description: session.Description,
        };
      })
    );

    console.log(`✅ Enrichment complete for ${enrichedSessions.length} sessions.`);
    enrichedSessions.forEach(s => console.log(`Session: ${s.title}, DB_Status: ${sessions.find(orig => orig.Session_Id === s.id).Status}, Calculated: ${s.status}`));

    res.json({
      success: true,
      data: enrichedSessions,
      count: enrichedSessions.length,
    });
  } catch (error) {
    console.error("❌ Error fetching sessions:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching sessions",
      error: error.message,
    });
  }
});

// Get session statistics for admin dashboard
router.get("/stats/sessions", authenticateAdmin, async (req, res) => {
  try {
    console.log("📊 Fetching session stats...");

    const Tbl_Sessions = require("../models/Tbl_Sessions");
    const now = new Date();

    // Count active (ongoing) sessions
    const activeSessions = await Tbl_Sessions.countDocuments({
      Status: "Ongoing",
    });

    // Count total sessions today
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));

    const sessionsToday = await Tbl_Sessions.countDocuments({
      Scheduled_At: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    // Calculate total participants (sum of all participants in ongoing sessions)
    const ongoingSessions = await Tbl_Sessions.find({
      Status: "Ongoing",
    }).lean();

    const totalParticipants = ongoingSessions.reduce(
      (sum, session) => sum + (session.Participants || 0),
      0
    );

    res.json({
      success: true,
      data: {
        active: activeSessions,
        today: sessionsToday,
        totalParticipants: totalParticipants,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching session stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching session stats",
      error: error.message,
    });
  }
});

module.exports = router;
