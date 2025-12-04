const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');
    
    const allUsers = await User.find({}, 'email name role').lean();
    console.log(`📋 Total users: ${allUsers.length}\n`);
    
    console.log('All users:');
    allUsers.forEach(u => {
      console.log(`   - ${u.email} | Name: ${u.name || 'N/A'} | Role: ${u.role || 'N/A'}`);
    });
    
    // Search for specific emails
    const searchEmails = ['22bmit112@gmail.com', '22bmiit112@gmail.com', '22bmiit046@gmail.com'];
    console.log('\n🔍 Searching for specific emails:');
    for (const email of searchEmails) {
      const user = await User.findOne({ email });
      if (user) {
        console.log(`   ✅ ${email} - EXISTS (Role: ${user.role})`);
      } else {
        console.log(`   ❌ ${email} - NOT FOUND`);
      }
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
