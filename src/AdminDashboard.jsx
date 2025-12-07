import React, { useState, useEffect } from 'react';
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
    totalFeedback: 0,
    liveSessions: 0,
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

  // All university requests (pending, approved, rejected)
  const [pendingUniversities, setPendingUniversities] = useState([]);
  const [universitiesLoading, setUniversitiesLoading] = useState(false);

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

      setPendingUniversities(universitiesWithContact);

      // Update stats with real data
      const pendingCount = universitiesWithContact.filter(u => u.Verification_Status === 'pending').length;
      setStats(prev => ({
        ...prev,
        pendingApprovals: pendingCount
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
            setPendingUniversities(fallbackResult.data.map(uni => ({ ...uni, Contact_No: '—' })));
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
          const pendingCount = approvalsResult.data.filter(u => u.Verification_Status === 'pending').length;
          updatedStats.pendingApprovals = pendingCount;
          console.log('✅ Pending approvals updated:', pendingCount);
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

  // Fetch students from MongoDB
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token') || '';

      // Check if we have a token
      if (!token) {
        console.error('No authentication token found');
        alert('Please log in to access user management');
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
  const handleApproveUniversity = async (universityId) => {
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
        alert('University approved successfully!');
        fetchPendingUniversities(); // Refresh the list
      } else {
        alert('Failed to approve university: ' + result.message);
      }
    } catch (error) {
      console.error('Error approving university:', error);
      alert('Error approving university');
    }
  };

  const handleRejectUniversity = async (universityId) => {
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
        alert('University rejected successfully!');
        fetchPendingUniversities(); // Refresh the list
      } else {
        alert('Failed to reject university: ' + result.message);
      }
    } catch (error) {
      console.error('Error rejecting university:', error);
      alert('Error rejecting university');
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
        const pendingCount = result.data.filter(c => c.status === 'pending').length;
        const approvedCount = result.data.filter(c => c.status === 'approved').length;

        setStats(prev => ({
          ...prev,
          activeCourses: approvedCount,
          pendingApprovals: prev.pendingApprovals + pendingCount
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
        alert('✓ Course approved successfully!');
        fetchCourses(); // Refresh course list
      } else {
        alert('Failed to approve course: ' + result.message);
      }
    } catch (error) {
      console.error('Error approving course:', error);
      alert('Error approving course. Please try again.');
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
        alert('✓ Course rejected!');
        fetchCourses(); // Refresh course list
      } else {
        alert('Failed to reject course: ' + result.message);
      }
    } catch (error) {
      console.error('Error rejecting course:', error);
      alert('Error rejecting course. Please try again.');
    }
  };

  const handleViewCourse = (course) => {
    setViewingCourse(course);
  };

  const closeViewCourse = () => {
    setViewingCourse(null);
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
        alert('Category added successfully!');
      } else {
        alert(result.message || 'Failed to add category');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Error adding category. Please try again.');
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
        alert('Category updated successfully!');
      } else {
        alert(result.message || 'Failed to update category');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Error updating category. Please try again.');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/course-categories/${categoryId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setCategories(categories.filter(cat => cat._id !== categoryId));
        alert('Category deleted successfully!');
      } else {
        alert(result.message || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error deleting category. Please try again.');
    }
  };

  // Course management handlers removed as per requirements

  const [transactions, setTransactions] = useState([
    { id: 1, user: 'Om Jariwala', course: 'React for Beginners', amount: 799, status: 'Completed', date: '2024-03-15' },
    { id: 2, user: 'Raj Panchal', course: 'Python Programming', amount: 699, status: 'Pending', date: '2024-03-16' },
    { id: 3, user: 'Sneh Prjapati', course: 'Machine Learning', amount: 899, status: 'Completed', date: '2024-03-14' }
  ]);

  // Action handlers for Payment & Transactions
  const handleVerifyTransaction = (transactionId) => {
    setTransactions(transactions.map(transaction =>
      transaction.id === transactionId ? { ...transaction, status: 'Verified' } : transaction
    ));
    alert('Transaction verified successfully!');
  };

  const handleRefundTransaction = (transactionId) => {
    if (window.confirm('Are you sure you want to process this refund?')) {
      setTransactions(transactions.map(transaction =>
        transaction.id === transactionId ? { ...transaction, status: 'Refunded' } : transaction
      ));
      alert('Refund processed successfully!');
    }
  };

  const [feedback, setFeedback] = useState([
    { id: 1, user: 'Sneh Prjapati', course: 'React for Beginners', rating: 5, comment: 'Excellent course!', status: 'Approved' },
    { id: 2, user: 'Poorav Shah', course: 'Python Programming', rating: 4, comment: 'Good content, needs improvement', status: 'Pending' }
  ]);

  // Action handlers for Feedback Management
  const handleApproveFeedback = (feedbackId) => {
    setFeedback(feedback.map(fb =>
      fb.id === feedbackId ? { ...fb, status: 'Approved' } : fb
    ));
    alert('Feedback approved!');
  };

  const handleRejectFeedback = (feedbackId) => {
    setFeedback(feedback.map(fb =>
      fb.id === feedbackId ? { ...fb, status: 'Rejected' } : fb
    ));
    alert('Feedback rejected!');
  };

  const handleEditFeedback = (feedbackId) => {
    alert(`Editing feedback with ID: ${feedbackId}`);
    // Implementation: Open feedback edit modal
  };

  const [liveSessions, setLiveSessions] = useState([
    { id: 1, title: 'React Hooks Deep Dive', instructor: 'Abha Ma\'am', participants: 23, status: 'Live', startTime: '10:00 AM' },
    { id: 2, title: 'Python Basics Q&A', instructor: 'Rakesh Sir', participants: 15, status: 'Scheduled', startTime: '2:00 PM' }
  ]);

  // Action handlers for Live Session Monitor
  const handleMonitorSession = (sessionId) => {
    alert(`Monitoring session with ID: ${sessionId}`);
    // Implementation: Open session monitoring interface
  };

  const handleModerateSession = (sessionId) => {
    alert(`Moderating session with ID: ${sessionId}`);
    // Implementation: Open moderation controls
  };

  const handleEndSession = (sessionId) => {
    if (window.confirm('Are you sure you want to end this session?')) {
      setLiveSessions(liveSessions.map(session =>
        session.id === sessionId ? { ...session, status: 'Ended' } : session
      ));
      alert('Session ended successfully!');
    }
  };

  // Action handlers for Chatbot Management
  const handleManageFAQ = () => {
    alert('Opening FAQ management interface...');
    // Implementation: Navigate to FAQ management
  };

  const handleTrainBot = () => {
    alert('Opening bot training interface...');
    // Implementation: Navigate to bot training
  };

  const handleViewLogs = () => {
    alert('Opening chatbot logs...');
    // Implementation: Navigate to logs viewer
  };

  const handleEditChatbot = () => {
    alert('Opening chatbot configuration...');
    // Implementation: Navigate to chatbot settings
  };

  const handleDeleteChatbot = () => {
    if (window.confirm('Are you sure you want to delete chatbot data?')) {
      alert('Chatbot data deleted!');
    }
  };

  const [exams, setExams] = useState([
    { id: 1, title: 'React Final Assessment', course: 'React for Beginners', participants: 45, status: 'Active', passRate: '87%' },
    { id: 2, title: 'Python Certification', course: 'Python Programming', participants: 32, status: 'Completed', passRate: '92%' }
  ]);

  const handleViewResults = () => {
    alert('Opening exam results viewer...');
    // Implementation: Navigate to results dashboard
  };

  const handleEditExam = () => {
    alert('Opening exam editor...');
    // Implementation: Navigate to exam creation/edit interface
  };

  const handleIssueCertificates = () => {
    alert('Processing certificate issuance...');
    // Implementation: Batch certificate generation
  };

  const menuItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: '📊' },
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'courses', label: 'Course Categories', icon: '📚' },
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
        <div className="stat-card users">
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
        <div className="stat-card revenue">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3 className={statsLoading ? 'loading' : ''}>
              {statsLoading ? 'Loading...' : `₹${stats.totalRevenue.toLocaleString('en-IN')}`}
            </h3>
            <p>Total Revenue</p>
            <span className={`stat-trend ${statsLoading ? 'loading' : ''}`}>
              {statsLoading ? 'Fetching data...' : (
                stats.totalRevenue > 0 
                  ? `from ${stats.totalUsers} users` 
                  : 'No transactions yet'
              )}
            </span>
          </div>
        </div>
        <div className="stat-card courses">
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
        <div className="stat-card pending">
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
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button className="action-btn" onClick={() => setActivePanel('users')}>
            <span className="action-icon">👥</span>
            <span className="action-label">Manage Users</span>
          </button>
          <button className="action-btn" onClick={() => setActivePanel('courses')}>
            <span className="action-icon">📚</span>
            <span className="action-label">Review Courses</span>
          </button>
          <button className="action-btn" onClick={() => setActivePanel('payments')}>
            <span className="action-icon">💳</span>
            <span className="action-label">Check Payments</span>
          </button>
          <button className="action-btn" onClick={() => setActivePanel('feedback')}>
            <span className="action-icon">⭐</span>
            <span className="action-label">Review Feedback</span>
          </button>
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
          <button className="btn-primary">Add New User</button>
          <button className="btn-secondary">Export Users</button>
          <input type="text" placeholder="Search users..." className="search-input" />
        </div>
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Join Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                    <div className="loading-spinner">Loading users...</div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
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
                    <td>
                      <span className={`status-badge ${(user.status || 'active').toLowerCase()}`}>
                        {user.status || 'Active'}
                      </span>
                    </td>
                    <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-edit"
                          onClick={() => handleEditUser(user._id || user.id)}
                        >
                          EDIT
                        </button>
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
          ) : courses.filter(course => (course.status || 'pending') === 'pending').length > 0 ? (
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
                  .filter(course => (course.status || 'pending') === 'pending')
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
          ) : courses.filter(course => course.status === 'approved').length > 0 ? (
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
                  .filter(course => course.status === 'approved')
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
          <p>₹{stats.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="payment-stat">
          <h4>Pending Payments</h4>
          <p>₹12,450</p>
        </div>
        <div className="payment-stat">
          <h4>Refunds Processed</h4>
          <p>₹3,200</p>
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
            {transactions.map(transaction => (
              <tr key={transaction.id}>
                <td>#{transaction.id.toString().padStart(6, '0')}</td>
                <td>{transaction.user}</td>
                <td>{transaction.course}</td>
                <td>₹{transaction.amount}</td>
                <td><span className={`status-badge ${transaction.status.toLowerCase()}`}>{transaction.status}</span></td>
                <td>{transaction.date}</td>
                <td>
                  <button className="btn-verify" onClick={() => handleVerifyTransaction(transaction.id)}>Verify</button>
                  <button className="btn-refund" onClick={() => handleRefundTransaction(transaction.id)}>Refund</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderFeedbackManagement = () => (
    <div className="feedback-management-panel">
      <h2>⭐ Feedback & Review Management</h2>
      <div className="feedback-stats">
        <div className="feedback-stat">
          <h4>Total Reviews</h4>
          <p>{stats.totalFeedback}</p>
        </div>
        <div className="feedback-stat">
          <h4>Average Rating</h4>
          <p>4.6 ⭐</p>
        </div>
        <div className="feedback-stat">
          <h4>Pending Reviews</h4>
          <p>12</p>
        </div>
      </div>
      <div className="feedback-list">
        {feedback.map(review => (
          <div key={review.id} className="feedback-card">
            <div className="feedback-header">
              <h4>{review.user}</h4>
              <div className="rating">
                {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
              </div>
              <span className={`status-badge ${review.status.toLowerCase()}`}>{review.status}</span>
            </div>
            <p><strong>Course:</strong> {review.course}</p>
            <p className="feedback-comment">"{review.comment}"</p>
            <div className="feedback-actions">
              <button className="btn-approve" onClick={() => handleApproveFeedback(review.id)}>Approve</button>
              <button className="btn-reject" onClick={() => handleRejectFeedback(review.id)}>Reject</button>
              <button className="btn-edit" onClick={() => handleEditFeedback(review.id)}>Edit</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLiveSessionMonitor = () => (
    <div className="live-session-panel">
      <h2>🎥 Live Session Monitor</h2>
      <div className="session-stats">
        <div className="session-stat">
          <h4>Active Sessions</h4>
          <p>{stats.liveSessions}</p>
        </div>
        <div className="session-stat">
          <h4>Total Participants</h4>
          <p>127</p>
        </div>
        <div className="session-stat">
          <h4>Sessions Today</h4>
          <p>8</p>
        </div>
      </div>
      <div className="sessions-list">
        {liveSessions.map(session => (
          <div key={session.id} className="session-card">
            <div className="session-info">
              <h4>{session.title}</h4>
              <p>Instructor: {session.instructor}</p>
              <p>Participants: {session.participants}</p>
              <p>Status: <span className={`status-badge ${session.status.toLowerCase()}`}>{session.status}</span></p>
              <p>Start Time: {session.startTime}</p>
            </div>
            <div className="session-actions">
              <button className="btn-monitor" onClick={() => handleMonitorSession(session.id)}>Monitor</button>
              <button className="btn-moderate" onClick={() => handleModerateSession(session.id)}>Moderate</button>
              <button className="btn-end" onClick={() => handleEndSession(session.id)}>End Session</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderChatbotManagement = () => (
    <div className="chatbot-management-panel">
      <h2>🤖 Chatbot Management</h2>
      <div className="chatbot-stats">
        <div className="chatbot-stat">
          <h4>Total FAQs</h4>
          <p>156</p>
        </div>
        <div className="chatbot-stat">
          <h4>Queries Today</h4>
          <p>89</p>
        </div>
        <div className="chatbot-stat">
          <h4>Response Rate</h4>
          <p>94%</p>
        </div>
      </div>
      <div className="chatbot-actions">
        <button className="btn-primary" onClick={handleManageFAQ}>Manage FAQ</button>
        <button className="btn-secondary" onClick={handleTrainBot}>Train Bot</button>
        <button className="btn-info" onClick={handleViewLogs}>View Logs</button>
        <button className="btn-edit" onClick={handleEditChatbot}>Edit Settings</button>
        <button className="btn-delete" onClick={handleDeleteChatbot}>Delete Data</button>
      </div>
      <div className="faq-list">
        <div className="faq-item">
          <h4>How to enroll in a course?</h4>
          <p>Click on the "Enroll Now" button on any course card and complete the payment process.</p>
          <div className="faq-actions">
            <button className="btn-edit">Edit</button>
            <button className="btn-delete">Delete</button>
          </div>
        </div>
        <div className="faq-item">
          <h4>What payment methods are accepted?</h4>
          <p>We accept all major credit cards, debit cards, UPI, and net banking.</p>
          <div className="faq-actions">
            <button className="btn-edit">Edit</button>
            <button className="btn-delete">Delete</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderExamManagement = () => (
    <div className="exam-management-panel">
      <h2>🎓 Exam & Certification Management</h2>
      <div className="exam-stats">
        <div className="exam-stat">
          <h4>Total Exams</h4>
          <p>{stats.totalExams}</p>
        </div>
        <div className="exam-stat">
          <h4>Certificates Issued</h4>
          <p>{stats.certificatesIssued}</p>
        </div>
        <div className="exam-stat">
          <h4>Average Pass Rate</h4>
          <p>89%</p>
        </div>
      </div>
      <div className="panel-controls">
        <button className="btn-primary" onClick={handleViewResults}>View Results</button>
        <button className="btn-secondary" onClick={handleEditExam}>Edit Exam</button>
        <button className="btn-success" onClick={handleIssueCertificates}>Issue Certificates</button>
        <button className="btn-secondary">Export Results</button>
      </div>
      <div className="exams-list">
        {exams.map(exam => (
          <div key={exam.id} className="exam-card">
            <div className="exam-header">
              <h4>{exam.title}</h4>
              <span className={`status-badge ${exam.status.toLowerCase()}`}>{exam.status}</span>
            </div>
            <p><strong>Course:</strong> {exam.course}</p>
            <p><strong>Participants:</strong> {exam.participants}</p>
            <p><strong>Pass Rate:</strong> {exam.passRate}</p>
            <div className="exam-actions">
              <button className="btn-view">View Results</button>
              <button className="btn-edit">Edit Exam</button>
              <button className="btn-certificate">Issue Certificates</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="analytics-panel">
      <h2>📈 Reports & Analytics</h2>
      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>User Growth</h3>
          <div className="chart-placeholder">
            <p>📊 User registration trends over time</p>
            <div className="mock-chart">
              <div className="chart-bar" style={{ height: '60%' }}></div>
              <div className="chart-bar" style={{ height: '80%' }}></div>
              <div className="chart-bar" style={{ height: '70%' }}></div>
              <div className="chart-bar" style={{ height: '90%' }}></div>
              <div className="chart-bar" style={{ height: '100%' }}></div>
            </div>
          </div>
        </div>
        <div className="analytics-card">
          <h3>Revenue Analytics</h3>
          <div className="chart-placeholder">
            <p>💰 Monthly revenue breakdown</p>
            <div className="revenue-breakdown">
              <div className="revenue-item">
                <span>Course Sales</span>
                <span>₹67,890</span>
              </div>
              <div className="revenue-item">
                <span>Certifications</span>
                <span>₹15,670</span>
              </div>
              <div className="revenue-item">
                <span>Live Sessions</span>
                <span>₹5,890</span>
              </div>
            </div>
          </div>
        </div>
        <div className="analytics-card">
          <h3>Course Performance</h3>
          <div className="chart-placeholder">
            <p>📚 Most popular courses</p>
            <div className="course-performance">
              <div className="performance-item">
                <span>React for Beginners</span>
                <div className="progress-bar">
                  <div className="progress" style={{ width: '90%' }}></div>
                </div>
              </div>
              <div className="performance-item">
                <span>Python Programming</span>
                <div className="progress-bar">
                  <div className="progress" style={{ width: '75%' }}></div>
                </div>
              </div>
              <div className="performance-item">
                <span>Machine Learning</span>
                <div className="progress-bar">
                  <div className="progress" style={{ width: '85%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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
    let filtered = [...pendingUniversities];

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
      filtered = filtered.filter(uni =>
        uni.Verification_Status && uni.Verification_Status.toLowerCase() === statusFilter.toLowerCase()
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
              <span className="stat-label">Total:</span> {pendingUniversities.length}
            </span>
            <span className="stat-badge">
              <span className="stat-label">Pending:</span> {pendingUniversities.filter(u => u.Verification_Status === 'pending').length}
            </span>
            <span className="stat-badge">
              <span className="stat-label">Approved:</span> {pendingUniversities.filter(u => u.Verification_Status === 'verified').length}
            </span>
            <span className="stat-badge">
              <span className="stat-label">Rejected:</span> {pendingUniversities.filter(u => u.Verification_Status === 'rejected').length}
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
                <th
                  className="sortable"
                  onClick={() => requestSort('createdAt')}
                >
                  <div className="sort-header">
                    Request Date
                    <span className={`sort-indicator ${sortConfig.key === 'createdAt' ? 'active' : ''}`}>
                      {getSortIndicator('createdAt')}
                    </span>
                  </div>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {universitiesLoading ? (
                <tr>
                  <td colSpan="5" className="loading-row">
                    <div className="loading-spinner">
                      <div className="spinner"></div>
                      <span>Loading universities...</span>
                    </div>
                  </td>
                </tr>
              ) : sortedAndFilteredUniversities.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-state">
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
                      <div className="date-cell">
                        <span className="date">
                          {university.createdAt ? new Date(university.createdAt).toLocaleDateString() : '—'}
                        </span>
                        <span className="time">
                          {university.createdAt ? new Date(university.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
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
                        <button
                          className="btn-view"
                          onClick={() => handleViewUser(university._id)}
                          title="View Details"
                        >
                          <span className="btn-icon">👁️</span>
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
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
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
    </div>
  );
};

export default AdminDashboard;