const mongoose = require('mongoose');

const tblCourseTopicsSchema = new mongoose.Schema({
  Topic_Id: {
    type: Number,
    required: true,
    unique: true
  },
  Course_Id: {
    type: Number,
    required: true,
    ref: 'Tbl_Courses'
  },
  Title: {
    type: String,
    required: true,
    trim: true
  },
  Description: {
    type: String,
    trim: true,
    default: ''
  },
  Order_Number: {
    type: Number,
    required: true
  },
  Estimated_Hours: {
    type: Number,
    default: null
  }
}, {
  collection: 'tbl_coursetopics',
  timestamps: false
});

// Index for faster queries
tblCourseTopicsSchema.index({ Course_Id: 1, Order_Number: 1 });

module.exports = mongoose.model('Tbl_CourseTopics', tblCourseTopicsSchema);
