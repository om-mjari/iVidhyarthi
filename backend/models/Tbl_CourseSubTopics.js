const mongoose = require('mongoose');

const tblCourseSubTopicsSchema = new mongoose.Schema({
  SubTopic_Id: {
    type: Number,
    required: true,
    unique: true
  },
  Topic_Id: {
    type: Number,
    required: true,
    ref: 'Tbl_CourseTopics'
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
    type: String,
    required: true
  }
}, {
  collection: 'tbl_coursesubtopics',
  timestamps: false
});

// Index for faster queries
tblCourseSubTopicsSchema.index({ Topic_Id: 1 });

module.exports = mongoose.model('Tbl_CourseSubTopics', tblCourseSubTopicsSchema);
