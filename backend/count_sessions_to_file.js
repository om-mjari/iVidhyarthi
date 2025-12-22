const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function countSessions() {
    try {
        if (!process.env.MONGODB_URI) {
            fs.writeFileSync(path.join(__dirname, 'count_output.txt'), 'Error: MONGODB_URI not found in env');
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGODB_URI);
        const Tbl_Sessions = require('./models/Tbl_Sessions');
        const count = await Tbl_Sessions.countDocuments();
        fs.writeFileSync(path.join(__dirname, 'count_output.txt'), count.toString());
        process.exit(0);
    } catch (err) {
        fs.writeFileSync(path.join(__dirname, 'count_output.txt'), 'Error: ' + err.message);
        process.exit(1);
    }
}

countSessions();
