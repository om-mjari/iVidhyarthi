const mongoose = require('mongoose');
require('dotenv').config();

const Tbl_Enrollments = require('./models/Tbl_Enrollments');
const Tbl_Students = require('./models/Tbl_Students');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('\n=== Checking Student ID Mapping ===\n');
  
  const enrollment = await Tbl_Enrollments.findOne({ Course_Id: '11' });
  console.log('Sample Enrollment:');
  console.log('  Student_Id:', enrollment.Student_Id);
  console.log('  Type:', typeof enrollment.Student_Id);
  
  console.log('\nChecking Tbl_Students collection...');
  const allStudents = await Tbl_Students.find().limit(3);
  console.log('Sample Students:');
  allStudents.forEach(s => {
    console.log('  Student_Id:', s.Student_Id, 'type:', typeof s.Student_Id);
    console.log('  User_Id:', s.User_Id, 'type:', typeof s.User_Id);
  });
  
  console.log('\nTrying to find by User_Id (since Student_Id in enrollment might be User_Id)...');
  const studentIds = ['691d75546345e054d8afe7d4', '692d2fac02f3cd8b48f0d64e'];
  
  // Try finding in User collection
  console.log('\n1. Checking if these are User IDs...');
  const users = await User.find({ _id: { $in: studentIds } });
  console.log(`   Found ${users.length} users`);
  if (users.length > 0) {
    users.forEach(u => {
      console.log(`   - ${u.email} (ID: ${u._id})`);
    });
  }
  
  // Try finding students by User_Id
  console.log('\n2. Finding students by User_Id (as string)...');
  const studentsByUserId = await Tbl_Students.find({ 
    User_Id: { $in: studentIds } 
  });
  console.log(`   Found ${studentsByUserId.length} students`);
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
