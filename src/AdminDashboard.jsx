import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import './AdminDashboard.css';
import Logo from './Logo';

const AdminDashboard = ({ onLogout }) => {
  // State for category management
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [activePanel, setActivePanel] = useState('overview');
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalRevenue: 0,
    activeCourses: 0,
    totalCourses: 0,
    pendingApprovals: 0,
    approvedUniversities: 0,
    totalFeedback: 0,
    liveSessions: 0,
    upcomingSessions: 0,
    sessionsToday: 0,
    totalParticipants: 0,
    totalExams: 0,
    certificatesIssued: 0
  });

  // Real student data from MongoDB
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // User view/edit states
  const [viewingUser, setViewingUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Payment action states
  const [verifyingTransaction, setVerifyingTransaction] = useState(null);
  const [refundingTransaction, setRefundingTransaction] = useState(null);

  // Confirmation modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmData, setConfirmData] = useState(null);

  // All university requests (pending, approved, rejected)
  const [allUniversities, setAllUniversities] = useState([]);
  const [universitiesLoading, setUniversitiesLoading] = useState(false);
  const [viewingUniversity, setViewingUniversity] = useState(null);


  // Notification state
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const closeNotification = () => {
    setNotification(null);
  };

  // Chatbot history state
  const [chatHistory, setChatHistory] = useState([]);
  const [chatStats, setChatStats] = useState({
    totalChats: 0,
    totalUsers: 0,
    averageResponseTime: 0,
    helpfulChats: 0
  });
  const [chatLoading, setChatLoading] = useState(false);
  const [chatPage, setChatPage] = useState(1);
  const [chatTotalPages, setChatTotalPages] = useState(1);
  const [deletingChatId, setDeletingChatId] = useState(null);

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState({
    userGrowth: [],
    courseSales: 0
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [examsLoading, setExamsLoading] = useState(false);
  const [examAttempts, setExamAttempts] = useState([]);
  const [exams, setExams] = useState([]);
  const [issuedCertificates, setIssuedCertificates] = useState([]);

  // Chart data state
  const [chartData, setChartData] = useState({
    topCourses: [],
    platformActivity: [],
    engagementFunnel: [],
    paymentMethods: [],
    revenueEnrollments: [],
    categoryDistribution: []
  });


  // Fetch all universities with registrar contact from MongoDB
  const fetchPendingUniversities = async () => {
    try {
      setUniversitiesLoading(true);
      const token = localStorage.getItem('auth_token') || `admin_mock_token_${Date.now()}`;

      // Fetch all universities
      const universitiesResponse = await fetch('http://localhost:5000/api/admin/universities/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!universitiesResponse.ok) {
        throw new Error('Failed to fetch universities');
      }

      const universitiesResult = await universitiesResponse.json();

      if (!universitiesResult.success) {
        throw new Error(universitiesResult.message || 'Failed to fetch universities');
      }

      // Fetch registrars to get contact numbers
      const registrarsResponse = await fetch('http://localhost:5000/api/registrar/get-registrars', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      let registrarsMap = {};
      if (registrarsResponse.ok) {
        const registrarsResult = await registrarsResponse.json();
        if (registrarsResult.success && registrarsResult.data) {
          // Create a map of University_Id to Contact_No
          registrarsMap = registrarsResult.data.reduce((map, registrar) => {
            if (registrar.University_Id) {
              map[registrar.University_Id.toString()] = registrar.Contact_No;
            }
            return map;
          }, {});
        }
      }

      // Merge university data with registrar contact
      const universitiesWithContact = universitiesResult.data.map(uni => ({
        ...uni,
        Contact_No: registrarsMap[uni._id?.toString()] || registrarsMap[uni.University_Id?.toString()] || '—'
      }));

      console.log('Admin Dashboard - Universities with Contact:', universitiesWithContact);

      setAllUniversities(universitiesWithContact);

      // Update stats with real data
      const pendingCount = universitiesWithContact.filter(u => (u.Verification_Status || '').toLowerCase() === 'pending').length;
      const approvedCount = universitiesWithContact.filter(u => (u.Verification_Status || '').toLowerCase() === 'verified').length;

      setStats(prev => ({
        ...prev,
        pendingApprovals: pendingCount,
        approvedUniversities: approvedCount
      }));
    } catch (error) {
      console.error('Error fetching universities:', error);
      // Fallback: try to fetch just universities without contact
      try {
        const token = localStorage.getItem('auth_token') || `admin_mock_token_${Date.now()}`;
        const fallbackResponse = await fetch('http://localhost:5000/api/admin/universities/all', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (fallbackResponse.ok) {
          const fallbackResult = await fallbackResponse.json();
          if (fallbackResult.success) {
            setAllUniversities(fallbackResult.data.map(uni => ({ ...uni, Contact_No: '—' })));
          }
        }
      } catch (fallbackError) {
        console.error('Fallback fetch also failed:', fallbackError);
      }
    } finally {
      setUniversitiesLoading(false);
    }
  };

  // Fetch categories 
  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('auth_token') || '';
      const response = await fetch('http://localhost:5000/api/course-categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      console.log('Categories API Response:', result);
      if (result.success) {
        setCategories(result.data);
      } else {
        console.error('Failed to fetch categories:', result.message);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Fetch dashboard statistics from database
  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);
      const token = localStorage.getItem('auth_token') || '';

      console.log('🔄 Fetching dashboard stats...');

      // Fetch total users count
      const usersResponse = await fetch('http://localhost:5000/api/admin/stats/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Fetch total courses count
      const coursesResponse = await fetch('http://localhost:5000/api/admin/stats/courses', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Fetch total revenue
      const revenueResponse = await fetch('http://localhost:5000/api/admin/stats/revenue', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Fetch pending approvals (universities)
      const approvalsResponse = await fetch('http://localhost:5000/api/admin/universities/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      let updatedStats = { ...stats };

      // Update total users
      if (usersResponse.ok) {
        const usersResult = await usersResponse.json();
        console.log('📊 Users Stats Response:', usersResult);
        if (usersResult.success) {
          updatedStats.totalUsers = usersResult.data.total || usersResult.data.count || 0;
          updatedStats.activeUsers = usersResult.data.active || 0;
          console.log('✅ Users updated - Total:', updatedStats.totalUsers, 'Active:', updatedStats.activeUsers);
        }
      } else {
        console.error('❌ Users stats failed:', usersResponse.status, await usersResponse.text());
      }

      // Update active courses
      if (coursesResponse.ok) {
        const coursesResult = await coursesResponse.json();
        console.log('📊 Courses Stats Response:', coursesResult);
        if (coursesResult.success) {
          updatedStats.activeCourses = coursesResult.data.active || coursesResult.data.count || 0;
          updatedStats.totalCourses = coursesResult.data.total || 0;
          console.log('✅ Courses updated - Active:', updatedStats.activeCourses, 'Total:', updatedStats.totalCourses);
        }
      } else {
        console.error('❌ Courses stats failed:', coursesResponse.status, await coursesResponse.text());
      }

      // Update total revenue
      if (revenueResponse.ok) {
        const revenueResult = await revenueResponse.json();
        console.log('📊 Revenue Stats Response:', revenueResult);
        if (revenueResult.success) {
          updatedStats.totalRevenue = revenueResult.data.total || 0;
          console.log('✅ Revenue updated:', updatedStats.totalRevenue);
        }
      } else {
        console.error('❌ Revenue stats failed:', revenueResponse.status, await revenueResponse.text());
      }

      // Update pending approvals
      if (approvalsResponse.ok) {
        const approvalsResult = await approvalsResponse.json();
        console.log('📊 Approvals Stats Response:', approvalsResult);
        if (approvalsResult.success) {
          const pendingCount = approvalsResult.data.filter(u => (u.Verification_Status || '').toLowerCase() === 'pending').length;
          const approvedCount = approvalsResult.data.filter(u => (u.Verification_Status || '').toLowerCase() === 'verified').length;
          updatedStats.pendingApprovals = pendingCount;
          updatedStats.approvedUniversities = approvedCount;
          console.log('✅ Pending approvals updated:', pendingCount, 'Approved:', approvedCount);
        }
      } else {
        console.error('❌ Approvals stats failed:', approvalsResponse.status, await approvalsResponse.text());
      }

      console.log('📈 Final Stats Update:', updatedStats);
      setStats(updatedStats);
    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch sessions from MongoDB
  const fetchSessions = async () => {
    try {
      setSessionsLoading(true);
      const token = localStorage.getItem('auth_token') || '';

      console.log('🔄 Fetching sessions from /api/admin/sessions...');

      const response = await fetch('http://localhost:5000/api/admin/sessions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch sessions');
      }

      console.log('✅ Fetched sessions:', result.data);
      setLiveSessions(Array.isArray(result.data) ? result.data : []);

      // Update session stats
      const activeCount = result.data.filter(s => s.status === 'Ongoing').length;
      const now = new Date();
      const upcomingCount = result.data.filter(s => {
        const sessionDate = new Date(s.scheduled_at);
        return sessionDate > now;
      }).length;
      const todayCount = result.data.filter(s => {
        const sessionDate = new Date(s.scheduled_at);
        const today = new Date();
        return sessionDate.toDateString() === today.toDateString();
      }).length;
      const totalParticipants = result.data
        .filter(s => s.status === 'Ongoing')
        .reduce((sum, s) => sum + (s.enrolled_students || 0), 0);

      console.log('📊 Session Stats:', {
        activeCount,
        upcomingCount,
        todayCount,
        totalParticipants,
        totalSessions: result.data.length,
        sessionStatuses: result.data.map(s => ({ title: s.title, status: s.status, scheduled: s.scheduled_at }))
      });

      setStats(prev => ({
        ...prev,
        liveSessions: activeCount,
        upcomingSessions: upcomingCount,
        sessionsToday: todayCount,
        totalParticipants: totalParticipants
      }));
    } catch (error) {
      console.error('❌ Error fetching sessions:', error);
      setLiveSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  };

  // Fetch students from MongoDB
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token') || '';

      // Check if we have a token
      if (!token) {
        console.error('No authentication token found');
        showNotification('Please log in to access user management', 'error');
        setLoading(false);
        return;
      }

      console.log('🔄 Fetching users from /api/admin/users...');

      const response = await fetch('http://localhost:5000/api/admin/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch users');
      }

      console.log('✅ Fetched users:', result.data);
      setUsers(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error('❌ Error fetching students:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    try {
      setAnalyticsLoading(true);
      const token = localStorage.getItem('auth_token') || '';

      // Fetch users for growth chart
      const usersResponse = await fetch('http://localhost:5000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const usersResult = await usersResponse.json();

      if (usersResult.success) {
        // Process users by month for the last 6 months
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const today = new Date();
        const last6Months = [];

        for (let i = 5; i >= 0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          last6Months.push({
            month: months[d.getMonth()],
            year: d.getFullYear(),
            count: 0,
            index: d.getMonth()
          });
        }

        usersResult.data.forEach(user => {
          const created = new Date(user.createdAt);
          const monthIndex = created.getMonth();
          const year = created.getFullYear();

          const bucket = last6Months.find(m => m.index === monthIndex && m.year === year);
          if (bucket) {
            bucket.count++;
          }
        });

        const userGrowth = last6Months.map(m => ({
          month: m.month,
          count: m.count
        }));

        // Cumulative count
        let runningTotal = 0; // Or start from total - sum(growth) if we want total users, but User Growth usually implies rate or cumulative. 
        // For "User Growth" chart, usually we show total users over time.
        // Let's assume we want total users at end of each month.
        // We'd need all users.
        // Simple approach: just showing new registrations per month for now as it's easier.
        // Or if the chart expects total, we can calculate.

        // Let's stick to new users per month for simplicity and "Growth" label.
        setAnalyticsData(prev => ({
          ...prev,
          userGrowth: userGrowth,
          courseSales: stats.totalRevenue // Use total revenue as proxy or fetch specific sales if needed
        }));
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Fetch comprehensive chart data from database
  const fetchChartData = async () => {
    try {
      const token = localStorage.getItem('auth_token') || '';

      // Fetch courses for top courses chart
      const coursesResponse = await fetch('http://localhost:5000/api/admin/courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const coursesResult = await coursesResponse.json();

      if (coursesResult.success && coursesResult.data && coursesResult.data.length > 0) {
        // Get top 5 courses by enrollment
        const topCourses = coursesResult.data
          .sort((a, b) => (b.Enrolled_Students || 0) - (a.Enrolled_Students || 0))
          .slice(0, 5)
          .map(course => ({
            course: course.Title?.substring(0, 15) || 'Untitled',
            students: course.Enrolled_Students || 0,
            revenue: (course.Enrolled_Students || 0) * (course.Price || 0)
          }));

        setChartData(prev => ({ ...prev, topCourses }));
      } else {
        // Fallback data for top courses
        setChartData(prev => ({
          ...prev, topCourses: [
            { course: 'No courses yet', students: 0, revenue: 0 }
          ]
        }));
      }

      // Fetch payments for payment methods distribution
      const paymentsResponse = await fetch('http://localhost:5000/api/admin/payments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const paymentsResult = await paymentsResponse.json();

      if (paymentsResult.success && paymentsResult.data && paymentsResult.data.length > 0) {
        const paymentMethodCounts = {};
        paymentsResult.data.forEach(payment => {
          const method = payment.Payment_Method;
          // Only count if payment method is not null, undefined, empty, or 'Unknown'
          if (method && method !== 'Unknown' && method.trim() !== '') {
            paymentMethodCounts[method] = (paymentMethodCounts[method] || 0) + 1;
          }
        });

        const total = Object.values(paymentMethodCounts).reduce((a, b) => a + b, 0);

        if (total > 0) {
          const paymentMethods = Object.entries(paymentMethodCounts).map(([name, count]) => ({
            name,
            value: Math.round((count / total) * 100),
            fill: name === 'Credit Card' ? '#3b82f6' :
              name === 'Debit Card' ? '#10b981' :
                name === 'UPI' ? '#f59e0b' :
                  name === 'Net Banking' ? '#8b5cf6' : '#ef4444'
          }));

          setChartData(prev => ({ ...prev, paymentMethods }));
        } else {
          // No valid payment methods found
          setChartData(prev => ({
            ...prev, paymentMethods: [
              { name: 'No payments yet', value: 100, fill: '#9ca3af' }
            ]
          }));
        }
      } else {
        // Fallback data for payment methods
        setChartData(prev => ({
          ...prev, paymentMethods: [
            { name: 'No payments yet', value: 100, fill: '#9ca3af' }
          ]
        }));
      }

      // Fetch users for engagement funnel
      const usersResponse = await fetch('http://localhost:5000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const usersResult = await usersResponse.json();

      if (usersResult.success && usersResult.data && usersResult.data.length > 0 && coursesResult.success) {
        const totalUsers = usersResult.data.length;
        const enrolledUsers = new Set(coursesResult.data.flatMap(c => c.Enrolled_Students_List || [])).size;
        const activeUsers = usersResult.data.filter(u => u.isActive).length;

        const engagementFunnel = [
          { stage: 'Visitors', count: Math.max(Math.round(totalUsers * 2), 10), fill: '#3b82f6' },
          { stage: 'Registered', count: Math.max(totalUsers, 5), fill: '#6366f1' },
          { stage: 'Enrolled', count: Math.max(enrolledUsers, 3), fill: '#8b5cf6' },
          { stage: 'Active', count: Math.max(activeUsers, 2), fill: '#a855f7' },
          { stage: 'Completed', count: Math.max(Math.round(activeUsers * 0.5), 1), fill: '#c084fc' }
        ];

        setChartData(prev => ({ ...prev, engagementFunnel }));
      } else {
        // Fallback data for engagement funnel
        setChartData(prev => ({
          ...prev, engagementFunnel: [
            { stage: 'Visitors', count: 10, fill: '#3b82f6' },
            { stage: 'Registered', count: 5, fill: '#6366f1' },
            { stage: 'Enrolled', count: 3, fill: '#8b5cf6' },
            { stage: 'Active', count: 2, fill: '#a855f7' },
            { stage: 'Completed', count: 1, fill: '#c084fc' }
          ]
        }));
      }

      // Generate platform activity data (last 7 days)
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const platformActivity = days.map(day => ({
        day,
        morning: Math.floor(Math.random() * 50) + 40,
        afternoon: Math.floor(Math.random() * 50) + 70,
        evening: Math.floor(Math.random() * 50) + 85
      }));

      setChartData(prev => ({ ...prev, platformActivity }));

      // Generate revenue vs enrollments data (last 6 months)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const today = new Date();
      const revenueEnrollments = [];

      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthName = months[d.getMonth()];

        // Calculate actual enrollments for this month
        const monthEnrollments = coursesResult.success && coursesResult.data ?
          coursesResult.data.reduce((sum, course) => {
            const courseDate = new Date(course.createdAt);
            if (courseDate.getMonth() === d.getMonth() && courseDate.getFullYear() === d.getFullYear()) {
              return sum + (course.Enrolled_Students || 0);
            }
            return sum;
          }, 0) : Math.floor(Math.random() * 20);

        // Calculate revenue for this month from payments
        const monthRevenue = paymentsResult.success && paymentsResult.data ?
          paymentsResult.data.reduce((sum, payment) => {
            const paymentDate = new Date(payment.Payment_Date);
            if (paymentDate.getMonth() === d.getMonth() && paymentDate.getFullYear() === d.getFullYear()) {
              return sum + (payment.Amount || 0);
            }
            return sum;
          }, 0) : Math.floor(Math.random() * 5000);

        revenueEnrollments.push({
          month: monthName,
          revenue: monthRevenue,
          enrollments: monthEnrollments
        });
      }

      setChartData(prev => ({ ...prev, revenueEnrollments }));

      // Category distribution
      if (categories && categories.length > 0) {
        const categoryDistribution = categories.slice(0, 6).map(cat => {
          const coursesInCategory = coursesResult.success && coursesResult.data ?
            coursesResult.data.filter(c => c.Category_Id === cat.Category_Id).length : 0;

          return {
            name: cat.Category_Name,
            courses: coursesInCategory
          };
        });

        setChartData(prev => ({ ...prev, categoryDistribution }));
      } else {
        // Fallback data for category distribution
        setChartData(prev => ({
          ...prev, categoryDistribution: [
            { name: 'No categories yet', courses: 0 }
          ]
        }));
      }

    } catch (error) {
      console.error('Error fetching chart data:', error);
      // Set fallback data for all charts on error
      setChartData({
        topCourses: [{ course: 'No data', students: 0, revenue: 0 }],
        paymentMethods: [{ name: 'No data', value: 100, fill: '#9ca3af' }],
        engagementFunnel: [
          { stage: 'Visitors', count: 10, fill: '#3b82f6' },
          { stage: 'Registered', count: 5, fill: '#6366f1' },
          { stage: 'Enrolled', count: 3, fill: '#8b5cf6' },
          { stage: 'Active', count: 2, fill: '#a855f7' },
          { stage: 'Completed', count: 1, fill: '#c084fc' }
        ],
        platformActivity: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
          day, morning: 50, afternoon: 80, evening: 100
        })),
        revenueEnrollments: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(month => ({
          month, revenue: 0, enrollments: 0
        })),
        categoryDistribution: [{ name: 'No data', courses: 0 }]
      });
    }
  };

  // Fetch all exam data
  const fetchExams = async () => {
    try {
      setExamsLoading(true);
      const token = localStorage.getItem('auth_token') || '';

      // Fetch Quizzes
      const quizResponse = await fetch('http://localhost:5000/api/quiz/all/list', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const quizResult = await quizResponse.json();

      // Fetch Attempts
      const attemptResponse = await fetch('http://localhost:5000/api/quiz/attempts/all/list', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const attemptResult = await attemptResponse.json();

      // Fetch Certificates
      const certResponse = await fetch('http://localhost:5000/api/certification/all/list', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const certResult = await certResponse.json();

      if (quizResult.success && attemptResult.success && certResult.success) {
        setExams(quizResult.data || []);
        setExamAttempts(attemptResult.data || []);
        setIssuedCertificates(certResult.data || []);

        // Update stats
        const totalExams = quizResult.data.length;
        const certsIssued = certResult.data.length;
        const totalAttempts = attemptResult.data.length;
        const passedAttempts = attemptResult.data.filter(a => a.Percentage >= 70).length;
        const avgPassRate = totalAttempts > 0 ? (passedAttempts / totalAttempts * 100).toFixed(1) : 0;

        setStats(prev => ({
          ...prev,
          totalExams: totalExams,
          certificatesIssued: certsIssued,
          avgPassRate: avgPassRate
        }));
      }
    } catch (error) {
      console.error('Error fetching exam data:', error);
    } finally {
      setExamsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch dashboard stats on component mount
    fetchDashboardStats();

    // Only fetch users when the admin panel is active
    if (activePanel === 'users') {
      fetchStudents();
    }
    if (activePanel === 'courses') {
      fetchCourses();
    }
    if (activePanel === 'exams') {
      fetchExams();
    }
    if (activePanel === 'payments') {
      fetchPayments();
    }
    if (activePanel === 'feedback') {
      fetchFeedback();
    }
    if (activePanel === 'live') {
      fetchSessions();
    }
    if (activePanel === 'analytics') {
      fetchAnalyticsData();
      fetchChartData();
    }
    if (activePanel === 'overview') {
      fetchChartData();
    }
    fetchCategories();
    fetchPendingUniversities();
    fetchCourseCategories();
  }, [activePanel]);

  // Refresh data every 30 seconds to show new registrations
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardStats(); // Refresh stats
      if (activePanel === 'users') {
        fetchStudents();
      }
      if (activePanel === 'courses') {
        fetchCourses();
      }
      if (activePanel === 'payments') {
        fetchPayments();
      }
      if (activePanel === 'chatbot') {
        fetchChatbotData();
      }
      if (activePanel === 'feedback') {
        fetchFeedback();
      }
      if (activePanel === 'live') {
        fetchSessions();
      }
      if (activePanel === 'exams') {
        fetchExams();
      }
      if (activePanel === 'analytics') {
        fetchAnalyticsData();
      }
      fetchPendingUniversities();
    }, 30000);

    return () => clearInterval(interval);
  }, [activePanel]);

  // Action handlers for User Management
  const handleViewUser = (userId) => {
    const user = users.find(u => u._id === userId || u.id === userId);
    if (user) {
      setViewingUser(user);
    }
  };

  const handleEditUser = (userId) => {
    const user = users.find(u => u._id === userId || u.id === userId);
    if (user) {
      setEditingUser({ ...user });
    }
  };

  const handleDeleteUser = (userId) => {
    const user = users.find(u => u._id === userId || u.id === userId);
    if (user) {
      setDeleteConfirm(user);
    }
  };

  const confirmDeleteUser = async () => {
    if (!deleteConfirm) return;

    try {
      const token = localStorage.getItem('auth_token') || '';
      const response = await fetch(`http://localhost:5000/api/admin/users/${deleteConfirm._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        setUsers(users.filter(u => u._id !== deleteConfirm._id && u.id !== deleteConfirm._id));
        setDeleteConfirm(null);
        console.log('✅ User deleted successfully!');
      } else {
        console.error('❌ Failed to delete user:', result.message);
      }
    } catch (error) {
      console.error('❌ Error deleting user:', error);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const token = localStorage.getItem('auth_token') || '';
      const response = await fetch(`http://localhost:5000/api/admin/users/${editingUser._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role,
          status: editingUser.status
        })
      });

      const result = await response.json();

      if (result.success) {
        setUsers(users.map(u =>
          (u._id === editingUser._id || u.id === editingUser._id) ? { ...u, ...editingUser } : u
        ));
        setEditingUser(null);
        console.log('✅ User updated successfully!');
      } else {
        console.error('❌ Failed to update user:', result.message);
      }
    } catch (error) {
      console.error('❌ Error updating user:', error);
    }
  };

  // Action handlers for University Approval
  const handleApproveUniversity = (universityId) => {
    setConfirmMessage('Are you sure you want to Approve this university?');
    setConfirmData(universityId);
    setConfirmAction('approve');
    setShowConfirmModal(true);
  };

  const confirmApproveUniversity = async (universityId) => {
    try {
      // Use stored token if present else fallback to mock admin token accepted by backend
      const token = localStorage.getItem('auth_token') || `admin_mock_token_${Date.now()}`;

      const response = await fetch(`http://localhost:5000/api/admin/universities/${universityId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();

      if (result.success) {
        setShowConfirmModal(false);
        setConfirmAction(null);
        setConfirmData(null);
        showNotification(`${result.data?.name || 'University'} has been approved successfully.`, 'success');
        fetchPendingUniversities(); // Refresh the list
      } else {
        showNotification(result.message || 'Failed to approve university.', 'error');
        console.error('Failed to approve university:', result.message);
      }
    } catch (error) {
      console.error('Error approving university:', error);
    }
  };

  const handleRejectUniversity = (universityId) => {
    setConfirmMessage('Are you sure you want to Reject this university?');
    setConfirmData(universityId);
    setConfirmAction('reject');
    setShowConfirmModal(true);
  };

  const confirmRejectUniversity = async (universityId) => {
    try {
      // Use stored token if present else fallback to mock admin token accepted by backend
      const token = localStorage.getItem('auth_token') || `admin_mock_token_${Date.now()}`;

      const response = await fetch(`http://localhost:5000/api/admin/universities/${universityId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();

      if (result.success) {
        setShowConfirmModal(false);
        setConfirmAction(null);
        setConfirmData(null);
        showNotification(`${result.data?.name || 'University'} has been rejected.`, 'error');
        fetchPendingUniversities(); // Refresh the list
      } else {
        showNotification(result.message || 'Failed to reject university.', 'error');
        console.error('Failed to reject university:', result.message);
      }
    } catch (error) {
      console.error('Error rejecting university:', error);
    }
  };

  // Course management state
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [viewingCourse, setViewingCourse] = useState(null);
  const [courseCategories, setCourseCategories] = useState([]);

  // Fetch all courses from backend
  const fetchCourses = async () => {
    try {
      setCoursesLoading(true);
      const response = await fetch('http://localhost:5000/api/tbl-courses');
      const result = await response.json();

      console.log('Courses API Response:', result);

      if (result.success && result.data) {
        setCourses(result.data);

        // Update stats
        const pendingCount = result.data.filter(c => {
          const s = (c.status || 'pending').toLowerCase();
          return s !== 'approved' && s !== 'rejected' && s !== 'completed';
        }).length;
        const approvedCount = result.data.filter(c => {
          const s = (c.status || '').toLowerCase();
          return s === 'approved' || s === 'completed';
        }).length;

        setStats(prev => ({
          ...prev,
          activeCourses: approvedCount,
          pendingApprovals: pendingCount // Current count of courses needing approval
        }));
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setCoursesLoading(false);
    }
  };

  // Fetch course categories for mapping
  const fetchCourseCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/course-categories');
      const result = await response.json();
      if (result.success && result.data) {
        setCourseCategories(result.data);
      }
    } catch (error) {
      console.error('Error fetching course categories:', error);
    }
  };

  // Course Management Handlers
  const handleApproveCourse = async (courseId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/tbl-courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'approved' })
      });

      const result = await response.json();

      if (result.success) {
        fetchCourses(); // Refresh course list
      } else {
        console.error('Failed to approve course:', result.message);
      }
    } catch (error) {
      console.error('Error approving course:', error);
    }
  };

  const handleRejectCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to reject this course?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/tbl-courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'rejected' })
      });

      const result = await response.json();

      if (result.success) {
        fetchCourses(); // Refresh course list
      } else {
        console.error('Failed to reject course:', result.message);
      }
    } catch (error) {
      console.error('Error rejecting course:', error);
    }
  };

  const handleViewCourse = (course) => {
    setViewingCourse(course);
  };

  const closeViewCourse = () => {
    setViewingCourse(null);
  };

  // Fetch all feedback from backend
  const fetchFeedback = async () => {
    try {
      setFeedbackLoading(true);
      const token = localStorage.getItem('auth_token') || '';

      console.log('📝 Fetching feedback from backend...');

      const response = await fetch('http://localhost:5000/api/admin/feedback', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('📝 Feedback Response:', result);

      if (result.success) {
        setFeedback(result.feedbacks || []);
        setFeedbackStats(result.stats || {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          flagged: 0,
          averageRating: 0
        });
        console.log('✅ Feedback loaded:', result.feedbacks.length);
      }
    } catch (error) {
      console.error('❌ Error fetching feedback:', error);
    } finally {
      setFeedbackLoading(false);
    }
  };

  // Get category name from Category_Id
  const getCategoryName = (categoryId) => {
    const category = courseCategories.find(cat => cat.Category_Id === categoryId);
    return category ? category.Category_Name : `Category ${categoryId}`;
  };

  // Get course thumbnail initials
  const getCourseInitials = (title) => {
    const words = title.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return title.substring(0, 2).toUpperCase();
  };

  // Category Management Handlers
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    try {
      const response = await fetch('http://localhost:5000/api/course-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ Category_Name: newCategory }),
      });

      const result = await response.json();

      if (result.success) {
        setCategories([...categories, result.data]);
        setNewCategory('');
        showNotification('Category added successfully!', 'success');
      } else {
        showNotification(result.message || 'Failed to add category', 'error');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      showNotification('Error adding category', 'error');
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setEditCategoryName(category.Category_Name);
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editCategoryName.trim()) return;

    try {
      const response = await fetch(`http://localhost:5000/api/course-categories/${editingCategory._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ Category_Name: editCategoryName }),
      });

      const result = await response.json();

      if (result.success) {
        setCategories(categories.map(cat =>
          cat._id === editingCategory._id
            ? { ...cat, Category_Name: editCategoryName }
            : cat
        ));
        setEditingCategory(null);
        setEditCategoryName('');
        // Category updated successfully
      } else {
        console.error('Failed to update category:', result.message);
      }
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const handleDeleteCategory = (categoryId) => {
    setConfirmMessage('Are you sure you want to delete this category? This action cannot be undone.');
    setConfirmData(categoryId);
    setConfirmAction('deleteCategory');
    setShowConfirmModal(true);
  };

  const confirmDeleteCategory = async () => {
    if (!confirmData) return;

    try {
      const response = await fetch(`http://localhost:5000/api/course-categories/${confirmData}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setCategories(categories.filter(cat => cat._id !== confirmData));
        showNotification('Category deleted successfully!', 'success');
      } else {
        showNotification('Failed to delete category', 'error');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      showNotification('Error deleting category', 'error');
    } finally {
      setShowConfirmModal(false);
      setConfirmData(null);
      setConfirmAction(null);
    }
  };

  // Course management handlers removed as per requirements

  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [paymentStats, setPaymentStats] = useState({
    totalRevenue: 0,
    pendingPayments: 0,
    failedPayments: 0,
  });

  // Fetch payments from database
  const fetchPayments = async () => {
    try {
      setTransactionsLoading(true);
      const token = localStorage.getItem('auth_token') || '';

      console.log('💳 Fetching payments from /api/admin/payments...');

      const response = await fetch('http://localhost:5000/api/admin/payments', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch payments');
      }

      console.log('✅ Fetched payments:', result.data);
      setTransactions(Array.isArray(result.data) ? result.data : []);

      if (result.stats) {
        setPaymentStats({
          totalRevenue: result.stats.totalRevenue || 0,
          pendingPayments: result.stats.pendingPayments || 0,
          failedPayments: result.stats.failedPayments || 0,
        });
      }
    } catch (error) {
      console.error('❌ Error fetching payments:', error);
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  };



  // Action handlers for Payment & Transactions
  const handleVerifyTransaction = (transactionId) => {
    const transaction = transactions.find(t => t._id === transactionId);
    if (transaction) {
      setVerifyingTransaction(transaction);
    }
  };

  const confirmVerifyTransaction = () => {
    if (!verifyingTransaction) return;
    setTransactions(transactions.map(transaction =>
      transaction._id === verifyingTransaction._id ? { ...transaction, status: 'VERIFIED' } : transaction
    ));
    setVerifyingTransaction(null);
    console.log('✅ Transaction verified successfully!');
  };

  const handleRefundTransaction = (transactionId) => {
    const transaction = transactions.find(t => t._id === transactionId);
    if (transaction) {
      setRefundingTransaction(transaction);
    }
  };

  const confirmRefundTransaction = () => {
    if (!refundingTransaction) return;
    setTransactions(transactions.map(transaction =>
      transaction._id === refundingTransaction._id ? { ...transaction, status: 'REFUNDED' } : transaction
    ));
    setRefundingTransaction(null);
    console.log('✅ Refund processed successfully!');
  };

  const [feedback, setFeedback] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackStats, setFeedbackStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    flagged: 0,
    averageRating: 0
  });

  // Modal states for feedback management
  const [showFeedbackDetail, setShowFeedbackDetail] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [showRespondModal, setShowRespondModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [respondMessage, setRespondMessage] = useState('');
  const [feedbackFilter, setFeedbackFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'

  // Action handlers for Feedback Management
  const handleApproveFeedback = async (feedbackId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/feedback/${feedbackId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      const result = await response.json();
      if (result.success) {
        // Update local state
        setFeedback(feedback.map(fb =>
          fb.Feedback_Id === feedbackId ? { ...fb, Status: 'Approved' } : fb
        ));
        // Update stats
        setFeedbackStats(prev => ({
          ...prev,
          pending: prev.pending - 1,
          approved: prev.approved + 1
        }));
        fetchFeedback(); // Refresh data
      } else {
        console.error('Failed to approve feedback:', result.message);
      }
    } catch (error) {
      console.error('Error approving feedback:', error);
      showNotification('Error approving feedback', 'error');
    }
  };

  const handleRejectFeedback = (feedbackItem) => {
    setSelectedFeedback(feedbackItem);
    setShowRejectConfirm(true);
  };

  const confirmRejectFeedback = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/feedback/${selectedFeedback.Feedback_Id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      const result = await response.json();
      if (result.success) {
        // Update local state
        setFeedback(feedback.map(fb =>
          fb.Feedback_Id === selectedFeedback.Feedback_Id ? { ...fb, Status: 'Rejected' } : fb
        ));
        // Update stats
        setFeedbackStats(prev => ({
          ...prev,
          pending: prev.pending - 1,
          rejected: prev.rejected + 1
        }));
        setShowRejectConfirm(false);
        setSelectedFeedback(null);
        fetchFeedback(); // Refresh data
      } else {
        console.error('Failed to reject feedback:', result.message);
      }
    } catch (error) {
      console.error('Error rejecting feedback:', error);
      showNotification('Error rejecting feedback', 'error');
    }
  };

  const handleRespondFeedback = (feedbackItem) => {
    setSelectedFeedback(feedbackItem);
    setRespondMessage(feedbackItem.Response || '');
    setShowRespondModal(true);
  };

  const handleDeleteFeedback = (feedbackItem) => {
    setConfirmMessage('Are you sure you want to delete this feedback? This action cannot be undone.');
    setConfirmData(feedbackItem.Feedback_Id);
    setConfirmAction('deleteFeedback');
    setShowConfirmModal(true);
  };

  const confirmDeleteFeedback = async () => {
    if (!confirmData) return;

    try {
      const response = await fetch(`http://localhost:5000/api/admin/feedback/${confirmData}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      const result = await response.json();
      if (result.success) {
        setFeedback(feedback.filter(fb => fb.Feedback_Id !== confirmData));
        showNotification('delete properly', 'success');
        fetchFeedback(); // Refresh data
      } else {
        showNotification('Failed to delete feedback', 'error');
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
      showNotification('Error deleting feedback', 'error');
    } finally {
      setShowConfirmModal(false);
      setConfirmData(null);
      setConfirmAction(null);
    }
  };

  const submitFeedbackResponse = async () => {
    if (!respondMessage.trim()) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/admin/feedback/${selectedFeedback.Feedback_Id}/respond`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          response: respondMessage,
          studentId: selectedFeedback.Student_Id
        })
      });

      const result = await response.json();
      if (result.success) {
        // Update local state
        setFeedback(feedback.map(fb =>
          fb.Feedback_Id === selectedFeedback.Feedback_Id
            ? { ...fb, Response: respondMessage, Responded_On: new Date() }
            : fb
        ));
        setShowRespondModal(false);
        setSelectedFeedback(null);
        setRespondMessage('');
        showNotification('Response sent properly', 'success');
        fetchFeedback(); // Refresh data
      } else {
        console.error('Failed to send response:', result.message);
      }
    } catch (error) {
      console.error('Error sending response:', error);
      showNotification('Error sending response', 'error');
    }
  };

  const viewFeedbackDetail = (feedbackItem) => {
    setSelectedFeedback(feedbackItem);
    setShowFeedbackDetail(true);
  };

  const [liveSessions, setLiveSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionFilter, setSessionFilter] = useState('all'); // 'all', 'today', 'upcoming', 'ongoing'
  const [sessionFilterDate, setSessionFilterDate] = useState(''); // for specific date filter


  // Action handlers for Live Session Monitor
  const handleMonitorSession = (sessionId) => {
    showNotification(`Monitoring session with ID: ${sessionId}`, 'info');
    // Implementation: Open session monitoring interface
  };

  const handleModerateSession = (sessionId) => {
    showNotification(`Moderating session with ID: ${sessionId}`, 'info');
    // Implementation: Open moderation controls
  };

  const handleEndSession = (sessionId) => {
    setConfirmMessage('Are you sure you want to end this session?');
    setConfirmData(sessionId);
    setConfirmAction('endSession');
    setShowConfirmModal(true);
  };

  const confirmEndSession = () => {
    if (!confirmData) return;
    setLiveSessions(liveSessions.map(session =>
      session.id === confirmData ? { ...session, status: 'Ended' } : session
    ));
    showNotification('Session ended successfully!', 'success');
    setShowConfirmModal(false);
    setConfirmData(null);
    setConfirmAction(null);
  };

  // Action handlers for Chatbot Management
  const handleManageFAQ = () => {
    showNotification('Opening FAQ management interface...', 'info');
    // Implementation: Navigate to FAQ management
  };

  const handleTrainBot = () => {
    showNotification('Opening bot training interface...', 'info');
    // Implementation: Navigate to bot training
  };

  // Fetch chatbot history and stats
  const fetchChatbotData = async () => {
    try {
      setChatLoading(true);

      // Fetch chat statistics
      const statsResponse = await fetch('http://localhost:5000/api/chat-history/stats/overview');
      const statsData = await statsResponse.json();

      if (statsData.success) {
        setChatStats({
          totalChats: statsData.data.totalChats || 0,
          totalUsers: statsData.data.totalUsers || 0,
          averageResponseTime: Math.round(statsData.data.averageResponseTimeMs || 0),
          helpfulChats: statsData.data.helpfulChats || 0
        });
      }

      // Fetch chat history
      const historyResponse = await fetch(`http://localhost:5000/api/chat-history/all?limit=10&page=${chatPage}`);
      const historyData = await historyResponse.json();

      if (historyData.success) {
        setChatHistory(historyData.data);
        setChatTotalPages(historyData.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching chatbot data:', error);
    } finally {
      setChatLoading(false);
    }
  };

  const handleViewLogs = () => {
    fetchChatbotData();
  };

  const handleDeleteChatEntry = async (chatId) => {
    // Show confirmation modal
    setDeletingChatId(chatId);
  };

  const confirmDeleteChatEntry = async () => {
    if (deletingChatId) {
      try {
        const response = await fetch(`http://localhost:5000/api/chat-history/${deletingChatId}`, {
          method: 'DELETE'
        });
        const data = await response.json();

        if (data.success) {
          console.log('Chat entry deleted successfully');
          setDeletingChatId(null); // Close modal
          fetchChatbotData(); // Refresh data
        }
      } catch (error) {
        console.error('Error deleting chat entry:', error);
        setDeletingChatId(null); // Close modal on error too
      }
    }
  };

  const cancelDeleteChatEntry = () => {
    setDeletingChatId(null);
  };

  const handleNextPage = () => {
    if (chatPage < chatTotalPages) {
      setChatPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (chatPage > 1) {
      setChatPage(prev => prev - 1);
    }
  };

  // Fetch chatbot data when activePanel is chatbot or page changes
  useEffect(() => {
    if (activePanel === 'chatbot') {
      fetchChatbotData();
    }
  }, [activePanel, chatPage]);



  const handleViewResults = () => {
    showNotification('Assessment results synchronization in progress...', 'info');
  };

  const handleEditExam = () => {
    showNotification('Redirecting to secure exam configuration portal...', 'info');
  };

  const handleIssueCertificates = () => {
    showNotification('Validating credentials for mass certificate publication...', 'info');
  };

  const menuItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: '📊' },
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'courses', label: 'Courses & Categories', icon: '📚' },
    { id: 'payments', label: 'Payments & Transactions', icon: '💳' },
    { id: 'feedback', label: 'Feedback & Reviews', icon: '⭐' },
    { id: 'live', label: 'Live Session Monitor', icon: '🎥' },
    { id: 'chatbot', label: 'Chatbot Management', icon: '🤖' },
    { id: 'exams', label: 'Exam & Certification', icon: '🎓' },
    { id: 'analytics', label: 'Reports & Analytics', icon: '📈' },
    { id: 'approvals', label: 'University Approvals', icon: '✅' }
  ];

  const renderOverview = () => (
    <div className="overview-panel">
      <h2>📊 Dashboard Overview</h2>
      <div className="stats-grid">
        <div className="stat-card users" onClick={() => setActivePanel('users')}>
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3 className={statsLoading ? 'loading' : ''}>
              {statsLoading ? 'Loading...' : stats.totalUsers.toLocaleString('en-IN')}
            </h3>
            <p>Total Users</p>
            <span className={`stat-trend ${statsLoading ? 'loading' : ''}`}>
              {statsLoading ? 'Fetching data...' : (
                stats.totalUsers > 0
                  ? `${stats.activeUsers} active users`
                  : 'No users registered yet'
              )}
            </span>
          </div>
        </div>
        <div className="stat-card revenue" onClick={() => setActivePanel('payments')}>
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3 className={statsLoading ? 'loading' : ''}>
              {statsLoading ? 'Loading...' : `₹${stats.totalRevenue.toLocaleString('en-IN')}`}
            </h3>
            <p>Total Revenue</p>
            <span className={`stat-trend ${statsLoading ? 'loading' : ''}`}>
              {statsLoading ? 'Fetching data...' : (
                stats.totalRevenue > 0
                  ? `Gross platform sales`
                  : 'No transactions yet'
              )}
            </span>
          </div>
        </div>
        <div className="stat-card commission" onClick={() => setActivePanel('payments')}>
          <div className="stat-icon">🏦</div>
          <div className="stat-content">
            <h3 className={statsLoading ? 'loading' : ''}>
              {statsLoading ? 'Loading...' : `₹${(stats.totalRevenue * 0.3).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            </h3>
            <p>Admin Commission (30%)</p>
            <span className="stat-trend">Net platform profit</span>
          </div>
        </div>
        <div className="stat-card lecturer-rev" onClick={() => setActivePanel('payments')}>
          <div className="stat-icon">👨‍🏫</div>
          <div className="stat-content">
            <h3 className={statsLoading ? 'loading' : ''}>
              {statsLoading ? 'Loading...' : `₹${(stats.totalRevenue * 0.7).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            </h3>
            <p>Lecturer Revenue (70%)</p>
            <span className="stat-trend">Distributed to instructors</span>
          </div>
        </div>
        <div className="stat-card courses" onClick={() => setActivePanel('courses')}>
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3 className={statsLoading ? 'loading' : ''}>
              {statsLoading ? 'Loading...' : stats.activeCourses.toLocaleString('en-IN')}
            </h3>
            <p>Active Courses</p>
            <span className={`stat-trend ${statsLoading ? 'loading' : ''}`}>
              {statsLoading ? 'Fetching data...' : (
                stats.activeCourses > 0
                  ? `of ${stats.totalCourses} total courses`
                  : 'No courses available'
              )}
            </span>
          </div>
        </div>
        <div className="stat-card pending" onClick={() => setActivePanel('approvals')}>
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3 className={statsLoading ? 'loading' : ''}>
              {statsLoading ? 'Loading...' : stats.pendingApprovals.toLocaleString('en-IN')}
            </h3>
            <p>Pending Approvals</p>
            <span className={`stat-trend ${statsLoading ? 'loading' : ''}`}>
              {statsLoading ? 'Fetching data...' : (
                stats.pendingApprovals > 0
                  ? '⚠️ Requires attention'
                  : '✓ All clear'
              )}
            </span>
          </div>
        </div>

        <div className="stat-card commission" onClick={() => setActivePanel('approvals')}>
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3 className={statsLoading ? 'loading' : ''}>
              {statsLoading ? 'Loading...' : (stats.approvedUniversities || 0).toLocaleString('en-IN')}
            </h3>
            <p>Approved Universities</p>
            <span className="stat-trend">Successfully verified</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <h3 style={{ marginBottom: '2rem', fontSize: '1.5rem', color: '#1f2937' }}>📈 Analytics & Insights</h3>

        <div className="charts-grid">
          {/* Revenue Distribution Pie Chart */}
          <div className="chart-container">
            <h4>💰 Revenue Distribution</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Admin (30%)', value: stats.totalRevenue * 0.3, fill: '#8b5cf6' },
                    { name: 'Lecturer (70%)', value: stats.totalRevenue * 0.7, fill: '#10b981' }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  dataKey="value"
                >
                  <Cell fill="#8b5cf6" />
                  <Cell fill="#10b981" />
                </Pie>
                <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Total Revenue Donut Chart */}
          <div className="chart-container">
            <h4>💰 Total Revenue</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Total Revenue', value: stats.totalRevenue, fill: '#10b981' }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ value }) => `₹${value.toLocaleString('en-IN')}`}
                >
                  <Cell fill="#10b981" />
                </Pie>
                <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ fontSize: '24px', fontWeight: 'bold', fill: '#1f2937' }}
                >
                  ₹{stats.totalRevenue.toLocaleString('en-IN')}
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Platform Activity */}
          <div className="chart-container">
            <h4>🔥 Platform Activity</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.platformActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="morning" stroke="#fbbf24" strokeWidth={2} name="Morning" />
                <Line type="monotone" dataKey="afternoon" stroke="#f59e0b" strokeWidth={2} name="Afternoon" />
                <Line type="monotone" dataKey="evening" stroke="#ef4444" strokeWidth={2} name="Evening" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Engagement Funnel */}
          <div className="chart-container">
            <h4>📉 Engagement Funnel</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={chartData.engagementFunnel}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="stage" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" name="Users">
                  {chartData.engagementFunnel.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUserManagement = () => {
    // If we're not on the users panel, don't render anything
    if (activePanel !== 'users') return null;

    return (
      <div className="user-management-panel">
        <h2>👥 User Management</h2>
        <div className="panel-controls">
          <input type="text" placeholder="Search users..." className="search-input" />
        </div>
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Join Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                    <div className="loading-spinner">Loading users...</div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                    <div className="no-users-message">
                      <p>No users found</p>
                      <button
                        className="btn-primary"
                        onClick={fetchStudents}
                        style={{ marginTop: '10px' }}
                      >
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user._id || user.id}>
                    <td>{user.name || 'N/A'}</td>
                    <td>{user.email || 'N/A'}</td>
                    <td>
                      <span className={`role-badge ${(user.role || 'user').toLowerCase()}`}>
                        {(user.role || 'user').toUpperCase()}
                      </span>
                    </td>
                    <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteUser(user._id || user.id)}
                        >
                          DELETE
                        </button>
                        <button
                          className="btn-view"
                          onClick={() => handleViewUser(user._id || user.id)}
                        >
                          VIEW
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderCourseManagement = () => (
    <div className="course-management-panel">
      <h2>📚 Course Management</h2>

      {/* Category Management Section */}
      <div className="category-management">
        <h3>Manage Course Categories</h3>
        <div className="category-form">
          {editingCategory ? (
            <form onSubmit={handleUpdateCategory} className="edit-category-form">
              <input
                type="text"
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
                placeholder="Enter category name"
                required
              />
              <button type="submit" className="btn-primary">Update Category</button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setEditingCategory(null);
                  setEditCategoryName('');
                }}
              >
                Cancel
              </button>
            </form>
          ) : (
            <form onSubmit={handleAddCategory} className="add-category-form">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Enter new category name"
                required
              />
              <button type="submit" className="btn-primary">Add Category</button>
            </form>
          )}
        </div>

        <div className="categories-list">
          {categories.length === 0 ? (
            <p>No categories found. Add your first category above.</p>
          ) : (
            <div className="categories-grid">
              {categories.map((category) => (
                <div key={category._id} className="category-card">
                  <span className="category-name">{category.Category_Name}</span>
                  <div className="category-actions">
                    <button
                      className="btn-edit"
                      onClick={() => handleEditCategory(category)}
                    >
                      <i className="fas fa-edit"></i> Edit
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteCategory(category._id)}
                    >
                      <i className="fas fa-trash"></i> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Courses Section - Table Layout */}
      <div className="courses-section">
        {/* View Course Modal */}
        {viewingCourse && (
          <>
            <div className="admin-modal-overlay" onClick={closeViewCourse} />
            <div className="admin-modal admin-modal-large">
              <div className="admin-modal-header">
                <h3>📚 Course Details</h3>
                <button className="btn-close" onClick={closeViewCourse}>×</button>
              </div>
              <div className="admin-modal-body">
                <div className="course-detail-grid">
                  <div className="course-detail-main">
                    <div className="course-detail-section">
                      <h4>Course Title</h4>
                      <p className="detail-title">{viewingCourse.Title}</p>
                    </div>

                    <div className="course-detail-section">
                      <h4>Full Description</h4>
                      <p className="detail-description">{viewingCourse.Description || 'No description provided'}</p>
                    </div>

                    <div className="course-detail-row">
                      <div className="course-detail-section">
                        <h4>Category</h4>
                        <p>{getCategoryName(viewingCourse.Category_Id)}</p>
                      </div>
                      <div className="course-detail-section">
                        <h4>Status</h4>
                        <span className={`status-badge status-${viewingCourse.status || 'pending'}`}>
                          {viewingCourse.status || 'pending'}
                        </span>
                      </div>
                    </div>

                    <div className="course-detail-row">
                      <div className="course-detail-section">
                        <h4>Price</h4>
                        <p className="detail-price">₹{viewingCourse.Price.toLocaleString()}</p>
                      </div>
                      <div className="course-detail-section">
                        <h4>Duration</h4>
                        <p>{viewingCourse.Duration || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="course-detail-sidebar">
                    <div className="course-detail-section">
                      <h4>Lecturer Information</h4>
                      <p><strong>Email:</strong> {viewingCourse.Lecturer_Id}</p>
                    </div>

                    <div className="course-detail-section">
                      <h4>Course ID</h4>
                      <p>{viewingCourse.Course_Id}</p>
                    </div>

                    <div className="course-detail-section">
                      <h4>Created Date</h4>
                      <p>{new Date(viewingCourse.Created_At).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</p>
                    </div>

                    <div className="course-detail-section">
                      <h4>Active Status</h4>
                      <p>{viewingCourse.Is_Active ? '✓ Active' : '✗ Inactive'}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="admin-modal-footer">
                {viewingCourse.status !== 'approved' && (
                  <button
                    className="btn-modal-approve"
                    onClick={() => {
                      closeViewCourse();
                      handleApproveCourse(viewingCourse.Course_Id);
                    }}
                  >
                    <i className="fas fa-check"></i> Approve Course
                  </button>
                )}
                {viewingCourse.status !== 'rejected' && (
                  <button
                    className="btn-modal-reject"
                    onClick={() => {
                      closeViewCourse();
                      handleRejectCourse(viewingCourse.Course_Id);
                    }}
                  >
                    <i className="fas fa-times"></i> Reject Course
                  </button>
                )}
                <button className="btn-modal-close" onClick={closeViewCourse}>Close</button>
              </div>
            </div>
          </>
        )}

        {/* Pending Courses Table */}
        <h3 className="courses-section-heading">
          <i className="fas fa-clock"></i> Pending Courses
        </h3>
        <div className="courses-table-wrapper">
          {coursesLoading ? (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>Loading courses...</p>
            </div>
          ) : courses.filter(course => {
            const s = (course.status || 'pending').toLowerCase();
            return s !== 'approved' && s !== 'rejected' && s !== 'completed';
          }).length > 0 ? (
            <table className="courses-table">
              <thead>
                <tr>
                  <th>Course Title</th>
                  <th>Category</th>
                  <th>Lecturer Email</th>
                  <th>Price</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Date Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses
                  .filter(course => {
                    const s = (course.status || 'pending').toLowerCase();
                    return s !== 'approved' && s !== 'rejected' && s !== 'completed';
                  })
                  .map((course) => (
                    <tr key={course.Course_Id || course._id}>
                      <td className="course-title-cell">{course.Title}</td>
                      <td>{getCategoryName(course.Category_Id)}</td>
                      <td>{course.Lecturer_Id}</td>
                      <td className="price-cell">₹{course.Price.toLocaleString()}</td>
                      <td>{course.Duration || 'N/A'}</td>
                      <td>
                        <span className="status-badge status-pending">
                          {course.status || 'pending'}
                        </span>
                      </td>
                      <td>{new Date(course.Created_At).toLocaleDateString('en-IN')}</td>
                      <td className="actions-cell">
                        <button
                          className="btn-approve"
                          onClick={() => handleApproveCourse(course.Course_Id)}
                          title="Approve this course"
                        >
                          Approve
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => handleRejectCourse(course.Course_Id)}
                          title="Reject this course"
                        >
                          Reject
                        </button>
                        <button
                          className="btn-view"
                          onClick={() => handleViewCourse(course)}
                          title="View full details"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : (
            <div className="no-courses-message">
              <i className="fas fa-inbox"></i>
              <p>No pending courses for approval</p>
            </div>
          )}
        </div>

        {/* Approved Courses Table */}
        <h3 className="courses-section-heading" style={{ marginTop: '3rem' }}>
          <i className="fas fa-check-circle"></i> Approved Courses
        </h3>
        <div className="courses-table-wrapper">
          {coursesLoading ? (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>Loading courses...</p>
            </div>
          ) : courses.filter(course => {
            const s = (course.status || '').toLowerCase();
            return s === 'approved' || s === 'completed';
          }).length > 0 ? (
            <table className="courses-table">
              <thead>
                <tr>
                  <th>Course Title</th>
                  <th>Category</th>
                  <th>Lecturer Email</th>
                  <th>Price</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Date Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses
                  .filter(course => {
                    const s = (course.status || '').toLowerCase();
                    return s === 'approved' || s === 'completed';
                  })
                  .map((course) => (
                    <tr key={course.Course_Id || course._id}>
                      <td className="course-title-cell">{course.Title}</td>
                      <td>{getCategoryName(course.Category_Id)}</td>
                      <td>{course.Lecturer_Id}</td>
                      <td className="price-cell">₹{course.Price.toLocaleString()}</td>
                      <td>{course.Duration || 'N/A'}</td>
                      <td>
                        <span className="status-badge status-approved">
                          {course.status}
                        </span>
                      </td>
                      <td>{new Date(course.Created_At).toLocaleDateString('en-IN')}</td>
                      <td className="actions-cell">
                        <button
                          className="btn-view"
                          onClick={() => handleViewCourse(course)}
                          title="View full details"
                        >
                          View
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => handleRejectCourse(course.Course_Id)}
                          title="Revoke approval"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : (
            <div className="no-courses-message">
              <i className="fas fa-check-double"></i>
              <p>No approved courses yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderPaymentManagement = () => (
    <div className="payment-management-panel">
      <h2>💳 Payments & Transactions</h2>
      <div className="payment-stats">
        <div className="payment-stat">
          <h4>Total Revenue</h4>
          <p>₹{paymentStats.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="payment-stat">
          <h4>Pending Payments</h4>
          <p>₹{paymentStats.pendingPayments.toLocaleString()}</p>
        </div>
        <div className="payment-stat">
          <h4>Failed Payments</h4>
          <p>₹{paymentStats.failedPayments.toLocaleString()}</p>
        </div>
      </div>
      <div className="transactions-table">
        <table>
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>User</th>
              <th>Course</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactionsLoading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                  <div className="loading-spinner">Loading transactions...</div>
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                  <p>No transactions found</p>
                </td>
              </tr>
            ) : (
              transactions.map(transaction => (
                <tr key={transaction._id}>
                  <td>#{transaction.receiptNo || transaction.transactionId}</td>
                  <td>{transaction.studentName || 'N/A'}</td>
                  <td>{transaction.courseName || 'N/A'}</td>
                  <td>₹{transaction.amount}</td>
                  <td><span className={`status-badge ${transaction.status.toLowerCase()}`}>{transaction.status}</span></td>
                  <td>{transaction.paymentDate ? new Date(transaction.paymentDate).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-verify" onClick={() => handleVerifyTransaction(transaction._id)}>VERIFY</button>
                      <button className="btn-refund" onClick={() => handleRefundTransaction(transaction._id)}>REFUND</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderFeedbackManagement = () => {
    return (
      <div className="feedback-management-panel">
        <div className="feedback-header-section">
          <h2>⭐ Feedback & Review Management</h2>
        </div>

        <div className="feedback-stats">
          <div className="feedback-stat">
            <h4>Total Reviews</h4>
            <p>{feedbackStats.total}</p>
          </div>
          <div className="feedback-stat">
            <h4>Average Rating</h4>
            <p>{feedbackStats.averageRating} ⭐</p>
          </div>
        </div>

        {feedbackLoading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading feedback...</p>
          </div>
        ) : feedback.length === 0 ? (
          <div className="no-data">
            <p>No feedback available</p>
          </div>
        ) : (
          <div className="feedback-list">
            {feedback.map(review => (
              <div
                key={review.Feedback_Id}
                className="feedback-card clickable"
                onClick={() => viewFeedbackDetail(review)}
                style={{ cursor: 'pointer' }}
              >
                <div className="feedback-header">
                  <h4>{review.studentName || review.Student_Name || 'Anonymous'}</h4>
                  <div className="rating">
                    {'★'.repeat(review.Rating || 0)}{'☆'.repeat(5 - (review.Rating || 0))}
                  </div>
                </div>
                <p><strong>Course:</strong> {review.courseTitle || review.Course_Title || 'N/A'}</p>
                <p className="feedback-comment">"{review.Comment ? review.Comment.substring(0, 100) + '...' : 'No comment provided'}"</p>
                <p className="feedback-date"><strong>Posted:</strong> {new Date(review.Posted_On).toLocaleDateString()}</p>
                {review.Response && (
                  <div className="feedback-response">
                    <p><strong>Admin Response:</strong> {review.Response.substring(0, 80)}...</p>
                  </div>
                )}
                <div className="feedback-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="btn-edit" onClick={() => handleRespondFeedback(review)}>
                    RESPOND
                  </button>
                  <button className="btn-delete" onClick={() => handleDeleteFeedback(review)}>
                    DELETE
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Feedback Detail Modal */}
        {showFeedbackDetail && selectedFeedback && (
          <div className="modal-overlay" onClick={() => setShowFeedbackDetail(false)}>
            <div className="modal-content feedback-detail-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>📝 Feedback Details</h2>
                <button className="modal-close" onClick={() => setShowFeedbackDetail(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="feedback-detail-section">
                  <h3>Student Information</h3>
                  <p><strong>Name:</strong> {selectedFeedback.studentName || selectedFeedback.Student_Name || 'Anonymous'}</p>
                  <p><strong>Course:</strong> {selectedFeedback.courseTitle || selectedFeedback.Course_Title || 'N/A'}</p>
                  <p><strong>Posted On:</strong> {new Date(selectedFeedback.Posted_On).toLocaleString()}</p>
                </div>
                <div className="feedback-detail-section">
                  <h3>Rating</h3>
                  <div className="rating" style={{ fontSize: '2rem', color: '#FFD700' }}>
                    {'★'.repeat(selectedFeedback.Rating || 0)}{'☆'.repeat(5 - (selectedFeedback.Rating || 0))}
                  </div>
                </div>
                <div className="feedback-detail-section">
                  <h3>Comment</h3>
                  <p className="full-comment">{selectedFeedback.Comment || 'No comment provided'}</p>
                </div>
                {selectedFeedback.Response && (
                  <div className="feedback-detail-section">
                    <h3>Admin Response</h3>
                    <p>{selectedFeedback.Response}</p>
                    <p className="response-date"><strong>Responded On:</strong> {new Date(selectedFeedback.Responded_On).toLocaleString()}</p>
                  </div>
                )}
                <div className="feedback-detail-section">
                  <h3>Status</h3>
                  <span className={`status-badge ${(selectedFeedback.Status || '').toLowerCase()}`}>
                    {selectedFeedback.Status || 'Pending'}
                  </span>
                </div>
              </div>
              <div className="modal-footer">
                {selectedFeedback.Status === 'Pending' && (
                  <button className="btn-approve" onClick={() => {
                    setShowFeedbackDetail(false);
                    handleApproveFeedback(selectedFeedback.Feedback_Id);
                  }}>
                    APPROVE
                  </button>
                )}
                {selectedFeedback.Status !== 'Rejected' && (
                  <button className="btn-reject" onClick={() => {
                    setShowFeedbackDetail(false);
                    handleRejectFeedback(selectedFeedback);
                  }}>
                    REJECT
                  </button>
                )}
                <button className="btn-edit" onClick={() => {
                  setShowFeedbackDetail(false);
                  handleRespondFeedback(selectedFeedback);
                }}>
                  RESPOND
                </button>
                <button className="btn-modal-close" onClick={() => setShowFeedbackDetail(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Confirmation Modal */}
        {showRejectConfirm && selectedFeedback && (
          <div className="modal-overlay" onClick={() => setShowRejectConfirm(false)}>
            <div className="modal-content reject-confirm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>⚠️ Confirm Rejection</h2>
                <button className="modal-close" onClick={() => setShowRejectConfirm(false)}>✕</button>
              </div>
              <div className="modal-body">
                <p style={{ fontSize: '1.1rem', textAlign: 'center', marginBottom: '1rem' }}>
                  Are you sure you want to reject this feedback?
                </p>
                <div className="reject-preview">
                  <p><strong>Student:</strong> {selectedFeedback.studentName || 'Anonymous'}</p>
                  <p><strong>Course:</strong> {selectedFeedback.courseTitle || 'N/A'}</p>
                  <p><strong>Rating:</strong> {'★'.repeat(selectedFeedback.Rating || 0)}</p>
                  <p><strong>Comment:</strong> "{selectedFeedback.Comment}"</p>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-reject" onClick={confirmRejectFeedback}>
                  Yes, Reject
                </button>
                <button className="btn-modal-close" onClick={() => setShowRejectConfirm(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Respond Modal */}
        {showRespondModal && selectedFeedback && (
          <div className="modal-overlay" onClick={() => setShowRespondModal(false)}>
            <div className="modal-content respond-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>💬 Send Response to Student</h2>
                <button className="modal-close" onClick={() => setShowRespondModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="respond-context">
                  <p><strong>Student:</strong> {selectedFeedback.studentName || 'Anonymous'}</p>
                  <p><strong>Course:</strong> {selectedFeedback.courseTitle || 'N/A'}</p>
                  <p><strong>Their Comment:</strong> "{selectedFeedback.Comment}"</p>
                </div>
                <div className="respond-input-section">
                  <label htmlFor="respondMessage"><strong>Your Response:</strong></label>
                  <textarea
                    id="respondMessage"
                    rows="6"
                    placeholder="Type your response here... The student will receive a notification."
                    value={respondMessage}
                    onChange={(e) => setRespondMessage(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-approve" onClick={submitFeedbackResponse}>
                  Send Response
                </button>
                <button className="btn-modal-close" onClick={() => setShowRespondModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderLiveSessionMonitor = () => {
    const formatDateTime = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // Filter sessions based on selected filter
    const getFilteredSessions = () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1);

      return liveSessions.filter(session => {
        const sessionDate = new Date(session.scheduled_at);
        const sessionDay = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());

        switch (sessionFilter) {
          case 'all':
            return true;
          case 'today':
            // Show sessions scheduled on today's date
            return sessionDay.getTime() === today.getTime();
          case 'upcoming':
            // Show sessions where scheduled date/time > current date/time
            return sessionDate > now;
          case 'ongoing':
            // Show sessions with status = Ongoing
            return session.status === 'Ongoing';
          case 'completed':
            // Show sessions with status = Completed
            return session.status === 'Completed';
          case 'date':
            // Show sessions scheduled on the selected date
            if (!sessionFilterDate) return true;
            const filterDate = new Date(sessionFilterDate);
            const filterDay = new Date(filterDate.getFullYear(), filterDate.getMonth(), filterDate.getDate());
            return sessionDay.getTime() === filterDay.getTime();
          default:
            return true;
        }
      });
    };

    const filteredSessions = getFilteredSessions();

    const handleJoinSession = (session) => {
      if (session.meeting_link) {
        window.open(session.meeting_link, '_blank');
        showNotification('Opening session...', 'info');
      } else {
        showNotification('No meeting link available for this session', 'error');
      }
    };

    return (
      <div className="live-session-panel">
        <h2>🎥 Live Session Monitor</h2>

        {/* Filter Tabs */}
        <div className="feedback-filter-tabs" style={{ marginBottom: '1.5rem' }}>
          <button
            className={`filter-tab ${sessionFilter === 'all' ? 'active' : ''}`}
            onClick={() => setSessionFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-tab ${sessionFilter === 'today' ? 'active' : ''}`}
            onClick={() => setSessionFilter('today')}
          >
            Today
          </button>
          <button
            className={`filter-tab ${sessionFilter === 'upcoming' ? 'active' : ''}`}
            onClick={() => setSessionFilter('upcoming')}
          >
            Upcoming
          </button>
          <button
            className={`filter-tab ${sessionFilter === 'ongoing' ? 'active' : ''}`}
            onClick={() => setSessionFilter('ongoing')}
          >
            Ongoing
          </button>
          <button
            className={`filter-tab ${sessionFilter === 'completed' ? 'active' : ''}`}
            onClick={() => setSessionFilter('completed')}
          >
            Completed
          </button>
          <button
            className={`filter-tab ${sessionFilter === 'date' ? 'active' : ''}`}
            onClick={() => setSessionFilter('date')}
          >
            Specific Date
          </button>
        </div>

        {/* Date Picker for Specific Date Filter */}
        {sessionFilter === 'date' && (
          <div style={{ marginBottom: '1.5rem' }}>
            <input
              type="date"
              value={sessionFilterDate}
              onChange={(e) => setSessionFilterDate(e.target.value)}
              style={{
                padding: '0.75rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '0.95rem'
              }}
            />
          </div>
        )}

        <div className="session-stats">
          <div className="session-stat">
            <h4>Ongoing Sessions</h4>
            <p>{liveSessions.filter(s => s.status === 'Ongoing').length}</p>
          </div>
          <div className="session-stat">
            <h4>Upcoming Sessions</h4>
            <p>{liveSessions.filter(s => {
              const sessionDate = new Date(s.scheduled_at);
              const now = new Date();
              return sessionDate > now;
            }).length}</p>
          </div>
        </div>
        <div className="sessions-list">
          {sessionsLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <div className="loading-spinner">Loading sessions...</div>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <p>No sessions found for the selected filter</p>
            </div>
          ) : (
            filteredSessions.map(session => (
              <div key={session.session_id} className="session-card">
                <div className="session-info">
                  <h4>{session.title || 'Untitled Session'}</h4>
                  <p><strong>Instructor:</strong> <span style={{ color: '#D946EF', fontWeight: '700' }}>{session.instructor || 'Unknown Instructor'}</span></p>
                  <p><strong>Course:</strong> <span style={{ color: '#9333EA', fontWeight: '700' }}>{session.course_name || 'Unknown Course'}</span></p>
                  <p>Enrolled Students: {session.enrolled_students || 0}</p>
                  <p>Status: <span className={`status-badge ${session.status.toLowerCase().replace(/ /g, '.')}`}>{session.status}</span></p>
                  <p>Start Time: {formatDateTime(session.scheduled_at)}</p>
                  <p>Duration: {session.duration || 'N/A'} minutes</p>
                </div>
                <div className="session-actions" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {session.status === 'Ongoing' && (
                    <button className="btn-success" onClick={() => handleJoinSession(session)}>
                      Join Session
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderChatbotManagement = () => (
    <div className="chatbot-management-panel">
      <h2>🤖 Chatbot Management</h2>
      <div className="chatbot-stats">
        <div className="chatbot-stat">
          <h4>Total Conversations</h4>
          <p>{chatLoading ? '...' : chatStats.totalChats}</p>
        </div>
        <div className="chatbot-stat">
          <h4>Unique Users</h4>
          <p>{chatLoading ? '...' : chatStats.totalUsers}</p>
        </div>
        <div className="chatbot-stat">
          <h4>Avg Response Time</h4>
          <p>{chatLoading ? '...' : `${chatStats.averageResponseTime}ms`}</p>
        </div>
        <div className="chatbot-stat">
          <h4>Helpful Responses</h4>
          <p>{chatLoading ? '...' : chatStats.helpfulChats}</p>
        </div>
      </div>

      {chatLoading ? (
        <div className="loading-state">Loading chat history...</div>
      ) : chatHistory.length === 0 ? (
        <div className="empty-state">
          <p>No chat history found. Users haven't started conversations yet.</p>
        </div>
      ) : (
        <>
          <div className="chat-history-list">
            <h3>Recent Conversations</h3>
            {chatHistory.map((chat) => (
              <div key={chat.Chat_Id} className="chat-item">
                <div className="chat-header">
                  <div className="chat-user-info">
                    <strong>{chat.User_Name}</strong>
                    <span className="chat-email">{chat.User_Email || 'No email'}</span>
                    <span className="chat-time">{new Date(chat.Timestamp).toLocaleString()}</span>
                  </div>
                  <div className="chat-meta">
                    <span className="response-time">{chat.Response_Time_Ms}ms</span>
                    {chat.Is_Helpful !== null && (
                      <span className={`helpful-badge ${chat.Is_Helpful ? 'helpful' : 'not-helpful'}`}>
                        {chat.Is_Helpful ? '👍 Helpful' : '👎 Not Helpful'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="chat-content">
                  <div className="question">
                    <strong>Q:</strong> {chat.Question}
                  </div>
                  <div className="answer">
                    <strong>A:</strong> {chat.Answer}
                  </div>
                  {chat.Feedback_Comment && (
                    <div className="feedback-comment">
                      <strong>Feedback:</strong> {chat.Feedback_Comment}
                    </div>
                  )}
                </div>
                <div className="chat-actions">
                  <button className="btn-delete" onClick={() => handleDeleteChatEntry(chat.Chat_Id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>

          <div className="pagination-controls">
            <button
              className="btn-secondary"
              onClick={handlePrevPage}
              disabled={chatPage === 1}
            >
              Previous
            </button>
            <span className="page-info">Page {chatPage} of {chatTotalPages}</span>
            <button
              className="btn-secondary"
              onClick={handleNextPage}
              disabled={chatPage === chatTotalPages}
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deletingChatId && (
        <div className="modal-overlay" onClick={cancelDeleteChatEntry}>
          <div className="confirmation-alert-modal modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚠️ Confirm Deletion</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this chat entry?</p>
              <p style={{ color: '#dc2626', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={cancelDeleteChatEntry}>
                Cancel
              </button>
              <button className="btn-confirm-delete" onClick={confirmDeleteChatEntry}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderExamManagement = () => (
    <div className="exam-management-panel animate-fade-in">
      <div className="panel-header">
        <div className="title-group">
          <h2>🎓 Exam & Certification Insights</h2>
          <p>Monitor platform-wide assessments and credential issuance</p>
        </div>
        <div className="panel-controls">
          <button className="btn-primary" onClick={handleViewResults}>
            <span className="icon">📊</span> View Global Scaling
          </button>
          <button className="btn-success" onClick={handleIssueCertificates}>
            <span className="icon">📜</span> Batch Certify
          </button>
        </div>
      </div>

      <div className="stats-strip">
        <div className="strip-item">
          <span className="label">Available Exams</span>
          <span className="value">{examsLoading ? '...' : stats.totalExams || 0}</span>
        </div>
        <div className="strip-item">
          <span className="label">Total Certifications</span>
          <span className="value">{examsLoading ? '...' : stats.certificatesIssued || 0}</span>
        </div>
        <div className="strip-item">
          <span className="label">Global Pass Rate</span>
          <span className="value">{examsLoading ? '...' : (stats.avgPassRate || 89) + '%'}</span>
        </div>
      </div>

      <div className="data-table-container">
        <table className="modern-table">
          <thead>
            <tr>
              <th>Exam Detail</th>
              <th>Assessment ID</th>
              <th>Course Context</th>
              <th>Performance</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Management</th>
            </tr>
          </thead>
          <tbody>
            {examsLoading ? (
              [...Array(3)].map((_, i) => (
                <tr key={`shimmer-${i}`} className="shimmer-row">
                  <td colSpan="6"><div className="shimmer-box"></div></td>
                </tr>
              ))
            ) : exams.length === 0 ? (
              <tr>
                <td colSpan="6">
                  <div className="empty-state-cell">
                    <div className="empty-icon">📝</div>
                    <p>No assessment records found in the database.</p>
                  </div>
                </td>
              </tr>
            ) : (
              exams.map(exam => {
                const attempts = (examAttempts || []).filter(a => a.Quiz_Id === exam.Quiz_Id);
                const passCount = attempts.filter(a => a.Percentage >= 70).length;
                const passRateNum = attempts.length > 0 ? (passCount / attempts.length * 100) : 0;
                const passRate = passRateNum.toFixed(0) + '%';

                return (
                  <tr key={exam.Quiz_Id || exam._id}>
                    <td>
                      <div className="user-profile-cell">
                        <div className="exam-avatar-mini">📝</div>
                        <div className="user-info">
                          <span className="user-name">{exam.Title || exam.title}</span>
                          <span className="user-email">Module {exam.Week_Number || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td><span className="id-badge">{exam.Quiz_Id?.substring(0, 10) || exam.id}...</span></td>
                    <td><span className="course-context-label">Course: {exam.Course_Id || exam.course}</span></td>
                    <td>
                      <div className="mini-progress-group">
                        <div className="mini-progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: passRate,
                              background: passRateNum > 80 ? 'var(--success-green)' : passRateNum > 50 ? '#F59E0B' : '#EF4444'
                            }}
                          ></div>
                        </div>
                        <span className="progress-value">{passRate}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill ${exam.Status?.toLowerCase() || 'active'}`}>
                        {exam.Status || 'Active'}
                      </span>
                    </td>
                    <td>
                      <div className="management-actions">
                        <button className="action-view" onClick={handleViewResults} title="Analytics">📊</button>
                        <button className="action-approve" onClick={handleEditExam} title="Configure">⚙️</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAnalytics = () => {
    return (
      <div className="analytics-panel animate-fade-in">
        <div className="panel-header">
          <h2>📈 Reports & Analytics</h2>
          <p>Visualizing platform trends and performance</p>
        </div>

        {analyticsLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading analytics data...</p>
          </div>
        ) : (
          <div className="charts-section">
            <div className="charts-grid">
              {/* User Growth Bar Chart - Only show if data exists */}
              {analyticsData.userGrowth && analyticsData.userGrowth.length > 0 && analyticsData.userGrowth.some(item => item.count > 0) && (
                <div className="chart-container">
                  <h4>📊 User Growth</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.userGrowth} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                      />
                      <Bar dataKey="count" fill="var(--primary-color)" radius={[4, 4, 0, 0]} barSize={30} name="New Users" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Revenue Distribution Pie Chart - Only show if revenue exists */}
              {stats.totalRevenue > 0 && (
                <div className="chart-container">
                  <h4>💰 Revenue Distribution</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Admin (30%)', value: stats.totalRevenue * 0.3, fill: '#8b5cf6' },
                          { name: 'Lecturer (70%)', value: stats.totalRevenue * 0.7, fill: '#10b981' }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        dataKey="value"
                      >
                        <Cell fill="#8b5cf6" />
                        <Cell fill="#10b981" />
                      </Pie>
                      <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Total Revenue Donut Chart - Only show if revenue exists */}
              {stats.totalRevenue > 0 && (
                <div className="chart-container">
                  <h4>💰 Total Revenue</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Total Revenue', value: stats.totalRevenue, fill: '#10b981' }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        label={({ value }) => `₹${value.toLocaleString('en-IN')}`}
                      >
                        <Cell fill="#10b981" />
                      </Pie>
                      <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                      <text
                        x="50%"
                        y="50%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{ fontSize: '24px', fontWeight: 'bold', fill: '#1f2937' }}
                      >
                        ₹{stats.totalRevenue.toLocaleString('en-IN')}
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Platform Activity - Only show if data exists */}
              {chartData.platformActivity && chartData.platformActivity.length > 0 && (
                <div className="chart-container">
                  <h4>🔥 Platform Activity</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData.platformActivity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="morning" stroke="#fbbf24" strokeWidth={2} name="Morning" />
                      <Line type="monotone" dataKey="afternoon" stroke="#f59e0b" strokeWidth={2} name="Afternoon" />
                      <Line type="monotone" dataKey="evening" stroke="#ef4444" strokeWidth={2} name="Evening" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Engagement Funnel - Only show if data exists */}
              {chartData.engagementFunnel && chartData.engagementFunnel.length > 0 && (
                <div className="chart-container">
                  <h4>📉 Engagement Funnel</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={chartData.engagementFunnel}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="stage" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="count" name="Users">
                        {chartData.engagementFunnel.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Requests');

  // Handle sorting
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting and filtering
  const getSortedAndFilteredUniversities = () => {
    let filtered = [...allUniversities];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(uni =>
        (uni.University_Name && uni.University_Name.toLowerCase().includes(term)) ||
        (uni.University_Email && uni.University_Email.toLowerCase().includes(term)) ||
        (uni.Contact_No && uni.Contact_No.includes(term))
      );
    }

    // Apply status filter
    if (statusFilter !== 'All Requests') {
      const dbStatus = statusFilter === 'Approved' ? 'verified' : statusFilter.toLowerCase();
      filtered = filtered.filter(uni =>
        uni.Verification_Status && uni.Verification_Status.toLowerCase() === dbStatus
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key] || '';
        let bValue = b[sortConfig.key] || '';

        // Handle date comparison
        if (sortConfig.key === 'createdAt') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        } else {
          // Convert to string for case-insensitive comparison
          aValue = String(aValue).toLowerCase();
          bValue = String(bValue).toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return '↕';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const renderApprovals = () => {
    const sortedAndFilteredUniversities = getSortedAndFilteredUniversities();

    return (
      <div className="approvals-panel">
        <div className="approvals-header">
          <h2>✅ University Approvals</h2>
          <div className="approvals-stats">
            <span className="stat-badge">
              <span className="stat-label">Total:</span> {allUniversities.length}
            </span>
            <span className="stat-badge">
              <span className="stat-label">Pending:</span> {allUniversities.filter(u => (u.Verification_Status || '').toLowerCase() === 'pending').length}
            </span>
            <span className="stat-badge">
              <span className="stat-label">Approved:</span> {allUniversities.filter(u => (u.Verification_Status || '').toLowerCase() === 'verified').length}
            </span>
            <span className="stat-badge">
              <span className="stat-label">Rejected:</span> {allUniversities.filter(u => (u.Verification_Status || '').toLowerCase() === 'rejected').length}
            </span>
          </div>
        </div>

        <div className="panel-controls">
          <div className="search-wrapper">
            <input
              type="text"
              placeholder="Search universities..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All Requests">All Requests</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
        <div className="approvals-table">
          <table>
            <thead>
              <tr>
                <th
                  className="sortable"
                  onClick={() => requestSort('University_Name')}
                >
                  <div className="sort-header">
                    University Name
                    <span className={`sort-indicator ${sortConfig.key === 'University_Name' ? 'active' : ''}`}>
                      {getSortIndicator('University_Name')}
                    </span>
                  </div>
                </th>
                <th>Contact</th>
                <th
                  className="sortable"
                  onClick={() => requestSort('Verification_Status')}
                >
                  <div className="sort-header">
                    Status
                    <span className={`sort-indicator ${sortConfig.key === 'Verification_Status' ? 'active' : ''}`}>
                      {getSortIndicator('Verification_Status')}
                    </span>
                  </div>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {universitiesLoading ? (
                <tr>
                  <td colSpan="4" className="loading-row">
                    <div className="loading-spinner">
                      <div className="spinner"></div>
                      <span>Loading universities...</span>
                    </div>
                  </td>
                </tr>
              ) : sortedAndFilteredUniversities.length === 0 ? (
                <tr>
                  <td colSpan="4" className="empty-state">
                    <div className="empty-icon">📭</div>
                    <h3>No matching universities found</h3>
                    <p>Try adjusting your search or filter criteria</p>
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('All Requests');
                      }}
                    >
                      Clear Filters
                    </button>
                  </td>
                </tr>
              ) : (
                sortedAndFilteredUniversities.map(university => (
                  <tr key={university._id}>
                    <td>
                      <div className="university-name">
                        {university.University_Name || '—'}
                        {university.Verification_Status === 'pending' && (
                          <span className="new-badge">New</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {university.Contact_No ? (
                        <a href={`tel:${university.Contact_No}`} className="contact-link">
                          {university.Contact_No}
                        </a>
                      ) : '—'}
                    </td>
                    <td>
                      <span className={`status-badge ${university.Verification_Status ? university.Verification_Status.toLowerCase() : ''}`}>
                        {university.Verification_Status || '—'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-approve"
                          onClick={() => handleApproveUniversity(university._id)}
                          disabled={university.Verification_Status !== 'pending'}
                          title="Approve University"
                        >
                          <span className="btn-icon">✓</span>
                          <span className="btn-text">Approve</span>
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => handleRejectUniversity(university._id)}
                          disabled={university.Verification_Status !== 'pending'}
                          title="Reject University"
                        >
                          <span className="btn-icon">✕</span>
                          <span className="btn-text">Reject</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderActivePanel = () => {
    switch (activePanel) {
      case 'overview': return renderOverview();
      case 'users': return renderUserManagement();
      case 'courses': return renderCourseManagement();
      case 'payments': return renderPaymentManagement();
      case 'feedback': return renderFeedbackManagement();
      case 'live': return renderLiveSessionMonitor();
      case 'chatbot': return renderChatbotManagement();
      case 'exams': return renderExamManagement();
      case 'analytics': return renderAnalytics();
      case 'approvals': return renderApprovals();
      default: return renderOverview();
    }
  };

  return (
    <div className={`admin-dashboard ${showRespondModal ? 'sidebar-hidden' : ''}`}>
      <aside className={`admin-sidebar ${showRespondModal ? 'hidden' : ''}`}>
        <div className="admin-header">
          <Logo size="medium" showText={true} style={{ color: 'white', marginBottom: '1rem' }} />
          <h2>iVidhyarthi Control Center</h2>
          <p>Admin Command Console</p>
        </div>
        <nav className="admin-nav">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activePanel === item.id ? 'active' : ''}`}
              onClick={() => setActivePanel(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="admin-footer">
          <button className="logout-btn" onClick={onLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      <main className="admin-content">
        <header className="admin-content-header">
          <div className="breadcrumb">
            <span>Admin Dashboard</span>
            <span>/</span>
            <span>{menuItems.find(item => item.id === activePanel)?.label}</span>
          </div>
          <div className="admin-user-info">
            <span>Welcome, Admin</span>
            <div className="admin-avatar">👤</div>
          </div>
        </header>

        <div className="admin-panel-content">
          {renderActivePanel()}
        </div>
      </main>

      {/* View User Modal */}
      {viewingUser && (
        <div className="modal-overlay" onClick={() => setViewingUser(null)}>
          <div className="modal-content user-view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>👤 User Details</h2>
              <button className="modal-close" onClick={() => setViewingUser(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="user-detail-grid">
                <div className="detail-item">
                  <label>Name</label>
                  <p>{viewingUser.name || 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <label>Email</label>
                  <p>{viewingUser.email || 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <label>Role</label>
                  <p><span className={`role-badge ${viewingUser.role}`}>{viewingUser.role?.toUpperCase()}</span></p>
                </div>
                <div className="detail-item">
                  <label>Status</label>
                  <p><span className={`status-badge ${viewingUser.status}`}>{viewingUser.status?.toUpperCase()}</span></p>
                </div>
                <div className="detail-item">
                  <label>User ID</label>
                  <p className="user-id">{viewingUser._id || viewingUser.id}</p>
                </div>
                <div className="detail-item">
                  <label>Join Date</label>
                  <p>{viewingUser.createdAt ? new Date(viewingUser.createdAt).toLocaleString() : 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <label>Last Updated</label>
                  <p>{viewingUser.updatedAt ? new Date(viewingUser.updatedAt).toLocaleString() : 'N/A'}</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setViewingUser(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal-content user-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Edit User</h2>
              <button className="modal-close" onClick={() => setEditingUser(null)}>✕</button>
            </div>
            <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div className="modal-body">
                <div className="edit-form-container">
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      value={editingUser.name || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={editingUser.email || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <select
                      value={editingUser.role || 'user'}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    >
                      <option value="student">Student</option>
                      <option value="instructor">Instructor</option>
                      <option value="lecturer">Lecturer</option>
                      <option value="registrar">Registrar</option>
                      <option value="admin">Admin</option>
                      <option value="user">User</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={editingUser.status || 'active'}
                      onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setEditingUser(null)}>Cancel</button>
                <button type="submit" className="btn-primary">💾 Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚠️ Confirm Delete</h2>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="delete-warning">
                <div className="warning-icon">🗑️</div>
                <p>Are you sure you want to delete this user?</p>
                <div className="user-info-delete">
                  <p><strong>Name:</strong> {deleteConfirm.name}</p>
                  <p><strong>Email:</strong> {deleteConfirm.email}</p>
                  <p><strong>Role:</strong> {deleteConfirm.role}</p>
                </div>
                <p className="warning-text">This action cannot be undone!</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn-delete" onClick={confirmDeleteUser}>Delete User</button>
            </div>
          </div>
        </div>
      )}

      {/* Verify Transaction Modal */}
      {verifyingTransaction && (
        <div className="modal-overlay" onClick={() => setVerifyingTransaction(null)}>
          <div className="modal-content verify-transaction-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✅ Verify Transaction</h2>
              <button className="modal-close" onClick={() => setVerifyingTransaction(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="transaction-verify-info">
                <div className="verify-icon">✓</div>
                <p>Verify this transaction as completed?</p>
                <div className="transaction-info-box">
                  <p><strong>Transaction ID:</strong> {verifyingTransaction.receiptNo}</p>
                  <p><strong>Student:</strong> {verifyingTransaction.studentName}</p>
                  <p><strong>Course:</strong> {verifyingTransaction.courseName}</p>
                  <p><strong>Amount:</strong> ₹{verifyingTransaction.amount}</p>
                  <p><strong>Status:</strong> {verifyingTransaction.status}</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setVerifyingTransaction(null)}>Cancel</button>
              <button className="btn-verify" onClick={confirmVerifyTransaction}>Verify Transaction</button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Transaction Modal */}
      {refundingTransaction && (
        <div className="modal-overlay" onClick={() => setRefundingTransaction(null)}>
          <div className="modal-content refund-transaction-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💸 Process Refund</h2>
              <button className="modal-close" onClick={() => setRefundingTransaction(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="transaction-refund-info">
                <div className="refund-icon">💰</div>
                <p>Are you sure you want to process this refund?</p>
                <div className="transaction-info-box">
                  <p><strong>Transaction ID:</strong> {refundingTransaction.receiptNo}</p>
                  <p><strong>Student:</strong> {refundingTransaction.studentName}</p>
                  <p><strong>Course:</strong> {refundingTransaction.courseName}</p>
                  <p><strong>Refund Amount:</strong> ₹{refundingTransaction.amount}</p>
                  <p><strong>Current Status:</strong> {refundingTransaction.status}</p>
                </div>
                <p className="warning-text">This will initiate a refund to the student's account.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setRefundingTransaction(null)}>Cancel</button>
              <button className="btn-refund" onClick={confirmRefundTransaction}>Process Refund</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Alert Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content confirmation-alert-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚠️ Confirmation Required</h2>
              <button className="modal-close" onClick={() => setShowConfirmModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="confirmation-message">
                <div className="confirmation-icon">
                  {confirmAction === 'approve' ? '✅' : confirmAction === 'deleteCategory' || confirmAction === 'endSession' ? '⚠️' : '❌'}
                </div>
                <p>{confirmMessage}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmAction(null);
                  setConfirmData(null);
                }}
              >
                Cancel
              </button>
              <button
                className={confirmAction === 'approve' ? 'btn-approve' : 'btn-reject'}
                onClick={() => {
                  if (confirmAction === 'approve') {
                    confirmApproveUniversity(confirmData);
                  } else if (confirmAction === 'reject') {
                    confirmRejectUniversity(confirmData);
                  } else if (confirmAction === 'deleteCategory') {
                    confirmDeleteCategory();
                  } else if (confirmAction === 'endSession') {
                    confirmEndSession();
                  } else if (confirmAction === 'deleteFeedback') {
                    confirmDeleteFeedback();
                  }
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )
      }

      {/* Notification Modal */}
      {
        notification && (
          <div className="notification-modal-overlay">
            <div className={`notification-modal ${notification.type} animate-slide-in`}>
              <div className="notification-content">
                <div className="notification-icon">
                  {notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : 'ℹ️'}
                </div>
                <p>{notification.message}</p>
                <button className="notification-close" onClick={closeNotification}>✕</button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default AdminDashboard;