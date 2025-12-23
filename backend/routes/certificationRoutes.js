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

// Generate and Send Certificate
router.post("/generate", async (req, res) => {
  try {
    const { courseId, studentId } = req.body;
    console.log("🎓 Processing certificate generation for:", { courseId, studentId });

    if (!courseId || !studentId) {
      console.warn("⚠️ Missing fields in request:", { courseId, studentId });
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // 1. Get Student and User info (robust lookup)
    let student = await Student.findOne({ _id: studentId }).populate("User_Id");
    if (!student) {
      console.log(`🔍 Student not found by _id, trying by User_Id: ${studentId}`);
      student = await Student.findOne({ User_Id: studentId }).populate("User_Id");
    }

    if (!student || !student.User_Id) {
      console.error(`❌ Student or User not found for ID: ${studentId}`);
      return res.status(404).json({ success: false, message: "Student record not found. Please ensure your profile is complete." });
    }

    // 2. Get Course info (robust course lookup)
    let course = await Course.findOne({ Course_Id: courseId });
    if (!course && !isNaN(courseId)) {
      course = await Course.findOne({ Course_Id: Number(courseId) });
    }
    if (!course) {
      console.log(`🔍 Course not found by Course_Id, trying by MongoDB _id: ${courseId}`);
      course = await Course.findById(courseId);
    }

    if (!course) {
      console.error(`❌ Course not found for ID: ${courseId}`);
      return res.status(404).json({ success: false, message: "Course details not found." });
    }

    const studentName = student.Full_Name;
    const studentEmail = student.User_Id.email;
    const courseName = course.Title;

    console.log("✅ Found details:", { studentName, studentEmail, courseName });

    // 3. Create Certificate record
    const newCertificate = await Certificate.create({
      Course_Id: course.Course_Id.toString(),
      Student_Id: student._id.toString(),
      Percentage: 100,
      Grade: "A+",
      Status: "Active"
    });

    console.log("📄 Certificate record created:", newCertificate.Certificate_Id);

    // 4. Generate PDF
    const doc = new PDFDocument({ layout: "landscape", size: "A4" });
    let buffers = [];
    doc.on("data", buffers.push.bind(buffers));

    return new Promise((resolve, reject) => {
      doc.on("end", async () => {
        const pdfData = Buffer.concat(buffers);
        try {
          // Send Email
          console.log(`📧 Sending certificate to: ${studentEmail}`);
          await sendCertificateEmail(studentEmail, studentName, courseName, pdfData);
          res.json({ success: true, message: "Certificate generated and sent to email", data: newCertificate });
          resolve();
        } catch (emailErr) {
          console.error("❌ Error sending certificate email:", emailErr);
          res.status(500).json({ success: false, message: "Certificate created but email failed to send. Check SMTP settings." });
          resolve();
        }
      });

      // PDF Design
      const width = doc.page.width;
      const height = doc.page.height;

      // Professional Border
      doc.rect(20, 20, width - 40, height - 40).lineWidth(8).stroke("#14b8a6");
      doc.rect(35, 35, width - 70, height - 70).lineWidth(2).stroke("#f59e0b");

      // Content
      doc.moveDown(3);
      doc.fillColor("#1f2937").fontSize(45).font('Helvetica-Bold').text("CERTIFICATE", { align: "center", characterSpacing: 2 });
      doc.fontSize(20).font('Helvetica').text("OF COMPLETION", { align: "center", characterSpacing: 1 });

      doc.moveDown(2);
      doc.fontSize(18).fillColor("#4b5563").text("This is to certify that", { align: "center" });

      doc.moveDown(1);
      doc.fillColor("#14b8a6").fontSize(40).font('Helvetica-Bold').text(studentName, { align: "center" });

      doc.moveDown(1);
      doc.fillColor("#4b5563").fontSize(18).font('Helvetica').text("has successfully completed the online course", { align: "center" });

      doc.moveDown(1);
      doc.fillColor("#1f2937").fontSize(28).font('Helvetica-Bold').text(courseName, { align: "center" });

      doc.moveDown(2);
      doc.fillColor("#6b7280").fontSize(14).font('Helvetica').text(`Awarded on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: "center" });

      doc.moveDown(1);
      doc.fontSize(10).text(`Certificate ID: ${newCertificate.Certificate_Id}`, { align: "center" });

      // Footer
      doc.fontSize(20).fillColor("#14b8a6").text("iVidhyarthi", 50, height - 80, { align: "left" });
      doc.fontSize(10).fillColor("#9ca3af").text("Learn • Build • Shine", 50, height - 55);

      doc.end();
    });

  } catch (error) {
    console.error("❌ Error generating certificate:", error);
    res.status(500).json({ success: false, message: "Internal server error: " + error.message });
  }
});

// Get certificates by student ID
router.get("/:studentId", async (req, res) => {
  try {
    const certificates = await Certificate.find({
      Student_Id: req.params.studentId,
    });
    res.json({ success: true, data: certificates });
  } catch (error) {
    console.error("Error fetching certificates:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get all certificates (Admin)
router.get("/all/list", async (req, res) => {
  try {
    const certificates = await Certificate.find().sort({ createdAt: -1 });
    res.json({ success: true, data: certificates });
  } catch (error) {
    console.error("Error fetching all certificates:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
