# 🔧 Fix: Assignment Submission "Route not found" Error

## ❌ Problem
Getting error: **"Failed to submit assignment: Route not found"**
```
POST http://localhost:5000/api/assignments/submit → 404 (Not Found)
```

## ✅ Solution

### **Step 1: Restart Backend Server**

The route exists but the server needs to be restarted to load the changes.

**In PowerShell Terminal:**
```powershell
# Navigate to backend folder
cd backend

# Stop the server if running (Ctrl+C)

# Start the server
node server.js
```

**Expected Output:**
```
✅ MongoDB connected
📦 GridFS initialized
✅ Routes registered:
   - /api/auth
   - /api/admin
   ...
   - /api/assignments     <-- This should be listed
   - /api/submissions     <-- This too
   ...
🚀 Server running on port 5000
```

---

## 📝 What Was Fixed

### **1. Dual Storage System**
Assignments are now stored in **BOTH** tables:

#### **Tbl_Submissions** (Primary)
```javascript
{
  Submission_Id: "SUB_1732876543_abc123xyz",
  Assignment_Id: "ASSIGN_123",
  Student_Id: "STU_456",
  Course_Id: "COURSE_789",
  Submission_Content: '{"1":"answer1","2":"1"}',
  Score: 85,
  Time_Spent: 180,
  Status: "Submitted",
  Feedback: "Submitted: 85/100 (85%)",
  Submitted_On: "2025-11-30T10:30:00.000Z"
}
```

#### **Tbl_Assignments** (Secondary)
```javascript
{
  Assignment_Id: "ASSIGN_123_STU_456",
  Course_Id: "COURSE_789",
  Title: "ASSIGN_123 - Student Submission",
  Status: "Submitted",
  Marks: 85,
  Submission_Data: {
    Student_Id: "STU_456",
    Answers: {...},
    Questions: [...],
    Score: 85,
    Time_Spent: 180,
    Submitted_On: "2025-11-30T10:30:00.000Z"
  }
}
```

### **2. Updated AssignmentPage.jsx**

**Before:**
```javascript
// Only saved to Tbl_Assignments
const response = await fetch('http://localhost:5000/api/assignments/submit', ...);
```

**After:**
```javascript
// Save to BOTH tables
// 1. Tbl_Submissions
const submissionsResponse = await fetch('http://localhost:5000/api/submissions/create', ...);

// 2. Tbl_Assignments
const assignmentsResponse = await fetch('http://localhost:5000/api/assignments/submit', ...);
```

### **3. Updated WeeklyAssignments.jsx**

**Fetches from both tables:**
```javascript
// Get from Tbl_Submissions
const submissionsResponse = await fetch(`/api/submissions/student/${stuId}`);

// Get from Tbl_Assignments
const tblAssignmentsResponse = await fetch(`/api/assignments/course/${courseId}`);

// Combine both
allSubmissions = [...submissionsData.data, ...tblAssignmentSubmissions];
```

---

## 🧪 Testing Steps

### **1. Start Backend Server**
```powershell
cd backend
node server.js
```

### **2. Verify Routes Loaded**
Check console output shows:
```
✅ Routes registered:
   - /api/assignments
   - /api/submissions
```

### **3. Test API Endpoints**

**Test 1: Submissions endpoint**
```powershell
curl http://localhost:5000/api/submissions/student/YOUR_STUDENT_ID
```

**Test 2: Assignments endpoint**
```powershell
curl http://localhost:5000/api/assignments/course/YOUR_COURSE_ID
```

Both should return `{ success: true, data: [...] }`

### **4. Submit Assignment**

1. Go to course → Click "Start Assignment"
2. Answer questions
3. Click "Submit Assignment"
4. **Watch browser console:**
   - Should show: `📤 Submitting Assignment Data`
   - Should show: `📥 Tbl_Submissions Response: {success: true}`
   - Should show: `📥 Tbl_Assignments Response: {success: true}`
   - Should show: `✅ Assignment submitted successfully to Tbl_Submissions & Tbl_Assignments!`

5. **Check MongoDB:**
   ```javascript
   // In MongoDB Compass or CLI
   db.Tbl_Submissions.find({ Student_Id: "YOUR_ID" })
   db.Tbl_Assignments.find({ "Submission_Data.Student_Id": "YOUR_ID" })
   ```

---

## 🔍 Troubleshooting

### **Issue: Still getting 404 error**

**Solution 1: Check server.js has routes**
```javascript
// backend/server.js should have:
const assignmentRoutes = require("./routes/assignmentRoutes");
const submissionRoutes = require("./routes/submissionRoutes");

app.use("/api/assignments", assignmentRoutes);
app.use("/api/submissions", submissionRoutes);
```

**Solution 2: Verify route files exist**
```powershell
ls backend/routes/assignmentRoutes.js
ls backend/routes/submissionRoutes.js
```

**Solution 3: Check for syntax errors**
```powershell
cd backend
node -c routes/assignmentRoutes.js
node -c routes/submissionRoutes.js
```

### **Issue: CORS error**

**Solution:** Add CORS middleware in server.js
```javascript
const cors = require('cors');
app.use(cors());
```

### **Issue: MongoDB connection error**

**Solution:** Check .env file
```
MONGODB_URI=mongodb://localhost:27017/ividhyarthi
# OR
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ividhyarthi
```

---

## 📊 Database Verification

### **Check Tbl_Submissions**
```javascript
// MongoDB Compass or CLI
db.Tbl_Submissions.find({}).sort({ Submitted_On: -1 }).limit(5)
```

**Expected:**
```json
[
  {
    "_id": "...",
    "Submission_Id": "SUB_1732876543_abc123",
    "Assignment_Id": "669d89bdfeb89feff39a8b",
    "Student_Id": "669d89bdfeb89feff39a8b",
    "Score": 85,
    "Status": "Submitted",
    "Submission_Content": "{\"1\":\"answer1\",\"2\":\"1\"}",
    "Submitted_On": "2025-11-30T10:30:00.000Z"
  }
]
```

### **Check Tbl_Assignments**
```javascript
db.Tbl_Assignments.find({ Status: "Submitted" }).limit(5)
```

**Expected:**
```json
[
  {
    "_id": "...",
    "Assignment_Id": "669d89bdfeb89feff39a8b_669d89bdfeb89feff39a8b",
    "Status": "Submitted",
    "Submission_Data": {
      "Student_Id": "669d89bdfeb89feff39a8b",
      "Score": 85,
      "Answers": {...},
      "Questions": [...]
    }
  }
]
```

---

## ✅ Success Checklist

- [ ] Backend server started without errors
- [ ] Routes loaded (check console output)
- [ ] Can access http://localhost:5000/api/health
- [ ] Assignment submits without "Route not found" error
- [ ] Data appears in Tbl_Submissions
- [ ] Data appears in Tbl_Assignments
- [ ] "View Submission" button appears after submission
- [ ] Can view submitted answers
- [ ] Progress bar updates

---

## 🚀 Quick Fix Commands

```powershell
# Stop any running servers
# Press Ctrl+C in terminal

# Navigate to backend
cd c:\Users\omjar\OneDrive\Desktop\react\iVidhyarthi\backend

# Install dependencies (if needed)
npm install

# Start server
node server.js

# In NEW terminal, start frontend
cd c:\Users\omjar\OneDrive\Desktop\react\iVidhyarthi
npm run dev
```

---

**Last Updated:** November 30, 2025  
**Status:** ✅ Fixed - Restart backend server to apply changes
