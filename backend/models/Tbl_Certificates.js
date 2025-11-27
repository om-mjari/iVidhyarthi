const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  Certificate_Id: {
    type: String,
    required: true,
    unique: true,
    default: () => `CERT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  Course_Id: {
    type: String,
    required: true,
    ref: 'Tbl_Courses'
  },
  Student_Id: {
    type: String,
    required: true,
    ref: 'Tbl_Students'
  },
  Issue_Date: {
    type: Date,
    default: Date.now
  },
  Certificate_Url: {
    type: String,
    required: false,
    default: null
  },
  Certificate_Number: {
    type: String,
    unique: true,
    default: () => `CERT-${Date.now()}-${Math.floor(Math.random() * 10000)}`
  },
  Grade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'Pass', 'Fail'],
    default: 'Pass'
  },
  Percentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  Status: {
    type: String,
    enum: ['Active', 'Revoked', 'Expired'],
    default: 'Active'
  }
}, {
  timestamps: true,
  collection: 'Tbl_Certificates'
});

// Indexes
certificateSchema.index({ Course_Id: 1, Student_Id: 1 });
certificateSchema.index({ Certificate_Id: 1 }, { unique: true });
certificateSchema.index({ Certificate_Number: 1 }, { unique: true });
certificateSchema.index({ Student_Id: 1 });

module.exports = mongoose.model('Tbl_Certificates', certificateSchema);
