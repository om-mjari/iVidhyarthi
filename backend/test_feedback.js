const mongoose = require('mongoose');
require('dotenv').config();
const Feedback = require('./models/Tbl_Feedback');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');
    
    // Test feedback data
    const testFeedback = {
      Course_Id: '1',
      Student_Id: '6929525c02d64e0017d0e3b7',
      Rating: 5,
      Comment: 'This is a test feedback. Great course!',
      Status: 'Pending'
    };
    
    console.log('🧪 Creating Test Feedback:');
    console.log('   Course ID:', testFeedback.Course_Id);
    console.log('   Student ID:', testFeedback.Student_Id);
    console.log('   Rating:', testFeedback.Rating);
    console.log('   Comment:', testFeedback.Comment);
    
    try {
      const feedback = new Feedback(testFeedback);
      await feedback.save();
      
      console.log('\n✅ Feedback Created Successfully!');
      console.log('   Feedback ID:', feedback.Feedback_Id);
      console.log('   Posted On:', feedback.Posted_On);
      console.log('   Status:', feedback.Status);
      
      // Fetch all feedbacks for this student
      const allFeedbacks = await Feedback.find({ Student_Id: testFeedback.Student_Id });
      console.log(`\n📝 Total feedbacks from this student: ${allFeedbacks.length}`);
      
      if (allFeedbacks.length > 0) {
        console.log('\nRecent Feedbacks:');
        allFeedbacks.slice(0, 3).forEach((f, i) => {
          console.log(`   ${i + 1}. Course: ${f.Course_Id} | Rating: ${f.Rating}★ | Status: ${f.Status}`);
        });
      }
      
    } catch (error) {
      console.error('\n❌ Error creating feedback:', error.message);
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });
