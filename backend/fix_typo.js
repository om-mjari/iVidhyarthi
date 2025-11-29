const mongoose = require('mongoose');
require('dotenv').config();
const Course = require('./models/Tbl_Courses');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    const res = await Course.updateOne(
      { Title: 'Basic Python Prograaming' },
      { $set: { Title: 'Basic Python Programming' } }
    );
    console.log('Update result:', res);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
