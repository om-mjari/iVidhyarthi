const mongoose = require('mongoose');
const Tbl_Courses = require('./models/Tbl_Courses');
const User = require('./models/User');
const Tbl_Lecturers = require('./models/Tbl_Lecturers');
require('dotenv').config();

console.log('🔍 Checking Login vs Database Mismatch\n');
console.log('==========================================\n');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');
    
    // Check all users with lecturer role
    const lecturerUsers = await User.find({ role: 'lecturer' }, 'email name');
    console.log(`📋 Found ${lecturerUsers.length} lecturer users:\n`);
    
    for (const user of lecturerUsers) {
      console.log(`\n👤 User: ${user.name || 'N/A'}`);
      console.log(`   Email: ${user.email}`);
      
      // Check if they have a lecturer profile
      const lecturerProfile = await Tbl_Lecturers.findOne({ User_Id: user._id });
      if (lecturerProfile) {
        console.log(`   ✅ Has Lecturer Profile (ID: ${lecturerProfile.Lecturer_Id})`);
      } else {
        console.log(`   ⚠️  No Lecturer Profile`);
      }
      
      // Check their courses
      const courses = await Tbl_Courses.find({ Lecturer_Id: user.email }, 'Course_Id Title');
      console.log(`   📚 Courses assigned: ${courses.length}`);
      if (courses.length > 0) {
        courses.forEach(c => {
          console.log(`      - ${c.Course_Id}: ${c.Title}`);
        });
      }
    }
    
    console.log('\n\n📊 All unique Lecturer_Id values in courses:\n');
    const allLecturerIds = await Tbl_Courses.distinct('Lecturer_Id');
    allLecturerIds.forEach(id => {
      console.log(`   - ${id}`);
    });
    
    console.log('\n\n🔍 Checking for mismatches...\n');
    
    // Find courses with lecturer IDs that don't match any user
    for (const lecturerId of allLecturerIds) {
      const userExists = await User.findOne({ email: lecturerId });
      const courseCount = await Tbl_Courses.countDocuments({ Lecturer_Id: lecturerId });
      
      if (!userExists) {
        console.log(`⚠️  WARNING: ${courseCount} course(s) assigned to ${lecturerId} but NO USER EXISTS`);
      } else {
        console.log(`✅ ${courseCount} course(s) for ${lecturerId} - User exists`);
      }
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
