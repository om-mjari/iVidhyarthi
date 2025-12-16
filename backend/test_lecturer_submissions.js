const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Submission = require('./models/Tbl_Submissions');
  const Assignment = require('./models/Tbl_Assignments');
  const Course = require('./models/Tbl_Courses');
  const Student = require('./models/Tbl_Students');
  
  console.log('\n=== Testing Lecturer Submission Endpoint Logic ===\n');
  
  // Simulate the lecturer endpoint logic
  const lecturerId = '22bmiit112@gmail.com'; // Lecturer who has Course_Id 11
  
  console.log('1. Finding courses for lecturer:', lecturerId);
  const courses = await Course.find({ Lecturer_Id: lecturerId }).lean();
  console.log('Found', courses.length, 'courses');
  
  if (courses.length > 0) {
    console.log('Course IDs:', courses.map(c => c.Course_Id));
    console.log('Course Titles:', courses.map(c => c.Title));
  }
  
  const courseIds = courses.map(c => c.Course_Id);
  
  console.log('\n2. Finding assignments for these courses');
  const assignments = await Assignment.find({
    Course_Id: { $in: courseIds }
  }).lean();
  console.log('Found', assignments.length, 'assignments');
  
  const assignmentIds = assignments.map(a => a.Assignment_Id);
  
  console.log('\n3. Finding submissions for these assignments');
  const submissions = await Submission.find({
    Assignment_Id: { $in: assignmentIds }
  }).lean();
  console.log('Found', submissions.length, 'submissions');
  
  console.log('\n4. Enriching submissions...');
  submissions.forEach(sub => {
    const assignment = assignments.find(a => a.Assignment_Id === sub.Assignment_Id);
    const course = courses.find(c => c.Course_Id === sub.Course_Id);
    
    console.log('\n--- Submission:', sub.Submission_Id);
    console.log('    Course_Id in submission:', sub.Course_Id, 'type:', typeof sub.Course_Id);
    console.log('    Course_Ids in array:', courseIds.map(id => `${id} (${typeof id})`));
    console.log('    Course found:', course ? 'YES' : 'NO');
    
    // Test type conversion
    const courseByString = courses.find(c => c.Course_Id == sub.Course_Id); // loose equality
    console.log('    Course found with == :', courseByString ? 'YES' : 'NO');
    
    if (course) {
      console.log('    Course Title:', course.Title);
    } else {
      console.log('    ❌ PROBLEM: Course_Id', sub.Course_Id, 'not in courses array');
    }
  });
  
  process.exit();
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
