const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  Course_Id: {
    type: Number,
    required: true
  },
  Title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true
  },
  Description: {
    type: String,
    trim: true
  },
  Category_Id: {
    type: Number,
    required: [true, 'Category ID is required'],
    ref: 'Tbl_CourseCategories'
  },
  Price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  Lecturer_Id: {
    type: String,
    required: [true, 'Lecturer ID is required'],
    ref: 'Tbl_Lecturers'
  },
  Created_At: {
    type: Date,
    default: Date.now
  },
  Duration: {
    type: String,
    trim: true
  },
  image_url: {
    type: String,
    trim: true
  },
  Is_Active: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  collection: 'tbl_courses',
  timestamps: false
});

// Auto-increment Course_Id
courseSchema.pre('save', async function(next) {
  if (this.isNew && !this.Course_Id) {
    const count = await mongoose.model('Tbl_Courses').countDocuments();
    this.Course_Id = count + 1;
  }
  next();
});

const Tbl_Courses = mongoose.model('Tbl_Courses', courseSchema);

module.exports = Tbl_Courses;