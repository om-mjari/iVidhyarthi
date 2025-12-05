const mongoose = require('mongoose');
const Tbl_Feedback = require('./models/Tbl_Feedback');
const Tbl_Courses = require('./models/Tbl_Courses');
const Tbl_Students = require('./models/Tbl_Students');
const Tbl_Enrollments = require('./models/Tbl_Enrollments');
const User = require('./models/User');
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
    console.log(`📚 Lecturer Courses: ${lecturerCourses.length}\n`);
    
    // ===== 1. FETCH FEEDBACK DATA =====
    console.log('📝 Fetching Feedback...');
    
    const feedbackRecords = await Tbl_Feedback.find({
      Course_Id: { $in: courseIds.map(id => id.toString()) }
    }).sort({ Created_At: -1 }).lean();
    
    const feedbackList = await Promise.all(
      feedbackRecords.map(async (feedback) => {
        // Parse Course_Id if string
        const courseId = typeof feedback.Course_Id === 'string' && !isNaN(feedback.Course_Id)
          ? parseInt(feedback.Course_Id)
          : feedback.Course_Id;
        
        const course = await Tbl_Courses.findOne({ Course_Id: courseId });
        
        // Get student info
        const student = await Tbl_Students.findOne({ Student_Id: feedback.Student_Id });
        const user = await User.findById(feedback.Student_Id);
        
        return {
          id: feedback.Feedback_Id,
          studentName: student?.Full_Name || user?.name || user?.email || 'Unknown Student',
          courseName: course?.Title || 'Unknown Course',
          rating: feedback.Rating || 0,
          comment: feedback.Comments || feedback.Comment || '',
          date: feedback.Created_At || feedback.Feedback_Date || new Date()
        };
      })
    );
    
    console.log(`  Found ${feedbackList.length} feedback records\n`);
    
    // ===== 2. FETCH EARNINGS DATA =====
    console.log('💰 Fetching Earnings...');
    
    let earningsTable = [];
    let monthlyEarnings = {};
    
    try {
      // Fetch from Tbl_Earnings collection
      const Tbl_Earnings = mongoose.model('Tbl_Earnings', new mongoose.Schema({}, { strict: false, collection: 'Tbl_Earnings' }));
      
      const earnings = await Tbl_Earnings.find({}).sort({ createdAt: -1 }).lean();
      
      // Filter earnings for lecturer's courses
      const relevantEarnings = earnings.filter(earning => {
        const courseId = typeof earning.Course_Id === 'string' && !isNaN(earning.Course_Id)
          ? parseInt(earning.Course_Id)
          : earning.Course_Id;
        return courseIds.includes(courseId);
      });
      
      earningsTable = await Promise.all(
        relevantEarnings.map(async (earning) => {
          const courseId = typeof earning.Course_Id === 'string' && !isNaN(earning.Course_Id)
            ? parseInt(earning.Course_Id)
            : earning.Course_Id;
          
          const course = await Tbl_Courses.findOne({ Course_Id: courseId });
          
          return {
            id: earning.Earning_Id || earning._id,
            date: earning.Earning_Date || earning.createdAt || new Date(),
            amount: earning.Amount || 0,
            status: earning.Status || 'Paid',
            course: course?.Title || 'Unknown Course'
          };
        })
      );
      
      // Group by month for chart
      relevantEarnings.forEach(earning => {
        const date = new Date(earning.Earning_Date || earning.createdAt || new Date());
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyEarnings[monthKey] = (monthlyEarnings[monthKey] || 0) + (earning.Amount || 0);
      });
      
      console.log(`  Found ${earningsTable.length} earnings records\n`);
      
    } catch (err) {
      console.log(`  No earnings data found: ${err.message}\n`);
    }
    
    // ===== 3. MONTHLY EARNINGS CHART =====
    const now = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyEarningsLabels = [];
    const monthlyEarningsData = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      
      monthlyEarningsLabels.push(monthNames[monthDate.getMonth()]);
      monthlyEarningsData.push(monthlyEarnings[monthKey] || 0);
    }
    
    // ===== 4. ENROLLMENTS THIS MONTH CHART =====
    console.log('📊 Calculating Enrollments This Month...');
    
    const enrollments = await Tbl_Enrollments.find({
      Course_Id: { $in: courseIds.map(id => id.toString()) }
    }).lean();
    
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const weeklyEnrollments = [0, 0, 0, 0];
    
    enrollments.forEach(enrollment => {
      const enrollDate = enrollment.Enrollment_Date ? new Date(enrollment.Enrollment_Date) : now;
      
      if (enrollDate.getMonth() === currentMonth && enrollDate.getFullYear() === currentYear) {
        const dayOfMonth = enrollDate.getDate();
        let weekIndex;
        if (dayOfMonth <= 7) weekIndex = 0;
        else if (dayOfMonth <= 14) weekIndex = 1;
        else if (dayOfMonth <= 21) weekIndex = 2;
        else weekIndex = 3;
        
        weeklyEnrollments[weekIndex]++;
      }
    });
    
    // If no dates, assume current week
    if (weeklyEnrollments.every(w => w === 0) && enrollments.length > 0) {
      const currentWeek = Math.min(3, Math.floor((now.getDate() - 1) / 7));
      weeklyEnrollments[currentWeek] = enrollments.length;
    }
    
    console.log(`  Enrollments this month: ${weeklyEnrollments.reduce((a, b) => a + b, 0)}\n`);
    
    // ===== FINAL OUTPUT =====
    const dynamicData = {
      feedbackList: feedbackList,
      earningsTable: earningsTable,
      monthlyEarningsChart: {
        labels: monthlyEarningsLabels,
        data: monthlyEarningsData
      },
      enrollmentsThisMonthChart: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        data: weeklyEnrollments
      }
    };
    
    console.log('✅ DYNAMIC DATA OUTPUT:\n');
    console.log(JSON.stringify(dynamicData, null, 2));
    
    console.log('\n📊 Summary:');
    console.log(`  - Feedback records: ${feedbackList.length}`);
    console.log(`  - Earnings records: ${earningsTable.length}`);
    console.log(`  - Total earnings (last 6 months): ₹${monthlyEarningsData.reduce((a, b) => a + b, 0)}`);
    console.log(`  - Enrollments this month: ${weeklyEnrollments.reduce((a, b) => a + b, 0)}`);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
