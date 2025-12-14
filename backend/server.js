// server.js (rewritten, cleaned, and fixed)
// --------------------------------------------------
// iVidhyarthi - Backend Entry Point
// --------------------------------------------------

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const nodemailer = require("nodemailer");
const process = require("process");

const app = express();

/* ============================
   Basic validations & configs
   ============================ */
const PORT = process.env.PORT || 5000;
if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI not set in environment. Exiting.");
  process.exit(1);
}
if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
  console.warn(
    "⚠️ EMAIL_USER or EMAIL_APP_PASSWORD not set — email features may fail."
  );
}

/* ============================
   Middlewares
   ============================ */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

/* ============================
   MongoDB connection + GridFS
   ============================ */
let gridfsBucket = null;
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

mongoose.connection.once("open", () => {
  gridfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "uploads",
  });
  console.log("📦 GridFS initialized");
});

/* ============================
   Multer (file upload) setup
   ============================ */
const MAX_FILE_SIZE =
  parseInt(process.env.MAX_FILE_SIZE || "", 10) || 50 * 1024 * 1024;
const ALLOWED_FILE_TYPES = (
  process.env.ALLOWED_FILE_TYPES || "image/png,image/jpeg,image/jpg,video/mp4"
).split(",");

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      return cb(
        new Error(
          "Invalid file type. Allowed types: " + ALLOWED_FILE_TYPES.join(", ")
        ),
        false
      );
    }
    cb(null, true);
  },
});

/* ============================
   Nodemailer / OTP Setup
   ============================ */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const otpStore = new Map(); // key: email, value: { otp, expiresAt }

/* ============================
   Route imports (ensure paths exist)
   - Keep route files small & focused
   ============================ */
const authRoutes = require("./routes/auth");
const courseRoutes = require("./routes/courses");
const registrarRoutes = require("./routes/registrar");
const adminRoutes = require("./routes/admin");
const courseCategoriesRoutes = require("./routes/courseCategories");
const tblCoursesRoutes = require("./routes/tblCourses");
const tblLecturersRoutes = require("./routes/tblLecturers");
const paymentRoutes = require("./routes/paymentRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const progressRoutes = require("./routes/progressRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const earningsRoutes = require("./routes/earningsRoutes");
const certificationRoutes = require("./routes/certificationRoutes");
const quizRoutes = require("./routes/quizRoutes");
const videoProgressRoutes = require("./routes/videoProgressRoutes");
const courseContentRoutes = require("./routes/courseContentRoutes");
const courseTopicsRoutes = require("./routes/courseTopicsRoutes");
const lecturerProfileRoutes = require("./routes/lecturerProfile");
const lecturerOverviewRoutes = require("./routes/lecturerOverview");
const lecturerStudentsRoutes = require("./routes/lecturerStudents");
const sessionRoutes = require("./routes/sessionRoutes");
const recommendationsRoutes = require("./routes/recommendationsRoutes");
const lecturerDynamicDataRoutes = require("./routes/lecturerDynamicData");
const instituteRoutes = require("./routes/instituteRoutes");
const transcriptionRoutes = require("./routes/transcriptionRoutes");

/* ============================
   Mount API routes (STATIC first)
   ============================ */
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/registrar", registrarRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/tbl-courses", tblCoursesRoutes);
app.use("/api/tbl-lecturers", tblLecturersRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/course-categories", courseCategoriesRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/earnings", earningsRoutes);
app.use("/api/certifications", certificationRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/video-progress", videoProgressRoutes);
app.use("/api/course-content", courseContentRoutes);
app.use("/api/course-topics", courseTopicsRoutes);
app.use("/api/lecturer-profile", lecturerProfileRoutes);
app.use("/api/lecturer-overview", lecturerOverviewRoutes);
app.use("/api/lecturer-students", lecturerStudentsRoutes);
app.use("/api/lecturer/sessions", sessionRoutes);
app.use("/api/sessions", sessionRoutes); // Alias for student access
app.use("/api/recommendations", recommendationsRoutes);
app.use("/api/transcription", transcriptionRoutes);
app.use("/api/lecturer-dynamic-data", lecturerDynamicDataRoutes);
app.use("/api/institutes", instituteRoutes);

console.log("✅ Routes registered:");
console.log("   - /api/auth");
console.log("   - /api/admin");
console.log("   - /api/registrar");
console.log("   - /api/courses");
console.log("   - /api/tbl-courses");
console.log("   - /api/tbl-lecturers");
console.log("   - /api/payments");
console.log("   - /api/course-categories");
console.log("   - /api/enrollments");
console.log("   - /api/assignments");
console.log("   - /api/submissions");
console.log("   - /api/progress");
console.log("   - /api/feedback");
console.log("   - /api/earnings");
console.log("   - /api/certifications");
console.log("   - /api/quiz");
console.log("   - /api/lecturer-profile");
console.log("   - /api/lecturer-overview");
console.log("   - /api/lecturer-students");
console.log("   - /api/lecturer/sessions");
console.log("   - /api/sessions");
console.log("   - /api/lecturer-dynamic-data");

/* ============================
   Health & readiness endpoints
   ============================ */
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "iVidhyarthi Backend is running",
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
  });
});

/* ============================
   GridFS endpoints (upload/download/delete)
   ============================ */

/** Upload file */
app.post("/api/upload", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    if (!gridfsBucket)
      return res
        .status(500)
        .json({ success: false, message: "GridFS not initialized" });

    const uploadStream = gridfsBucket.openUploadStream(req.file.originalname, {
      metadata: {
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        uploadedAt: new Date(),
      },
    });

    uploadStream.end(req.file.buffer);

    uploadStream.on("finish", () => {
      return res.status(201).json({
        success: true,
        message: "File uploaded",
        fileId: uploadStream.id,
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
    });

    uploadStream.on("error", (err) => next(err));
  } catch (err) {
    next(err);
  }
});

/** Get file metadata list */
app.get("/api/files", async (req, res, next) => {
  try {
    if (!gridfsBucket)
      return res
        .status(500)
        .json({ success: false, message: "GridFS not initialized" });
    const files = await gridfsBucket.find().toArray();
    res.json({ success: true, data: files });
  } catch (err) {
    next(err);
  }
});

/** Download file by ID */
app.get("/api/files/:id", async (req, res, next) => {
  try {
    if (!gridfsBucket)
      return res
        .status(500)
        .json({ success: false, message: "GridFS not initialized" });
    const fileId = new mongoose.Types.ObjectId(req.params.id);
    const files = await gridfsBucket.find({ _id: fileId }).toArray();
    if (!files || files.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "File not found" });

    const file = files[0];
    res.setHeader(
      "Content-Type",
      file.metadata?.mimetype || "application/octet-stream"
    );
    res.setHeader("Content-Disposition", `inline; filename="${file.filename}"`);

    const downloadStream = gridfsBucket.openDownloadStream(fileId);
    downloadStream.on("error", (err) => next(err));
    downloadStream.pipe(res);
  } catch (err) {
    next(err);
  }
});

/** Delete file by ID */
app.delete("/api/files/:id", async (req, res, next) => {
  try {
    if (!gridfsBucket)
      return res
        .status(500)
        .json({ success: false, message: "GridFS not initialized" });
    const fileId = new mongoose.Types.ObjectId(req.params.id);
    await gridfsBucket.delete(fileId);
    res.json({ success: true, message: "File deleted" });
  } catch (err) {
    next(err);
  }
});

/* ============================
   OTP / Email endpoints
   ============================ */

/** Send OTP */
app.post("/send-otp", async (req, res, next) => {
  try {
    const { email } = req.body;

    console.log("📧 Send OTP request received for:", email);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      console.log("❌ Invalid email format");
      return res
        .status(400)
        .json({ success: false, message: "Valid email required" });
    }

    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      console.error("❌ Email credentials not configured in .env file");
      return res
        .status(500)
        .json({ success: false, message: "Email service not configured" });
    }

    // Cleanup expired OTPs (simple sweep)
    const now = Date.now();
    for (const [key, val] of otpStore.entries()) {
      if (val.expiresAt < now) otpStore.delete(key);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email.trim(), { otp, expiresAt: Date.now() + OTP_EXPIRY_MS });

    console.log("🔑 Generated OTP:", otp, "for", email.trim());

    const mailOptions = {
      from: `"iVidhyarthi Team" <${process.env.EMAIL_USER}>`,
      to: email.trim(),
      subject: "Your OTP - iVidhyarthi",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">iVidhyarthi - Email Verification</h2>
          <p>Your One-Time Password (OTP) is:</p>
          <div style="background: #f0f0f0; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #666;">This OTP will expire in 5 minutes.</p>
          <p style="color: #666;">If you didn't request this OTP, please ignore this email.</p>
        </div>
      `,
    };

    console.log("📮 Attempting to send email to:", email.trim());

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("❌ Error sending OTP mail:", err);
        console.error("Error details:", {
          message: err.message,
          code: err.code,
          command: err.command,
        });
        return res.status(500).json({
          success: false,
          message: "Could not send OTP. Please check email configuration.",
          error: err.message,
        });
      }
      console.log("✅ OTP email sent successfully!", info.messageId);
      return res.json({ success: true, message: "OTP sent successfully" });
    });
  } catch (err) {
    console.error("❌ Unexpected error in send-otp:", err);
    next(err);
  }
});

/** Verify OTP */
app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp)
    return res
      .status(400)
      .json({ success: false, message: "Email and OTP required" });

  const record = otpStore.get(email.trim());
  if (!record || record.expiresAt < Date.now()) {
    if (record) otpStore.delete(email.trim());
    return res
      .status(400)
      .json({ success: false, message: "OTP expired or not requested" });
  }
  if (record.otp !== String(otp).trim())
    return res.status(400).json({ success: false, message: "Invalid OTP" });

  otpStore.delete(email.trim());
  res.json({ success: true, message: "OTP verified" });
});

/** Reset Password */
app.post("/reset-password", async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const User = require("./models/User");
    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update password using the virtual setter
    user.password = newPassword;
    await user.save();

    console.log("✅ Password reset successful for:", email);

    res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (err) {
    console.error("❌ Error resetting password:", err);
    next(err);
  }
});

/* ============================
   Test email (optional)
   ============================ */
app.get("/test-email", async (req, res, next) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      return res
        .status(400)
        .json({ success: false, message: "Email not configured" });
    }
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: "Test email - iVidhyarthi",
      text: "If you received this, email is configured correctly.",
    });
    res.json({ success: true, message: "Test email sent" });
  } catch (err) {
    next(err);
  }
});

/* ============================
   Centralized error handler
   ============================ */
app.use((err, req, res, next) => {
  console.error("❗ Server error:", err.message);
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File too large. Max: " + MAX_FILE_SIZE,
    });
  }
  return res
    .status(500)
    .json({ success: false, message: err.message || "Internal server error" });
});

/* ============================
   404 fallback
   ============================ */
app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

/* ============================
   Start server & graceful shutdown
   ============================ */

// Port availability checker
const net = require("net");

function checkPortAvailability(port) {
  return new Promise((resolve, reject) => {
    const tester = net
      .createServer()
      .once("error", (err) => {
        if (err.code === "EADDRINUSE") {
          resolve(false); // Port is in use
        } else {
          reject(err);
        }
      })
      .once("listening", () => {
        tester
          .once("close", () => {
            resolve(true); // Port is available
          })
          .close();
      })
      .listen(port);
  });
}

// Start server with port check
async function startServer() {
  try {
    const isPortAvailable = await checkPortAvailability(PORT);

    if (!isPortAvailable) {
      console.error(`\n❌ ERROR: Port ${PORT} is already in use!`);
      console.error(`\n💡 Solution:`);
      console.error(`   1. Kill the existing process:`);
      console.error(`      Windows: netstat -ano | findstr :${PORT}`);
      console.error(`               taskkill /PID <PID> /F`);
      console.error(`      Mac/Linux: lsof -ti:${PORT} | xargs kill -9`);
      console.error(`   2. Or change PORT in your .env file\n`);
      process.exit(1);
    }

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${PORT}`);
      console.log(`📡 API base: http://localhost:${PORT}/api`);
    });

    // Graceful shutdown handler
    process.on("SIGINT", async () => {
      console.log("🛑 SIGINT received. Closing server...");
      server.close(async () => {
        try {
          await mongoose.disconnect();
          console.log("✅ MongoDB disconnected.");
          process.exit(0);
        } catch (err) {
          console.error("Error during shutdown:", err);
          process.exit(1);
        }
      });
    });

    process.on("SIGTERM", async () => {
      console.log("🛑 SIGTERM received. Closing server...");
      server.close(async () => {
        try {
          await mongoose.disconnect();
          console.log("✅ MongoDB disconnected.");
          process.exit(0);
        } catch (err) {
          console.error("Error during shutdown:", err);
          process.exit(1);
        }
      });
    });
  } catch (error) {
    console.error("❌ Error starting server:", error.message);
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app;
