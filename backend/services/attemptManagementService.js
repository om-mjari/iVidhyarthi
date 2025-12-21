const Tbl_QuizAttempts = require('../models/Tbl_QuizAttempts');
const Tbl_Quiz = require('../models/Tbl_Quiz');
const Tbl_Courses = require('../models/Tbl_Courses');

class AttemptManagementService {
  constructor() {
    this.maxAttempts = 5;
    this.blockDurationDays = 30;
    this.passingPercentage = 70;
  }

  async checkAttemptEligibility(studentId, courseId, quizId) {
    const attempts = await this.getStudentAttempts(studentId, quizId);
    
    const eligibility = {
      canAttempt: false,
      remainingAttempts: 0,
      totalAttempts: attempts.length,
      isBlocked: false,
      blockReason: null,
      blockExpiresAt: null,
      isPassed: false,
      bestScore: 0
    };

    // Check if student has already passed
    const passedAttempt = attempts.find(a => a.Percentage >= this.passingPercentage);
    if (passedAttempt) {
      eligibility.isPassed = true;
      eligibility.bestScore = passedAttempt.Percentage;
      eligibility.blockReason = 'Already passed the quiz';
      return eligibility;
    }

    // Check if student has exceeded maximum attempts
    if (attempts.length >= this.maxAttempts) {
      const lastAttempt = attempts[0];
      const blockExpiry = new Date(lastAttempt.Submitted_At);
      blockExpiry.setDate(blockExpiry.getDate() + this.blockDurationDays);

      if (new Date() < blockExpiry) {
        eligibility.isBlocked = true;
        eligibility.blockReason = `Maximum attempts (${this.maxAttempts}) reached`;
        eligibility.blockExpiresAt = blockExpiry;
        return eligibility;
      }

      eligibility.isBlocked = true;
      eligibility.blockReason = 'Permanently blocked after 5 failed attempts';
      return eligibility;
    }

    // Check course status - only allow quiz attempts if course is completed
    if (courseId) {
      const course = await Tbl_Courses.findOne({ Course_Id: parseInt(courseId) });
      if (course && course.status !== 'Completed') {
        eligibility.canAttempt = false;
        eligibility.blockReason = 'This course is not yet ready for quizzes. Please wait for the instructor to finalize the course.';
        return eligibility;
      }
    }

    eligibility.canAttempt = true;
    eligibility.remainingAttempts = this.maxAttempts - attempts.length;
    eligibility.bestScore = attempts.length > 0 ? Math.max(...attempts.map(a => a.Percentage)) : 0;

    return eligibility;
  }

  async getStudentAttempts(studentId, quizId) {
    return await Tbl_QuizAttempts.find({
      Student_Id: studentId,
      Quiz_Id: quizId,
      Status: 'Completed'
    })
      .sort({ Submitted_At: -1 })
      .lean();
  }

  async recordAttempt(studentId, courseId, quizId, answers) {
    const eligibility = await this.checkAttemptEligibility(studentId, courseId, quizId);
    
    if (!eligibility.canAttempt) {
      throw new Error(eligibility.blockReason || 'Cannot attempt quiz');
    }

    const quiz = await Tbl_Quiz.findOne({ Quiz_Id: quizId });
    if (!quiz) {
      throw new Error('Quiz not found');
    }

    const { score, totalMarks, percentage } = this.evaluateAnswers(answers, quiz.Questions);

    const attempt = new Tbl_QuizAttempts({
      Quiz_Id: quizId,
      Student_Id: studentId,
      Course_Id: courseId,
      Week_Number: quiz.Week_Number || 0,
      Answers: answers,
      Score: score,
      Total_Marks: totalMarks,
      Percentage: percentage,
      Status: 'Completed',
      Submitted_At: new Date(),
      Time_Spent: 0
    });

    await attempt.save();

    const isPassed = percentage >= this.passingPercentage;
    const newEligibility = await this.checkAttemptEligibility(studentId, courseId, quizId);

    return {
      attemptId: attempt.Attempt_Id,
      score,
      totalMarks,
      percentage,
      isPassed,
      remainingAttempts: newEligibility.remainingAttempts,
      isBlocked: newEligibility.isBlocked,
      blockReason: newEligibility.blockReason,
      blockExpiresAt: newEligibility.blockExpiresAt
    };
  }

  evaluateAnswers(studentAnswers, questions) {
    let score = 0;
    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

    questions.forEach((question) => {
      const studentAnswer = studentAnswers[question.question_id];
      if (studentAnswer !== undefined && studentAnswer === question.correct_answer) {
        score += question.marks;
      }
    });

    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;

    return { score, totalMarks, percentage };
  }

  async getAttemptHistory(studentId, quizId) {
    const attempts = await Tbl_QuizAttempts.find({
      Student_Id: studentId,
      Quiz_Id: quizId
    })
      .sort({ Submitted_At: -1 })
      .lean();

    const eligibility = await this.checkAttemptEligibility(studentId, null, quizId);

    return {
      attempts: attempts.map(a => ({
        attemptId: a.Attempt_Id,
        score: a.Score,
        totalMarks: a.Total_Marks,
        percentage: a.Percentage,
        submittedAt: a.Submitted_At,
        isPassed: a.Percentage >= this.passingPercentage
      })),
      eligibility
    };
  }

  async getBlockStatus(studentId, quizId) {
    const eligibility = await this.checkAttemptEligibility(studentId, null, quizId);
    
    return {
      isBlocked: eligibility.isBlocked,
      blockReason: eligibility.blockReason,
      blockExpiresAt: eligibility.blockExpiresAt,
      canAttempt: eligibility.canAttempt,
      remainingAttempts: eligibility.remainingAttempts,
      totalAttempts: eligibility.totalAttempts
    };
  }

  async resetBlockForStudent(studentId, quizId) {
    const attempts = await this.getStudentAttempts(studentId, quizId);
    
    if (attempts.length >= this.maxAttempts) {
      const lastAttempt = attempts[0];
      const blockExpiry = new Date(lastAttempt.Submitted_At);
      blockExpiry.setDate(blockExpiry.getDate() + this.blockDurationDays);

      if (new Date() >= blockExpiry) {
        await Tbl_QuizAttempts.deleteMany({
          Student_Id: studentId,
          Quiz_Id: quizId
        });
        return { success: true, message: 'Block reset after 30-day period' };
      }
    }

    return { success: false, message: 'No eligible block to reset' };
  }
}

module.exports = new AttemptManagementService();
