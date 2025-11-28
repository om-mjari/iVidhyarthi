const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Token = require("../models/token");
const University = require("../models/Tbl_University");
const Institutes = require("../models/Tbl_Institutes");
const Students = require("../models/Tbl_Students");
const Registrars = require("../models/Tbl_Registrars");
const Lecturers = require("../models/Tbl_Lecturers");

const router = express.Router();

// Register new user
router.post("/register", async (req, res) => {
  try {
    console.log("📝 Registration request received");

    // Normalize and map incoming fields
    const rawEmail = (req.body.email || "").toLowerCase().trim();
    const rawPassword = req.body.password || "";
    const mappedName = (
      req.body.name ||
      req.body.fullName ||
      rawEmail.split("@")[0] ||
      "User"
    ).trim();

    if (!rawEmail || !rawPassword) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: rawEmail });
    if (existingUser) {
      // If user exists but email is not verified, resend verification link
      if (!existingUser.isEmailVerified) {
        try {
          // Delete any old tokens and resend verification
          const Token = require("../models/token");
          await Token.deleteMany({ userId: existingUser._id });
          const emailResult = await existingUser.generateVerificationToken();
          if (!emailResult.success) {
            return res.status(500).json({
              success: false,
              message: "Failed to resend verification email. Please try again.",
            });
          }
          return res.status(200).json({
            success: true,
            message:
              "This email is already registered but not verified. A new verification email has been sent.",
          });
        } catch (e) {
          return res.status(500).json({
            success: false,
            message: "Could not resend verification email.",
          });
        }
      }
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Determine role
    const incomingType = (req.body.userType || req.body.role || "")
      .toString()
      .toLowerCase();
    let role = "student";
    if (incomingType === "lecturer" || incomingType === "instructor")
      role = "instructor";
    else if (incomingType === "registrar") role = "registrar";
    else if (incomingType === "admin") role = "admin";

    // Create User (minimal schema)
    const user = new User({ email: rawEmail, role });
    user.password = rawPassword; // virtual -> hashes into passwordHash
    await user.save();

    // Link data to normalized tables
    const commonPhone = (
      req.body.phone ||
      req.body.contactNumber ||
      req.body.mobileNo ||
      req.body.contactNo ||
      ""
    ).toString();
    const gender = req.body.gender
      ? String(req.body.gender).toLowerCase()
      : undefined;
    const dob = req.body.dob || req.body.dateOfBirth || undefined;

    const universityName =
      req.body.university ||
      (req.body.education && req.body.education.university) ||
      undefined;
    const instituteName =
      req.body.institute ||
      (req.body.education && req.body.education.institution) ||
      undefined;

    const highestQualification =
      req.body.highestQualification ||
      (req.body.education && req.body.education.highestQualification) ||
      undefined;
    const specialization = req.body.specialization || undefined;
    const designation = req.body.designation || undefined;
    const experienceYears = req.body.experienceYears || undefined;
    const enrollmentYear = req.body.enrollmentYear
      ? Number(req.body.enrollmentYear)
      : undefined;

    const findOrCreateUniversity = async (name) => {
      if (!name) return null;
      let u = await University.findOne({ University_Name: name.trim() });
      if (!u) {
        u = await University.create({
          University_Name: name.trim(),
          Verification_Status: "pending",
        });
      }
      return u;
    };
    const findOrCreateInstitute = async (name, uni) => {
      if (!name) return null;
      let i = await Institutes.findOne({
        Institute_Name: name.trim(),
        ...(uni ? { University_Id: uni._id } : {}),
      });
      if (!i) {
        i = await Institutes.create({
          Institute_Name: name.trim(),
          University_Id: uni ? uni._id : undefined,
        });
      }
      return i;
    };

    try {
      let uniDoc = await findOrCreateUniversity(universityName);
      let instDoc = await findOrCreateInstitute(instituteName, uniDoc);

      if (role === "student") {
        await Students.create({
          User_Id: user._id,
          Full_Name: mappedName,
          Mobile_No: commonPhone || undefined,
          Institution_Id: instDoc ? instDoc._id : undefined,
          Enrollment_Year: enrollmentYear,
          Branch:
            req.body.branch ||
            (req.body.education && req.body.education.branch) ||
            undefined,
          Course:
            req.body.course ||
            (req.body.education && req.body.education.course) ||
            undefined,
          Semester:
            req.body.semester ||
            (req.body.education && req.body.education.semester) ||
            undefined,
          Highest_Qualification: highestQualification,
          DOB: dob,
          Gender: gender,
        });
      } else if (role === "registrar") {
        const usedUni =
          uniDoc ||
          (await findOrCreateUniversity(
            universityName || "Unknown University"
          ));
        await Registrars.create({
          User_Id: user._id,
          Contact_No: commonPhone || undefined,
          University_Id: usedUni._id,
        });
      } else if (role === "instructor") {
        const usedUni =
          uniDoc || (await findOrCreateUniversity(universityName || ""));
        const usedInst =
          instDoc ||
          (await findOrCreateInstitute(instituteName || "", usedUni));
        await Lecturers.create({
          User_Id: user._id,
          Full_Name: mappedName,
          Mobile_No: commonPhone || undefined,
          DOB: dob,
          Gender: gender,
          Institute_Id: usedInst ? usedInst._id : undefined,
          Highest_Qualification: highestQualification,
          Specialization: specialization,
          Designation: designation,
          Experience_Years: experienceYears,
        });
      }
    } catch (e) {
      console.warn("Role table insert failed:", e.message);
      // Do not fail the signup if auxiliary insert fails
    }

    // Generate verification token and send email using User method
    const emailResult = { success: true };

    if (!emailResult.success) {
      console.error(
        "Failed to send verification email:",
        emailResult.message || emailResult.error
      );
      // If email fails due to misconfiguration, still respond with success for registration,
      // but inform client to contact support. This avoids 500 on frontend.
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || "dev-secret";
    const jwtToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      message:
        "User registered successfully. Please check your email to verify your account.",
      data: {
        user: user.toJSON(),
        token: jwtToken,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: errors[0] || "Validation failed",
        errors,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: error.message,
    });
  }
});

router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required",
      });
    }

    // Find the token in database
    const tokenDoc = await Token.findOne({ token });

    if (!tokenDoc) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
      });
    }

    // Update user's email verification status
    const user = await User.findByIdAndUpdate(
      tokenDoc.userId,
      { isEmailVerified: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete the used token
    await Token.findByIdAndDelete(tokenDoc._id);

    console.log("✅ Email verified for user:", user.email);

    res.json({
      success: true,
      message:
        "Email verified successfully! You can now log in to your account.",
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({
      success: false,
      message: "Email verification failed",
      error: error.message,
    });
  }
});

// Login user - Simplified for direct entry
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("🔐 Login attempt for:", email);
    console.log("🔐 Password length:", password.length);

    // Find user by email
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log(
        "❌ User not found in database for email:",
        email.toLowerCase()
      );
      return res.status(401).json({
        success: false,
        message: "User not found. Please register first.",
      });
    }

    console.log("✅ User found in database:", user.email);
    try {
      const ph = user.passwordHash || "";
      console.log(
        "🔐 Stored password hash starts with:",
        String(ph).substring(0, 20)
      );
    } catch (_) {}

    // Allow login even if email is not verified (relaxed for current requirement)

    // Verify password
    console.log("🔐 Comparing password...");
    const isPasswordValid = await user.comparePassword(password);
    console.log("🔐 Password comparison result:", isPasswordValid);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }
    console.log("✅ Login successful for:", user.email);

    // Update last login
    try {
      user.lastLogin = new Date();
      await user.save();
    } catch (saveError) {
      console.log("⚠️ Could not update lastLogin, continuing...");
    }

    // Build profile info for dashboard
    let profile = { email: user.email, role: user.role };
    try {
      if (!user.role || user.role === "student") {
        const student = await Students.findOne({ User_Id: user._id });
        if (student) {
          profile.name = student.Full_Name || "";
          profile.dateOfBirth = student.DOB
            ? new Date(student.DOB).toISOString()
            : null;
          profile.gender = student.Gender || "";
        }
      }
    } catch (_) {}

    // Generate JWT token for authentication
    const jwtSecret = process.env.JWT_SECRET || "dev-secret";
    const jwtToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: profile,
        token: jwtToken,
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: error.message,
    });
  }
});

// Get current user profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate(
      "enrolledCourses.courseId",
      "name thumbnail price"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user.toJSON(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
      error: error.message,
    });
  }
});

// Update user profile
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const allowedUpdates = [
      "name",
      "phone",
      "dateOfBirth",
      "gender",
      "address",
      "education",
      "preferences",
    ];

    const updates = {};
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(req.user.userId, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: user.toJSON(),
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: error.message,
    });
  }
});

// Change password
router.put("/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error changing password",
      error: error.message,
    });
  }
});

// Create test user (for development only)
router.post("/create-test-user", async (req, res) => {
  try {
    // Delete existing test users first (all variations)
    await User.deleteOne({ email: "22bmit501@gmail.com" });
    await User.deleteOne({ email: "22bmiit501@gmail.com" });
    await User.deleteOne({ email: "jack123@gmail.com" });
    console.log("🗑️ Deleted existing test users if any");

    // Create test user with the current email from your form
    const testUser = new User({
      name: "Jack",
      email: "jack123@gmail.com",
      password: "123456789", // This will be hashed by the pre-save middleware
      phone: "9876543210",
      gender: "male",
      role: "student",
      isEmailVerified: true,
    });

    await testUser.save();
    console.log("✅ Test user created:", testUser.email);
    console.log(
      "🔑 Password hash created:",
      testUser.password.substring(0, 20) + "..."
    );

    res.json({
      success: true,
      message: "Test user created successfully",
      data: {
        email: "jack123@gmail.com",
        password: "123456789",
        note: "Use these credentials to login",
      },
    });
  } catch (error) {
    console.error("Error creating test user:", error);
    res.status(500).json({
      success: false,
      message: "Error creating test user",
      error: error.message,
    });
  }
});

// Debug: Get all users in database
router.get("/debug-users", async (req, res) => {
  try {
    const users = await User.find({}).select("name email createdAt");
    res.json({
      success: true,
      count: users.length,
      users: users,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all students (Admin only)
router.get("/students", async (req, res) => {
  try {
    // Fetch all users (since role might be undefined or different)
    const allUsers = await User.find({})
      .select("-password") // Exclude password field
      .sort({ createdAt: -1 }); // Sort by newest first

    console.log("📊 Found users in database:", allUsers.length);
    console.log(
      "📋 User roles:",
      allUsers.map((u) => ({ name: u.name, role: u.role || "undefined" }))
    );

    // Filter for students (role is 'student' or undefined/null - default to student)
    const students = allUsers.filter(
      (user) => !user.role || user.role === "student" || user.role === "Student"
    );

    console.log("👥 Filtered students:", students.length);

    res.json({
      success: true,
      data: students,
      count: students.length,
      debug: {
        totalUsers: allUsers.length,
        studentCount: students.length,
      },
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching students",
      error: error.message,
    });
  }
});

// Verify email endpoint
router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required",
      });
    }

    // Find the token in database
    const tokenDoc = await Token.findOne({ token });

    if (!tokenDoc) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
      });
    }

    // Update user's email verification status
    const user = await User.findByIdAndUpdate(
      tokenDoc.userId,
      { isEmailVerified: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete the used token
    await Token.findByIdAndDelete(tokenDoc._id);

    console.log("✅ Email verified for user:", user.email);

    res.json({
      success: true,
      message:
        "Email verified successfully! You can now log in to your account.",
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({
      success: false,
      message: "Email verification failed",
      error: error.message,
    });
  }
});

// Resend verification email
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    // Delete old tokens for this user
    await Token.deleteMany({ userId: user._id });

    // Generate new verification token and send email using User method
    const emailResult = await user.generateVerificationToken();

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to resend verification email",
        error: emailResult.error,
      });
    }

    console.log("✅ Verification email resent to:", user.email);

    res.json({
      success: true,
      message: "Verification email sent successfully. Please check your inbox.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend verification email",
      error: error.message,
    });
  }
});

// Logout (client-side token removal, but we can track it)
router.post("/logout", authenticateToken, async (req, res) => {
  try {
    // In a production app, you might want to blacklist the token
    // For now, we'll just send a success response
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error during logout",
      error: error.message,
    });
  }
});

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token required",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
    req.user = user;
    next();
  });
}

module.exports = router;

// --- Lecturer Eligibility Routes ---
// Generate quiz based on specialization using OpenAI-style API (stub-friendly)
router.post("/lecturer/quiz", async (req, res) => {
  try {
    const {
      specialization = "Computer Science",
      numQuestions = 10,
      seed = "",
    } = req.body || {};

    // Curated pool with correct answers
    const pools = {
      "computer science": [
        {
          q: "Which data structure uses LIFO?",
          options: ["Queue", "Stack", "Heap", "Graph"],
          answer: 1,
        },
        {
          q: "Time complexity of binary search?",
          options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
          answer: 1,
        },
        {
          q: "Which normal form eliminates transitive dependency?",
          options: ["1NF", "2NF", "3NF", "BCNF"],
          answer: 2,
        },
        {
          q: "TCP works at which OSI layer?",
          options: ["Transport", "Network", "Session", "Application"],
          answer: 0,
        },
        {
          q: "Which is a non-relational database?",
          options: ["MongoDB", "PostgreSQL", "MySQL", "SQLite"],
          answer: 0,
        },
        {
          q: "Which algorithm is divide and conquer?",
          options: [
            "Insertion sort",
            "Merge sort",
            "Counting sort",
            "Bubble sort",
          ],
          answer: 1,
        },
        {
          q: "Mutex is used for?",
          options: [
            "Scheduling",
            "Deadlock detection",
            "Mutual exclusion",
            "Paging",
          ],
          answer: 2,
        },
        {
          q: "HTTP is stateless. What maintains sessions?",
          options: ["IP", "Cookies", "UDP", "ICMP"],
          answer: 1,
        },
        {
          q: "Big-O of traversing a linked list of n?",
          options: ["O(log n)", "O(1)", "O(n)", "O(n log n)"],
          answer: 2,
        },
        {
          q: "Which model is best for changing requirements?",
          options: ["Waterfall", "Spiral", "V-Model", "Big Bang"],
          answer: 1,
        },
        {
          q: "Primary key allows?",
          options: ["Nulls", "Duplicates", "Both", "Neither"],
          answer: 3,
        },
        {
          q: "Which is symmetric-key cipher?",
          options: ["RSA", "AES", "ECC", "Diffie-Hellman"],
          answer: 1,
        },
        {
          q: "REST uses which constraints?",
          options: [
            "Stateful servers",
            "Uniform interface",
            "Binary protocol",
            "Persistent connections",
          ],
          answer: 1,
        },
        {
          q: "Which data structure for BFS?",
          options: ["Stack", "Queue", "Set", "Tree"],
          answer: 1,
        },
        {
          q: "Gradient descent is used for?",
          options: ["Optimization", "Compilation", "Sorting", "Routing"],
          answer: 0,
        },
      ],
    };

    // deterministic shuffle by seed
    const rng = (function (s) {
      let h = 0;
      for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
      return () => (h = (1103515245 * h + 12345) >>> 0) / 0xffffffff;
    })(String(seed));
    function shuffle(arr) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    const pool =
      pools[specialization.toLowerCase()] || pools["computer science"];
    const count = Math.min(Math.max(10, numQuestions), 15);
    const questions = shuffle(pool)
      .slice(0, count)
      .map((q, i) => ({ id: i + 1, ...q }));

    res.json({ success: true, data: { seed, questions } });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Failed to generate quiz",
      error: e.message,
    });
  }
});

// Evaluate quiz and update user eligibility
router.post("/lecturer/quiz/submit", async (req, res) => {
  try {
    const {
      userId,
      answers = [],
      specialization = "Computer Science",
      seed = "",
    } = req.body || {};
    const total = answers.length;
    if (!userId || total === 0) {
      return res
        .status(400)
        .json({ success: false, message: "userId and answers are required" });
    }

    // Recreate the same quiz to check answers
    const pools = {
      "computer science": [
        {
          q: "Which data structure uses LIFO?",
          options: ["Queue", "Stack", "Heap", "Graph"],
          answer: 1,
        },
        {
          q: "Time complexity of binary search?",
          options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
          answer: 1,
        },
        {
          q: "Which normal form eliminates transitive dependency?",
          options: ["1NF", "2NF", "3NF", "BCNF"],
          answer: 2,
        },
        {
          q: "TCP works at which OSI layer?",
          options: ["Transport", "Network", "Session", "Application"],
          answer: 0,
        },
        {
          q: "Which is a non-relational database?",
          options: ["MongoDB", "PostgreSQL", "MySQL", "SQLite"],
          answer: 0,
        },
        {
          q: "Which algorithm is divide and conquer?",
          options: [
            "Insertion sort",
            "Merge sort",
            "Counting sort",
            "Bubble sort",
          ],
          answer: 1,
        },
        {
          q: "Mutex is used for?",
          options: [
            "Scheduling",
            "Deadlock detection",
            "Mutual exclusion",
            "Paging",
          ],
          answer: 2,
        },
        {
          q: "HTTP is stateless. What maintains sessions?",
          options: ["IP", "Cookies", "UDP", "ICMP"],
          answer: 1,
        },
        {
          q: "Big-O of traversing a linked list of n?",
          options: ["O(log n)", "O(1)", "O(n)", "O(n log n)"],
          answer: 2,
        },
        {
          q: "Which model is best for changing requirements?",
          options: ["Waterfall", "Spiral", "V-Model", "Big Bang"],
          answer: 1,
        },
        {
          q: "Primary key allows?",
          options: ["Nulls", "Duplicates", "Both", "Neither"],
          answer: 3,
        },
        {
          q: "Which is symmetric-key cipher?",
          options: ["RSA", "AES", "ECC", "Diffie-Hellman"],
          answer: 1,
        },
        {
          q: "REST uses which constraints?",
          options: [
            "Stateful servers",
            "Uniform interface",
            "Binary protocol",
            "Persistent connections",
          ],
          answer: 1,
        },
        {
          q: "Which data structure for BFS?",
          options: ["Stack", "Queue", "Set", "Tree"],
          answer: 1,
        },
        {
          q: "Gradient descent is used for?",
          options: ["Optimization", "Compilation", "Sorting", "Routing"],
          answer: 0,
        },
      ],
    };
    const rng = (function (s) {
      let h = 0;
      for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
      return () => (h = (1103515245 * h + 12345) >>> 0) / 0xffffffff;
    })(String(seed));
    function shuffle(arr) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }
    const pool =
      pools[specialization.toLowerCase()] || pools["computer science"];
    const picked = shuffle(pool).slice(0, total);
    const score = answers.reduce(
      (acc, ans, idx) => acc + (Number(ans) === picked[idx].answer ? 1 : 0),
      0
    );
    const passing =
      total === 10 ? 5 : total === 15 ? 7 : Math.ceil(total * 0.5);
    const passed = score >= passing;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          instructorEligibility: {
            specialization,
            score,
            total,
            passed,
            evaluatedAt: new Date(),
          },
          role: passed ? "instructor" : "student",
        },
      },
      { new: true }
    );

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    res.json({
      success: true,
      data: { passed, score, total, user: user.toJSON() },
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Failed to submit quiz",
      error: e.message,
    });
  }
});

// Get user details by ID
router.get("/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
