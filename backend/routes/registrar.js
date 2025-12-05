const express = require("express");
const Registrars = require("../models/Tbl_Registrars");
const Users = require("../models/User");
const Institutes = require("../models/Tbl_Institutes");
const Students = require("../models/Tbl_Students");
const Lecturers = require("../models/Tbl_Lecturers");
const University = require("../models/Tbl_University");
const Courses = require("../models/Tbl_Courses");

const router = express.Router();

// Middleware to authenticate registrar
const authenticateRegistrar = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });
    }

    const token = authHeader.substring(7);
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");

    // Find registrar by user_id
    const registrar = await Registrars.findOne({
      User_Id: decoded.userId,
    }).populate("User_Id");
    if (!registrar) {
      return res
        .status(401)
        .json({ success: false, message: "Registrar not found" });
    }

    req.registrar = registrar;
    req.user = registrar.User_Id;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

// Get registrar profile
router.get("/profile", authenticateRegistrar, async (req, res) => {
  try {
    const registrar = await Registrars.findOne({ User_Id: req.user._id })
      .populate("User_Id")
      .populate("University_Id");

    if (!registrar) {
      return res
        .status(404)
        .json({ success: false, message: "Registrar profile not found" });
    }

    // Check if university is approved
    const isUniversityApproved =
      registrar.University_Id?.Verification_Status === "verified";

    res.json({
      success: true,
      data: {
        name: registrar.User_Id.email.split("@")[0],
        email: registrar.User_Id.email,
        contact: registrar.Contact_No,
        university:
          registrar.University_Id?.University_Name || "Unknown University",
        universityId: registrar.University_Id?._id,
        role: "registrar",
        universityApproved: isUniversityApproved,
        universityStatus:
          registrar.University_Id?.Verification_Status || "pending",
      },
    });
  } catch (error) {
    console.error("Error fetching registrar profile:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update registrar profile (only contact info)
router.put("/profile", authenticateRegistrar, async (req, res) => {
  try {
    const { contact } = req.body;

    const registrar = await Registrars.findOne({ User_Id: req.user._id });
    if (!registrar) {
      return res
        .status(404)
        .json({ success: false, message: "Registrar not found" });
    }

    // Update contact if provided
    if (contact) {
      registrar.Contact_No = contact;
      await registrar.save();
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        contact: registrar.Contact_No,
      },
    });
  } catch (error) {
    console.error("Error updating registrar profile:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Change password
router.put("/change-password", authenticateRegistrar, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    const user = await Users.findById(req.user._id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    user.password = newPassword; // This will be hashed by the pre-save middleware
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get all registrars with their university IDs and contact numbers
router.get("/get-registrars", async (req, res) => {
  try {
    const registrars = await Registrars.find()
      .select("University_Id Contact_No")
      .lean();

    res.json({
      success: true,
      data: registrars,
    });
  } catch (error) {
    console.error("Error fetching registrars:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get dashboard stats
router.get("/stats", authenticateRegistrar, async (req, res) => {
  try {
    const registrar = await Registrars.findOne({ User_Id: req.user._id });
    if (!registrar) {
      return res
        .status(404)
        .json({ success: false, message: "Registrar not found" });
    }

    // Get institutes under this registrar's university
    const institutes = await Institutes.find({
      University_Id: registrar.University_Id,
    });

    // Get students from these institutes
    const instituteIds = institutes.map((inst) => inst._id);
    const students = await Students.find({
      Institution_Id: { $in: instituteIds },
    });

    // Get lecturers from these institutes
    const lecturers = await Lecturers.find({
      Institute_Id: { $in: instituteIds },
    });

    // Get lecturer IDs to count courses
    const lecturerIds = lecturers.map((lec) => lec._id.toString());

    // Count active courses taught by these lecturers
    const activeCourses = await Courses.countDocuments({
      Lecturer_Id: { $in: lecturerIds },
      Is_Active: true,
      status: "approved",
    });

    // Calculate stats
    const totalInstitutes = institutes.length;
    const totalStudents = students.length;
    const totalLecturers = lecturers.length;

    res.json({
      success: true,
      data: {
        totalInstitutes,
        totalStudents,
        totalLecturers,
        activeCourses,
        pendingApprovals: 0, // You can implement approval logic
      },
    });
  } catch (error) {
    console.error("Error fetching registrar stats:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get institutes under registrar's university
router.get("/institutes", authenticateRegistrar, async (req, res) => {
  try {
    const registrar = await Registrars.findOne({ User_Id: req.user._id });
    if (!registrar) {
      return res
        .status(404)
        .json({ success: false, message: "Registrar not found" });
    }

    const institutes = await Institutes.find({
      University_Id: registrar.University_Id,
    }).populate("University_Id", "University_Name");

    res.json({
      success: true,
      data: institutes.map((inst) => ({
        id: inst._id,
        name: inst.Institute_Name,
        courses: inst.Courses_Offered || "",
        status: inst.Verification_Status || "Active",
        university: inst.University_Id?.University_Name || "Unknown",
      })),
    });
  } catch (error) {
    console.error("Error fetching institutes:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Add new institute
router.post("/institutes", authenticateRegistrar, async (req, res) => {
  try {
    const { name, courses } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Institute name is required" });
    }

    const registrar = await Registrars.findOne({
      User_Id: req.user._id,
    }).populate("University_Id");
    if (!registrar) {
      return res
        .status(404)
        .json({ success: false, message: "Registrar not found" });
    }

    // Check if university is approved
    if (registrar.University_Id?.Verification_Status !== "verified") {
      return res.status(403).json({
        success: false,
        message:
          "Your university is not approved yet. You cannot add institutes until your university is verified by admin.",
      });
    }

    const institute = await Institutes.create({
      Institute_Name: name,
      Courses_Offered: courses || "",
      University_Id: registrar.University_Id._id,
      Verification_Status: "Active",
    });

    res.json({
      success: true,
      message: "Institute added successfully",
      data: {
        id: institute._id,
        name: institute.Institute_Name,
        courses: institute.Courses_Offered,
        status: institute.Verification_Status,
      },
    });
  } catch (error) {
    console.error("Error adding institute:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update institute
router.put("/institutes/:id", authenticateRegistrar, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, courses, status } = req.body;

    const registrar = await Registrars.findOne({
      User_Id: req.user._id,
    }).populate("University_Id");
    if (!registrar) {
      return res
        .status(404)
        .json({ success: false, message: "Registrar not found" });
    }

    // Check if university is approved
    if (registrar.University_Id?.Verification_Status !== "verified") {
      return res.status(403).json({
        success: false,
        message:
          "Your university is not approved yet. You cannot update institutes until your university is verified by admin.",
      });
    }

    const institute = await Institutes.findOne({
      _id: id,
      University_Id: registrar.University_Id,
    });

    if (!institute) {
      return res
        .status(404)
        .json({ success: false, message: "Institute not found" });
    }

    if (name) institute.Institute_Name = name;
    if (courses !== undefined) institute.Courses_Offered = courses;
    if (status) institute.Verification_Status = status;

    await institute.save();

    res.json({
      success: true,
      message: "Institute updated successfully",
      data: {
        id: institute._id,
        name: institute.Institute_Name,
        courses: institute.Courses_Offered,
        status: institute.Verification_Status,
      },
    });
  } catch (error) {
    console.error("Error updating institute:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete institute
router.delete("/institutes/:id", authenticateRegistrar, async (req, res) => {
  try {
    const { id } = req.params;

    const registrar = await Registrars.findOne({
      User_Id: req.user._id,
    }).populate("University_Id");
    if (!registrar) {
      return res
        .status(404)
        .json({ success: false, message: "Registrar not found" });
    }

    // Check if university is approved
    if (registrar.University_Id?.Verification_Status !== "verified") {
      return res.status(403).json({
        success: false,
        message:
          "Your university is not approved yet. You cannot delete institutes until your university is verified by admin.",
      });
    }

    const institute = await Institutes.findOneAndDelete({
      _id: id,
      University_Id: registrar.University_Id,
    });

    if (!institute) {
      return res
        .status(404)
        .json({ success: false, message: "Institute not found" });
    }

    res.json({
      success: true,
      message: "Institute deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting institute:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get analytics data
router.get("/analytics", authenticateRegistrar, async (req, res) => {
  try {
    const registrar = await Registrars.findOne({ User_Id: req.user._id });
    if (!registrar) {
      return res
        .status(404)
        .json({ success: false, message: "Registrar not found" });
    }

    const institutes = await Institutes.find({
      University_Id: registrar.University_Id,
    });
    const instituteIds = institutes.map((inst) => inst._id);

    const students = await Students.find({
      Institution_Id: { $in: instituteIds },
    });
    const lecturers = await Lecturers.find({
      Institute_Id: { $in: instituteIds },
    });

    // Group students by institute
    const studentsByInstitute = {};
    students.forEach((student) => {
      const instituteId = student.Institution_Id.toString();
      if (!studentsByInstitute[instituteId]) {
        studentsByInstitute[instituteId] = [];
      }
      studentsByInstitute[instituteId].push(student);
    });

    // Create analytics data
    const analytics = institutes.map((inst) => {
      const instituteStudents = studentsByInstitute[inst._id.toString()] || [];
      const instituteLecturers = lecturers.filter(
        (lec) => lec.Institute_Id.toString() === inst._id.toString()
      );

      return {
        instituteId: inst._id,
        instituteName: inst.Institute_Name,
        totalStudents: instituteStudents.length,
        totalLecturers: instituteLecturers.length,
        courses: inst.Courses_Offered || [],
        students: instituteStudents.map((s) => ({
          name: s.Full_Name,
          course: s.Course,
          enrollmentYear: s.Enrollment_Year,
        })),
      };
    });

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get registrar login history
router.get("/login-history", authenticateRegistrar, async (req, res) => {
  try {
    const registrar = await Registrars.findOne({ User_Id: req.user._id });

    if (!registrar) {
      return res
        .status(404)
        .json({ success: false, message: "Registrar not found" });
    }

    // Get login history from registrar document
    const loginHistory = registrar.LoginHistory || [];

    // Sort by most recent first
    const sortedHistory = loginHistory.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    // Return last 10 logins
    res.json({
      success: true,
      data: sortedHistory.slice(0, 10),
    });
  } catch (error) {
    console.error("Error fetching login history:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Seed initial login history (for testing/demo - remove in production)
router.post("/seed-login-history", authenticateRegistrar, async (req, res) => {
  try {
    const registrar = await Registrars.findOne({ User_Id: req.user._id });

    if (!registrar) {
      return res
        .status(404)
        .json({ success: false, message: "Registrar not found" });
    }

    // Generate sample login history
    const now = new Date();
    const sampleHistory = [
      {
        timestamp: new Date(now - 2 * 60 * 60 * 1000), // 2 hours ago
        ip: "192.168.1.100",
        device: "Desktop",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
      },
      {
        timestamp: new Date(now - 24 * 60 * 60 * 1000), // 1 day ago
        ip: "192.168.1.105",
        device: "Mobile",
        userAgent: "Mozilla/5.0 (Android 14; Mobile) Chrome/120.0.0.0",
      },
      {
        timestamp: new Date(now - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        ip: "192.168.1.100",
        device: "Desktop",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
      },
      {
        timestamp: new Date(now - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        ip: "192.168.1.110",
        device: "Tablet",
        userAgent: "Mozilla/5.0 (iPad; CPU OS 17_0) Safari/605.1.15",
      },
      {
        timestamp: new Date(now - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        ip: "192.168.1.100",
        device: "Desktop",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
      },
    ];

    registrar.LoginHistory = sampleHistory;
    await registrar.save();

    res.json({
      success: true,
      message: "Sample login history added successfully",
      count: sampleHistory.length,
    });
  } catch (error) {
    console.error("Error seeding login history:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get monthly enrollment trends
router.get("/monthly-trends", authenticateRegistrar, async (req, res) => {
  try {
    const registrar = await Registrars.findOne({ User_Id: req.user._id });
    if (!registrar) {
      return res
        .status(404)
        .json({ success: false, message: "Registrar not found" });
    }

    const institutes = await Institutes.find({
      University_Id: registrar.University_Id,
    });
    const instituteIds = institutes.map((inst) => inst._id);

    // Get all students from these institutes
    const students = await Students.find({
      Institution_Id: { $in: instituteIds },
    });

    // Group students by month (last 6 months)
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const currentDate = new Date();
    const monthlyData = [];

    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1
      );
      const monthIndex = targetDate.getMonth();
      const year = targetDate.getFullYear();

      // Count students enrolled in this month
      const enrollmentsInMonth = students.filter((student) => {
        if (student.createdAt) {
          const studentDate = new Date(student.createdAt);
          return (
            studentDate.getMonth() === monthIndex &&
            studentDate.getFullYear() === year
          );
        }
        return false;
      }).length;

      // Count active institutes in this month
      const activeInstitutes = institutes.filter((inst) => {
        if (inst.createdAt) {
          const instDate = new Date(inst.createdAt);
          return instDate <= targetDate;
        }
        return true;
      }).length;

      monthlyData.push({
        month: monthNames[monthIndex],
        enrollments: enrollmentsInMonth,
        institutes: activeInstitutes || institutes.length,
      });
    }

    res.json({
      success: true,
      data: monthlyData,
    });
  } catch (error) {
    console.error("Error fetching monthly trends:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get top popular courses
router.get("/top-courses", authenticateRegistrar, async (req, res) => {
  try {
    const registrar = await Registrars.findOne({ User_Id: req.user._id });
    if (!registrar) {
      return res
        .status(404)
        .json({ success: false, message: "Registrar not found" });
    }

    const institutes = await Institutes.find({
      University_Id: registrar.University_Id,
    });
    const instituteIds = institutes.map((inst) => inst._id);

    // Get all lecturers from these institutes
    const lecturers = await Lecturers.find({
      Institute_Id: { $in: instituteIds },
    });
    const lecturerIds = lecturers.map((lec) => lec._id.toString());

    // Get all courses taught by these lecturers
    const courses = await Courses.find({
      Lecturer_Id: { $in: lecturerIds },
      Is_Active: true,
      status: "approved",
    });

    // Get enrollments for these courses
    const Enrollments = require("../models/Tbl_Enrollments");
    const enrollments = await Enrollments.find({
      Course_Id: { $in: courses.map((c) => c.Course_Id) },
    });

    // Count enrollments per course
    const courseStats = {};
    enrollments.forEach((enrollment) => {
      const courseId = enrollment.Course_Id;
      if (!courseStats[courseId]) {
        courseStats[courseId] = 0;
      }
      courseStats[courseId]++;
    });

    // Map course data with enrollment counts
    const courseData = courses.map((course) => {
      const lecturer = lecturers.find(
        (l) => l._id.toString() === course.Lecturer_Id
      );
      const institute = institutes.find(
        (i) => i._id.toString() === lecturer?.Institute_Id?.toString()
      );

      return {
        name: course.Title,
        students: courseStats[course.Course_Id] || 0,
        courseId: course.Course_Id,
        institute: institute?.Institute_Name || "Unknown",
      };
    });

    // Group by course title and count institutes
    const groupedCourses = {};
    courseData.forEach((course) => {
      if (!groupedCourses[course.name]) {
        groupedCourses[course.name] = {
          name: course.name,
          students: 0,
          institutes: new Set(),
        };
      }
      groupedCourses[course.name].students += course.students;
      groupedCourses[course.name].institutes.add(course.institute);
    });

    // Convert to array and sort by student count
    const topCourses = Object.values(groupedCourses)
      .map((course) => ({
        name: course.name,
        students: course.students,
        institutes: course.institutes.size,
      }))
      .sort((a, b) => b.students - a.students)
      .slice(0, 5);

    res.json({
      success: true,
      data: topCourses,
    });
  } catch (error) {
    console.error("Error fetching top courses:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get recent activities
router.get("/recent-activities", authenticateRegistrar, async (req, res) => {
  try {
    const registrar = await Registrars.findOne({ User_Id: req.user._id });
    if (!registrar) {
      return res
        .status(404)
        .json({ success: false, message: "Registrar not found" });
    }

    const institutes = await Institutes.find({
      University_Id: registrar.University_Id,
    }).sort({ createdAt: -1 });
    const instituteIds = institutes.map((inst) => inst._id);

    // Get recent students
    const recentStudents = await Students.find({
      Institution_Id: { $in: instituteIds },
    })
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent lecturers
    const lecturers = await Lecturers.find({
      Institute_Id: { $in: instituteIds },
    });
    const lecturerIds = lecturers.map((l) => l._id.toString());

    // Get recent courses
    const recentCourses = await Courses.find({
      Lecturer_Id: { $in: lecturerIds },
    })
      .sort({ Created_At: -1 })
      .limit(5);

    const activities = [];

    // Add student enrollments
    recentStudents.forEach((student) => {
      const institute = institutes.find(
        (i) => i._id.toString() === student.Institution_Id?.toString()
      );
      activities.push({
        type: "enrollment",
        message: `New student enrolled: ${student.Full_Name}`,
        time: student.createdAt || new Date(),
        icon: "👤",
        institute: institute?.Institute_Name,
      });
    });

    // Add course additions
    recentCourses.forEach((course) => {
      const lecturer = lecturers.find(
        (l) => l._id.toString() === course.Lecturer_Id
      );
      const institute = institutes.find(
        (i) => i._id.toString() === lecturer?.Institute_Id?.toString()
      );
      activities.push({
        type: "course",
        message: `New course added: ${course.Title}`,
        time: course.Created_At || new Date(),
        icon: "📚",
        institute: institute?.Institute_Name,
      });
    });

    // Add institute additions
    institutes.slice(0, 3).forEach((inst) => {
      if (inst.createdAt) {
        activities.push({
          type: "institute",
          message: `Institute added: ${inst.Institute_Name}`,
          time: inst.createdAt,
          icon: "🏛️",
          institute: inst.Institute_Name,
        });
      }
    });

    // Sort by time and return top 10
    const sortedActivities = activities
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 10)
      .map((activity) => ({
        ...activity,
        time: formatTimeAgo(new Date(activity.time)),
      }));

    res.json({
      success: true,
      data: sortedActivities,
    });
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Helper function to format time ago
function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? "s" : ""} ago`;
    }
  }

  return "Just now";
}

module.exports = router;
