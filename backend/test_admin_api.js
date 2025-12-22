const axios = require('axios');

async function checkApi() {
    try {
        const response = await axios.get('http://localhost:5000/api/admin/sessions', {
            headers: {
                'Authorization': 'Bearer admin_mock_token_123',
                'Content-Type': 'application/json'
            }
        });
        console.log('API_SESSIONS_DATA:', JSON.stringify(response.data, null, 2));
    } catch (e) {
        console.error('API_ERROR:', e.message);
        if (e.response) {
            console.error('API_RESPONSE_ERROR:', e.response.data);
        }
    }
}

checkApi();
