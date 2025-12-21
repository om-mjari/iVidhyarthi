const express = require('express');
const router = express.Router();
const autoQuizOrchestrator = require('../services/autoQuizOrchestrator');
const attemptManagementService = require('../services/attemptManagementService');
const certificateService = require('../services/certificateService');
const Tbl_Enrollments = require('../models/Tbl_Enrollments');
const Tbl_ProgressTracking = require('../models/Tbl_ProgressTracking');
const Tbl_Courses = require('../models/Tbl_Courses');

router.post('/generate', async (req, res) => {
  try {
    const { courseId, studentId } = req.body;

    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required' });
    }

    const result = await autoQuizOrchestrator.generateQuizForCourse(courseId);
    res.status(200).json(result);

  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate quiz', 
      message: error.message 
    });
  }
});

router.get('/check-eligibility', async (req, res) => {
  try {
    const { studentId, courseId } = req.query;

    if (!studentId || !courseId) {
      return res.status(400).json({ error: 'Student ID and Course ID are required' });
    }

    const quiz = await autoQuizOrchestrator.getQuizForCourse(courseId);
    if (!quiz) {
      return res.status(200).json({
        quizExists: false,
        canAttempt: false,
        message: 'Quiz not generated yet'
      });
    }

    const eligibility = await attemptManagementService.checkAttemptEligibility(
      studentId,
      courseId,
      quiz.Quiz_Id
    );

    res.status(200).json({
      quizExists: true,
      quizId: quiz.Quiz_Id,
      ...eligibility
    });

  } catch (error) {
    console.error('Eligibility check error:', error);
    res.status(500).json({ 
      error: 'Failed to check eligibility', 
      message: error.message 
    });
  }
});

router.get('/check-progress', async (req, res) => {
  try {
    const { studentId, courseId } = req.query;

    if (!studentId || !courseId) {
      return res.status(400).json({ error: 'Student ID and Course ID are required' });
    }

    const enrollment = await Tbl_Enrollments.findOne({
      Student_Id: studentId,
      Course_Id: parseInt(courseId)
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    // Check course status
    const course = await Tbl_Courses.findOne({ Course_Id: parseInt(courseId) });
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const progress = enrollment.Progress_Percentage || 0;
    const isCourseCompleted = course.status === 'Completed'; // Assuming we add a 'Completed' status
    const canAttemptQuiz = progress >= 100 && isCourseCompleted;

    res.status(200).json({
      progress,
      isCourseCompleted,
      canAttemptQuiz,
      message: canAttemptQuiz 
        ? 'You can now attempt the quiz' 
        : isCourseCompleted 
          ? `Complete ${100 - progress}% more to unlock the quiz`
          : 'This course is not yet ready for quizzes. Please wait for the instructor to finalize the course.'
    });

  } catch (error) {
    console.error('Progress check error:', error);
    res.status(500).json({ 
      error: 'Failed to check progress', 
      message: error.message 
    });
  }
});

router.post('/attempt', async (req, res) => {
  try {
    const { studentId, courseId, quizId, answers } = req.body;

    if (!studentId || !courseId || !quizId || !answers) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await attemptManagementService.recordAttempt(
      studentId,
      courseId,
      quizId,
      answers
    );

    if (result.isPassed) {
      const certificate = await certificateService.generateAndIssueCertificate(
        studentId,
        courseId,
        result.percentage
      );

      result.certificate = {
        certificateId: certificate.Certificate_Id,
        certificateUrl: certificate.Certificate_Url,
        grade: certificate.Grade
      };
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Quiz attempt error:', error);
    res.status(500).json({ 
      error: 'Failed to submit quiz', 
      message: error.message 
    });
  }
});

router.get('/history', async (req, res) => {
  try {
    const { studentId, quizId } = req.query;

    if (!studentId || !quizId) {
      return res.status(400).json({ error: 'Student ID and Quiz ID are required' });
    }

    const history = await attemptManagementService.getAttemptHistory(studentId, quizId);
    res.status(200).json(history);

  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch attempt history', 
      message: error.message 
    });
  }
});

router.get('/quiz/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const quiz = await autoQuizOrchestrator.getQuizForCourse(courseId);

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found for this course' });
    }

    res.status(200).json(quiz);

  } catch (error) {
    console.error('Quiz fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch quiz', 
      message: error.message 
    });
  }
});

router.get('/certificate/:studentId/:courseId', async (req, res) => {
  try {
    const { studentId, courseId } = req.params;
    const certificate = await certificateService.getCertificate(studentId, courseId);

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    res.status(200).json(certificate);

  } catch (error) {
    console.error('Certificate fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch certificate', 
      message: error.message 
    });
  }
});

router.post('/regenerate-quiz', async (req, res) => {
  try {
    const { courseId, adminKey } = req.body;

    if (adminKey !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await autoQuizOrchestrator.generateQuizForCourse(courseId);
    res.status(200).json(result);

  } catch (error) {
    console.error('Quiz regeneration error:', error);
    res.status(500).json({ 
      error: 'Failed to regenerate quiz', 
      message: error.message 
    });
  }
});

module.exports = router;
