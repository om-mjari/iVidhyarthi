const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Student = require('./models/Tbl_Students');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    const email = 'omjariwala367@gmail.com';
    
    const user = await User.findOne({ email });
    console.log('User:', user);
    
    if (user) {
      const student = await Student.findOne({ User_Id: user._id });
      console.log('Student Record:', student);
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
