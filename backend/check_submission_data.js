const mongoose = require(\"mongoose\");
require(\"dotenv\").config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Submission = require(\"./models/Tbl_Submissions\");
  const sub = await Submission.findOne().lean();
  console.log(\"Sample Submission:\", JSON.stringify(sub, null, 2));
  process.exit();
});
