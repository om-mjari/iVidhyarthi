const mongoose = require('mongoose');
require('dotenv').config();
const Course = require('./models/Tbl_Courses');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    const courses = await Course.find({}, 'Course_Id Title');
    console.log('Courses:', courses);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
