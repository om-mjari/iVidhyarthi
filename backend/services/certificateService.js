const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Tbl_Certificates = require('../models/Tbl_Certificates');
const Tbl_Students = require('../models/Tbl_Students');
const Tbl_Courses = require('../models/Tbl_Courses');
const nodemailer = require('nodemailer');

class CertificateService {
  constructor() {
    this.certificatesDir = path.join(__dirname, '..', 'public', 'certificates');
    this.transporter = this.setupTransporter();
    this.ensureCertificatesDirectory();
  }

  ensureCertificatesDirectory() {
    if (!fs.existsSync(this.certificatesDir)) {
      fs.mkdirSync(this.certificatesDir, { recursive: true });
    }
  }

  setupTransporter() {
    if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD) {
      return nodemailer.createTransport({
        host: process.env.HOST,
        service: process.env.SERVICE,
        port: Number(process.env.EMAIL_PORT || 587),
        secure: Boolean(process.env.SECURE || false),
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_APP_PASSWORD,
        },
      });
    }
    return null;
  }

  async generateAndIssueCertificate(studentId, courseId, percentage) {
    try {
      const existingCert = await Tbl_Certificates.findOne({
        Student_Id: studentId,
        Course_Id: courseId,
        Status: 'Active'
      });

      if (existingCert) {
        console.log('Certificate already exists:', existingCert.Certificate_Id);
        return existingCert;
      }

      const student = await Tbl_Students.findOne({ Student_Id: studentId });
      const course = await Tbl_Courses.findOne({ Course_Id: courseId });

      if (!student || !course) {
        throw new Error('Student or Course not found');
      }

      const grade = this.calculateGrade(percentage);
      const pdfPath = await this.generatePDF(student, course, percentage, grade);

      const certificate = new Tbl_Certificates({
        Course_Id: courseId.toString(),
        Student_Id: studentId,
        Certificate_Url: `/certificates/${path.basename(pdfPath)}`,
        Grade: grade,
        Percentage: percentage,
        Status: 'Active'
      });

      await certificate.save();

      if (student.Email && this.transporter) {
        await this.sendCertificateEmail(student, course, certificate, pdfPath);
      }

      console.log('Certificate generated:', certificate.Certificate_Id);
      return certificate;

    } catch (error) {
      console.error('Certificate generation failed:', error);
      throw error;
    }
  }

  async generatePDF(student, course, percentage, grade) {
    return new Promise((resolve, reject) => {
      const fileName = `CERT_${student.Student_Id}_${course.Course_Id}_${Date.now()}.pdf`;
      const filePath = path.join(this.certificatesDir, fileName);

      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 50, bottom: 50, left: 72, right: 72 }
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
        .lineWidth(3)
        .strokeColor('#4A90E2')
        .stroke();

      doc.rect(40, 40, doc.page.width - 80, doc.page.height - 80)
        .lineWidth(1)
        .strokeColor('#4A90E2')
        .stroke();

      doc.fontSize(40)
        .fillColor('#2C3E50')
        .font('Helvetica-Bold')
        .text('CERTIFICATE OF COMPLETION', 0, 120, { align: 'center' });

      doc.fontSize(14)
        .fillColor('#7F8C8D')
        .font('Helvetica')
        .text('This is to certify that', 0, 190, { align: 'center' });

      doc.fontSize(32)
        .fillColor('#2C3E50')
        .font('Helvetica-Bold')
        .text(student.Name || 'Student Name', 0, 220, { align: 'center' });

      doc.fontSize(14)
        .fillColor('#7F8C8D')
        .font('Helvetica')
        .text('has successfully completed the course', 0, 270, { align: 'center' });

      doc.fontSize(24)
        .fillColor('#4A90E2')
        .font('Helvetica-Bold')
        .text(course.Course_Name || 'Course Name', 0, 300, { align: 'center' });

      doc.fontSize(14)
        .fillColor('#7F8C8D')
        .font('Helvetica')
        .text(`with a score of ${percentage}% (Grade: ${grade})`, 0, 345, { align: 'center' });

      const issueDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.fontSize(12)
        .fillColor('#95A5A6')
        .text(`Issued on: ${issueDate}`, 0, 390, { align: 'center' });

      doc.fontSize(10)
        .fillColor('#7F8C8D')
        .text('iVidhyarthi Learning Platform', 100, doc.page.height - 100, { align: 'left' });

      doc.fontSize(10)
        .text('_________________________', doc.page.width - 250, doc.page.height - 120, { align: 'right' });
      doc.fontSize(9)
        .fillColor('#7F8C8D')
        .text('Authorized Signature', doc.page.width - 250, doc.page.height - 100, { align: 'right' });

      doc.end();

      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    });
  }

  calculateGrade(percentage) {
    if (percentage >= 95) return 'A+';
    if (percentage >= 90) return 'A';
    if (percentage >= 85) return 'B+';
    if (percentage >= 80) return 'B';
    if (percentage >= 75) return 'C+';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'Pass';
  }

  async sendCertificateEmail(student, course, certificate, pdfPath) {
    if (!this.transporter) {
      console.warn('Email transporter not configured. Skipping email.');
      return;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER || 'no-reply@ividhyarthi.com',
      to: student.Email,
      subject: `🎉 Congratulations! Your ${course.Course_Name} Certificate`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎓 iVidhyarthi</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Excellence in Learning</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #333; margin: 0 0 20px 0;">🎉 Congratulations, ${student.Name}!</h2>
            
            <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
              We are thrilled to inform you that you have successfully completed the course:
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
              <h3 style="color: #667eea; margin: 0 0 10px 0;">${course.Course_Name}</h3>
              <p style="color: #666; margin: 0;">
                <strong>Grade:</strong> ${certificate.Grade} <br>
                <strong>Score:</strong> ${certificate.Percentage}% <br>
                <strong>Certificate Number:</strong> ${certificate.Certificate_Number}
              </p>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin: 20px 0;">
              Your dedication and hard work have paid off! We've attached your official certificate to this email. 
              You can also download it anytime from your student dashboard.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/student/certificates" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                View Certificate
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin: 20px 0 0 0; font-size: 14px;">
              Keep up the great work and continue your learning journey with us!
            </p>
            
            <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              © ${new Date().getFullYear()} iVidhyarthi. All rights reserved.<br>
              This is an automated email. Please do not reply.
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `Certificate_${course.Course_Name.replace(/\s+/g, '_')}.pdf`,
          path: pdfPath
        }
      ]
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Certificate email sent to ${student.Email}`);
    } catch (error) {
      console.error('Failed to send certificate email:', error.message);
    }
  }

  async getCertificate(studentId, courseId) {
    return await Tbl_Certificates.findOne({
      Student_Id: studentId,
      Course_Id: courseId.toString(),
      Status: 'Active'
    }).lean();
  }

  async getStudentCertificates(studentId) {
    return await Tbl_Certificates.find({
      Student_Id: studentId,
      Status: 'Active'
    })
      .sort({ Issue_Date: -1 })
      .lean();
  }
}

module.exports = new CertificateService();
