# 🚀 Quick Start - Submissions System

## For Developers

### Start the System
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
npm run dev
```

### Key Files Modified
- ✅ `backend/routes/submissionRoutes.js` - Added lecturer endpoint and marks update endpoint
- ✅ `src/LecturerDashboard.jsx` - Completely redesigned Submissions tab

### Database Fields (Already Exist)
- ✅ `Tbl_Assignments.File_URL` - Stores lecturer-uploaded assignment PDFs
- ✅ `Tbl_Submissions.File_Url` - Stores student-submitted PDFs

## For Lecturers

### Accessing Submissions
1. Login to Lecturer Dashboard
2. Click **"Submissions"** tab (between Uploads and Sessions)
3. View all student submissions

### Viewing PDFs
1. Find submission in table
2. Click **"📄 View PDF"** button
3. PDF opens in full-screen viewer
4. Can enter marks while viewing

### Entering Marks
**Method 1: From Table**
1. Type marks in input field next to submission
2. Click **"💾 Save"** button
3. Wait for "✅ Marks saved successfully!" alert

**Method 2: From PDF Viewer**
1. Open PDF with "📄 View PDF" button
2. Enter marks in input field at bottom
3. Click **"💾 Save Marks"** button

### Updating Marks
1. Change value in marks input field
2. Click **"✓ Update"** button (changes to Update after first save)
3. Marks updated immediately

### Viewing Statistics
- **Top Cards**: Total submissions, pending, graded, unique students
- **Student Cards**: Individual submission counts and scores per student

## API Endpoints

### Get Submissions (for lecturers)
```http
GET /api/submissions/lecturer/:lecturerId
Response: Array of enriched submissions with student names
```

### Save Marks
```http
PUT /api/submissions/marks/:submissionId
Body: { "Grade": 85, "Graded_By": "lecturer@email.com" }
Response: Updated submission object
```

### Grade with Feedback
```http
PUT /api/submissions/grade/:submissionId
Body: { "Grade": 85, "Feedback": "Great work!", "Graded_By": "lecturer@email.com" }
Response: Updated submission object
```

## Features at a Glance

✅ **Student Names**: Shows actual names, not just IDs  
✅ **Assignment Titles**: Clear assignment identification  
✅ **Submission Dates**: Formatted timestamps  
✅ **PDF Viewing**: Inline viewer, no downloads needed  
✅ **Quick Marks Entry**: Input + Save in one row  
✅ **Validation**: Prevents invalid marks  
✅ **Auto-refresh**: UI updates after save  
✅ **Statistics**: Per-student submission counts  
✅ **Status Tracking**: Graded vs Submitted badges  

## Keyboard Shortcuts
- **ESC**: Close PDF viewer modal
- **Tab**: Navigate between marks inputs
- **Enter**: (while in marks input) Save marks

## Common Tasks

### Task: Grade all pending submissions
1. Filter mentally by status (yellow badges = pending)
2. Enter marks for each
3. Click Save buttons
4. Watch statistics update in real-time

### Task: Check student progress
1. Scroll to "📊 Submission Count by Student" section
2. View cards showing each student's submissions
3. Check graded vs pending counts
4. Review overall score percentages

### Task: Review PDF and grade
1. Click "📄 View PDF" 
2. Read submission in full-screen viewer
3. Enter marks at bottom
4. Click "💾 Save Marks"
5. Modal closes automatically

## Troubleshooting

### PDF not showing
- Check File_Url field in database
- Verify file exists at `backend/uploads/assignments/`
- Ensure server is running on port 5000

### Student name shows as ID
- Check Tbl_Students collection has Full_Name field
- Verify Student_Id matches between tables
- Backend will fallback to email if name not found

### Marks not saving
- Check input value is between 0 and max marks
- Ensure backend is running
- Check browser console for errors
- Verify lecturer is logged in

## Data Flow

```
Student submits → File uploaded → File_Url saved → 
Lecturer views → Enters marks → Marks saved → 
Status = Graded → Statistics update
```

## Testing URLs
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- API Test: http://localhost:5000/api/submissions/lecturer/[email]

---

**Ready to use! No additional setup required.** 🎉
