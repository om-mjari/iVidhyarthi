const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log("Connected to MongoDB");
  
  const Submission = require("./models/Tbl_Submissions");
  const Student = require("./models/Tbl_Students");
  const Course = require("./models/Tbl_Courses");
  
  const sub = await Submission.findOne().lean();
  console.log("\n=== Sample Submission ===");
  console.log("Student_Id:", sub?.Student_Id);
  console.log("Course_Id:", sub?.Course_Id);
  console.log("Assignment_Id:", sub?.Assignment_Id);
  
  if (sub) {
    console.log("\n=== Looking up Student ===");
    const student = await Student.findOne({ _id: sub.Student_Id }).lean();
    console.log("Found Student:", student?.Full_Name || "NOT FOUND");
    
    console.log("\n=== Looking up Course ===");
    const course = await Course.findOne({ Course_Id: sub.Course_Id }).lean();
    console.log("Found Course:", course?.Title || "NOT FOUND");
  }
  
  process.exit();
}).catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
