/**
 * Seed Script for New Tables
 * Creates sample data to populate all new collections in MongoDB Atlas
 */

require("dotenv").config();
const mongoose = require("mongoose");

// Import models
const Assignment = require("./models/Tbl_Assignments");
const Exam = require("./models/Tbl_Exams");
const Enrollment = require("./models/Tbl_Enrollments");
const Submission = require("./models/Tbl_Submissions");
const ExamAttempt = require("./models/Tbl_ExamAttempts");
const Progress = require("./models/Tbl_ProgressTracking");
const Certificate = require("./models/Tbl_Certificates");
const Feedback = require("./models/Tbl_Feedback");
const Earnings = require("./models/Tbl_Earnings");
const Session = require("./models/Tbl_Sessions");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ Connected to MongoDB Atlas");
    seedData();
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

async function seedData() {
  try {
    console.log("\n🌱 Starting to seed new tables...\n");

    // Clear existing data first
    console.log("🗑️ Clearing existing data...");
    await Promise.all([
      Assignment.deleteMany({}),
      Exam.deleteMany({}),
      Enrollment.deleteMany({}),
      Submission.deleteMany({}),
      ExamAttempt.deleteMany({}),
      Progress.deleteMany({}),
      Certificate.deleteMany({}),
      Feedback.deleteMany({}),
      Earnings.deleteMany({}),
      Session.deleteMany({}),
    ]);
    console.log("✅ Cleared all existing data\n");

    // 1. Create Sample Assignments
    console.log("📝 Creating Assignments...");
    const assignments = await Assignment.insertMany([
      {
        Course_Id: "COURSE_001",
        Topic_Id: "TOPIC_001",
        Title: "Week 1 Assignment - IoT Basics",
        Description: "Multiple choice questions on IoT fundamentals",
        Due_Date: new Date("2025-12-10"),
        Assignment_Type: "Quiz",
        Marks: 100,
      },
      {
        Course_Id: "COURSE_001",
        Title: "Week 2 Assignment - Sensor Networks",
        Description: "Questions on sensor types and networking",
        Due_Date: new Date("2025-12-17"),
        Assignment_Type: "Quiz",
        Marks: 100,
      },
      {
        Course_Id: "COURSE_001",
        Title: "Final Project - IoT Application",
        Description: "Design and implement a complete IoT solution",
        Due_Date: new Date("2026-01-15"),
        Assignment_Type: "Project",
        Marks: 200,
      },
    ]);
    console.log(`✅ Created ${assignments.length} assignments`);

    // 2. Create Sample Exams
    console.log("\n📋 Creating Exams...");
    const exams = await Exam.insertMany([
      {
        Course_Id: "COURSE_001",
        Title: "Mid-Term Exam",
        Total_Marks: 100,
        Duration: 90,
        Status: "Published",
        Exam_Date: new Date("2025-12-20"),
      },
      {
        Course_Id: "COURSE_001",
        Title: "Final Exam",
        Total_Marks: 150,
        Duration: 120,
        Status: "Draft",
        Exam_Date: new Date("2026-01-25"),
      },
    ]);
    console.log(`✅ Created ${exams.length} exams`);

    // 3. Create Sample Enrollments
    console.log("\n👥 Creating Enrollments...");
    const enrollments = await Enrollment.insertMany([
      {
        Course_Id: "COURSE_001",
        Student_Id: "STU_001",
        Status: "Active",
        Payment_Status: "Paid",
      },
      {
        Course_Id: "COURSE_001",
        Student_Id: "STU_002",
        Status: "Active",
        Payment_Status: "Paid",
      },
      {
        Course_Id: "COURSE_002",
        Student_Id: "STU_001",
        Status: "Active",
        Payment_Status: "Paid",
      },
    ]);
    console.log(`✅ Created ${enrollments.length} enrollments`);

    // 4. Create Sample Submissions
    console.log("\n📤 Creating Submissions...");
    const submissions = await Submission.insertMany([
      {
        Assignment_Id: assignments[0].Assignment_Id,
        Student_Id: "STU_001",
        File_Url: "https://example.com/submissions/assignment1_stu001.pdf",
        Grade: 85,
        Feedback: "Good understanding of IoT concepts. Well done!",
        Status: "Graded",
      },
      {
        Assignment_Id: assignments[0].Assignment_Id,
        Student_Id: "STU_002",
        File_Url: "https://example.com/submissions/assignment1_stu002.pdf",
        Status: "Submitted",
      },
    ]);
    console.log(`✅ Created ${submissions.length} submissions`);

    // 5. Create Sample Exam Attempts
    console.log("\n✍️ Creating Exam Attempts...");
    const examAttempts = await ExamAttempt.insertMany([
      {
        Exam_Id: exams[0].Exam_Id,
        Student_Id: "STU_001",
        Score: 78,
        Time_Taken: 75,
        Status: "Completed",
        Percentage: 78,
      },
      {
        Exam_Id: exams[0].Exam_Id,
        Student_Id: "STU_002",
        Score: 92,
        Time_Taken: 85,
        Status: "Completed",
        Percentage: 92,
      },
    ]);
    console.log(`✅ Created ${examAttempts.length} exam attempts`);

    // 6. Create Sample Progress Tracking
    console.log("\n📊 Creating Progress Records...");
    const progressRecords = await Progress.insertMany([
      {
        Course_Id: "COURSE_001",
        Student_Id: "STU_001",
        Progress_Percent: 45,
        Completed_Topics: ["1", "2", "3"],
        Status: "In Progress",
        Time_Spent: 180,
      },
      {
        Course_Id: "COURSE_001",
        Student_Id: "STU_002",
        Progress_Percent: 75,
        Completed_Topics: ["1", "2", "3", "4", "5"],
        Status: "In Progress",
        Time_Spent: 320,
      },
      {
        Course_Id: "COURSE_002",
        Student_Id: "STU_001",
        Progress_Percent: 100,
        Completed_Topics: ["1", "2", "3", "4", "5", "6"],
        Status: "Completed",
        Time_Spent: 450,
      },
    ]);
    console.log(`✅ Created ${progressRecords.length} progress records`);

    // 7. Create Sample Certificates
    console.log("\n🎓 Creating Certificates...");
    const certificates = await Certificate.insertMany([
      {
        Course_Id: "COURSE_002",
        Student_Id: "STU_001",
        Certificate_Url:
          "https://example.com/certificates/cert_stu001_course002.pdf",
        Grade: "A",
        Percentage: 92,
        Status: "Active",
      },
    ]);
    console.log(`✅ Created ${certificates.length} certificates`);

    // 8. Create Sample Feedback
    console.log("\n💬 Creating Feedback...");
    const feedbacks = await Feedback.insertMany([
      {
        Course_Id: "COURSE_001",
        Student_Id: "STU_001",
        Rating: 5,
        Comment:
          "Excellent course! The instructor explains concepts very clearly and the assignments are practical.",
        Status: "Approved",
        Helpful_Count: 12,
      },
      {
        Course_Id: "COURSE_001",
        Student_Id: "STU_002",
        Rating: 4,
        Comment:
          "Great content and well-structured lectures. Would love more hands-on projects.",
        Status: "Approved",
        Helpful_Count: 8,
      },
      {
        Course_Id: "COURSE_002",
        Student_Id: "STU_001",
        Rating: 5,
        Comment:
          "Best course I have taken! Highly recommended for anyone interested in this topic.",
        Status: "Pending",
        Helpful_Count: 3,
      },
    ]);
    console.log(`✅ Created ${feedbacks.length} feedback records`);

    // 9. Create Sample Earnings
    console.log("\n💰 Creating Earnings...");
    const earnings = await Earnings.insertMany([
      {
        Lecturer_Id: "LECT_001",
        Amount: 577.8,
        Course_Id: "COURSE_001",
        Transaction_Type: "Course Sale",
        Status: "Processed",
        Payment_Date: new Date("2025-11-20"),
      },
      {
        Lecturer_Id: "LECT_001",
        Amount: 577.8,
        Course_Id: "COURSE_001",
        Transaction_Type: "Course Sale",
        Status: "Processed",
        Payment_Date: new Date("2025-11-22"),
      },
      {
        Lecturer_Id: "LECT_002",
        Amount: 826.0,
        Course_Id: "COURSE_002",
        Transaction_Type: "Course Sale",
        Status: "Paid",
        Payment_Method: "Bank Transfer",
        Payment_Date: new Date("2025-11-25"),
      },
      {
        Lecturer_Id: "LECT_001",
        Amount: 500.0,
        Transaction_Type: "Bonus",
        Status: "Pending",
        Notes: "Performance bonus for Q4 2025",
      },
    ]);
    console.log(`✅ Created ${earnings.length} earnings records`);

    // 10. Create Sample Sessions
    console.log("\n🎥 Creating Sessions...");
    const sessions = await Session.insertMany([
      {
        Course_Id: "COURSE_001",
        Title: "Live Doubt Clearing Session - Week 1",
        Session_Url: "https://zoom.us/j/123456789",
        Scheduled_At: new Date("2025-12-05T10:00:00"),
        Duration: 60,
        Session_Type: "Live",
        Status: "Scheduled",
        Host_Id: "LECT_001",
        Max_Participants: 100,
      },
      {
        Course_Id: "COURSE_001",
        Title: "Workshop: Building Your First IoT Device",
        Session_Url: "https://zoom.us/j/987654321",
        Scheduled_At: new Date("2025-12-12T14:00:00"),
        Duration: 120,
        Session_Type: "Workshop",
        Status: "Scheduled",
        Host_Id: "LECT_001",
        Max_Participants: 50,
      },
      {
        Course_Id: "COURSE_001",
        Title: "Q&A Session - Mid-Term Preparation",
        Recording_Url: "https://example.com/recordings/qa_session_001.mp4",
        Scheduled_At: new Date("2025-11-20T16:00:00"),
        Duration: 90,
        Session_Type: "Q&A",
        Status: "Completed",
        Host_Id: "LECT_001",
        Attendees: ["STU_001", "STU_002", "STU_003"],
      },
    ]);
    console.log(`✅ Created ${sessions.length} sessions`);

    console.log("\n✅ ✅ ✅ Successfully seeded all tables! ✅ ✅ ✅\n");
    console.log("📊 Summary:");
    console.log(`   - Assignments: ${assignments.length}`);
    console.log(`   - Exams: ${exams.length}`);
    console.log(`   - Enrollments: ${enrollments.length}`);
    console.log(`   - Submissions: ${submissions.length}`);
    console.log(`   - Exam Attempts: ${examAttempts.length}`);
    console.log(`   - Progress Records: ${progressRecords.length}`);
    console.log(`   - Certificates: ${certificates.length}`);
    console.log(`   - Feedback: ${feedbacks.length}`);
    console.log(`   - Earnings: ${earnings.length}`);
    console.log(`   - Sessions: ${sessions.length}`);
    console.log(
      "\n🎉 All collections should now be visible in MongoDB Atlas!\n"
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  }
}
