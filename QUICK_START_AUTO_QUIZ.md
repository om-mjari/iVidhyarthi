# Quick Start - Automated Quiz System

## What Was Built
A **fully automated** AI quiz generation and certification system that requires ZERO manual intervention.

## How It Works

### Student Flow
1. Complete 100% of course (videos + assignments)
2. Click "Attempt Quiz" button
3. System auto-generates quiz from course materials (first time only)
4. Take quiz (5 attempts max)
5. Pass (≥70%) → Automatic certificate PDF + email
6. Fail → Track remaining attempts, enforce blocks

### Key Rules
- **5 attempts max** per student
- **70% to pass** and get certificate
- **30-day block** after 5 failures
- **Permanent block** after 30 days
- **Auto-generates** quiz from PDFs/notes using AI (free Mixtral-8x7B)

## Setup (Required)

### 1. Environment Variables
Add to `backend/.env`:
```env
HF_API_KEY=your_huggingface_api_key
EMAIL_USER=your_email@gmail.com
EMAIL_APP_PASSWORD=your_app_password
```

Get free Hugging Face API key: https://huggingface.co/settings/tokens

### 2. Start Backend
```bash
cd backend
node server.js
```

## Files Created

### Backend Services (7 services)
✅ `backend/services/textExtractionService.js` - Extract text from PDFs/docs
✅ `backend/services/chunkingService.js` - Split into AI-friendly chunks
✅ `backend/services/aiQuizGenerationService.js` - Generate questions using AI
✅ `backend/services/quizConsolidationService.js` - Deduplicate & select best questions
✅ `backend/services/autoQuizOrchestrator.js` - Coordinate entire workflow
✅ `backend/services/attemptManagementService.js` - Enforce 5-attempt rule & blocks
✅ `backend/services/certificateService.js` - Generate PDF & email certificates

### Backend Routes
✅ `backend/routes/autoQuizRoutes.js` - 8 API endpoints

### Frontend Integration
✅ Modified `src/CourseLearningPage.jsx` - "Attempt Quiz" button logic

### Server Registration
✅ Modified `backend/server.js` - Registered `/api/auto-quiz` routes

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auto-quiz/generate` | Generate quiz for course |
| GET | `/api/auto-quiz/check-eligibility` | Check if student can attempt |
| GET | `/api/auto-quiz/check-progress` | Get course completion % |
| POST | `/api/auto-quiz/attempt` | Submit quiz & auto-evaluate |
| GET | `/api/auto-quiz/history` | Get attempt history |
| GET | `/api/auto-quiz/quiz/:courseId` | Fetch quiz |
| GET | `/api/auto-quiz/certificate/:studentId/:courseId` | Get certificate |

## Testing

1. Enroll in a course
2. Complete all videos and assignments (100%)
3. Click "Attempt Quiz" (purple button)
4. Wait for quiz generation (2-5 minutes first time)
5. Answer questions and submit
6. Check email for certificate (if passed)

## Features

✅ **100% Automated** - No lecturer approval needed
✅ **AI-Powered** - Free Mixtral-8x7B model via Hugging Face
✅ **Quality Control** - Deduplication (75% threshold) & quality scoring (60% min)
✅ **Fair System** - 5 attempts, 30-day blocks, permanent blocks
✅ **Auto Certificates** - PDF generation + email with attachment
✅ **Efficient** - Quiz generated once, reused by all students
✅ **Secure** - Progress-locked (100% required), attempt validation

## System Flow

```
Course Materials (PDFs/Notes)
    ↓
Text Extraction (pdf-parse, mammoth, textract)
    ↓
Chunking (800-1500 words)
    ↓
AI Generation (Mixtral-8x7B) → 3 MCQ + 2 Short + 1 Conceptual per chunk
    ↓
Consolidation (deduplicate, score, select best 30)
    ↓
Store in Tbl_Quiz (Week_Number=0)
    ↓
Student Attempts (auto-evaluate MCQs)
    ↓
Pass (≥70%) → Generate Certificate → Email PDF
Fail (<70%) → Track attempts → Block if needed
```

## Blocking System

| Scenario | Action |
|----------|--------|
| 0-4 attempts used | Allow more attempts |
| 5 attempts failed | 30-day temporary block |
| After 30 days | Permanent block |
| Passed (≥70%) | Block further attempts (success) |

## Dependencies Installed

```bash
pdf-parse         # PDF text extraction
mammoth           # DOCX text extraction  
textract          # PPT text extraction
string-similarity # Deduplication
@huggingface/inference # Free AI API
```

## No New Database Tables

Uses existing collections:
- `Tbl_Quiz` - Store generated quizzes
- `Tbl_QuizAttempts` - Track student attempts
- `Tbl_Certificates` - Store certificates
- `Tbl_CourseContent` - Source materials
- `Tbl_Enrollments` - Progress tracking

## Documentation

📄 **AUTO_QUIZ_CERTIFICATION_GUIDE.md** - Full system documentation
📄 **QUICK_START_AUTO_QUIZ.md** - This file (quick reference)

## Troubleshooting

**Quiz generation fails:**
- Verify course has PDFs/notes in database
- Check `HF_API_KEY` environment variable
- Check backend console logs

**Certificate not generated:**
- Verify EMAIL credentials in `.env`
- Check if student scored ≥70%
- Verify PDFKit is installed

**Blocked incorrectly:**
- Check `Tbl_QuizAttempts` for attempt history
- Verify date calculations (30-day period)

## Support

Issues? Check:
1. Backend console logs
2. Environment variables (`.env` file)
3. Database collections (MongoDB)
4. API responses (use browser DevTools)

---

**Status**: ✅ Fully Implemented
**Ready**: Yes, test now!
**Cost**: $0 (uses free Hugging Face API)
