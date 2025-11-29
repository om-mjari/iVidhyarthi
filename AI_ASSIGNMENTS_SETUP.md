# AI-Powered Weekly Assignments - Setup Guide

## 🚀 Features Implemented

### 1. **Scrollable View**
- Full-page scroll with fixed header
- Smooth scrolling animation
- Custom scrollbar styling with gradient theme
- Optimized for performance

### 2. **AI-Generated Content Integration**

#### **Topic-Related Videos**
- AI generates 3 recommended videos per week
- Each video includes:
  - Title and description
  - Duration and difficulty level
  - Thumbnail and tags
  - YouTube integration ready

#### **Assignment Questions**
- AI generates 10 questions per assignment
- Question types: MCQ, True/False, Short Answer, Coding
- Each question includes:
  - Question text
  - Multiple choice options
  - Correct answer
  - Detailed explanation
  - Marks allocation
  - Difficulty level

#### **Study Materials**
- Auto-generated for each week:
  - Topic summary
  - Learning objectives
  - Key points
  - Prerequisites
  - Resource links

### 3. **Expandable Week Cards**
- Click "View Content" to expand any week
- Shows AI-generated content on demand
- Smooth expand/collapse animation
- Only loads content when expanded (performance optimization)

---

## 🔧 Setup Instructions

### **Step 1: Install Dependencies**

```bash
cd c:\Users\omjar\OneDrive\Desktop\react\iVidhyarthi
npm install
```

### **Step 2: Environment Variables**

Create `.env` file in the root directory:

```env
# AI API Configuration (Choose one)
VITE_AI_API_KEY=your-openai-api-key-here
# OR
VITE_AI_API_KEY=your-gemini-api-key-here

# YouTube API (Optional - for real video search)
VITE_YOUTUBE_API_KEY=your-youtube-api-key-here
```

### **Step 3: AI Provider Setup**

#### **Option A: OpenAI (GPT-4)**
1. Get API key from https://platform.openai.com/api-keys
2. Add to `.env`: `VITE_AI_API_KEY=sk-...`
3. Uncomment API call code in `aiContentService.js`

#### **Option B: Google Gemini**
1. Get API key from https://makersuite.google.com/app/apikey
2. Update `AI_API_ENDPOINT` in `aiContentService.js`:
   ```javascript
   const AI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
   ```

#### **Option C: Use Mock Data (Current)**
- No setup needed
- Uses pre-generated sample data
- Perfect for development/testing

---

## 📂 New Files Created

### 1. **`src/services/aiContentService.js`**
AI content generation service with functions:
- `generateTopicVideos()` - Video recommendations
- `generateAssignmentQuestions()` - Question bank
- `generateStudyMaterials()` - Study resources
- `searchYouTubeVideos()` - Real YouTube search
- `getAssignmentHint()` - AI hints for students

### 2. **Updated Files**
- `src/WeeklyAssignments.jsx` - Added expand/collapse functionality
- `src/WeeklyAssignments.css` - Scrollable view + AI content styling

---

## 🎯 How It Works

### **User Flow:**
1. Student opens Weekly Assignments page
2. Sees progress overview and all 7 weeks
3. Clicks "View Content" on any week
4. AI generates (or loads cached):
   - 3 video lectures
   - Study materials
   - Preview of 10 questions
5. Student can watch videos or start assignment
6. Questions are used in assignment interface

### **Technical Flow:**
```
User clicks "View Content"
    ↓
handleExpandWeek(weekNumber)
    ↓
loadAIContent(weekNumber)
    ↓
Promise.all([
  generateTopicVideos(),
  generateAssignmentQuestions(),
  generateStudyMaterials()
])
    ↓
setState with AI content
    ↓
Render expanded section
```

---

## 🎨 UI Components Added

### **1. Study Materials Section**
- Blue gradient background
- Learning objectives with target icons
- Key points with sparkle icons
- Prerequisites list

### **2. Video Cards**
- Thumbnail with play overlay
- Duration badge
- Difficulty level badge
- Tags for categorization
- Hover animations

### **3. Questions Preview**
- Shows first 3 questions
- Question type badges
- Marks allocation
- MCQ options preview
- Note about full question bank

---

## ⚙️ Configuration

### **Change Number of Videos:**
Edit `aiContentService.js`:
```javascript
const mockVideos = Array.from({ length: 5 }, ...); // Change 3 to 5
```

### **Change Number of Questions:**
```javascript
generateAssignmentQuestions(topic, difficulty, 15); // Change 10 to 15
```

### **Customize Video Sources:**
Update `searchYouTubeVideos()` to use your preferred platform or API

### **Modify Question Types:**
Edit `questionTypes` array:
```javascript
const questionTypes = ['MCQ', 'True/False', 'Essay', 'Programming'];
```

---

## 🧪 Testing

### **Test Scrolling:**
1. Open Weekly Assignments page
2. Scroll through all 7 weeks
3. Verify smooth scrolling
4. Check custom scrollbar appearance

### **Test Expand/Collapse:**
1. Click "View Content" on Week 1
2. Verify loading spinner appears
3. Confirm AI content displays
4. Click "Hide Content" to collapse
5. Repeat for different weeks

### **Test AI Content:**
1. Expand a week
2. Verify 3 videos appear
3. Check study materials section
4. View question previews
5. Confirm all content is relevant

---

## 🔌 API Integration (When Ready)

### **Enable Real AI Generation:**

1. **Uncomment API calls** in `aiContentService.js`:
   ```javascript
   // In generateTopicVideos()
   const response = await fetch(AI_API_ENDPOINT, {...});
   ```

2. **Update prompts** for your specific needs:
   ```javascript
   content: `Generate videos for ${topic} in ${courseName} focusing on practical applications`
   ```

3. **Add error handling:**
   ```javascript
   try {
     const aiResponse = await fetch(...);
     if (!aiResponse.ok) throw new Error('API Error');
   } catch (error) {
     console.error(error);
     return mockData; // Fallback
   }
   ```

---

## 💡 Best Practices

### **Performance:**
- Content loads only when expanded (lazy loading)
- Cached in state to avoid re-fetching
- Debounce expand/collapse to prevent spam

### **UX:**
- Loading states show spinner
- Smooth animations for expand/collapse
- Error handling with fallback content
- Mobile-responsive design

### **SEO:**
- Semantic HTML structure
- Accessible ARIA labels
- Proper heading hierarchy

---

## 🐛 Troubleshooting

### **Content Not Loading:**
1. Check browser console for errors
2. Verify `.env` file exists
3. Confirm API key is valid
4. Check network tab for failed requests

### **Scroll Not Working:**
1. Verify CSS applied: `.assignments-grid-container`
2. Check `overflow-y: auto` is set
3. Ensure parent has fixed height

### **Expand Animation Choppy:**
1. Use `will-change: transform` in CSS
2. Reduce animation duration
3. Remove heavy images during animation

---

## 🎓 Future Enhancements

### **Planned Features:**
- [ ] AI-powered personalized study paths
- [ ] Real-time video recommendations based on performance
- [ ] Adaptive question difficulty
- [ ] Chatbot for assignment help
- [ ] Voice-to-text for answers
- [ ] Collaborative learning features
- [ ] Gamification with badges
- [ ] Progress analytics dashboard

### **Advanced AI Features:**
- [ ] Natural language question generation
- [ ] Automated grading with explanations
- [ ] Plagiarism detection
- [ ] Code execution for programming questions
- [ ] Speech recognition for verbal answers

---

## 📊 Analytics Integration

Track user engagement:
```javascript
// Log when user expands content
analytics.track('week_content_expanded', {
  weekNumber: week,
  courseName: courseName,
  timestamp: new Date()
});

// Log video views
analytics.track('video_viewed', {
  videoId: video.id,
  weekNumber: week
});
```

---

## 🔐 Security Notes

1. **API Key Protection:**
   - Never commit `.env` to Git
   - Use environment variables
   - Rotate keys regularly

2. **Content Validation:**
   - Sanitize AI-generated content
   - Filter inappropriate responses
   - Verify question quality

3. **Rate Limiting:**
   - Cache AI responses
   - Limit API calls per user
   - Implement request throttling

---

**Version:** 2.0.0  
**Date:** November 2025  
**Status:** ✅ Ready for Testing
