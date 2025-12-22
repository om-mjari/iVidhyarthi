const mongoose = require('mongoose');
require('dotenv').config();

async function checkData() {
    await mongoose.connect(process.env.MONGODB_URI);
    const Courses = require('./models/Tbl_Courses');
    const Lecturers = require('./models/Tbl_Lecturers');
    const Users = require('./models/User');

    const courses = await Courses.find().limit(5).lean();
    console.log('Courses Sample:', JSON.stringify(courses, null, 2));

    for (const course of courses) {
        console.log(`Checking lecturer for course: ${course.Title} (Lecturer_Id: ${course.Lecturer_Id})`);

        // Check if Lecturer_Id looks like an email
        if (course.Lecturer_Id && course.Lecturer_Id.includes('@')) {
            const user = await Users.findOne({ email: course.Lecturer_Id.toLowerCase() });
            console.log('  User by email:', user ? user.name : 'Not found');
            if (user) {
                const lecturer = await Lecturers.findOne({ User_Id: user._id });
                console.log('  Lecturer by user ID:', lecturer ? lecturer.Full_Name : 'Not found');
            }
        } else if (course.Lecturer_Id) {
            // Try as ObjectId
            try {
                const lecturer = await Lecturers.findById(course.Lecturer_Id);
                console.log('  Lecturer by ID:', lecturer ? lecturer.Full_Name : 'Not found');
            } catch (e) {
                console.log('  Not a valid ObjectId');
            }
        }
    }

    process.exit();
}

checkData().catch(console.error);
