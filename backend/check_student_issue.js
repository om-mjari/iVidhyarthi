const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log("Connected to MongoDB");
  
  const Student = require("./models/Tbl_Students");
  const User = require("./models/User");
  
  const studentId = "692d2fac02f3cd8b48f0d64e";
  
  console.log("\n=== Checking if this is a Student _id ===");
  const student = await Student.findById(studentId).lean();
  console.log("Student found:", student);
  
  console.log("\n=== Checking if this is a User _id (email) ===");
  const user = await User.findById(studentId).lean();
  console.log("User found:", user);
  
  console.log("\n=== Checking all students ===");
  const allStudents = await Student.find().limit(3).lean();
  console.log("Sample students:", allStudents.map(s => ({ _id: s._id, name: s.Full_Name, User_Id: s.User_Id })));
  
  process.exit();
}).catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
