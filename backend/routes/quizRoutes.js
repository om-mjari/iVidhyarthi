const express = require("express");
const router = express.Router();
const Quiz = require("../models/Tbl_Quiz");
const QuizAttempt = require("../models/Tbl_QuizAttempts");

// Generate and create quiz with AI-generated questions
router.post("/generate", async (req, res) => {
  try {
    const { Course_Id, Week_Number, Title, Topic, Time_Limit, Total_Marks } =
      req.body;

    if (!Course_Id || !Week_Number || !Topic) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: Course_Id, Week_Number, Topic",
      });
    }

    console.log("🎯 Generating AI Quiz:", { Course_Id, Week_Number, Topic });

    // Generate AI questions (placeholder - will be replaced with actual AI)
    const aiQuestions = generateAIQuestions(Topic, 10);

    const quiz = new Quiz({
      Course_Id,
      Week_Number,
      Title: Title || `Week ${Week_Number} Quiz`,
      Topic,
      Time_Limit: Time_Limit || 30,
      Total_Marks: Total_Marks || 50,
      Total_Questions: 10,
      Questions: aiQuestions,
      Status: "Active",
      AI_Generated: true,
    });

    await quiz.save();

    console.log("✅ Quiz created successfully:", quiz.Quiz_Id);

    res.json({
      success: true,
      message: "Quiz generated successfully",
      data: quiz,
    });
  } catch (error) {
    console.error("❌ Error generating quiz:", error);
    res.status(500).json({
      success: false,
      message: "Error generating quiz",
      error: error.message,
    });
  }
});

// Get quiz by course and week
router.get("/course/:courseId/week/:weekNumber", async (req, res) => {
  try {
    const quiz = await Quiz.findOne({
      Course_Id: req.params.courseId,
      Week_Number: parseInt(req.params.weekNumber),
      Status: "Active",
    });

    if (!quiz) {
      return res.json({
        success: false,
        message: "Quiz not found",
        data: null,
      });
    }

    res.json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching quiz",
      error: error.message,
    });
  }
});

// Get quiz by ID
router.get("/:quizId", async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ Quiz_Id: req.params.quizId });

    res.json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching quiz",
      error: error.message,
    });
  }
});

// Submit quiz attempt
router.post("/attempt", async (req, res) => {
  try {
    const { Quiz_Id, Student_Id, Course_Id, Week_Number, Answers, Time_Spent } =
      req.body;

    if (!Quiz_Id || !Student_Id) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: Quiz_Id, Student_Id",
      });
    }

    // Get the quiz to calculate score
    const quiz = await Quiz.findOne({ Quiz_Id });
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // Calculate score
    let score = 0;
    quiz.Questions.forEach((question) => {
      const studentAnswer = Answers[question.question_id];
      if (studentAnswer === question.correct_answer) {
        score += question.marks;
      }
    });

    const percentage = Math.round((score / quiz.Total_Marks) * 100);

    const attempt = new QuizAttempt({
      Quiz_Id,
      Student_Id,
      Course_Id,
      Week_Number,
      Answers,
      Score: score,
      Total_Marks: quiz.Total_Marks,
      Percentage: percentage,
      Time_Spent,
      Status: "Completed",
      Submitted_At: new Date(),
      Feedback: `You scored ${score}/${quiz.Total_Marks} (${percentage}%)`,
    });

    await attempt.save();

    console.log("✅ Quiz attempt submitted:", attempt.Attempt_Id);

    res.json({
      success: true,
      message: "Quiz submitted successfully",
      data: {
        attempt,
        score,
        percentage,
        totalMarks: quiz.Total_Marks,
      },
    });
  } catch (error) {
    console.error("❌ Error submitting quiz:", error);
    res.status(500).json({
      success: false,
      message: "Error submitting quiz",
      error: error.message,
    });
  }
});

// Get student's quiz attempts
router.get("/attempts/student/:studentId", async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({
      Student_Id: req.params.studentId,
    }).sort({ Submitted_At: -1 });

    res.json({
      success: true,
      data: attempts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching attempts",
      error: error.message,
    });
  }
});

// Helper function to generate AI questions (placeholder)
function generateAIQuestions(topic, count) {
  const questions = [];

  for (let i = 1; i <= count; i++) {
    questions.push({
      question_id: i,
      question: `AI-Generated Question ${i} about ${topic}?`,
      options: [
        `Option A for ${topic}`,
        `Option B for ${topic}`,
        `Option C for ${topic}`,
        `Option D for ${topic}`,
      ],
      correct_answer: Math.floor(Math.random() * 4),
      marks: 5,
      difficulty: i <= 3 ? "Easy" : i <= 7 ? "Medium" : "Hard",
      explanation: `This is an AI-generated explanation for question ${i} about ${topic}.`,
    });
  }

  return questions;
}

module.exports = router;
