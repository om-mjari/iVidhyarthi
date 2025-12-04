# Zoom Session Management - Setup & API Documentation

## Overview

This document describes the Zoom-integrated session management system for iVidhyarthi lecturers. Lecturers can create scheduled Zoom meetings directly through the platform, and all sessions are persisted in the database with automatic Zoom meeting creation.

---

## Features

✅ **Server-side Zoom Meeting Creation** - No manual link pasting required  
✅ **Database Persistence** - All sessions stored in `Tbl_Sessions`  
✅ **Authorization** - Only course owners can create sessions  
✅ **Validation** - Future dates, duration limits, required fields  
✅ **Pagination & Sorting** - Efficiently browse large session lists  
✅ **Graceful Degradation** - Works without Zoom (for dev/testing)

---

## Table of Contents

1. [Zoom API Setup](#zoom-api-setup)
2. [Environment Configuration](#environment-configuration)
3. [API Endpoints](#api-endpoints)
4. [Frontend Integration](#frontend-integration)
5. [Database Schema](#database-schema)
6. [Testing](#testing)
7. [Error Handling](#error-handling)
8. [Troubleshooting](#troubleshooting)

---

## Zoom API Setup

### Step 1: Create Server-to-Server OAuth App

1. Go to [Zoom App Marketplace](https://marketplace.zoom.us/)
2. Click **Develop** → **Build App**
3. Select **Server-to-Server OAuth**
4. Fill in app details:
   - App Name: `iVidhyarthi Session Manager`
   - Company Name: Your institution name
   - Developer Contact: Your email
5. Click **Create**

### Step 2: Configure OAuth Credentials

1. On the **App Credentials** tab, copy:
   - **Account ID**
   - **Client ID**
   - **Client Secret**
2. Keep these secure - you'll add them to `.env` next

### Step 3: Add Required Scopes

1. Go to **Scopes** tab
2. Add these scopes:
   - `meeting:write:admin` - Create meetings
   - `meeting:read:admin` - Read meeting details
3. Click **Continue** and activate your app

### Step 4: Activate the App

1. Go to **Activation** tab
2. Complete the activation process
3. Your app is now ready to use!

---

## Environment Configuration

Add these variables to your `.env` file:

```bash
# Zoom API Configuration (Server-to-Server OAuth)
ZOOM_ACCOUNT_ID=your_account_id_here
ZOOM_CLIENT_ID=your_client_id_here
ZOOM_CLIENT_SECRET=your_client_secret_here
```

**Security Notes:**
- ✅ Never commit `.env` to version control
- ✅ Rotate credentials periodically
- ✅ Use different credentials for dev/staging/production
- ✅ Store production secrets in secure vault (Azure Key Vault, AWS Secrets Manager, etc.)

**Without Zoom Configuration:**
The system will still work but won't create Zoom meetings. Sessions will be created in the database without `Session_Url` values. This is useful for:
- Local development
- Testing without Zoom account
- Demos

---

## API Endpoints

### POST `/api/lecturer/sessions`

Create a new session with automatic Zoom meeting creation.

**Authorization:** Required (lecturer must own the course)

**Headers:**
```http
Content-Type: application/json
x-lecturer-id: lecturer@example.com
```

**Request Body:**
```json
{
  "course_id": "COURSE123",
  "scheduled_at": "2025-12-15T14:00:00Z",
  "duration": 60,
  "title": "Week 5 Lecture",
  "description": "Optional description"
}
```

**Field Validations:**
- `course_id` (required): Must be a valid course owned by lecturer
- `scheduled_at` (required): ISO 8601 datetime, must be in the future
- `duration` (required): Integer between 1 and 480 minutes
- `title` (required): String, max 200 characters
- `description` (optional): String, any length

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Session created successfully",
  "data": {
    "session_id": "SESS_1733500000000_abc123",
    "course_id": "COURSE123",
    "session_url": "https://zoom.us/j/1234567890",
    "scheduled_at": "2025-12-15T14:00:00.000Z",
    "duration": 60,
    "title": "Week 5 Lecture",
    "description": "Optional description",
    "status": "Scheduled",
    "zoom_configured": true
  }
}
```

**Error Responses:**

**400 Bad Request** - Validation error:
```json
{
  "success": false,
  "message": "scheduled_at must be in the future"
}
```

**401 Unauthorized** - Missing lecturer ID:
```json
{
  "success": false,
  "message": "Lecturer identification required. Please provide x-lecturer-id header."
}
```

**403 Forbidden** - Not authorized for course:
```json
{
  "success": false,
  "message": "Not authorized to create session for this course"
}
```

**404 Not Found** - Course doesn't exist:
```json
{
  "success": false,
  "message": "Course not found"
}
```

**502 Bad Gateway** - Zoom API failure:
```json
{
  "success": false,
  "message": "Failed to create Zoom meeting: <reason>"
}
```

---

### GET `/api/lecturer/sessions`

Retrieve paginated list of sessions for lecturer's courses.

**Authorization:** Required

**Headers:**
```http
x-lecturer-id: lecturer@example.com
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number (min: 1) |
| `per_page` | integer | 20 | Items per page (1-100) |
| `sort` | string | `scheduled_at` | Sort field (`scheduled_at`, `session_id`) |
| `order` | string | `desc` | Sort order (`asc`, `desc`) |
| `course_id` | string | - | Filter by specific course (optional) |

**Example Request:**
```http
GET /api/lecturer/sessions?page=1&per_page=20&sort=scheduled_at&order=desc
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "session_id": "SESS_1733500000000_abc123",
        "course_id": "COURSE123",
        "course_name": "Introduction to Programming",
        "title": "Week 5 Lecture",
        "session_url": "https://zoom.us/j/1234567890",
        "scheduled_at": "2025-12-15T14:00:00.000Z",
        "duration": 60,
        "status": "Scheduled",
        "description": "Optional description",
        "created_at": "2025-12-04T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total": 45,
      "total_pages": 3,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

**Error Responses:**

**401 Unauthorized** - Missing lecturer ID:
```json
{
  "success": false,
  "message": "Lecturer identification required"
}
```

**403 Forbidden** - Course filter for unauthorized course:
```json
{
  "success": false,
  "message": "Not authorized to view sessions for this course"
}
```

---

## Frontend Integration

### SessionsTab Component

The `SessionsTab` component in `LecturerDashboard.jsx` provides a complete UI for session management.

**Features:**
- ✅ Course dropdown (auto-populated from lecturer's courses)
- ✅ Session creation form with validation
- ✅ Real-time error and success messages
- ✅ Paginated sessions table
- ✅ Sortable columns (click headers)
- ✅ Clickable "Join Meeting" buttons
- ✅ Status badges with color coding
- ✅ Responsive design

**Session Statuses:**
- 🔵 **Scheduled** - Future session, not yet started
- 🟢 **Ongoing** - Currently in progress
- ⚪ **Completed** - Past session, finished
- 🔴 **Cancelled** - Session was cancelled
- 🟠 **Postponed** - Session rescheduled

**User Flow:**
1. Lecturer navigates to Sessions tab
2. Selects course from dropdown
3. Fills in session details (title, date/time, duration)
4. Clicks "Create Session"
5. System creates Zoom meeting server-side
6. Session appears in table with Join Meeting link
7. Students can click link when session starts

---

## Database Schema

### Tbl_Sessions Collection

```javascript
{
  Session_Id: String (PK, auto-generated),
  Course_Id: String (FK to Tbl_Courses, required),
  Session_Url: String (Zoom join URL, nullable),
  Scheduled_At: Date (required),
  Duration: Number (minutes, required, default: 60),
  Title: String (required),
  Description: String (optional),
  Session_Type: String (enum, default: 'Live'),
  Status: String (enum, default: 'Scheduled'),
  Recording_Url: String (optional),
  Attendees: [String] (Student IDs),
  Max_Participants: Number (default: 100),
  Host_Id: String (Lecturer ID),
  createdAt: Date (timestamp),
  updatedAt: Date (timestamp)
}
```

**Indexes:**
- `Course_Id` - For filtering by course
- `Session_Id` - Unique identifier
- `Scheduled_At` - For sorting by date
- `Status` - For filtering by status

**Session_Id Format:**
```
SESS_{timestamp}_{random_string}
Example: SESS_1733500000000_abc123def
```

---

## Testing

### Prerequisites

1. Ensure backend server is running:
   ```bash
   cd backend
   npm start
   ```

2. Update test configuration in `backend/test_sessions.js`:
   ```javascript
   const TEST_CONFIG = {
     lecturerId: 'your_lecturer_email@example.com',
     courseId: 'VALID_COURSE_ID', // From your Tbl_Courses
     courseName: 'Test Course'
   };
   ```

### Run Tests

```bash
cd backend
node test_sessions.js
```

### Test Coverage

✅ **Unit Tests:**
- Valid session creation
- Missing required fields
- Past date rejection
- Invalid duration rejection
- Unauthorized course access

✅ **Integration Tests:**
- Create and retrieve workflow
- Pagination functionality
- Sorting functionality
- Authorization checks

✅ **Expected Results:**
```
🧪 Session Management API Tests

📋 TEST: Create Session - Valid Input
✅ Session created successfully
✅ Response has all required fields

📋 TEST: Create Session - Missing Required Fields
✅ Correctly rejected with 400 Bad Request

... (additional tests)

✅ Test suite completed!
```

---

## Error Handling

### Server-Side Error Handling

**Zoom Creation Failure:**
If Zoom API fails, the session is **not** created in the database. This ensures data consistency.

```javascript
try {
  zoomMeeting = await zoomService.createMeeting(...);
} catch (zoomError) {
  // Return 502 error immediately
  // No database record created
  return res.status(502).json({
    success: false,
    message: `Failed to create Zoom meeting: ${zoomError.message}`
  });
}
```

**Database Failure After Zoom Creation:**
If database save fails after Zoom meeting is created, the error is logged. In production, implement cleanup to delete the orphaned Zoom meeting.

```javascript
try {
  await newSession.save();
} catch (dbError) {
  console.error('❌ Database save failed:', dbError.message);
  // TODO: Delete Zoom meeting to prevent orphans
  return res.status(500).json({ ... });
}
```

### Frontend Error Handling

**Network Errors:**
```javascript
try {
  const response = await fetch(...);
} catch (err) {
  setError('Network error. Please check your connection.');
}
```

**Validation Errors:**
```javascript
if (!form.title || !form.scheduled_at) {
  setError('Please fill in all required fields');
  return;
}
```

**User-Friendly Messages:**
- ✅ "Session created successfully with Zoom meeting!"
- ⚠️ "Scheduled time must be in the future"
- ❌ "Failed to create Zoom meeting: Rate limit exceeded"

---

## Troubleshooting

### Issue: "Zoom not configured" message

**Cause:** Missing or incorrect Zoom credentials in `.env`

**Solution:**
1. Check `.env` file has all three variables:
   ```bash
   ZOOM_ACCOUNT_ID=...
   ZOOM_CLIENT_ID=...
   ZOOM_CLIENT_SECRET=...
   ```
2. Restart backend server after adding credentials
3. Verify credentials are correct (copy-paste from Zoom dashboard)

---

### Issue: "Failed to authenticate with Zoom"

**Cause:** Invalid Zoom credentials or expired app

**Solution:**
1. Verify credentials in Zoom App Marketplace
2. Check if app is activated (Apps → Manage → Your App → Status)
3. Regenerate Client Secret if needed
4. Test credentials:
   ```bash
   curl -X POST "https://zoom.us/oauth/token?grant_type=account_credentials&account_id=YOUR_ACCOUNT_ID" \
     -H "Authorization: Basic BASE64_ENCODED_CLIENT_ID:CLIENT_SECRET"
   ```

---

### Issue: "Not authorized to create session for this course"

**Cause:** Lecturer doesn't own the course

**Solution:**
1. Verify `Course_Id` exists in `Tbl_Courses`
2. Check `Lecturer_Id` field in course matches lecturer email
3. Database query to verify:
   ```javascript
   db.Tbl_Courses.findOne({ 
     Course_Id: 'COURSE123',
     Lecturer_Id: 'lecturer@example.com'
   })
   ```

---

### Issue: Sessions not appearing in list

**Cause:** Data fetching error or permission issue

**Solution:**
1. Check browser console for errors
2. Verify `x-lecturer-id` header is set correctly
3. Test API directly:
   ```bash
   curl -H "x-lecturer-id: lecturer@example.com" \
     http://localhost:5000/api/lecturer/sessions
   ```
4. Check MongoDB for session records:
   ```javascript
   db.Tbl_Sessions.find({ Course_Id: { $in: lecturerCourseIds } })
   ```

---

### Issue: "Zoom API rate limit exceeded"

**Cause:** Too many API calls in short time

**Solution:**
1. Zoom free tier: 100 requests/day per user
2. Zoom Pro+: Higher limits
3. Implement request throttling in production
4. Cache access tokens (already implemented)

---

## Rate Limiting & Best Practices

### Zoom API Limits

| Plan | Limit |
|------|-------|
| Free | 100 requests/day/user |
| Pro | 1,500 requests/day/user |
| Business+ | 3,000 requests/day/user |

### Best Practices

✅ **Token Caching** - Already implemented (5-minute buffer before expiry)  
✅ **Error Logging** - All Zoom errors logged with context  
✅ **Validation First** - Check inputs before calling Zoom API  
✅ **Graceful Degradation** - System works without Zoom  
✅ **Security** - Server-side only (no client credentials exposure)

---

## Production Deployment Checklist

- [ ] Zoom Server-to-Server OAuth app created and activated
- [ ] Production `.env` variables configured
- [ ] Credentials stored in secure vault (not plaintext)
- [ ] Database indexes created for `Tbl_Sessions`
- [ ] Backend server deployed and running
- [ ] Frontend deployed with correct API base URL
- [ ] HTTPS enabled (required for production)
- [ ] Rate limiting configured (if needed)
- [ ] Monitoring and logging set up
- [ ] Backup strategy for session data
- [ ] Test suite passes with production config

---

## Support & Resources

**Zoom Documentation:**
- [Server-to-Server OAuth](https://developers.zoom.us/docs/internal-apps/s2s-oauth/)
- [Create Meeting API](https://developers.zoom.us/docs/api/rest/reference/zoom-api/methods/#operation/meetingCreate)
- [Meeting Settings](https://developers.zoom.us/docs/api/rest/reference/zoom-api/methods/#operation/meetingUpdate)

**iVidhyarthi Resources:**
- API Endpoints: `backend/routes/sessionRoutes.js`
- Zoom Service: `backend/config/zoom.js`
- Frontend Component: `src/LecturerDashboard.jsx` (SessionsTab)
- Tests: `backend/test_sessions.js`

**Need Help?**
- Create an issue in the repository
- Contact the development team
- Check server logs for detailed error messages

---

## Changelog

**v1.0.0** (2025-12-04)
- Initial release
- Server-side Zoom meeting creation
- POST and GET session endpoints
- Frontend SessionsTab component
- Comprehensive test suite
- Full documentation

---

**End of Documentation**

For additional questions or feature requests, please refer to the main README.md or contact the development team.
