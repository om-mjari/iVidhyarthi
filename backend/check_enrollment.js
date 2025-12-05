const mongoose = require("mongoose");
require("dotenv").config();
const Tbl_Courses = require("./models/Tbl_Courses");
const Tbl_Enrollments = require("./models/Tbl_Enrollments");

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
    
    // Find course with ID 11
    const course = await Tbl_Courses.findOne({ Course_Id: 11 });
    console.log("\n=== COURSE INFO ===");
    if (course) {
      console.log(`Course ID: ${course.Course_Id}`);
      console.log(`Course Name: ${course.Title || course.Course_Name}`);
    } else {
      console.log("Course ID 11 not found!");
    }
    
    // Find enrollments for course 11
    const enrollments = await Tbl_Enrollments.find({ Course_Id: 11 });
    console.log("\n=== ENROLLMENTS FOR COURSE 11 ===");
    console.log(`Total Enrolled Students: ${enrollments.length}\n`);
    
    if (enrollments.length > 0) {
      enrollments.forEach((enrollment, index) => {
        console.log(`${index + 1}. Student Email: ${enrollment.Student_Email}`);
        console.log(`   Status: ${enrollment.Status}`);
        console.log(`   Enrolled: ${enrollment.Enrolled_At}`);
        console.log('');
      });
      console.log("✅ YES - These students WILL see the session on their dashboard!");
    } else {
      console.log("❌ NO - No students enrolled in Course 11, so NO ONE will see this session!");
    }
    
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
