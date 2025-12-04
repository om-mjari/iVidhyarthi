# 🔧 Session Dropdown & Course Name Debug Guide

## 📊 Issue Summary

**Symptoms:**
1. ❌ Course dropdown shows only "Select Course" (empty)
2. ❌ Sessions table displays "Unknown Course" in Course column
3. ✅ Session title, date, and duration display correctly

---

## 🔍 ROOT CAUSES IDENTIFIED

### 1. **Database Field Name Mismatch**
- **Database Schema**: Courses use `Title` field
- **Frontend Code**: Was expecting `Course_Name` field
- **Impact**: Dropdown couldn't display course names

### 2. **Lecturer ID Mismatch (Typo)**
- **Logged-in User**: `22bmit112@gmail.com` (single 'i')
- **Courses Assigned To**: `22bmiit112@gmail.com` (double 'i')
- **Impact**: API query returns 0 courses for logged-in lecturer

### 3. **Backend Session Enrichment Error**
- **Code Issue**: Backend used `course?.Course_Name` instead of `course?.Title`
- **Impact**: Sessions couldn't resolve course names, showing "Unknown Course"

---

## ✅ FIXES APPLIED

### Fix #1: Updated Frontend Dropdown
**File**: `src/LecturerDashboard.jsx`

```javascript
// BEFORE (Wrong)
{courses.map((course) => (
  <option key={course.Course_Id} value={course.Course_Id}>
    {course.Course_Name}  // ❌ Field doesn't exist
  </option>
))}

// AFTER (Fixed)
{courses.map((course) => (
  <option key={course.Course_Id} value={course.Course_Id}>
    {course.Title}  // ✅ Correct field name
  </option>
))}
```

### Fix #2: Updated Backend Session Enrichment
**File**: `backend/routes/sessionRoutes.js`

```javascript
// BEFORE (Wrong)
course_name: course?.Course_Name || 'Unknown Course',  // ❌

// AFTER (Fixed)
course_name: course?.Title || 'Unknown Course',  // ✅
```

### Fix #3: Added Debug Logging
**File**: `src/LecturerDashboard.jsx`

```javascript
const fetchCourses = async () => {
  const lecturerId = lecturer?.email || lecturer?.id;
  console.log('🔍 Fetching courses for lecturer:', lecturerId);
  
  const response = await fetch(`${API_BASE_URL}/tbl-courses?lecturerId=${lecturerId}`);
  const result = await response.json();
  
  console.log('📚 Courses API response:', result);
  console.log('✅ Courses set:', result.data.length, 'courses');
};
```

---

## 🔧 HOW TO FIX LECTURER ID MISMATCH

### Option 1: Update Course Assignments (Database Fix)
**If you want to keep user email as `22bmit112@gmail.com`:**

```javascript
// Run this script: backend/fix_lecturer_id.js
const mongoose = require('mongoose');
const Tbl_Courses = require('./models/Tbl_Courses');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  // Update courses with typo
  const result = await Tbl_Courses.updateMany(
    { Lecturer_Id: '22bmiit112@gmail.com' },  // Wrong (double 'i')
    { $set: { Lecturer_Id: '22bmit112@gmail.com' } }  // Correct (single 'i')
  );
  
  console.log(`✅ Updated ${result.modifiedCount} courses`);
  process.exit();
});
```

### Option 2: Update User Email (User Fix)
**If courses have correct email and user has typo:**

1. Check logged-in user's email in browser console:
```javascript
JSON.parse(localStorage.getItem('lecturer_user'))
```

2. Update localStorage:
```javascript
const user = JSON.parse(localStorage.getItem('lecturer_user'));
user.email = '22bmiit112@gmail.com';  // Match courses
localStorage.setItem('lecturer_user', JSON.stringify(user));
```

3. Refresh the page

---

## 🧪 TESTING & VERIFICATION

### Step 1: Check Logged-In User
Open browser console (F12) and run:
```javascript
const user = JSON.parse(localStorage.getItem('lecturer_user'));
console.log('Logged-in email:', user.email);
```

### Step 2: Check Database Courses
Run in backend terminal:
```bash
cd backend
node check_lecturer_courses.js
```

Look for courses assigned to your email.

### Step 3: Verify API Response
After the fix, open Network tab (F12) and check:
```
GET http://localhost:5000/api/tbl-courses?lecturerId=22bmit112@gmail.com
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "Course_Id": 10,
      "Title": "Ethical Hacking With Automation",
      "Lecturer_Id": "22bmit112@gmail.com",
      ...
    },
    {
      "Course_Id": 11,
      "Title": "Maths without Maths",
      "Lecturer_Id": "22bmit112@gmail.com",
      ...
    }
  ]
}
```

### Step 4: Check Console Logs
After refresh, look for:
```
🔍 Fetching courses for lecturer: 22bmit112@gmail.com
📚 Courses API response: { success: true, data: [...] }
✅ Courses set: 2 courses
```

### Step 5: Test Dropdown
- Should show: "Select Course", "Ethical Hacking With Automation", "Maths without Maths"
- Sessions table should now show correct course names

---

## 📋 CURRENT DATABASE STATE

Based on debug output:

| Course ID | Title | Lecturer ID |
|-----------|-------|-------------|
| 2 | ghh | 22bmiit046@gmail.com |
| 3 | IOS with AI | 22bmiit046@gmail.com |
| 4 | Basic Python Programming | omjariwala367@gmail.com |
| 5 | Maths with AI | 22bmiit109@gmail.com |
| 6 | Air Cloude | 22bmiit109@gmail.com |
| 7 | Basic C++ | 22bmiit109@gmail.com |
| 8 | CcNA with AI | omjariwala367@gmail.com |
| 9 | abc | omjariwala367@gmail.com |
| **10** | **Ethical Hacking With Automation** | **22bmiit112@gmail.com** ✅ |
| **11** | **Maths without Maths** | **22bmiit112@gmail.com** ✅ |

**Your courses**: ID 10 and 11 (if logged in as `22bmiit112@gmail.com`)

---

## 🎯 QUICK FIX CHECKLIST

- [x] ✅ Changed frontend dropdown to use `Title` field
- [x] ✅ Changed backend enrichment to use `Title` field  
- [x] ✅ Added debug logging to track API calls
- [ ] ⚠️ **ACTION REQUIRED**: Fix lecturer ID mismatch (see Option 1 or 2 above)

---

## 🚀 AFTER APPLYING FIXES

1. **Restart Backend** (if running):
```bash
cd backend
npm start
```

2. **Clear Browser Cache** (Ctrl + Shift + Delete)

3. **Refresh Frontend** (Ctrl + F5)

4. **Check Console** for debug logs

5. **Test**:
   - Open Sessions tab
   - Dropdown should show your courses
   - Create a session
   - Sessions table should show correct course name

---

## 📝 PREVENTION FOR FUTURE

### Best Practices:

1. **Consistent Field Naming**
   - Use `Title` consistently across frontend/backend
   - Or add getter/setter in Mongoose model:
   ```javascript
   courseSchema.virtual('Course_Name').get(function() {
     return this.Title;
   });
   ```

2. **Email Validation**
   - Lowercase all emails before saving
   - Add database unique constraint
   ```javascript
   Lecturer_Id: {
     type: String,
     lowercase: true,  // Auto-lowercase
     trim: true
   }
   ```

3. **Debug Logging**
   - Keep console logs during development
   - Use `console.log` with emojis for easy identification

4. **API Testing**
   - Test endpoints with different user IDs
   - Verify field names in responses match frontend expectations

---

## 🆘 STILL NOT WORKING?

Check these:

1. **Backend server running?**
   ```bash
   curl http://localhost:5000/api/tbl-courses/test
   ```

2. **MongoDB connected?**
   - Check backend console for "MongoDB connected" message

3. **Correct database?**
   - Verify `.env` has correct `MONGODB_URI`

4. **API endpoint correct?**
   - Should be: `http://localhost:5000/api/tbl-courses?lecturerId=...`

5. **CORS enabled?**
   - Check backend `server.js` has CORS middleware

6. **Browser cache?**
   - Clear all site data (F12 → Application → Clear storage)

---

## 📞 Need More Help?

Run this comprehensive diagnostic:

```bash
cd backend
node -e "
const mongoose = require('mongoose');
const Tbl_Courses = require('./models/Tbl_Courses');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const email = '22bmit112@gmail.com';
  const courses = await Tbl_Courses.find({ Lecturer_Id: email });
  console.log('Courses found:', courses.length);
  console.log('Emails in DB:', await Tbl_Courses.distinct('Lecturer_Id'));
  process.exit();
});
"
```

This will show all unique lecturer emails in the database.

---

**Last Updated**: December 4, 2025
**Status**: ✅ Code fixes applied, awaiting lecturer ID fix
