const mongoose = require('mongoose');
const Tbl_Courses = require('./models/Tbl_Courses');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const courses = await Tbl_Courses.find({}, 'Course_Id Title Lecturer_Id').limit(10);
    
    console.log('\nCourses with Lecturer_Id:');
    courses.forEach(c => {
      console.log(`ID: ${c.Course_Id}, Title: ${c.Title}, Lecturer: ${c.Lecturer_Id || 'NOT SET'}`);
    });
    
    // Check if any courses have the lecturer ID
    const lecturerEmail = '22bmit112@gmail.com';
    const lecturerCourses = await Tbl_Courses.find({ Lecturer_Id: lecturerEmail });
    console.log(`\nCourses for ${lecturerEmail}: ${lecturerCourses.length}`);
    
    process.exit();
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
