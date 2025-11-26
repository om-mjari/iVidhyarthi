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
  console.warn("⚠️ EMAIL_USER or EMAIL_APP_PASSWORD not set — email features may fail.");
}

/* ============================
   Middlewares
   ============================ */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "", 10) || 50 * 1024 * 1024;
const ALLOWED_FILE_TYPES = (process.env.ALLOWED_FILE_TYPES || "image/png,image/jpeg,image/jpg,video/mp4").split(",");

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      return cb(new Error("Invalid file type. Allowed types: " + ALLOWED_FILE_TYPES.join(", ")), false);
    }
    cb(null, true);
  },
});

/* ============================
   Nodemailer / OTP Setup
   ============================ */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
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
const paymentRoutes = require("./routes/paymentRoutes");

/* ============================
   Mount API routes (STATIC first)
   ============================ */
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/registrar", registrarRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/tbl-courses", tblCoursesRoutes);
app.use("/api/payments", paymentRoutes);

// IMPORTANT: Course categories mounted explicitly — this must match your route filename
app.use("/api/course-categories", courseCategoriesRoutes);

console.log("✅ Routes registered:");
console.log("   - /api/auth");
console.log("   - /api/admin");
console.log("   - /api/registrar");
console.log("   - /api/courses");
console.log("   - /api/tbl-courses");
console.log("   - /api/payments");
console.log("   - /api/course-categories");

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
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    if (!gridfsBucket) return res.status(500).json({ success: false, message: "GridFS not initialized" });

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
    if (!gridfsBucket) return res.status(500).json({ success: false, message: "GridFS not initialized" });
    const files = await gridfsBucket.find().toArray();
    res.json({ success: true, data: files });
  } catch (err) {
    next(err);
  }
});

/** Download file by ID */
app.get("/api/files/:id", async (req, res, next) => {
  try {
    if (!gridfsBucket) return res.status(500).json({ success: false, message: "GridFS not initialized" });
    const fileId = new mongoose.Types.ObjectId(req.params.id);
    const files = await gridfsBucket.find({ _id: fileId }).toArray();
    if (!files || files.length === 0) return res.status(404).json({ success: false, message: "File not found" });

    const file = files[0];
    res.setHeader("Content-Type", file.metadata?.mimetype || "application/octet-stream");
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
    if (!gridfsBucket) return res.status(500).json({ success: false, message: "GridFS not initialized" });
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
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return res.status(400).json({ success: false, message: "Valid email required" });

    // Cleanup expired OTPs (simple sweep)
    const now = Date.now();
    for (const [key, val] of otpStore.entries()) {
      if (val.expiresAt < now) otpStore.delete(key);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email.trim(), { otp, expiresAt: Date.now() + OTP_EXPIRY_MS });

    const mailOptions = {
      from: `"iVidhyarthi Team" <${process.env.EMAIL_USER}>`,
      to: email.trim(),
      subject: "Your OTP - iVidhyarthi",
      html: `<p>Your OTP is <strong>${otp}</strong>. It expires in 5 minutes.</p>`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("Error sending OTP mail:", err);
        return res.status(500).json({ success: false, message: "Could not send OTP" });
      }
      return res.json({ success: true, message: "OTP sent" });
    });
  } catch (err) {
    next(err);
  }
});

/** Verify OTP */
app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ success: false, message: "Email and OTP required" });

  const record = otpStore.get(email.trim());
  if (!record || record.expiresAt < Date.now()) {
    if (record) otpStore.delete(email.trim());
    return res.status(400).json({ success: false, message: "OTP expired or not requested" });
  }
  if (record.otp !== String(otp).trim()) return res.status(400).json({ success: false, message: "Invalid OTP" });

  otpStore.delete(email.trim());
  res.json({ success: true, message: "OTP verified" });
});

/* ============================
   Test email (optional)
   ============================ */
app.get("/test-email", async (req, res, next) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      return res.status(400).json({ success: false, message: "Email not configured" });
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
    return res.status(400).json({ success: false, message: "File too large. Max: " + MAX_FILE_SIZE });
  }
  return res.status(500).json({ success: false, message: err.message || "Internal server error" });
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
const server = app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
  console.log(`📡 API base: http://localhost:${PORT}/api`);
});

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

module.exports = app;