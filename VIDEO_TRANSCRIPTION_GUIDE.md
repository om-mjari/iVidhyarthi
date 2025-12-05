# Video Transcription Feature

## Overview
This feature provides AI-powered video transcription, translation, summarization, and PDF export functionality for course videos.

## Features
- 🎯 **Automatic Speech Recognition**: Converts video speech to text using OpenAI's Whisper model
- 🌐 **Multi-language Translation**: Translates transcripts to English, Hindi, and Gujarati
- 📝 **AI Summarization**: Generates concise summaries using GPT-3.5
- 📥 **PDF Export**: Download transcripts with summaries as formatted PDF documents

## Setup Instructions

### 1. Install Required Packages
Already installed:
```bash
cd backend
npm install openai pdfkit fluent-ffmpeg ytdl-core @ffmpeg-installer/ffmpeg
```

### 2. Configure OpenAI API Key

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add it to `backend/.env`:
```env
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### 3. Backend Files Created

- `backend/utils/transcriptionService.js` - Core transcription logic
- `backend/routes/transcriptionRoutes.js` - API endpoints
- Added route to `backend/server.js`

### 4. Frontend Updates

Updated `src/CourseLearningPage.jsx`:
- Added transcript generation button for each video
- Display transcript and summary in video cards
- Modal view for full transcript
- PDF download functionality

## API Endpoints

### Generate Transcript
```
POST /api/transcription/generate
Body: {
  "videoUrl": "video-url",
  "videoTitle": "video-title",
  "language": "English|Hindi|Gujarati"
}
```

### Download PDF
```
POST /api/transcription/download-pdf
Body: {
  "transcript": "full-transcript-text",
  "summary": "summary-text",
  "videoTitle": "video-title",
  "language": "English"
}
```

## How It Works

1. **User clicks "Generate Transcript"** on a video card
2. System processes the video:
   - Downloads audio (if needed)
   - Transcribes using Whisper API
   - Translates to selected language (if not English)
   - Generates summary using GPT-3.5
3. **Displays results** with:
   - Summary box
   - Full transcript (scrollable)
   - Option to view in modal
   - Download as PDF button

## Usage in Frontend

```jsx
// Generate transcript for a video
await handleGenerateTranscript(video);

// Download PDF
await handleDownloadTranscriptPDF();
```

## Notes

- Transcripts are cached per video to avoid redundant API calls
- Language selection affects translation but not initial transcription
- PDF includes both summary and full transcript
- Modal provides better reading experience for longer transcripts

## Cost Considerations

- Whisper API: ~$0.006 per minute of audio
- GPT-3.5: ~$0.002 per 1K tokens
- Typical 10-minute video: ~$0.10 total

## Future Enhancements

- Cache transcripts in database
- Support for more languages
- Timestamp-based transcript segments
- Searchable transcripts
- Automatic transcript generation on video upload
