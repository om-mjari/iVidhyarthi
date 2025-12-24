const express = require("express");
const router = express.Router();
const Certificate = require("../models/Tbl_Certificates");
const Student = require("../models/Tbl_Students");
const User = require("../models/User");
const Course = require("../models/Tbl_Courses");
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");
const path = require("path");

// Function to send certificate email
const sendCertificateEmail = async (email, studentName, courseName, pdfBuffer) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mailOptions = {
    from: `"iVidhyarthi" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Congratulations! Your Certificate for ${courseName}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>Congratulations ${studentName}!</h2>
        <p>You have successfully completed the course <strong>${courseName}</strong>.</p>
        <p>Your hard work and dedication have paid off. Please find your official certificate of completion attached to this email.</p>
        <p>Keep learning and growing!</p>
        <br>
        <p>Best regards,</p>
        <p><strong>The iVidhyarthi Team</strong></p>
      </div>
    `,
    attachments: [
      {
        filename: `Certificate_${courseName.replace(/\s+/g, "_")}.pdf`,
        content: pdfBuffer,
      },
    ],
  };

  return transporter.sendMail(mailOptions);
};

// Helper: Generate PDF Buffer (Strictly 1 Page)
const generatePDFBuffer = async (studentName, courseName, certId) => {
  return new Promise((resolve) => {
    // Standard Landscape A4: 841.89 x 595.28
    const doc = new PDFDocument({
      layout: "landscape",
      size: "A4",
      margin: 0,
      autoFirstPage: false
    });

    // Add only one page to ensure single-page PDF
    doc.addPage();
    const buffers = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));

    const w = doc.page.width;
    const h = doc.page.height;

    // --- REFINED PREMIUM DESIGN ---

    // 1. Navy Blue Polygon (Left)
    doc.save()
      .moveTo(0, 0)
      .lineTo(w * 0.22, 0)
      .lineTo(w * 0.12, h)
      .lineTo(0, h)
      .closePath()
      .fill("#1a1a40");

    // 2. Gold Horizontal Bars (Top & Bottom)
    doc.rect(0, 0, w, 15).fill("#d4af37");
    doc.rect(0, h - 15, w, 15).fill("#d4af37");

    // 3. Gold Medal Icon
    const mx = 85;
    const my = h / 2 - 10;
    doc.circle(mx, my, 45).fill("#b8860b");
    doc.circle(mx, my, 40).fill("#f1c40f");
    doc.circle(mx, my, 35).lineWidth(1).stroke("#ffffff");

    // Star inside medal
    doc.save().translate(mx, my).scale(0.7);
    doc.moveTo(0, -30).lineTo(9, -9).lineTo(31, -9).lineTo(13, 5).lineTo(20, 27).lineTo(0, 13).lineTo(-20, 27).lineTo(-13, 5).lineTo(-31, -9).lineTo(-9, -9).closePath().fill("#1a1a40");
    doc.restore();

    // 4. Main Text Area (Centered in the remaining 78% width)
    const centerX = w * 0.22 + (w * 0.78 / 2);

    doc.fillColor("#333333")
      .font("Helvetica-Bold")
      .fontSize(45)
      .text("CERTIFICATE", w * 0.22, 100, { width: w * 0.78, align: "center", characterSpacing: 2 });

    doc.fillColor("#666666")
      .font("Helvetica")
      .fontSize(16)
      .text("OF ACHIEVEMENT", w * 0.22, 155, { width: w * 0.78, align: "center", characterSpacing: 1 });

    doc.fillColor("#1a1a40")
      .font("Helvetica-Bold")
      .fontSize(38)
      .text(studentName, w * 0.22, 220, { width: w * 0.78, align: "center" });

    doc.fillColor("#555555")
      .font("Helvetica")
      .fontSize(14)
      .text("has successfully completed the online course", w * 0.22, 285, { width: w * 0.78, align: "center" });

    doc.fillColor("#333333")
      .font("Helvetica-Bold")
      .fontSize(24)
      .text(courseName, w * 0.22, 315, { width: w * 0.78, align: "center" });

    // 5. Signature and Date Section
    const lineY = h - 110;
    const itemW = 140;
    const gap = 100;
    const totalW = (itemW * 2) + gap;
    const startX = w * 0.22 + (w * 0.78 - totalW) / 2;

    // Date
    doc.moveTo(startX, lineY).lineTo(startX + itemW, lineY).lineWidth(1).strokeColor("#333333").stroke();
    doc.fillColor("#333333").font("Helvetica-Bold").fontSize(12).text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), startX, lineY - 18, { width: itemW, align: "center" });
    doc.font("Helvetica").fontSize(10).text("DATE", startX, lineY + 6, { width: itemW, align: "center" });

    // Signature
    const sigX = startX + itemW + gap;
    doc.moveTo(sigX, lineY).lineTo(sigX + itemW, lineY).stroke();
    doc.fillColor("#1a1a40").font("Times-BoldItalic").fontSize(20).text("iVidhyarthi", sigX, lineY - 22, { width: itemW, align: "center" });
    doc.fillColor("#333333").font("Helvetica").fontSize(10).text("SIGNATURE", sigX, lineY + 6, { width: itemW, align: "center" });

    // 6. Footer Info
    doc.fontSize(8.5).fillColor("#999999").text(`Certificate ID: ${certId}`, 0, h - 35, { width: w, align: "center" });
    doc.text("Verify this certificate at www.ividhyarthi.com", 0, h - 25, { width: w, align: "center" });

    doc.end();
  });
};

// Check if certificate exists (GET)
router.get("/check/:courseId/:studentId", async (req, res) => {
  try {
    const { courseId, studentId } = req.params;

    // Robust course lookup
    let course = await Course.findOne({ Course_Id: courseId });
    if (!course && !isNaN(courseId)) course = await Course.findOne({ Course_Id: Number(courseId) });
    if (!course) course = await Course.findById(courseId);

    if (!course) return res.json({ success: false, message: "Course not found" });

    // Robust student lookup
    let student = await Student.findOne({ _id: studentId });
    if (!student) student = await Student.findOne({ User_Id: studentId });

    if (!student) {
      console.log(`⚠️ Student check: No student found for ID ${studentId}`);
      return res.json({ success: true, alreadyExists: false });
    }

    // NEW ROBUST LOOKUP: Check for the exact ID provided, the Student _id, AND the User_Id
    // This solves the problem where some records store the User ID and others store the Student ID.
    const searchTerms = [student._id.toString(), studentId];
    if (student.User_Id) searchTerms.push(student.User_Id.toString());

    const existingCert = await Certificate.findOne({
      Course_Id: course.Course_Id.toString(),
      Student_Id: { $in: searchTerms }
    });

    if (existingCert) {
      console.log(`✅ Found certificate for student ${studentId} using terms:`, searchTerms);
      const pdfBuffer = await generatePDFBuffer(student.Full_Name, course.Title, existingCert.Certificate_Id);
      return res.json({
        success: true,
        alreadyExists: true,
        pdfBase64: pdfBuffer.toString("base64"),
        certificateId: existingCert.Certificate_Id
      });
    }

    res.json({ success: true, alreadyExists: false });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Generate and Send Certificate (POST)
router.post("/generate", async (req, res) => {
  try {
    const { courseId, studentId, checkOnly } = req.body;

    // Robust student lookup
    let student = await Student.findOne({ _id: studentId }).populate("User_Id");
    if (!student) student = await Student.findOne({ User_Id: studentId }).populate("User_Id");
    if (!student || !student.User_Id) return res.status(404).json({ success: false, message: "Student not found" });

    // Robust course lookup
    let course = await Course.findOne({ Course_Id: courseId });
    if (!course && !isNaN(courseId)) course = await Course.findOne({ Course_Id: Number(courseId) });
    if (!course) course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    const studentName = student.Full_Name;
    const studentEmail = student.User_Id.email;
    const courseName = course.Title;

    // 1. Check if exists using robust search terms
    const searchTerms = [student._id.toString(), studentId];
    if (student.User_Id) searchTerms.push(student.User_Id.toString());

    let existingCert = await Certificate.findOne({
      Course_Id: course.Course_Id.toString(),
      Student_Id: { $in: searchTerms }
    });

    if (existingCert) {
      console.log(`♻️ Certificate already exists for ${studentId}, checking if should send email...`);
      const pdfBuffer = await generatePDFBuffer(studentName, courseName, existingCert.Certificate_Id);

      // ONLY send email if it's NOT a checkOnly request AND it's a new generation request (not just showing existing)
      // The checkOnly parameter indicates this is a background check, not a new generation
      if (!checkOnly) {
        try { 
          // Only send email if this is an actual generation request, not just a 'show' request
          await sendCertificateEmail(studentEmail, studentName, courseName, pdfBuffer); 
        } catch (e) { 
          console.error('Failed to send certificate email:', e.message);
        }
      }

      return res.json({
        success: true,
        alreadyExists: true,
        pdfBase64: pdfBuffer.toString("base64")
      });
    }

    if (checkOnly) return res.json({ success: true, alreadyExists: false });

    // 2. Create New
    const newCert = await Certificate.create({
      Course_Id: course.Course_Id.toString(),
      Student_Id: student._id.toString(),
      Percentage: 100,
      Grade: "A+",
      Status: "Active"
    });

    const pdfBuffer = await generatePDFBuffer(studentName, courseName, newCert.Certificate_Id);

    // 3. Send Email
    try { await sendCertificateEmail(studentEmail, studentName, courseName, pdfBuffer); } catch (e) { }

    return res.json({
      success: true,
      alreadyExists: false,
      pdfBase64: pdfBuffer.toString("base64"),
      certificateId: newCert.Certificate_Id
    });
  } catch (error) {
    console.error("❌ Certificate Error:", error);
    res.status(500).json({ success: false, message: "Server error: " + error.message });
  }
});

// Standard list routes
router.get("/:studentId", async (req, res) => {
  try {
    const certificates = await Certificate.find({ Student_Id: req.params.studentId });
    res.json({ success: true, data: certificates });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/all/list", async (req, res) => {
  try {
    const certificates = await Certificate.find().sort({ createdAt: -1 });
    res.json({ success: true, data: certificates });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
