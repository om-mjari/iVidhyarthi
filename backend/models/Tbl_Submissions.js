const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  Submission_Id: {
    type: String,
    required: true,
    unique: true,
    default: () => `SUB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  Assignment_Id: {
    type: String,
    required: true,
    ref: 'Tbl_Assignments'
  },
  Student_Id: {
    type: String,
    required: true,
    ref: 'Tbl_Students'
  },
  File_Url: {
    type: String,
    required: false,
    default: null
  },
  Submitted_On: {
    type: Date,
    default: Date.now
  },
  Grade: {
    type: Number,
    default: null,
    min: 0
  },
  Feedback: {
    type: String,
    default: ''
  },
  Status: {
    type: String,
    enum: ['Submitted', 'Graded', 'Late', 'Resubmitted', 'Pending'],
    default: 'Submitted'
  },
  Graded_On: {
    type: Date,
    default: null
  },
  Graded_By: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  collection: 'Tbl_Submissions'
});

// Indexes
submissionSchema.index({ Assignment_Id: 1, Student_Id: 1 });
submissionSchema.index({ Submission_Id: 1 }, { unique: true });
submissionSchema.index({ Student_Id: 1 });
submissionSchema.index({ Status: 1 });

module.exports = mongoose.model('Tbl_Submissions', submissionSchema);
