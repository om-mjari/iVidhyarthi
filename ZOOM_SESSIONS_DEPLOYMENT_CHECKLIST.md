# 🚀 Zoom Sessions - Deployment Checklist

## ✅ Pre-Deployment Steps

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Zoom API

#### A. Create Zoom App
1. Visit https://marketplace.zoom.us/
2. Click **Develop** → **Build App**
3. Select **Server-to-Server OAuth**
4. Fill in app details:
   - App Name: `iVidhyarthi Session Manager`
   - Company Name: Your institution
   - Developer Contact: Your email

#### B. Get Credentials
1. Go to **App Credentials** tab
2. Copy these values:
   - Account ID
   - Client ID
   - Client Secret

#### C. Add Scopes
1. Go to **Scopes** tab
2. Add these scopes:
   - `meeting:write:admin`
   - `meeting:read:admin`
3. Click **Continue**

#### D. Activate App
1. Go to **Activation** tab
2. Complete activation

### 3. Update .env File

```bash
cd backend
cp .env.example .env
```

Edit `.env` and add Zoom credentials:
```bash
ZOOM_ACCOUNT_ID=your_account_id_here
ZOOM_CLIENT_ID=your_client_id_here
ZOOM_CLIENT_SECRET=your_client_secret_here
```

### 4. Restart Backend Server

```bash
cd backend
npm start
```

Verify route registration in console:
```
✅ Routes registered:
   ...
   - /api/lecturer/sessions
```

---

## 🧪 Testing

### 1. Update Test Configuration

Edit `backend/test_sessions.js`:
```javascript
const TEST_CONFIG = {
  lecturerId: 'your_lecturer_email@example.com',  // Replace with real lecturer email
  courseId: 'COURSE_001',                          // Replace with real Course_Id
  courseName: 'Test Course'
};
```

### 2. Run Tests

```bash
cd backend
node test_sessions.js
```

Expected output:
```
🧪 Session Management API Tests
...
✅ Session created successfully
✅ Correctly rejected with 400 Bad Request
...
✅ Test suite completed!
```

### 3. Manual Testing

1. Login as lecturer at http://localhost:5173
2. Navigate to **Dashboard** → **Sessions** tab
3. Select a course from dropdown
4. Fill in session details:
   - Title: "Test Session"
   - Scheduled At: Tomorrow at 2 PM
   - Duration: 60 minutes
5. Click **Create Session**
6. Verify:
   - ✅ Success message appears
   - ✅ Session appears in table
   - ✅ "Join Meeting" button shows Zoom link
   - ✅ Clicking link opens Zoom

---

## 📋 Verification Checklist

### Backend
- [ ] `backend/config/zoom.js` exists
- [ ] `backend/routes/sessionRoutes.js` exists
- [ ] `backend/server.js` imports and mounts sessionRoutes
- [ ] `backend/package.json` includes `axios` dependency
- [ ] `.env` has ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET
- [ ] Server starts without errors
- [ ] Route `/api/lecturer/sessions` appears in logs

### Frontend
- [ ] `src/LecturerDashboard.jsx` has updated SessionsTab
- [ ] Sessions tab displays form with course dropdown
- [ ] Form includes: Course, Title, Scheduled At, Duration, Description
- [ ] Sessions table displays with columns: Session_Id, Course, Title, Scheduled At, Duration, Status, Action
- [ ] "Join Meeting" buttons work
- [ ] Pagination controls appear (if > 20 sessions)
- [ ] Sorting works (click column headers)

### Database
- [ ] `Tbl_Sessions` collection exists
- [ ] Sessions have `Session_Url` field populated
- [ ] `Course_Id` references valid courses
- [ ] `Scheduled_At` dates are correct

### Testing
- [ ] Test suite passes all 10 tests
- [ ] Manual testing successful
- [ ] Zoom meetings created successfully
- [ ] Sessions appear in Zoom dashboard

---

## 🐛 Troubleshooting

### Issue: "Zoom not configured"

**Solution:**
1. Check `.env` has all three Zoom variables
2. Restart backend server
3. Verify credentials are correct (copy-paste from Zoom dashboard)

### Issue: "Failed to authenticate with Zoom"

**Solution:**
1. Verify app is activated in Zoom Marketplace
2. Check if scopes are added (`meeting:write:admin`, `meeting:read:admin`)
3. Try regenerating Client Secret

### Issue: Sessions not appearing in list

**Solution:**
1. Check browser console for errors
2. Verify lecturer email matches Course.Lecturer_Id
3. Test API directly:
   ```bash
   curl -H "x-lecturer-id: lecturer@example.com" \
     http://localhost:5000/api/lecturer/sessions
   ```

### Issue: "Not authorized to create session"

**Solution:**
1. Verify course belongs to lecturer:
   ```javascript
   db.Tbl_Courses.findOne({ 
     Course_Id: 'COURSE123',
     Lecturer_Id: 'lecturer@example.com'
   })
   ```
2. Check `x-lecturer-id` header is set correctly

---

## 📊 Database Verification

### Check Sessions

```javascript
// MongoDB Shell
use ividhyarthi;

// Find all sessions
db.Tbl_Sessions.find().pretty();

// Find sessions for specific course
db.Tbl_Sessions.find({ Course_Id: 'COURSE123' }).pretty();

// Count total sessions
db.Tbl_Sessions.countDocuments();

// Find sessions with Zoom URLs
db.Tbl_Sessions.find({ Session_Url: { $ne: null } }).count();
```

### Verify Zoom URLs

Sessions should have `Session_Url` like:
```
https://zoom.us/j/1234567890?pwd=xxx
```

---

## 🔐 Security Checklist

- [ ] Zoom credentials stored in `.env` (not in code)
- [ ] `.env` added to `.gitignore`
- [ ] Authorization checks in place (lecturer owns course)
- [ ] Input validation on both client and server
- [ ] No Zoom credentials in database
- [ ] HTTPS enabled (production only)

---

## 📝 Documentation

Available documentation:
- **Comprehensive Guide**: `ZOOM_SESSIONS_SETUP.md`
- **Quick Reference**: `ZOOM_SESSIONS_QUICK_REFERENCE.md`
- **Implementation Summary**: `ZOOM_SESSIONS_IMPLEMENTATION_COMPLETE.md`
- **This Checklist**: `ZOOM_SESSIONS_DEPLOYMENT_CHECKLIST.md`

---

## 🎉 Success Criteria

All must be ✅ before deployment:

- [ ] Backend server starts without errors
- [ ] Route `/api/lecturer/sessions` registered
- [ ] Test suite passes (10/10 tests)
- [ ] Manual testing successful:
  - [ ] Create session from UI
  - [ ] Zoom meeting created automatically
  - [ ] Session appears in list
  - [ ] Join Meeting button works
  - [ ] Pagination works (if applicable)
  - [ ] Sorting works
- [ ] Documentation reviewed
- [ ] Environment variables configured
- [ ] Database has session records with Zoom URLs

---

## 🚀 Deployment

Once all checks pass:

1. **Development**: ✅ Already deployed locally
2. **Staging**: Deploy to staging environment, repeat tests
3. **Production**: 
   - Use production Zoom credentials
   - Enable HTTPS
   - Configure monitoring
   - Update FRONTEND_URL in .env
   - Test thoroughly before announcing

---

## 📞 Support

If you encounter issues:

1. Check server logs for errors
2. Review relevant documentation section
3. Run test suite to diagnose
4. Check this troubleshooting guide

**Documentation Files:**
- Setup: `ZOOM_SESSIONS_SETUP.md`
- Quick Ref: `ZOOM_SESSIONS_QUICK_REFERENCE.md`
- Implementation: `ZOOM_SESSIONS_IMPLEMENTATION_COMPLETE.md`

---

**Last Updated**: December 4, 2025  
**Version**: 1.0.0  
**Status**: Ready for Deployment ✅
