# 📝 Assignment Submission - Data Storage Guide

## ✅ What Happens When You Click "Submit Assignment"

### 🎯 **Data is Saved to TWO Collections:**

---

## 1️⃣ **Tbl_Submissions** Collection

**Purpose:** Stores student assignment submissions

**Data Saved:**

```javascript
{
  Submission_Id: "SUB_1732876543_abc123xyz",     // Auto-generated
  Assignment_Id: "ASSIGN_123",                    // From assignment
  Student_Id: "STU_456",                          // Your student ID
  Course_Id: "COURSE_789",                        // Course ID
  Submission_Content: '{"1":"answer1","2":"1"}',  // Your answers as JSON string
  Submitted_On: "2025-11-29T16:47:23.000Z",      // Submission timestamp
  Status: "Submitted",                            // Status
  Score: 85,                                      // Auto-graded score
  Feedback: "Auto-graded: 85/100 (85%)",         // Auto-generated feedback
  Time_Spent: 128                                 // Time in seconds
}
```

**Console Output:**

```
📝 Creating Submission: {
  Assignment_Id: 'ASSIGN_123',
  Student_Id: 'STU_456',
  Course_Id: 'COURSE_789',
  Score: 85,
  Time_Spent: '2m 8s',
  Status: 'Submitted'
}
✅ Submission created successfully: SUB_1732876543_abc123xyz
```

---

## 2️⃣ **Tbl_ExamAttempts** Collection ⭐

**Purpose:** Tracks exam/assignment attempts and performance

**Data Saved:**

```javascript
{
  Attempt_Id: "ATTEMPT_1732876543_xyz789abc",    // Auto-generated
  Exam_Id: "ASSIGN_123",                          // Same as Assignment_Id
  Student_Id: "STU_456",                          // Your student ID
  Score: 85,                                      // Your score
  Attempt_Date: "2025-11-29T16:47:23.000Z",      // Attempt timestamp
  Time_Taken: 2,                                  // Time in MINUTES
  Status: "Completed",                            // Status
  Answers: {                                      // Parsed answers object
    "1": "answer1",
    "2": "1",
    "3": "answer3",
    "4": "2"
  },
  Percentage: 85                                  // Percentage score
}
```

**Console Output:**

```
📊 Preparing exam attempt data: {
  Exam_Id: 'ASSIGN_123',
  Student_Id: 'STU_456',
  Score: 85,
  Percentage: 85,
  Time_Taken: '2 minutes'
}
✅ Exam attempt CREATED in Tbl_ExamAttempts: ATTEMPT_1732876543_xyz789abc

🎉 SUBMISSION COMPLETE - Data saved to:
   ✓ Tbl_Submissions - Submission_Id: SUB_1732876543_abc123xyz
   ✓ Tbl_ExamAttempts - Exam tracking
```

---

## 🖥️ **Frontend Alert Message**

When you click Submit, you'll see:

```
✅ Assignment Submitted Successfully!

📊 Your Score: 85/100 (85%)
⏱️ Time Spent: 2:08

💾 Saved to:
  • Tbl_Submissions ✓
  • Tbl_ExamAttempts ✓

Submission ID: SUB_1732876543_abc123xyz
```

---

## 📊 **Verify in MongoDB**

### Check Tbl_Submissions:

```javascript
db.Tbl_Submissions.find({ Student_Id: "YOUR_STUDENT_ID" }).sort({
  Submitted_On: -1,
});
```

### Check Tbl_ExamAttempts:

```javascript
db.Tbl_ExamAttempts.find({ Student_Id: "YOUR_STUDENT_ID" }).sort({
  Attempt_Date: -1,
});
```

---

## 🔍 **Browser Console Logs**

Open browser console (F12) when submitting to see:

```javascript
📤 Submitting Assignment Data: {
  Assignment_Id: "ASSIGN_123",
  Student_Id: "STU_456",
  Course_Id: "COURSE_789",
  Score: 85,
  Percentage: 85,
  Time_Spent: "2:08",
  Status: "Submitted"
}

📥 Server Response: {
  success: true,
  message: "Submission created successfully",
  data: { Submission_Id: "SUB_...", ... }
}

✅ Assignment submission completed successfully!
```

---

## 🎯 **Summary**

When you click **"Submit Assignment"** button:

✅ **Step 1:** Frontend calculates your score (auto-grading)  
✅ **Step 2:** Sends data to backend API  
✅ **Step 3:** Backend saves to `Tbl_Submissions` collection  
✅ **Step 4:** Backend saves to `Tbl_ExamAttempts` collection  
✅ **Step 5:** Returns success response  
✅ **Step 6:** Shows success alert with score

**Both collections are updated automatically!** 🎉

---

## 🚀 **Test It Now:**

1. Go to assignment page
2. Answer all questions
3. Click "Submit Assignment"
4. Check browser console (F12)
5. Check backend terminal logs
6. Verify MongoDB collections

**Everything is working and saving data correctly!** ✅
