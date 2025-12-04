// backend/config/zoom.js
// Zoom API integration for creating meetings server-side

const axios = require('axios');

/**
 * Zoom API Configuration
 * 
 * Setup Instructions:
 * 1. Create a Server-to-Server OAuth app in Zoom Marketplace
 * 2. Add these credentials to your .env file:
 *    ZOOM_ACCOUNT_ID=your_account_id
 *    ZOOM_CLIENT_ID=your_client_id
 *    ZOOM_CLIENT_SECRET=your_client_secret
 * 3. Grant necessary scopes: meeting:write, meeting:read
 */

class ZoomService {
  constructor() {
    // Trim credentials to remove any whitespace
    this.accountId = process.env.ZOOM_ACCOUNT_ID?.trim();
    this.clientId = process.env.ZOOM_CLIENT_ID?.trim();
    this.clientSecret = process.env.ZOOM_CLIENT_SECRET?.trim();
    this.accessToken = null;
    this.tokenExpiresAt = null;
    this.baseUrl = 'https://api.zoom.us/v2';
    
    // Log configuration status (without exposing secrets)
    if (this.isConfigured()) {
      console.log('✅ Zoom credentials loaded:', {
        accountId: this.accountId?.substring(0, 8) + '...',
        clientId: this.clientId?.substring(0, 8) + '...',
        secretLength: this.clientSecret?.length
      });
    }
  }

  /**
   * Check if Zoom credentials are configured
   */
  isConfigured() {
    return !!(this.accountId && this.clientId && this.clientSecret);
  }

  /**
   * Get OAuth access token (Server-to-Server OAuth)
   * Tokens are cached and refreshed when expired
   */
  async getAccessToken() {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    if (!this.isConfigured()) {
      throw new Error('Zoom API credentials not configured. Please check ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET in .env');
    }

    try {
      // Construct authorization header
      const authString = `${this.clientId}:${this.clientSecret}`;
      const base64Auth = Buffer.from(authString).toString('base64');
      
      console.log('🔐 Attempting Zoom OAuth with Account ID:', this.accountId?.substring(0, 8) + '...');
      
      const response = await axios.post(
        `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(this.accountId)}`,
        null, // No body needed
        {
          headers: {
            'Authorization': `Basic ${base64Auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      if (!response.data.access_token) {
        throw new Error('No access token received from Zoom');
      }

      this.accessToken = response.data.access_token;
      // Set expiry to 5 minutes before actual expiry for safety
      this.tokenExpiresAt = Date.now() + ((response.data.expires_in - 300) * 1000);
      
      console.log('✅ Zoom OAuth successful, token expires in', response.data.expires_in, 'seconds');
      return this.accessToken;
    } catch (error) {
      // Enhanced error logging
      console.error('❌ Zoom OAuth error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers ? Object.keys(error.config.headers) : []
        }
      });
      
      // Return user-friendly error
      if (error.response?.status === 400) {
        throw new Error('Invalid Zoom credentials. Please verify ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET in .env file');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Zoom API request timeout. Please check your internet connection');
      } else if (error.response?.data?.reason) {
        throw new Error(`Zoom OAuth failed: ${error.response.data.reason}`);
      } else {
        throw new Error(`Failed to authenticate with Zoom: ${error.message}`);
      }
    }
  }

  /**
   * Create a Zoom meeting
   * 
   * @param {Object} params - Meeting parameters
   * @param {string} params.topic - Meeting topic/title
   * @param {string} params.start_time - ISO 8601 datetime (e.g., "2025-12-15T14:00:00Z")
   * @param {number} params.duration - Duration in minutes
   * @param {string} params.timezone - Timezone (e.g., "UTC", "Asia/Kolkata")
   * @param {string} params.agenda - Optional meeting description
   * @returns {Promise<Object>} Meeting details including join_url
   */
  async createMeeting({ topic, start_time, duration, timezone = 'UTC', agenda = '' }) {
    try {
      const token = await this.getAccessToken();

      console.log('📅 Creating Zoom meeting:', { topic, start_time, duration });

      // Use 'me' as user ID for Server-to-Server OAuth
      const response = await axios.post(
        `${this.baseUrl}/users/me/meetings`,
        {
          topic,
          type: 2, // Scheduled meeting
          start_time,
          duration,
          timezone,
          agenda,
          settings: {
            host_video: true,
            participant_video: true,
            join_before_host: false,
            mute_upon_entry: true,
            watermark: false,
            use_pmi: false,
            approval_type: 2, // No registration required
            audio: 'both',
            auto_recording: 'none',
            waiting_room: true
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000 // 15 second timeout for meeting creation
        }
      );

      console.log(`✅ Zoom meeting created: ${response.data.id}`);
      console.log(`📍 Join URL: ${response.data.join_url}`);
      
      return {
        meeting_id: response.data.id,
        join_url: response.data.join_url,
        start_url: response.data.start_url,
        password: response.data.password,
        topic: response.data.topic,
        start_time: response.data.start_time,
        duration: response.data.duration
      };
    } catch (error) {
      console.error('❌ Zoom meeting creation error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      // Handle specific error cases with clear messages
      if (error.response?.status === 401) {
        // Token might be expired, clear it
        this.accessToken = null;
        this.tokenExpiresAt = null;
        throw new Error('Zoom authentication expired. Please try again.');
      } else if (error.response?.status === 429) {
        throw new Error('Zoom API rate limit exceeded. Please try again later.');
      } else if (error.response?.status === 400) {
        const errorMsg = error.response?.data?.message || 'Invalid meeting parameters';
        throw new Error(`Zoom meeting validation error: ${errorMsg}`);
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Zoom API timeout. Please check your connection and try again.');
      } else if (error.response?.data?.message) {
        throw new Error(`Zoom API error: ${error.response.data.message}`);
      } else {
        throw new Error(`Failed to create Zoom meeting: ${error.message}`);
      }
    }
  }

  /**
   * Validate meeting parameters before creating
   */
  validateMeetingParams({ scheduled_at, duration, title }) {
    const errors = [];

    // Validate scheduled_at is in the future
    const scheduledTime = new Date(scheduled_at);
    if (isNaN(scheduledTime.getTime())) {
      errors.push('scheduled_at must be a valid datetime');
    } else if (scheduledTime <= new Date()) {
      errors.push('scheduled_at must be in the future');
    }

    // Validate duration
    if (!duration || duration < 1 || duration > 480) {
      errors.push('duration must be between 1 and 480 minutes');
    }

    // Validate title
    if (!title || title.trim().length === 0) {
      errors.push('title is required');
    } else if (title.length > 200) {
      errors.push('title must not exceed 200 characters');
    }

    return errors;
  }
}

// Export singleton instance
module.exports = new ZoomService();
