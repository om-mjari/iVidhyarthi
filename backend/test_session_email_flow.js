const mongoose = require('mongoose');
require('dotenv').config();

const Tbl_Enrollments = require('./models/Tbl_Enrollments');
const Tbl_Students = require('./models/Tbl_Students');
const Tbl_Courses = require('./models/Tbl_Courses');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('\n=== Testing Email Flow for Sessions ===\n');
  
  // Test with a real course that has enrollments
  const courseId = '11'; // Maths without Maths
  
  console.log('1. Checking course...');
  const course = await Tbl_Courses.findOne({ Course_Id: courseId });
  if (course) {
    console.log('   ✅ Course found:', course.Title);
  } else {
    console.log('   ❌ Course not found');
    process.exit(1);
  }
  
  console.log('\n2. Finding enrollments with Active/Pending status...');
  const enrollments = await Tbl_Enrollments.find({
    Course_Id: courseId,
    Status: { $in: ['Active', 'Pending'] }
  });
  console.log(`   Found ${enrollments.length} enrollments (Active/Pending)`);
  
  if (enrollments.length === 0) {
    console.log('   ⚠️ No Active/Pending enrollments found - NO EMAILS WOULD BE SENT');
    
    // Check if there are any enrollments at all
    const allEnrollments = await Tbl_Enrollments.find({ Course_Id: courseId });
    console.log(`   Total enrollments for this course: ${allEnrollments.length}`);
    if (allEnrollments.length > 0) {
      console.log('   Enrollment statuses:');
      for (const e of allEnrollments) {
        console.log(`     - ${e.Enrollment_Id}: ${e.Status}`);
      }
    }
    process.exit(0);
  }
  
  console.log('\n3. Getting student details...');
  const studentIds = enrollments.map(e => e.Student_Id);
  console.log('   Student IDs:', studentIds);
  
  const students = await Tbl_Students.find({ Student_Id: { $in: studentIds } });
  console.log(`   Found ${students.length} student records`);
  
  if (students.length === 0) {
    console.log('   ❌ No student records found - NO EMAILS WOULD BE SENT');
    process.exit(0);
  }
  
  console.log('\n4. Getting user emails...');
  const studentUserIds = students.map(s => s.User_Id);
  console.log('   User IDs:', studentUserIds);
  
  const users = await User.find({ _id: { $in: studentUserIds } });
  console.log(`   Found ${users.length} user records`);
  
  const studentEmails = users.map(u => u.email).filter(e => e);
  console.log(`   Valid emails: ${studentEmails.length}`);
  
  if (studentEmails.length > 0) {
    console.log('\n✅ EMAILS WOULD BE SENT TO:');
    studentEmails.forEach((email, idx) => {
      console.log(`   ${idx + 1}. ${email}`);
    });
    
    console.log('\n📧 Email Configuration Check:');
    console.log('   EMAIL_USER:', process.env.EMAIL_USER || 'NOT SET');
    console.log('   EMAIL_APP_PASSWORD:', process.env.EMAIL_APP_PASSWORD ? '***' + process.env.EMAIL_APP_PASSWORD.slice(-4) : 'NOT SET');
    
    if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD) {
      console.log('\n✅ Email configuration is SET - Emails WILL be sent');
    } else {
      console.log('\n⚠️ Email configuration is NOT SET - Using test SMTP (Ethereal)');
      console.log('   Real emails will NOT be delivered, but preview URLs will be shown in console');
    }
  } else {
    console.log('\n❌ NO VALID EMAILS - NO EMAILS WOULD BE SENT');
  }
  
  console.log('\n=== Summary ===');
  console.log('When you CREATE a session:');
  if (studentEmails.length > 0) {
    console.log(`  ✅ Email will be sent to ${studentEmails.length} student(s)`);
    console.log('  📧 Email type: "New Session Scheduled"');
  } else {
    console.log('  ❌ NO emails will be sent (no eligible students)');
  }
  
  console.log('\nWhen you START a session:');
  if (studentEmails.length > 0) {
    console.log(`  ✅ Email will be sent to ${studentEmails.length} student(s)`);
    console.log('  📧 Email type: "Session Started - Join Now!"');
  } else {
    console.log('  ❌ NO emails will be sent (no eligible students)');
  }
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
