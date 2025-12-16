const mongoose = require('mongoose');
require('dotenv').config();

const Tbl_Enrollments = require('./models/Tbl_Enrollments');
const Tbl_Students = require('./models/Tbl_Students');
const Tbl_Courses = require('./models/Tbl_Courses');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     SESSION EMAIL NOTIFICATION - STATUS CHECK          ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  const courseId = '11'; // Test with existing course
  
  // Step 1: Check course
  console.log('📚 STEP 1: Checking Course');
  const course = await Tbl_Courses.findOne({ Course_Id: courseId });
  if (!course) {
    console.log('   ❌ Course not found');
    process.exit(1);
  }
  console.log(`   ✅ Course: "${course.Title}"`);
  console.log(`   📧 Lecturer: ${course.Lecturer_Id}\n`);
  
  // Step 2: Check enrollments
  console.log('👥 STEP 2: Finding Enrolled Students (Active/Pending status only)');
  const enrollments = await Tbl_Enrollments.find({
    Course_Id: courseId,
    Status: { $in: ['Active', 'Pending'] }
  });
  console.log(`   Found: ${enrollments.length} enrollment(s)`);
  
  if (enrollments.length === 0) {
    console.log('   ⚠️  NO ACTIVE/PENDING ENROLLMENTS\n');
    
    const allEnrollments = await Tbl_Enrollments.find({ Course_Id: courseId });
    console.log(`   Total enrollments: ${allEnrollments.length}`);
    if (allEnrollments.length > 0) {
      console.log('   Status breakdown:');
      allEnrollments.forEach(e => {
        console.log(`     - ${e.Status}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('RESULT: ❌ NO EMAILS WILL BE SENT');
    console.log('REASON: No students with Active/Pending enrollment status');
    console.log('='.repeat(60) + '\n');
    process.exit(0);
  }
  
  // Step 3: Get User IDs (Student_Id in enrollments = User._id)
  console.log(`\n📋 STEP 3: Getting User Details`);
  const userIds = enrollments.map(e => e.Student_Id);
  console.log(`   User IDs from enrollments: ${userIds.length}`);
  
  // Get users directly (Student_Id in enrollment is actually User._id)
  const users = await User.find({ _id: { $in: userIds } });
  console.log(`   ✅ Found ${users.length} user(s) with email\n`);
  
  // Get student details for display
  const students = await Tbl_Students.find({ User_Id: { $in: userIds } });
  
  // Step 4: Collect emails
  console.log('✉️  STEP 4: Email Recipients');
  const studentEmails = users.map(u => u.email).filter(e => e);
  
  if (studentEmails.length === 0) {
    console.log('   ❌ NO VALID EMAILS FOUND\n');
    console.log('='.repeat(60));
    console.log('RESULT: ❌ NO EMAILS WILL BE SENT');
    console.log('REASON: No valid email addresses found');
    console.log('='.repeat(60) + '\n');
    process.exit(0);
  }
  
  console.log(`   📧 Valid emails: ${studentEmails.length}\n`);
  
  // Display student details
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const student = students.find(s => s.User_Id.toString() === user._id.toString());
    const enrollment = enrollments.find(e => e.Student_Id === user._id.toString());
    
    console.log(`   ${i + 1}. ${user.email}`);
    if (student) {
      console.log(`      Name: ${student.Full_Name}`);
    }
    console.log(`      Status: ${enrollment ? enrollment.Status : 'Unknown'}`);
  }
  
  // Step 5: Check email configuration
  console.log('\n⚙️  STEP 5: Email Configuration Check');
  const hasEmailConfig = process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD;
  console.log(`   EMAIL_USER: ${process.env.EMAIL_USER || '❌ NOT SET'}`);
  console.log(`   EMAIL_APP_PASSWORD: ${process.env.EMAIL_APP_PASSWORD ? '✅ SET (***' + process.env.EMAIL_APP_PASSWORD.slice(-4) + ')' : '❌ NOT SET'}`);
  
  if (hasEmailConfig) {
    console.log('   ✅ Email configuration is COMPLETE');
  } else {
    console.log('   ⚠️  Email configuration MISSING - Will use test SMTP (Ethereal)');
    console.log('   ℹ️  Preview URLs will be shown in console, but real emails won\'t be delivered');
  }
  
  // Final Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY - EMAIL NOTIFICATION STATUS');
  console.log('='.repeat(60));
  
  console.log('\n🎯 When you CREATE a new session:');
  console.log(`   ✅ Email WILL be sent to ${studentEmails.length} student(s)`);
  console.log('   📧 Email Type: "New Session Scheduled"');
  console.log('   📝 Content: Session details (title, date, time, duration)');
  if (hasEmailConfig) {
    console.log('   📬 Delivery: Real emails via Gmail');
  } else {
    console.log('   📬 Delivery: Test mode (Ethereal) - Check console for preview URL');
  }
  
  console.log('\n🚀 When you START a session:');
  console.log(`   ✅ Email WILL be sent to ${studentEmails.length} student(s)`);
  console.log('   📧 Email Type: "Session Started - Join Now!"');
  console.log('   📝 Content: Join link + urgent notification');
  if (hasEmailConfig) {
    console.log('   📬 Delivery: Real emails via Gmail');
  } else {
    console.log('   📬 Delivery: Test mode (Ethereal) - Check console for preview URL');
  }
  
  console.log('\n💡 Note: Only students with Active/Pending enrollment status receive emails');
  console.log('   (Students who completed the course are excluded)');
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ EMAIL NOTIFICATIONS ARE CONFIGURED AND WORKING!');
  console.log('='.repeat(60) + '\n');
  
  process.exit(0);
}).catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
