const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config({ path: './backend/.env' });

async function debug() {
    await mongoose.connect(process.env.MONGODB_URI);
    const Session = require('./backend/models/Tbl_Sessions');
    const session = await Session.findOne({ Title: /working/i });
    if (session) {
        const now = new Date();
        const schedDate = new Date(session.Scheduled_At);
        const durationMins = parseInt(session.Duration) || 60;
        const durationMs = durationMins * 60000;
        const sessionEnd = new Date(schedDate.getTime() + durationMs);
        const bufferTime = 30 * 60 * 1000;
        const expiryTime = new Date(sessionEnd.getTime() + (4 * 60 * 60 * 1000));

        const result = {
            title: session.Title,
            db_status: session.Status,
            scheduled_at: session.Scheduled_At,
            now: now,
            sessionEnd: sessionEnd,
            expiryTime: expiryTime,
            isExpired: now > expiryTime
        };
        fs.writeFileSync('debug_session.json', JSON.stringify(result, null, 2));
    } else {
        fs.writeFileSync('debug_session.json', 'Session not found');
    }
    process.exit();
}
debug();
