const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Submission = require('./models/Tbl_Submissions');
  const Assignment = require('./models/Tbl_Assignments');
  const Course = require('./models/Tbl_Courses');
  
  console.log('\n=== Checking Submission Course_Id ===\n');
  
  // Get a few submissions
  const submissions = await Submission.find().limit(5).lean();
  console.log('Found', submissions.length, 'submissions');
  
  for (const sub of submissions) {
    console.log('\n--- Submission:', sub.Submission_Id);
    console.log('Student_Id:', sub.Student_Id);
    console.log('Assignment_Id:', sub.Assignment_Id);
    console.log('Course_Id in submission:', sub.Course_Id);
    
    // Find the assignment
    const assignment = await Assignment.findOne({ Assignment_Id: sub.Assignment_Id });
    if (assignment) {
      console.log('Assignment Course_Id:', assignment.Course_Id);
      
      // Find the course
      const course = await Course.findOne({ Course_Id: assignment.Course_Id });
      if (course) {
        console.log('Course Title:', course.Title);
      } else {
        console.log('❌ Course NOT FOUND for Course_Id:', assignment.Course_Id);
      }
    } else {
      console.log('❌ Assignment NOT FOUND');
    }
  }
  
  process.exit();
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
