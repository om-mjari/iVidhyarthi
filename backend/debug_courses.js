const mongoose = require('mongoose');
const Tbl_Courses = require('./models/Tbl_Courses');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const course = await Tbl_Courses.findOne().lean();
    console.log('\nFirst course found:');
    console.log(JSON.stringify(course, null, 2));
    
    const allCourses = await Tbl_Courses.find().lean();
    console.log(`\nTotal courses: ${allCourses.length}`);
    
    // Check if Lecturer_Id exists
    const coursesWithLecturer = allCourses.filter(c => c.Lecturer_Id);
    console.log(`Courses with Lecturer_Id: ${coursesWithLecturer.length}`);
    
    if (coursesWithLecturer.length > 0) {
      console.log('\nSample course with Lecturer_Id:');
      console.log(JSON.stringify(coursesWithLecturer[0], null, 2));
    }
    
    process.exit();
  })
  .catch(err => {
    console.error('MongoDB Error:', err);
    process.exit(1);
  });
