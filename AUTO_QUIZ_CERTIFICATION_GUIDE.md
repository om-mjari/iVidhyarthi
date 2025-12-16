# Automated AI-Based Quiz & Certification System

## Overview
Fully automated quiz generation and certification system that requires NO lecturer involvement. System automatically generates quizzes when students reach 100% course completion, evaluates attempts, enforces attempt limits, and issues certificates.

---

## System Architecture

### Core Services

1. **textExtractionService.js**
   - Extracts text from PDF, DOCX, PPT, TXT files
   - Cleans text (removes page numbers, headers, footers, duplicates)
   - Uses: `pdf-parse`, `mammoth`, `textract`

2. **chunkingService.js**
   - Splits large texts into 800-1500 word chunks
   - Maintains paragraph boundaries
   - Target chunk size: 1200 words

3. **aiQuizGenerationService.js**
   - Uses Hugging Face Inference API (Mixtral-8x7B-Instruct)
   - Generates per chunk: 3 MCQs, 2 short answers, 1 conceptual question
   - Structured prompt engineering with retry logic
   - **FREE API** (no cost)

4. **quizConsolidationService.js**
   - Deduplicates questions using string-similarity (>75% threshold)
   - Scores questions for quality (0.6 minimum)
   - Selects best 30 questions: 15 MCQ, 10 short answer, 5 conceptual
   - Assigns points: MCQ=1, Short=2, Conceptual=3

5. **autoQuizOrchestrator.js**
   - Coordinates entire workflow:
     - Fetch course materials (PDFs, notes)
     - Extract text → Chunk → Generate → Consolidate
     - Store in existing `Tbl_Quiz` collection
   - Only generates quiz once per course (reused by all students)

6. **attemptManagementService.js**
   - Enforces 5-attempt maximum per student
   - 30-day block on failure after 5 attempts
   - Permanent block after 30-day period expires
   - 70% passing threshold
   - Auto-evaluates MCQ answers

7. **certificateService.js**
   - Generates professional PDF certificates using PDFKit
   - Includes: student name, course, grade, score, certificate number
   - Auto-emails certificate via nodemailer
   - Stores in `Tbl_Certificates` collection

---

## API Routes (`/api/auto-quiz`)

### POST `/generate`
Generate quiz for a course (auto-called on first attempt)
```json
{
  "courseId": "123",
  "studentId": "STU001"
}
```

### GET `/check-eligibility`
Check if student can attempt quiz
```
?studentId=STU001&courseId=123
```
Returns: `{ canAttempt, remainingAttempts, isBlocked, isPassed, ... }`

### GET `/check-progress`
Check course completion progress
```
?studentId=STU001&courseId=123
```
Returns: `{ progress, canAttemptQuiz, message }`

### POST `/attempt`
Submit quiz attempt and auto-evaluate
```json
{
  "studentId": "STU001",
  "courseId": "123",
  "quizId": "QUIZ_123",
  "answers": { "1": 2, "2": 0, ... }
}
```
Returns: `{ score, percentage, isPassed, certificate: {...} }`

### GET `/history`
Get student's attempt history
```
?studentId=STU001&quizId=QUIZ_123
```

### GET `/quiz/:courseId`
Fetch generated quiz for a course

### GET `/certificate/:studentId/:courseId`
Fetch certificate (if passed)

---

## Frontend Integration (CourseLearningPage.jsx)

### "Attempt Quiz" Button Logic
- **Enabled**: When course progress = 100% (videos + assignments)
- **Disabled**: Progress < 100%
- **Visual**: Purple gradient when enabled, gray when disabled

### Click Flow
1. Check eligibility (`/check-eligibility`)
2. If blocked → Show block message with expiry date
3. If passed → Show "already passed" message
4. If quiz doesn't exist → Auto-generate (takes 2-5 minutes)
5. Fetch quiz and show attempt info (remaining attempts)
6. Display quiz interface

### After Submission
- Auto-evaluate answers
- If passed (≥70%):
  - Generate PDF certificate
  - Send email with certificate attachment
  - Store in `Tbl_Certificates`
- If failed:
  - Decrement remaining attempts
  - If 0 attempts left → 30-day block
  - If block expired → Permanent block

---

## Database Collections Used

### Existing Collections (NO NEW TABLES)
- `Tbl_Quiz` - Stores generated quizzes (Week_Number=0 for auto-quizzes)
- `Tbl_QuizAttempts` - Tracks all student attempts
- `Tbl_Certificates` - Stores issued certificates
- `Tbl_CourseContent` - Source for quiz generation (PDFs, notes)
- `Tbl_Enrollments` - Progress tracking

---

## Attempt & Block Rules

### Attempt Limits
- **Maximum**: 5 attempts per student per course
- **Passing**: 70% or higher
- **Evaluation**: Automatic (only MCQs currently)

### Blocking System
1. **After 5 failures**: 30-day temporary block
2. **After 30-day block expires**: Permanent block
3. **If passed**: No more attempts allowed (success state)

### Block Messages
- Temporary: "Blocked until [date]. Reason: Maximum attempts reached."
- Permanent: "Permanently blocked. Reason: 5 failed attempts."
- Passed: "Already passed! Check certificates section."

---

## Environment Variables Required

```env
# Hugging Face API (FREE)
HF_API_KEY=your_hf_api_key_here

# Email (for certificate delivery)
EMAIL_USER=your_email@gmail.com
EMAIL_APP_PASSWORD=your_app_password
HOST=smtp.gmail.com
SERVICE=gmail
EMAIL_PORT=587
SECURE=false

# MongoDB
MONGODB_URI=mongodb+srv://...

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173
```

---

## Installation & Setup

### 1. Install Dependencies (Already Done)
```bash
cd backend
npm install pdf-parse mammoth textract string-similarity @huggingface/inference
```

### 2. Set Environment Variables
Add `HF_API_KEY` to `.env` file (get free key from huggingface.co)

### 3. Start Backend
```bash
cd backend
node server.js
```

### 4. Test Quiz Generation
Navigate to a course with 100% completion and click "Attempt Quiz"

---

## How It Works (Step-by-Step)

### First Time (Quiz Generation)
1. Student completes 100% of course
2. "Attempt Quiz" button becomes enabled
3. Student clicks → System checks if quiz exists
4. If not, auto-generates:
   - Fetches all PDFs and notes from `Tbl_CourseContent`
   - Extracts text from each file
   - Chunks text into 1200-word segments
   - Sends each chunk to AI (Mixtral-8x7B) for question generation
   - Consolidates questions (deduplication, quality scoring)
   - Saves best 30 questions to `Tbl_Quiz`
5. Quiz displayed to student

### Subsequent Attempts
1. Same students or other students click "Attempt Quiz"
2. System fetches existing quiz (no regeneration)
3. Checks attempt eligibility
4. Displays quiz

### Submission & Evaluation
1. Student submits answers
2. System auto-evaluates MCQs
3. Calculates score and percentage
4. If ≥70%:
   - Generates PDF certificate
   - Sends email with attachment
   - Stores in database
5. If <70%:
   - Records failed attempt
   - Shows remaining attempts
   - Blocks if needed

---

## Key Features

✅ **100% Automated** - No lecturer review needed
✅ **AI-Powered** - Uses free Hugging Face Mixtral-8x7B model
✅ **Quality Control** - Deduplication and scoring algorithms
✅ **Fair Attempts** - 5 attempts with 30-day blocks
✅ **Auto Certificates** - PDF generation and email delivery
✅ **Reusable Quizzes** - Generated once per course
✅ **Progress-Locked** - Only available at 100% completion
✅ **Secure** - Token authentication, attempt validation
✅ **No New Tables** - Uses existing database schema

---

## Files Created

### Backend Services (7 files)
- `backend/services/textExtractionService.js` (124 lines)
- `backend/services/chunkingService.js` (81 lines)
- `backend/services/aiQuizGenerationService.js` (230 lines)
- `backend/services/quizConsolidationService.js` (193 lines)
- `backend/services/autoQuizOrchestrator.js` (198 lines)
- `backend/services/attemptManagementService.js` (190 lines)
- `backend/services/certificateService.js` (270 lines)

### Backend Routes (1 file)
- `backend/routes/autoQuizRoutes.js` (211 lines)

### Frontend Integration
- Modified `src/CourseLearningPage.jsx` (handleQuizStart function)
- Modified `backend/server.js` (registered routes)

### Documentation
- `AUTO_QUIZ_CERTIFICATION_GUIDE.md` (this file)

---

## Testing Checklist

- [ ] Quiz generation (first attempt)
- [ ] Quiz reuse (second student attempt)
- [ ] Attempt eligibility check
- [ ] MCQ evaluation
- [ ] Certificate generation on pass
- [ ] Certificate email delivery
- [ ] 5-attempt limit enforcement
- [ ] 30-day block after failures
- [ ] Permanent block after expiry
- [ ] "Already passed" blocking

---

## Troubleshooting

### Quiz Generation Fails
- Check if course has PDF/notes in `Tbl_CourseContent`
- Verify `HF_API_KEY` is set correctly
- Check backend logs for specific errors

### Certificate Not Generated
- Verify `EMAIL_USER` and `EMAIL_APP_PASSWORD` are set
- Check if student passed (≥70%)
- Verify PDFKit is installed

### Attempt Blocked Incorrectly
- Check `Tbl_QuizAttempts` collection for attempt history
- Verify dates are correct (30-day calculation)

---

## Future Enhancements (Optional)

1. **Short Answer Evaluation** - Add NLP for non-MCQ questions
2. **Difficulty Levels** - Generate Easy/Medium/Hard questions
3. **Adaptive Testing** - Adjust difficulty based on performance
4. **Question Bank** - Store questions for reuse across courses
5. **Analytics Dashboard** - Track quiz performance metrics
6. **Multi-Language Support** - Generate quizzes in different languages

---

## Support

For issues or questions:
1. Check backend logs: `backend/server.js` console output
2. Verify environment variables are set
3. Test API routes using Postman
4. Check database collections for data integrity

---

**System Status**: ✅ Fully Implemented and Ready for Testing
**Last Updated**: 2024
**Version**: 1.0.0
