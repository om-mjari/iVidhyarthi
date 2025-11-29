const mongoose = require("mongoose");
require("dotenv").config();
const Enrollment = require("./models/Tbl_Enrollments");
const Students = require("./models/Tbl_Students");
const Course = require("./models/Tbl_Courses");

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB");

    // Get a sample student
    const student = await Students.findOne();
    console.log("\nSample Student:", {
      _id: student._id,
      User_Id: student.User_Id,
      Full_Name: student.Full_Name,
    });

    // Get a sample course
    const course = await Course.findOne();
    console.log("\nSample Course:", {
      _id: course._id,
      Course_Id: course.Course_Id,
      Title: course.Title,
    });

    // Check existing enrollments
    const enrollments = await Enrollment.find().limit(3);
    console.log("\nExisting Enrollments:");
    enrollments.forEach((e) => {
      console.log({
        Student_Id: e.Student_Id,
        Course_Id: e.Course_Id,
        Status: e.Status,
        Payment_Status: e.Payment_Status,
      });
    });

    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
