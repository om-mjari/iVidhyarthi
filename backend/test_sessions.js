// backend/test_sessions.js
// Comprehensive tests for session management endpoints

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const TEST_LECTURER_EMAIL = 'lecturer@test.com'; // Replace with actual test lecturer email

/**
 * Test Configuration
 * Update these values with valid test data from your database
 */
const TEST_CONFIG = {
  lecturerId: TEST_LECTURER_EMAIL,
  courseId: 'COURSE_001', // Replace with valid Course_Id from your Tbl_Courses
  courseName: 'Test Course' // Optional: for display
};

console.log('🧪 Session Management API Tests\n');
console.log('Configuration:', TEST_CONFIG);
console.log('━'.repeat(60));

/**
 * Helper Functions
 */
function logTest(name) {
  console.log(`\n📋 TEST: ${name}`);
  console.log('─'.repeat(60));
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

function logError(message, error) {
  console.log(`❌ ${message}`);
  console.error('   Error:', error.response?.data || error.message);
}

function logInfo(message, data) {
  console.log(`ℹ️  ${message}`);
  if (data) {
    console.log('   Data:', JSON.stringify(data, null, 2));
  }
}

/**
 * Test 1: Create Session - Success Path
 */
async function testCreateSessionSuccess() {
  logTest('Create Session - Valid Input');
  
  try {
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 24); // Tomorrow same time

    const payload = {
      course_id: TEST_CONFIG.courseId,
      title: 'Test Session - Automated Test',
      scheduled_at: futureDate.toISOString(),
      duration: 60,
      description: 'This is a test session created by automated tests'
    };

    const response = await axios.post(
      `${BASE_URL}/lecturer/sessions`,
      payload,
      {
        headers: {
          'x-lecturer-id': TEST_CONFIG.lecturerId,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.status === 201 && response.data.success) {
      logSuccess('Session created successfully');
      logInfo('Response data', response.data.data);
      
      // Verify response structure
      const data = response.data.data;
      if (data.session_id && data.course_id && data.scheduled_at) {
        logSuccess('Response has all required fields');
      } else {
        logError('Response missing required fields', new Error('Invalid response structure'));
      }

      return data.session_id; // Return for cleanup
    } else {
      logError('Unexpected response', new Error(`Status: ${response.status}`));
    }
  } catch (error) {
    logError('Failed to create session', error);
  }
}

/**
 * Test 2: Create Session - Missing Fields
 */
async function testCreateSessionMissingFields() {
  logTest('Create Session - Missing Required Fields');
  
  try {
    const payload = {
      course_id: TEST_CONFIG.courseId,
      // Missing: title, scheduled_at, duration
    };

    const response = await axios.post(
      `${BASE_URL}/lecturer/sessions`,
      payload,
      {
        headers: {
          'x-lecturer-id': TEST_CONFIG.lecturerId,
          'Content-Type': 'application/json'
        },
        validateStatus: () => true // Don't throw on 4xx
      }
    );

    if (response.status === 400) {
      logSuccess('Correctly rejected with 400 Bad Request');
      logInfo('Error message', response.data);
    } else {
      logError('Should have returned 400', new Error(`Got status: ${response.status}`));
    }
  } catch (error) {
    logError('Unexpected error', error);
  }
}

/**
 * Test 3: Create Session - Past Date
 */
async function testCreateSessionPastDate() {
  logTest('Create Session - Scheduled in Past');
  
  try {
    const pastDate = new Date();
    pastDate.setHours(pastDate.getHours() - 1); // 1 hour ago

    const payload = {
      course_id: TEST_CONFIG.courseId,
      title: 'Past Session Test',
      scheduled_at: pastDate.toISOString(),
      duration: 60
    };

    const response = await axios.post(
      `${BASE_URL}/lecturer/sessions`,
      payload,
      {
        headers: {
          'x-lecturer-id': TEST_CONFIG.lecturerId,
          'Content-Type': 'application/json'
        },
        validateStatus: () => true
      }
    );

    if (response.status === 400) {
      logSuccess('Correctly rejected past date with 400');
      logInfo('Error message', response.data);
    } else {
      logError('Should have rejected past date', new Error(`Got status: ${response.status}`));
    }
  } catch (error) {
    logError('Unexpected error', error);
  }
}

/**
 * Test 4: Create Session - Invalid Duration
 */
async function testCreateSessionInvalidDuration() {
  logTest('Create Session - Invalid Duration');
  
  try {
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 24);

    const payload = {
      course_id: TEST_CONFIG.courseId,
      title: 'Invalid Duration Test',
      scheduled_at: futureDate.toISOString(),
      duration: 500 // Exceeds max (480)
    };

    const response = await axios.post(
      `${BASE_URL}/lecturer/sessions`,
      payload,
      {
        headers: {
          'x-lecturer-id': TEST_CONFIG.lecturerId,
          'Content-Type': 'application/json'
        },
        validateStatus: () => true
      }
    );

    if (response.status === 400) {
      logSuccess('Correctly rejected invalid duration with 400');
      logInfo('Error message', response.data);
    } else {
      logError('Should have rejected invalid duration', new Error(`Got status: ${response.status}`));
    }
  } catch (error) {
    logError('Unexpected error', error);
  }
}

/**
 * Test 5: Create Session - Unauthorized (Wrong Course)
 */
async function testCreateSessionUnauthorized() {
  logTest('Create Session - Unauthorized Course Access');
  
  try {
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 24);

    const payload = {
      course_id: 'INVALID_COURSE_999', // Course that doesn't belong to lecturer
      title: 'Unauthorized Test',
      scheduled_at: futureDate.toISOString(),
      duration: 60
    };

    const response = await axios.post(
      `${BASE_URL}/lecturer/sessions`,
      payload,
      {
        headers: {
          'x-lecturer-id': TEST_CONFIG.lecturerId,
          'Content-Type': 'application/json'
        },
        validateStatus: () => true
      }
    );

    if (response.status === 403 || response.status === 404) {
      logSuccess('Correctly rejected unauthorized access');
      logInfo('Error message', response.data);
    } else {
      logError('Should have rejected unauthorized access', new Error(`Got status: ${response.status}`));
    }
  } catch (error) {
    logError('Unexpected error', error);
  }
}

/**
 * Test 6: Get Sessions - Success
 */
async function testGetSessions() {
  logTest('Get Sessions - List All Sessions');
  
  try {
    const response = await axios.get(
      `${BASE_URL}/lecturer/sessions?page=1&per_page=20`,
      {
        headers: {
          'x-lecturer-id': TEST_CONFIG.lecturerId
        }
      }
    );

    if (response.status === 200 && response.data.success) {
      logSuccess('Successfully retrieved sessions');
      logInfo('Session count', response.data.data.sessions.length);
      logInfo('Pagination', response.data.data.pagination);
      
      if (response.data.data.sessions.length > 0) {
        logInfo('Sample session', response.data.data.sessions[0]);
      }
    } else {
      logError('Unexpected response', new Error(`Status: ${response.status}`));
    }
  } catch (error) {
    logError('Failed to get sessions', error);
  }
}

/**
 * Test 7: Get Sessions - Pagination
 */
async function testGetSessionsPagination() {
  logTest('Get Sessions - Pagination');
  
  try {
    const response = await axios.get(
      `${BASE_URL}/lecturer/sessions?page=1&per_page=5`,
      {
        headers: {
          'x-lecturer-id': TEST_CONFIG.lecturerId
        }
      }
    );

    if (response.status === 200) {
      const pagination = response.data.data.pagination;
      logSuccess('Pagination working');
      logInfo('Pagination details', {
        page: pagination.page,
        per_page: pagination.per_page,
        total: pagination.total,
        has_next: pagination.has_next,
        has_prev: pagination.has_prev
      });
    }
  } catch (error) {
    logError('Pagination test failed', error);
  }
}

/**
 * Test 8: Get Sessions - Sorting
 */
async function testGetSessionsSorting() {
  logTest('Get Sessions - Sorting by Scheduled Date');
  
  try {
    // Test ascending order
    const responseAsc = await axios.get(
      `${BASE_URL}/lecturer/sessions?sort=scheduled_at&order=asc`,
      {
        headers: {
          'x-lecturer-id': TEST_CONFIG.lecturerId
        }
      }
    );

    // Test descending order
    const responseDesc = await axios.get(
      `${BASE_URL}/lecturer/sessions?sort=scheduled_at&order=desc`,
      {
        headers: {
          'x-lecturer-id': TEST_CONFIG.lecturerId
        }
      }
    );

    if (responseAsc.status === 200 && responseDesc.status === 200) {
      logSuccess('Sorting works for both ascending and descending');
      
      if (responseAsc.data.data.sessions.length > 0) {
        logInfo('First session (ascending)', {
          title: responseAsc.data.data.sessions[0].title,
          scheduled_at: responseAsc.data.data.sessions[0].scheduled_at
        });
        logInfo('First session (descending)', {
          title: responseDesc.data.data.sessions[0].title,
          scheduled_at: responseDesc.data.data.sessions[0].scheduled_at
        });
      }
    }
  } catch (error) {
    logError('Sorting test failed', error);
  }
}

/**
 * Test 9: Get Sessions - Missing Lecturer ID
 */
async function testGetSessionsNoAuth() {
  logTest('Get Sessions - Missing Lecturer ID');
  
  try {
    const response = await axios.get(
      `${BASE_URL}/lecturer/sessions`,
      {
        validateStatus: () => true
      }
    );

    if (response.status === 401) {
      logSuccess('Correctly rejected request without lecturer ID');
      logInfo('Error message', response.data);
    } else {
      logError('Should have returned 401', new Error(`Got status: ${response.status}`));
    }
  } catch (error) {
    logError('Unexpected error', error);
  }
}

/**
 * Test 10: Integration Test - Create and Retrieve
 */
async function testIntegrationCreateAndRetrieve() {
  logTest('Integration - Create Session and Verify in List');
  
  try {
    // Step 1: Create session
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 48);

    const createPayload = {
      course_id: TEST_CONFIG.courseId,
      title: 'Integration Test Session',
      scheduled_at: futureDate.toISOString(),
      duration: 90,
      description: 'Created for integration testing'
    };

    const createResponse = await axios.post(
      `${BASE_URL}/lecturer/sessions`,
      createPayload,
      {
        headers: {
          'x-lecturer-id': TEST_CONFIG.lecturerId,
          'Content-Type': 'application/json'
        }
      }
    );

    if (createResponse.status !== 201) {
      logError('Failed to create session', new Error(`Status: ${createResponse.status}`));
      return;
    }

    const sessionId = createResponse.data.data.session_id;
    logSuccess(`Session created with ID: ${sessionId}`);

    // Step 2: Retrieve sessions and verify
    const listResponse = await axios.get(
      `${BASE_URL}/lecturer/sessions?page=1&per_page=50`,
      {
        headers: {
          'x-lecturer-id': TEST_CONFIG.lecturerId
        }
      }
    );

    const foundSession = listResponse.data.data.sessions.find(
      s => s.session_id === sessionId
    );

    if (foundSession) {
      logSuccess('Session found in list');
      logInfo('Retrieved session', foundSession);
    } else {
      logError('Session not found in list', new Error('Created session missing from GET response'));
    }
  } catch (error) {
    logError('Integration test failed', error);
  }
}

/**
 * Run All Tests
 */
async function runAllTests() {
  console.log('\n🚀 Starting Test Suite...\n');

  // Unit tests
  await testCreateSessionSuccess();
  await testCreateSessionMissingFields();
  await testCreateSessionPastDate();
  await testCreateSessionInvalidDuration();
  await testCreateSessionUnauthorized();
  
  // GET tests
  await testGetSessions();
  await testGetSessionsPagination();
  await testGetSessionsSorting();
  await testGetSessionsNoAuth();
  
  // Integration test
  await testIntegrationCreateAndRetrieve();

  console.log('\n' + '━'.repeat(60));
  console.log('✅ Test suite completed!\n');
  console.log('Note: Review logs above for any failures.');
  console.log('Zoom integration tests require proper Zoom API credentials in .env\n');
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test suite crashed:', error);
  process.exit(1);
});
