const axios = require('axios');

const userId = '6929525c02d64e0017d0e3b7'; // The ID from check_user_profile.js

async function testProfileApi() {
  try {
    console.log(`Testing API: http://localhost:5000/api/auth/student-profile/${userId}`);
    const response = await axios.get(`http://localhost:5000/api/auth/student-profile/${userId}`);
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
  } catch (error) {
    console.error('Error calling API:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

testProfileApi();
