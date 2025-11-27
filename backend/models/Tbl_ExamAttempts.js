const mongoose = require('mongoose');

const examAttemptSchema = new mongoose.Schema({
  Attempt_Id: {
    type: String,
    required: true,
    unique: true,
    default: () => `ATTEMPT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  Exam_Id: {
    type: String,
    required: true,
    ref: 'Tbl_Exams'
  },
  Student_Id: {
    type: String,
    required: true,
    ref: 'Tbl_Students'
  },
  Score: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  Attempt_Date: {
    type: Date,
    default: Date.now
  },
  Time_Taken: {
    type: Number, // in minutes
    default: 0
  },
  Status: {
    type: String,
    enum: ['Completed', 'In Progress', 'Submitted', 'Abandoned'],
    default: 'In Progress'
  },
  Answers: {
    type: mongoose.Schema.Types.Mixed, // Store exam answers as JSON
    default: {}
  },
  Percentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, {
  timestamps: true,
  collection: 'Tbl_ExamAttempts'
});

// Indexes
examAttemptSchema.index({ Exam_Id: 1, Student_Id: 1 });
examAttemptSchema.index({ Attempt_Id: 1 }, { unique: true });
examAttemptSchema.index({ Student_Id: 1 });
examAttemptSchema.index({ Attempt_Date: -1 });

module.exports = mongoose.model('Tbl_ExamAttempts', examAttemptSchema);
