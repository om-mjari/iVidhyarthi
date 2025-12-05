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
    
    console.log(`📚 Courses: ${lecturerCourses.length}`);
    console.log(`📊 Total Enrollments: ${enrollments.length}\n`);
    
    const now = new Date();
    
    // ===== 1. ENROLLMENT LINE CHART (This Week + This Month) =====
    const lineChartLabels = ['This Week', 'This Month'];
    const lineChartData = [0, 0];
    
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    enrollments.forEach(enrollment => {
      const enrollDate = enrollment.Enrollment_Date ? new Date(enrollment.Enrollment_Date) : now;
      if (enrollDate >= oneWeekAgo) {
        lineChartData[0]++; // This Week
      }
      if (enrollDate >= oneMonthAgo) {
        lineChartData[1]++; // This Month
      }
    });
    
    // If no dates, count all as current period
    if (lineChartData.every(d => d === 0) && enrollments.length > 0) {
      lineChartData[0] = enrollments.length;
      lineChartData[1] = enrollments.length;
    }
    
    // ===== 2. ENROLLMENT BAR CHART (Last 4 Weeks + Last 6 Months) =====
    const barChartLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const barChartData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    
    // Last 4 weeks
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
    enrollments.forEach(enrollment => {
      const enrollDate = enrollment.Enrollment_Date ? new Date(enrollment.Enrollment_Date) : now;
      if (enrollDate >= fourWeeksAgo) {
        const weeksDiff = Math.floor((now - enrollDate) / (7 * 24 * 60 * 60 * 1000));
        const weekIndex = 3 - Math.min(weeksDiff, 3);
        if (weekIndex >= 0 && weekIndex < 4) {
          barChartData[weekIndex]++;
        }
      }
    });
    
    // Last 6 months
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    
    enrollments.forEach(enrollment => {
      const enrollDate = enrollment.Enrollment_Date ? new Date(enrollment.Enrollment_Date) : now;
      if (enrollDate >= sixMonthsAgo) {
        const monthsDiff = (now.getFullYear() - enrollDate.getFullYear()) * 12 + 
                          (now.getMonth() - enrollDate.getMonth());
        const monthIndex = 5 - Math.min(monthsDiff, 5);
        if (monthIndex >= 0 && monthIndex < 6) {
          barChartData[4 + monthIndex]++;
        }
      }
    });
    
    // If no dates, put all in current week and month
    if (barChartData.every(d => d === 0) && enrollments.length > 0) {
      barChartData[3] = enrollments.length; // Week 4
      barChartData[9] = enrollments.length; // December
    }
    
    // ===== 3. COURSE LINE CHART (Enrollment count per course) =====
    const courseLineLabels = [];
    const courseLineData = [];
    
    for (const course of lecturerCourses) {
      const count = enrollments.filter(e => 
        e.Course_Id == course.Course_Id || e.Course_Id === course.Course_Id.toString()
      ).length;
      
      courseLineLabels.push(course.Title);
      courseLineData.push(count);
    }
    
    // ===== 4. COURSE BAR CHART (Same data, bar format) =====
    const courseBarLabels = courseLineLabels;
    const courseBarData = courseLineData;
    
    // ===== FINAL OUTPUT =====
    const chartData = {
      enrollmentLineChart: {
        labels: lineChartLabels,
        data: lineChartData
      },
      enrollmentBarChart: {
        labels: barChartLabels,
        data: barChartData
      },
      courseLineChart: {
        labels: courseLineLabels,
        data: courseLineData
      },
      courseBarChart: {
        labels: courseBarLabels,
        data: courseBarData
      }
    };
    
    console.log('📈 CHART-READY DATA:\n');
    console.log(JSON.stringify(chartData, null, 2));
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
