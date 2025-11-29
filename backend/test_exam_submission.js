const mongoose = require('mongoose');
const ExamAttempt = require('./models/Tbl_ExamAttempts');

// MongoDB Connection
const MONGODB_URI = 'mongodb+srv://omjari48:Omjari%402004@cluster0.i1iwp.mongodb.net/iVidhyarthi?retryWrites=true&w=majority';

async function testExamSubmission() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Sample exam submission data
    const sampleExamAttempt = {
      Exam_Id: 'TEST_ASSIGNMENT_001',
      Student_Id: 'STU123',
      Score: 85,
      Attempt_Date: new Date(),
      Time_Taken: 25, // minutes
      Status: 'Completed',
      Answers: {
        "1": "Cloud computing is...",
        "2": "1",
        "3": "Scalability, cost-efficiency",
        "4": "1"
      },
      Percentage: 85
    };

    console.log('📝 Creating test exam attempt...');
    const examAttempt = new ExamAttempt(sampleExamAttempt);
    await examAttempt.save();

    console.log('✅ Exam Attempt Created Successfully!');
    console.log('📊 Attempt Details:');
    console.log('   - Attempt ID:', examAttempt.Attempt_Id);
    console.log('   - Exam ID:', examAttempt.Exam_Id);
    console.log('   - Student ID:', examAttempt.Student_Id);
    console.log('   - Score:', examAttempt.Score);
    console.log('   - Percentage:', examAttempt.Percentage + '%');
    console.log('   - Time Taken:', examAttempt.Time_Taken, 'minutes');
    console.log('   - Status:', examAttempt.Status);

    // Fetch all exam attempts
    console.log('\n📋 Fetching all exam attempts...');
    const allAttempts = await ExamAttempt.find({});
    console.log(`✅ Found ${allAttempts.length} exam attempt(s)\n`);

    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
  }
}

testExamSubmission();
