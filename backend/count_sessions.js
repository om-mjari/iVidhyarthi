const mongoose = require('mongoose');
require('dotenv').config();

async function countSessions() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const Tbl_Sessions = require('./models/Tbl_Sessions');
        const count = await Tbl_Sessions.countDocuments();
        console.log(`\nTOTAL_SESSIONS_COUNT: ${count}\n`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

countSessions();
