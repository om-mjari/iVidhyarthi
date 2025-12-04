const mongoose = require('mongoose');
const Tbl_Courses = require('./models/Tbl_Courses');
require('dotenv').config();

console.log('🔧 Lecturer ID Fix Script');
console.log('=========================\n');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');
    
    // Check current state
    const wrongEmail = '22bmit112@gmail.com';  // Wrong (single 'i' - bmit)
    const correctEmail = '22bmiit112@gmail.com';  // Correct (double 'i' - bmiit)
    
    const coursesWithWrongEmail = await Tbl_Courses.find({ Lecturer_Id: wrongEmail });
    console.log(`📊 Courses with wrong email (${wrongEmail}): ${coursesWithWrongEmail.length}`);
    
    if (coursesWithWrongEmail.length > 0) {
      console.log('   Affected courses:');
      coursesWithWrongEmail.forEach(c => {
        console.log(`   - ID ${c.Course_Id}: ${c.Title}`);
      });
      
      console.log('\n🔄 Updating courses...');
      
      const result = await Tbl_Courses.updateMany(
        { Lecturer_Id: wrongEmail },
        { $set: { Lecturer_Id: correctEmail } }
      );
      
      console.log(`✅ Updated ${result.modifiedCount} course(s)`);
      console.log(`\n🎉 Fix complete! Courses now assigned to: ${correctEmail}`);
    } else {
      console.log('ℹ️  No courses found with typo email.');
      
      // Check if courses already have correct email
      const coursesWithCorrect = await Tbl_Courses.find({ Lecturer_Id: correctEmail });
      if (coursesWithCorrect.length > 0) {
        console.log(`✅ Courses already assigned correctly to: ${correctEmail}`);
        console.log(`   Total: ${coursesWithCorrect.length} course(s)`);
      } else {
        console.log('⚠️  No courses found for either email!');
        console.log('\n📋 All unique lecturer emails in database:');
        const allEmails = await Tbl_Courses.distinct('Lecturer_Id');
        allEmails.forEach(email => console.log(`   - ${email}`));
      }
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
