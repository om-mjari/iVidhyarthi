const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Course = require('./models/Tbl_Courses');
  
  console.log('\n=== Checking Lecturers in Courses ===\n');
  
  const courses = await Course.find().limit(10).lean();
  console.log('Found', courses.length, 'courses\n');
  
  const lecturerIds = new Set();
  courses.forEach(c => {
    lecturerIds.add(c.Lecturer_Id);
    console.log('Course:', c.Title);
    console.log('  Course_Id:', c.Course_Id);
    console.log('  Lecturer_Id:', c.Lecturer_Id);
    console.log();
  });
  
  console.log('Unique Lecturer_Ids:', Array.from(lecturerIds));
  
  process.exit();
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
