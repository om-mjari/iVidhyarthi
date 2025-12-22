const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config({ path: './backend/.env' });

async function run() {
    try {
        console.log('Connecting to URI:', process.env.MONGODB_URI?.substring(0, 20) + '...');
        await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
        const Session = mongoose.model('Tbl_Sessions', new mongoose.Schema({}, { strict: false, collection: 'Tbl_Sessions' }));
        const count = await Session.countDocuments();
        fs.writeFileSync('count_result.txt', 'TOTAL_SESSIONS: ' + count);
        console.log('Count:', count);
        process.exit(0);
    } catch (err) {
        fs.writeFileSync('count_result.txt', 'ERROR: ' + err.message);
        console.error(err);
        process.exit(1);
    }
}
run();
