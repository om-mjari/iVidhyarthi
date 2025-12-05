const mongoose = require("mongoose");
require("dotenv").config();
const Tbl_Sessions = require("./models/Tbl_Sessions");

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
    const sessions = await Tbl_Sessions.find({}).sort({ Scheduled_At: -1 });
    
    console.log("\n=== ALL SESSIONS ===\n");
    sessions.forEach((session, index) => {
      console.log(`${index + 1}. Session ID: ${session.Session_Id}`);
      console.log(`   Title: ${session.Title}`);
      console.log(`   Course ID: ${session.Course_Id}`);
      console.log(`   Status: ${session.Status}`);
      console.log(`   Scheduled: ${session.Scheduled_At}`);
      console.log(`   Duration: ${session.Duration} minutes`);
      console.log(`   Session URL: ${session.Session_Url ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    console.log(`\nTotal Sessions: ${sessions.length}`);
    console.log(`Scheduled: ${sessions.filter(s => s.Status === 'Scheduled').length}`);
    console.log(`Ongoing: ${sessions.filter(s => s.Status === 'Ongoing').length}`);
    console.log(`Completed: ${sessions.filter(s => s.Status === 'Completed').length}`);
    
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
