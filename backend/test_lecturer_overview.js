// Test script for lecturer overview API
// Run with: node backend/test_lecturer_overview.js

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:5000/api';

async function testLecturerOverview() {
  console.log('🧪 Testing Lecturer Overview API\n');

  // Test 1: Health check
  console.log('1️⃣ Testing backend health...');
  try {
    const healthRes = await fetch(`${API_BASE_URL}/health`);
    const health = await healthRes.json();
    if (health.success) {
      console.log('✅ Backend is running\n');
    } else {
      console.log('❌ Backend health check failed\n');
      return;
    }
  } catch (err) {
    console.error('❌ Cannot connect to backend:', err.message);
    console.log('💡 Make sure server is running: cd backend && npm start\n');
    return;
  }

  // Test 2: Test with a sample email (replace with real lecturer email)
  const testEmail = '22bmiit112@gmail.com'; // Replace with actual lecturer email
  console.log(`2️⃣ Testing overview for lecturer: ${testEmail}`);
  
  try {
    const url = `${API_BASE_URL}/lecturer-overview/${encodeURIComponent(testEmail)}`;
    console.log(`   Request: GET ${url}`);
    
    const response = await fetch(url);
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ API Response: SUCCESS\n');
      console.log('📊 Overview Data:');
      console.log(`   - Total Students: ${result.data.totalStudents}`);
      console.log(`   - Total Enrollments: ${result.data.totalEnrollments}`);
      console.log(`   - Total Courses: ${result.data.totalCourses}`);
      console.log(`   - Active Courses: ${result.data.activeCourses}`);
      console.log(`   - Total Materials: ${result.data.totalMaterials}`);
      console.log(`   - Total Assignments: ${result.data.totalAssignments}`);
      console.log(`   - Recent Enrollments (30d): ${result.data.recentEnrollments}`);
      console.log(`   - Growth Percentage: ${result.data.growthPercentage}`);
      console.log(`   - Course Enrollment Data: ${result.data.courseEnrollmentData.length} courses`);
      console.log('\n✅ All tests passed! 🎉\n');
    } else {
      console.log(`❌ API Error: ${response.status} ${response.statusText}`);
      console.log(`   Message: ${result.message || 'Unknown error'}`);
      console.log(`   Details: ${JSON.stringify(result, null, 2)}\n`);
    }
  } catch (err) {
    console.error('❌ Request failed:', err.message, '\n');
  }

  // Test 3: Test with invalid email
  console.log('3️⃣ Testing with invalid email...');
  try {
    const url = `${API_BASE_URL}/lecturer-overview/invalid@email.com`;
    const response = await fetch(url);
    const result = await response.json();
    
    if (response.status === 404 && !result.success) {
      console.log('✅ Correctly returns 404 for invalid email\n');
    } else {
      console.log('⚠️ Expected 404, got:', response.status, '\n');
    }
  } catch (err) {
    console.error('❌ Test failed:', err.message, '\n');
  }
}

// Run tests
testLecturerOverview().then(() => {
  console.log('🏁 Test completed');
  process.exit(0);
}).catch(err => {
  console.error('💥 Test suite failed:', err);
  process.exit(1);
});
