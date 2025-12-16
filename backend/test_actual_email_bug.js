const mongoose = require('mongoose');
require('dotenv').config();

const Tbl_Enrollments = require('./models/Tbl_Enrollments');
const Tbl_Students = require('./models/Tbl_Students');
const Tbl_Courses = require('./models/Tbl_Courses');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║   TESTING ACTUAL SESSION EMAIL CODE LOGIC             ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  const course_id = '11';
  const course = await Tbl_Courses.findOne({ Course_Id: course_id });
  
  console.log('Testing the EXACT code from sessionRoutes.js...\n');
  console.log('Step 1: Get enrollments');
  const enrollments = await Tbl_Enrollments.find({
    Course_Id: course_id,
    Status: { $in: ['Active', 'Pending'] }
  });
  console.log(`   Found ${enrollments.length} enrollments`);

  if (enrollments.length > 0) {
    console.log('\nStep 2: Get studentIds from enrollments');
    const studentIds = enrollments.map(e => e.Student_Id);
    console.log('   studentIds:', studentIds);
    console.log('   Type:', typeof studentIds[0]);
    
    console.log('\n⚠️  Step 3: Find students using Student_Id field (CURRENT CODE)');
    const students = await Tbl_Students.find({ Student_Id: { $in: studentIds } });
    console.log(`   ❌ Found ${students.length} students (PROBLEM HERE!)`);
    
    console.log('\n✅ Step 3 CORRECTED: Find students using User_Id field');
    const studentsCorrect = await Tbl_Students.find({ User_Id: { $in: studentIds } });
    console.log(`   ✅ Found ${studentsCorrect.length} students`);
    
    if (students.length === 0) {
      console.log('\n' + '='.repeat(60));
      console.log('🚨 PROBLEM IDENTIFIED!');
      console.log('='.repeat(60));
      console.log('\nThe code is looking for students using Student_Id field,');
      console.log('but Student_Id in enrollments contains User_Id values!');
      console.log('\nCurrently in sessionRoutes.js line 206:');
      console.log('   const students = await Tbl_Students.find({ Student_Id: { $in: studentIds } });');
      console.log('   ❌ This returns 0 students');
      console.log('\nShould be:');
      console.log('   const students = await Tbl_Students.find({ User_Id: { $in: studentIds } });');
      console.log('   ✅ This would return', studentsCorrect.length, 'students');
      console.log('\n' + '='.repeat(60));
    }
    
    // Test the corrected flow
    console.log('\n📧 Testing CORRECTED email flow:');
    if (studentsCorrect.length > 0) {
      const studentUserIds = studentsCorrect.map(s => s.User_Id);
      console.log('   studentUserIds:', studentUserIds.length);
      
      const users = await User.find({ _id: { $in: studentUserIds } });
      console.log('   users found:', users.length);
      
      const studentEmails = users.map(u => u.email).filter(e => e);
      console.log('   valid emails:', studentEmails.length);
      
      if (studentEmails.length > 0) {
        console.log('\n✅ With the fix, emails WOULD be sent to:');
        studentEmails.forEach((email, i) => {
          console.log(`   ${i + 1}. ${email}`);
        });
      }
    }
    
    // However, test if we can skip student lookup entirely
    console.log('\n💡 BETTER APPROACH (Skip Tbl_Students lookup):');
    console.log('   Since Student_Id in enrollment = User._id...');
    const usersDirect = await User.find({ _id: { $in: studentIds } });
    console.log(`   ✅ Found ${usersDirect.length} users directly`);
    const emailsDirect = usersDirect.map(u => u.email).filter(e => e);
    console.log(`   ✅ Valid emails: ${emailsDirect.length}`);
    if (emailsDirect.length > 0) {
      console.log('\n   Emails:');
      emailsDirect.forEach((email, i) => {
        console.log(`   ${i + 1}. ${email}`);
      });
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('CONCLUSION:');
  console.log('='.repeat(60));
  console.log('❌ CURRENTLY: Emails are NOT being sent');
  console.log('   Reason: Wrong field lookup in Tbl_Students');
  console.log('\n✅ SOLUTION: Fix the field from Student_Id to User_Id');
  console.log('   OR skip Tbl_Students lookup and query User directly');
  console.log('='.repeat(60) + '\n');
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
