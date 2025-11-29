const mongoose = require('mongoose');
require('dotenv').config();
const Enrollment = require('./models/Tbl_Enrollments');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    const enrollments = await Enrollment.find({});
    console.log('Enrollments:', enrollments);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
