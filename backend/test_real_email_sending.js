const mongoose = require('mongoose');
require('dotenv').config();

const Tbl_Sessions = require('./models/Tbl_Sessions');
const Tbl_Courses = require('./models/Tbl_Courses');
const Tbl_Enrollments = require('./models/Tbl_Enrollments');
const User = require('./models/User');
const sendSessionEmail = require('./utils/sendSessionEmail');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║   SIMULATING SESSION CREATION WITH EMAIL SENDING      ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  const course_id = '11';
  const title = 'TEST Session - Email Check';
  const scheduled_at = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
  const duration = 60;
  const description = 'This is a test session to verify email sending';
  
  console.log('📝 Session Details:');
  console.log('   Course ID:', course_id);
  console.log('   Title:', title);
  console.log('   Scheduled:', scheduled_at.toLocaleString());
  console.log('   Duration:', duration, 'minutes\n');
  
  try {
    const course = await Tbl_Courses.findOne({ Course_Id: course_id });
    if (!course) {
      console.log('❌ Course not found');
      process.exit(1);
    }
    console.log('✅ Course found:', course.Title);
    
    // EXACT CODE FROM sessionRoutes.js
    console.log('\n📧 Checking for students to notify...');
    const enrollments = await Tbl_Enrollments.find({
      Course_Id: course_id,
      Status: { $in: ['Active', 'Pending'] }
    });
    console.log(`   Found ${enrollments.length} active/pending enrollments`);

    if (enrollments.length > 0) {
      const studentIds = enrollments.map(e => e.Student_Id);
      console.log('   Student IDs:', studentIds);
      
      // Student_Id in enrollment is actually User._id, query users directly
      const users = await User.find({ _id: { $in: studentIds } });
      console.log(`   Found ${users.length} users`);
      
      const studentEmails = users.map(u => u.email).filter(e => e);
      console.log(`   Collected ${studentEmails.length} valid emails`);
      console.log('   Emails:', studentEmails);

      if (studentEmails.length > 0) {
        console.log('\n📨 Sending session creation emails...\n');
        
        const result = await sendSessionEmail(studentEmails, {
          courseTitle: course.Title || course.Course_Name,
          sessionTitle: title,
          scheduledAt: scheduled_at,
          duration: duration,
          sessionUrl: null,
          description: description
        }, 'created');
        
        console.log('\n📊 Email Result:', result);
        
        if (result.success) {
          console.log('\n' + '='.repeat(60));
          console.log('✅ SUCCESS! Emails were sent successfully!');
          console.log('='.repeat(60));
          console.log('Recipients:', studentEmails.join(', '));
          console.log('Message ID:', result.messageId);
        } else {
          console.log('\n' + '='.repeat(60));
          console.log('❌ FAILED! Email sending failed');
          console.log('='.repeat(60));
          console.log('Error:', result.error);
        }
      } else {
        console.log('\n⚠️ No valid email addresses found');
      }
    } else {
      console.log('\n⚠️ No active/pending students to notify');
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
  
  process.exit(0);
}).catch(err => {
  console.error('Connection Error:', err);
  process.exit(1);
});
