const mongoose = require('mongoose');
require('dotenv').config();
const Enrollment = require('./models/Tbl_Enrollments');
const Course = require('./models/Tbl_Courses');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');
    
    // Test data
    const testStudentId = '6929525c02d64e0017d0e3b7'; // Your user ID
    const testCourseId = '1'; // Basic Python Programming course
    
    console.log('🧪 Test Enrollment Creation');
    console.log('   Student ID:', testStudentId);
    console.log('   Course ID:', testCourseId);
    
    // Check if course exists
    const course = await Course.findOne({ Course_Id: testCourseId });
    if (course) {
      console.log('\n✅ Course found:', course.Title);
    } else {
      console.log('\n❌ Course not found!');
    }
    
    // Check if enrollment already exists
    const existing = await Enrollment.findOne({
      Student_Id: testStudentId,
      Course_Id: testCourseId
    });
    
    if (existing) {
      console.log('\n✅ Enrollment already exists:');
      console.log('   Status:', existing.Status);
      console.log('   Payment Status:', existing.Payment_Status);
      console.log('   Enrolled On:', existing.Enrolled_On);
    } else {
      console.log('\n❌ No enrollment found for this student-course combination');
    }
    
    // Fetch all enrollments for this student
    const allEnrollments = await Enrollment.find({ Student_Id: testStudentId });
    console.log(`\n📚 Total enrollments for student: ${allEnrollments.length}`);
    
    if (allEnrollments.length > 0) {
      console.log('\nEnrollment Details:');
      for (const enroll of allEnrollments) {
        const courseData = await Course.findOne({ Course_Id: enroll.Course_Id });
        console.log(`   - Course ID: ${enroll.Course_Id}`);
        console.log(`     Title: ${courseData ? courseData.Title : 'Not Found'}`);
        console.log(`     Status: ${enroll.Status}`);
        console.log(`     Payment: ${enroll.Payment_Status}`);
        console.log('');
      }
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
