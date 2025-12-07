const mongoose = require('mongoose');
require('dotenv').config();

const Feedback = require('./models/Tbl_Feedback');
const Courses = require('./models/Tbl_Courses');

async function testFeedbackCourses() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all feedback
    const feedbacks = await Feedback.find({}).limit(5).lean();
    console.log('\n📝 Sample Feedback entries:');
    feedbacks.forEach(f => {
      console.log(`  - Feedback_Id: ${f.Feedback_Id}, Course_Id: "${f.Course_Id}" (type: ${typeof f.Course_Id})`);
    });

    // Get all courses
    const courses = await Courses.find({}).select('Course_Id Title').limit(10).lean();
    console.log('\n📚 Sample Courses:');
    courses.forEach(c => {
      console.log(`  - Course_Id: ${c.Course_Id} (type: ${typeof c.Course_Id}), Title: "${c.Title}"`);
    });

    // Test matching
    console.log('\n🔍 Testing Course Lookup:');
    for (let feedback of feedbacks) {
      const courseId = parseInt(feedback.Course_Id);
      console.log(`\nFeedback Course_Id: "${feedback.Course_Id}" -> Parsed: ${courseId}`);
      
      if (!isNaN(courseId)) {
        const course = await Courses.findOne({ Course_Id: courseId }).select('Title').lean();
        console.log(`  Found course:`, course ? course.Title : 'NOT FOUND');
      } else {
        console.log(`  ❌ Invalid number`);
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

testFeedbackCourses();
