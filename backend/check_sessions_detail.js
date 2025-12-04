const mongoose = require('mongoose');
const Tbl_Sessions = require('./models/Tbl_Sessions');
const Tbl_Courses = require('./models/Tbl_Courses');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');
    
    const sessions = await Tbl_Sessions.find().sort({ Scheduled_At: 1 }).lean();
    console.log(`📅 Total sessions: ${sessions.length}\n`);
    
    for (const session of sessions) {
      // Convert Course_Id to number if it's numeric string
      let course = null;
      const courseId = typeof session.Course_Id === 'string' && !isNaN(session.Course_Id) 
        ? parseInt(session.Course_Id) 
        : session.Course_Id;
      
      if (typeof courseId === 'number') {
        course = await Tbl_Courses.findOne({ Course_Id: courseId });
      }
      
      console.log(`Session ID: ${session.Session_Id.substring(0, 20)}...`);
      console.log(`  Course_Id: ${session.Course_Id} → Parsed: ${courseId} (Type: ${typeof courseId})`);
      console.log(`  Course Name: ${course?.Title || '❌ NOT FOUND'}`);
      console.log(`  Title: ${session.Title}`);
      console.log(`  Scheduled: ${session.Scheduled_At}`);
      console.log(`  Status: ${session.Status}`);
      console.log('');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
