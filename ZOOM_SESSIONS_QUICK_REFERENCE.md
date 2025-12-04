# Zoom Sessions Quick Reference

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install axios
```

### 2. Configure Zoom API
Add to `.env`:
```bash
ZOOM_ACCOUNT_ID=your_account_id
ZOOM_CLIENT_ID=your_client_id
ZOOM_CLIENT_SECRET=your_client_secret
```

Get credentials from: https://marketplace.zoom.us/ → Your App → App Credentials

### 3. Restart Server
```bash
cd backend
npm start
```

### 4. Test It
```bash
node test_sessions.js
```

---

## 📡 API Quick Reference

### Create Session
```bash
curl -X POST http://localhost:5000/api/lecturer/sessions \
  -H "Content-Type: application/json" \
  -H "x-lecturer-id: lecturer@example.com" \
  -d '{
    "course_id": "COURSE123",
    "title": "Week 5 Lecture",
    "scheduled_at": "2025-12-15T14:00:00Z",
    "duration": 60
  }'
```

### Get Sessions
```bash
curl -H "x-lecturer-id: lecturer@example.com" \
  http://localhost:5000/api/lecturer/sessions?page=1&per_page=20
```

---

## 🎯 User Flow

1. Lecturer logs in → Dashboard → Sessions tab
2. Selects course from dropdown
3. Fills form: Title, Date/Time, Duration
4. Clicks "Create Session"
5. Zoom meeting created automatically
6. Session appears in list with Join link
7. Students click "Join Meeting" at session time

---

## ✅ Validation Rules

- **scheduled_at**: Must be in future
- **duration**: 1-480 minutes
- **title**: Required, max 200 chars
- **course_id**: Must be owned by lecturer

---

## 🐛 Troubleshooting

**"Zoom not configured"**
→ Check .env has ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET

**"Not authorized"**
→ Verify course belongs to lecturer (check Tbl_Courses.Lecturer_Id)

**"Session not appearing"**
→ Check browser console, verify x-lecturer-id header

**Full docs:** See `ZOOM_SESSIONS_SETUP.md`

---

## 📁 Files Modified/Created

### Backend
- ✅ `backend/config/zoom.js` - Zoom API service
- ✅ `backend/routes/sessionRoutes.js` - Session endpoints
- ✅ `backend/server.js` - Route registration
- ✅ `backend/package.json` - Added axios dependency
- ✅ `backend/test_sessions.js` - Test suite

### Frontend
- ✅ `src/LecturerDashboard.jsx` - Updated SessionsTab component

### Database
- ✅ Uses existing `Tbl_Sessions` model (no schema changes)

### Documentation
- ✅ `ZOOM_SESSIONS_SETUP.md` - Comprehensive documentation
- ✅ `ZOOM_SESSIONS_QUICK_REFERENCE.md` - This file

---

## 🔑 Environment Variables

```bash
# Required for Zoom integration
ZOOM_ACCOUNT_ID=         # From Zoom App Marketplace
ZOOM_CLIENT_ID=          # From Zoom App Marketplace
ZOOM_CLIENT_SECRET=      # From Zoom App Marketplace

# System works without Zoom (sessions created without URLs)
# Useful for local dev and testing
```

---

## 🎨 Frontend Features

- ✅ Course dropdown (auto-populated)
- ✅ Form validation (client + server)
- ✅ Success/error toasts
- ✅ Paginated table (20 per page)
- ✅ Sortable columns
- ✅ Status badges (color-coded)
- ✅ Clickable Join Meeting buttons
- ✅ Responsive design

---

## 🧪 Testing

```bash
# Run full test suite
cd backend
node test_sessions.js

# Update test config first:
# Edit test_sessions.js → TEST_CONFIG
# Set valid lecturerId and courseId
```

**Tests:**
- ✅ Create session (success)
- ✅ Create session (validation errors)
- ✅ Get sessions (pagination)
- ✅ Get sessions (sorting)
- ✅ Authorization checks
- ✅ Integration tests

---

## 📊 Database Structure

```javascript
Tbl_Sessions {
  Session_Id: "SESS_1733500000000_abc123",
  Course_Id: "COURSE123",
  Session_Url: "https://zoom.us/j/1234567890",
  Scheduled_At: ISODate("2025-12-15T14:00:00Z"),
  Duration: 60,
  Title: "Week 5 Lecture",
  Status: "Scheduled",
  Host_Id: "lecturer@example.com"
}
```

---

## 🚦 Status Codes

| Code | Meaning |
|------|---------|
| 201 | Session created successfully |
| 200 | Sessions retrieved successfully |
| 400 | Validation error |
| 401 | Missing lecturer ID |
| 403 | Not authorized for course |
| 404 | Course/Lecturer not found |
| 502 | Zoom API failure |

---

## 🔗 Useful Links

- **Zoom App Marketplace**: https://marketplace.zoom.us/
- **Zoom API Docs**: https://developers.zoom.us/docs/api/
- **Server-to-Server OAuth**: https://developers.zoom.us/docs/internal-apps/s2s-oauth/

---

## ⚡ Production Checklist

- [ ] Zoom app created and activated
- [ ] `.env` configured with production credentials
- [ ] Server restarted
- [ ] Tests passing
- [ ] HTTPS enabled
- [ ] Database indexes created
- [ ] Monitoring configured

---

**Need more details?** See `ZOOM_SESSIONS_SETUP.md` for comprehensive documentation.
