const mongoose = require('mongoose');
const Tbl_Enrollments = require('./models/Tbl_Enrollments');
const Tbl_Courses = require('./models/Tbl_Courses');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');
    
    const lecturerEmail = '22bmiit112@gmail.com';
    
    // Get lecturer's courses
    const lecturerCourses = await Tbl_Courses.find({ 
      Lecturer_Id: lecturerEmail 
    }, 'Course_Id Title').lean();
    
    const courseIds = lecturerCourses.map(c => c.Course_Id);
    
    // Get all enrollments for these courses (handle string Course_Id)
    const enrollments = await Tbl_Enrollments.find({
      Course_Id: { $in: courseIds.map(id => id.toString()) }
    }).lean();
    
    console.log(`📚 Lecturer Courses: ${lecturerCourses.length}`);
    console.log(`📊 Total Enrollments: ${enrollments.length}\n`);
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // ===== 1. ENROLLMENTS THIS MONTH BAR CHART (Weekly breakdown) =====
    const weeksInMonth = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const weeklyData = [0, 0, 0, 0];
    
    // Calculate first day of current month
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    
    enrollments.forEach(enrollment => {
      const enrollDate = enrollment.Enrollment_Date ? new Date(enrollment.Enrollment_Date) : now;
      
      // Check if enrollment is in current month
      if (enrollDate.getMonth() === currentMonth && enrollDate.getFullYear() === currentYear) {
        // Determine which week of the month
        const dayOfMonth = enrollDate.getDate();
        let weekIndex;
        if (dayOfMonth <= 7) weekIndex = 0;
        else if (dayOfMonth <= 14) weekIndex = 1;
        else if (dayOfMonth <= 21) weekIndex = 2;
        else weekIndex = 3;
        
        weeklyData[weekIndex]++;
      }
    });
    
    // If no enrollment dates, assume all are in current week (Week 4 for December)
    if (weeklyData.every(w => w === 0) && enrollments.length > 0) {
      const currentWeek = Math.min(3, Math.floor((now.getDate() - 1) / 7));
      weeklyData[currentWeek] = enrollments.length;
    }
    
    // ===== 2. ENROLLMENTS BY COURSE LINE CHART =====
    const courseLabels = [];
    const courseData = [];
    
    for (const course of lecturerCourses) {
      const count = enrollments.filter(e => 
        e.Course_Id == course.Course_Id || e.Course_Id === course.Course_Id.toString()
      ).length;
      
      courseLabels.push(course.Title);
      courseData.push(count);
    }
    
    // ===== FINAL OUTPUT =====
    const chartData = {
      enrollmentsThisMonthBarChart: {
        labels: weeksInMonth,
        data: weeklyData
      },
      enrollmentsByCourseLineChart: {
        labels: courseLabels,
        data: courseData
      }
    };
    
    console.log('📈 OVERVIEW CHART DATA:\n');
    console.log(JSON.stringify(chartData, null, 2));
    
    console.log('\n📊 Summary:');
    console.log(`  - Total enrollments this month: ${weeklyData.reduce((a, b) => a + b, 0)}`);
    console.log(`  - Courses with enrollments: ${courseData.filter(c => c > 0).length}/${courseLabels.length}`);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
