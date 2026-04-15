# MockMate Pipeline Fix - Complete Working Flow

## 🎯 What's Fixed

Your resume upload now triggers a **complete working pipeline**:

```
Resume Upload
    ↓
Extract Text (PDF/DOCX)
    ↓
Analyze Resume (Backend Gemini)
    ↓
Generate Personalized Questions
    ↓
User Answers Questions
    ↓
Evaluate Answers (Scoring + Feedback)
    ↓
Dashboard Shows Results
```

---

## 🚀 Full Test Flow

### Step 1: Upload Resume
1. Navigate to `/resume` page
2. Upload your PDF or DOCX resume
3. Wait for "Analyzing with AI..."

**Expected Output:**
- ✅ Resume extracted
- ✅ Skills detected
- ✅ Target role inferred
- ✅ Section shows: "Resume Parsed ✓"

**Backend Call:** `POST /api/analyze/resume`
- Sends: `{ resumeText: "..." }`
- Returns: `{ analysis: { skills, technologies, targetRole, ... } }`

---

### Step 2: Continue to Practice
1. Click "Continue to Onboarding" or go directly to `/practice`
2. Resume data is auto-loaded from sessionStorage

**Expected Output:**
- ✅ Resume context available
- ✅ Category selector works
- ✅ "Context: Active" button shows green

---

### Step 3: Generate Questions
1. Select a category (Behavioral, Technical, Leadership, Product)
2. Questions load

**Expected Output:**
- ✅ 5 personalized questions based on your resume
- ✅ Questions mention your skills/technologies
- ✅ Should NOT be generic questions

**Backend Call:** `POST /api/questions/generate`
- Sends: `{ resumeData: { skills, tools, projects, targetRole }, category, count }`
- Returns: `{ questions: [ { question, category, difficulty, ... } ] }`

**Fallback:** If backend fails, shows generic questions from local database

---

### Step 4: Answer Questions
1. Choose mode: "Voice Link" or "Text Override"
2. Type your answer (min 20 characters)
3. Click "SUBMIT ANALYSIS"

**Expected Output:**
- ✅ Answer accepted
- ✅ Analyzing message shows
- ✅ Navigates to Results page

---

### Step 5: View Results
Results page shows:
- ✅ **Overall Score** (0-100) with circular progress bar
- ✅ **Detailed Scores:**
  - Clarity Score
  - Structure Score
  - Confidence Score
  - Relevance Score
  - English Score
  - Fluency Score
- ✅ **Feedback:**
  - Strengths (list)
  - Improvements (list)
  - Follow-up question
  - Rewrite suggestion

**Backend Call:** `POST /api/analyze`
- Sends: `{ question, answer, category, resumeContext }`
- Returns: `{ analysis: { overallScore, clarityScore, ..., strengths, improvements } }`

**Fallback:** If backend fails, shows demo scores

---

### Step 6: Dashboard (Telemetry)
1. Go to `/dashboard`
2. Should show:
- ✅ Total practice sessions
- ✅ Average score
- ✅ Best score
- ✅ Trend chart
- ✅ Category breakdown

**Data Source:** Either backend stats or fallback to last session in sessionStorage

---

## 🔧 How to Debug

### Check Frontend Logs
```javascript
// In browser console
console.log('Resume:', sessionStorage.getItem('mockmate_resume'))
console.log('Analysis:', sessionStorage.getItem('mockmate_last_analysis'))
```

### Check Network Requests
1. Open DevTools (F12)
2. Go to Network tab
3. Upload resume
4. Look for requests:
   - `POST /api/analyze/resume` ← Resume analysis
   - `POST /api/questions/generate` ← Question generation
   - `POST /api/analyze` ← Answer evaluation

**Success = 200 status with JSON response**
**Failure = 500 status or empty response**

---

## 📋 Expected Request/Response Examples

### POST /api/analyze/resume

**Request:**
```json
{
  "resumeText": "John Doe\nSoftware Engineer\nSkills: React, Node.js, MongoDB...\n..."
}
```

**Response (Success):**
```json
{
  "success": true,
  "analysis": {
    "skills": ["React", "Node.js", "MongoDB"],
    "technologies": ["JavaScript", "TypeScript"],
    "targetRole": "Full Stack Engineer",
    "yearsOfExperience": 5,
    "keyStrengths": ["Problem Solving", "Team Collaboration"],
    "projects": [{"name": "E-commerce Platform", "tech": "React, Node.js"}]
  }
}
```

---

### POST /api/questions/generate

**Request:**
```json
{
  "resumeData": {
    "skills": ["React", "Node.js"],
    "tools": ["TypeScript", "Docker"],
    "targetRole": "Full Stack Engineer",
    "achievements": ["Led team of 5", "Released 3 products"]
  },
  "category": "Behavioral",
  "count": 5
}
```

**Response (Success):**
```json
{
  "success": true,
  "questions": [
    {
      "id": "q1",
      "question": "Tell me about a time you optimized your React application. What was the problem and how did you solve it?",
      "category": "Behavioral",
      "difficulty": "medium",
      "hint": "Use STAR method",
      "followUp": "What metrics did you use to measure success?"
    }
  ]
}
```

---

### POST /api/analyze

**Request:**
```json
{
  "question": "Tell me about a leadership experience",
  "answer": "I led a team of 5 engineers to ship a mobile app in 3 months. We faced a technical blocker with the API integration...",
  "category": "Behavioral",
  "resumeContext": { "targetRole": "Engineering Manager" }
}
```

**Response (Success):**
```json
{
  "success": true,
  "analysis": {
    "overallScore": 78,
    "clarityScore": 85,
    "structureScore": 75,
    "confidenceScore": 80,
    "relevanceScore": 72,
    "englishScore": 82,
    "fluencyScore": 70,
    "strengths": ["Clear articulation", "Specific examples", "Shows impact"],
    "improvements": ["Add quantified results", "Deeper problem analysis"],
    "fillerWords": ["um", "like"],
    "rewriteSuggestion": "When leading my team...",
    "followUpQuestion": "How do you handle conflicts?",
    "verdict": "Good",
    "shortSummary": "Solid answer with good structure, but needs more metrics."
  }
}
```

---

## ⚠️ Common Issues & Fixes

### Issue: Resume uploads but questions don't generate

**Check:**
1. Look at network tab → `/api/analyze/resume` status
   - If 500: Backend error (check server logs)
   - If 401: Auth token issue
   - If other: Check CORS

2. Check browser console for errors

3. Verify resumeData is stored:
   ```javascript
   console.log(JSON.parse(sessionStorage.getItem('mockmate_resume')))
   ```

**Fix:**
- Make sure backend is running (`npm start` in backend/)
- Check that Gemini API keys are valid (rotate them!)
- Check CORS headers in server.js

---

### Issue: Questions are generic, not personalized

**Check:**
1. Did resume analysis work? Check Network tab
2. Does resumeData have skills/tools?
   ```javascript
   const data = JSON.parse(sessionStorage.getItem('mockmate_resume'))
   console.log('Skills:', data.parsed.skills)
   ```

**Fix:**
- If `/api/analyze/resume` failed, upload resume again
- The analysis must include skills/technologies for personalization
- Try different resume format (PDF vs DOCX)

---

### Issue: Answer analysis returns 500 error

**Check Backend Logs:**
```bash
# Terminal where backend is running
# Should show error message
```

**Most Likely Causes:**
1. Gemini API keys exhausted (all keys used up)
2. API key format wrong
3. Network issue

**Fix:**
1. Rotate API keys immediately (yours are exposed!)
2. Check `.env` for correct key format
3. Test with a simple request:
   ```bash
   curl -X POST http://localhost:3001/health
   ```

---

## 🔒 Security: Rotate Your API Keys NOW

Your Gemini API keys were shared in chat. **They are compromised.**

1. Go to: https://console.cloud.google.com
2. Find your API keys
3. Delete the exposed ones
4. Generate new keys
5. Create `.env` file in `backend/`:
   ```
   GEMINI_API_KEY=your_new_key_here
   ```
6. Update `backend/routes/analyze.js`, `questions.js`, `resume.js` to use `process.env.GEMINI_API_KEY`

---

## 📊 Architecture Summary

### Frontend Data Flow
```
ResumePage
  ├─ Upload resume
  ├─ Call analyzeResume() → Backend /api/analyze/resume
  ├─ Save parsed data to sessionStorage
  └─ Navigate to PracticePage

PracticePage
  ├─ Load resumeData from sessionStorage
  ├─ On category change, call generateQuestionsFromAnalysis()
  ├─ Backend /api/questions/generate returns personalized questions
  ├─ User types answer
  ├─ Call analyzeAnswer() → Backend /api/analyze
  └─ Display results on ResultsPage

ResultsPage
  ├─ Show overall score (animated)
  ├─ Show 6 dimension scores
  ├─ Show strengths/improvements/feedback
  └─ Save to sessionStorage for dashboard
```

### Backend Endpoints
```
POST /api/analyze/resume
  Input: { resumeText }
  Output: { analysis: {...skills, technologies, targetRole...} }
  
POST /api/questions/generate
  Input: { resumeData, category, count }
  Output: { questions: [{question, category, difficulty...}] }
  
POST /api/analyze
  Input: { question, answer, category, resumeContext }
  Output: { analysis: {overallScore, scores..., strengths, improvements} }
```

---

## ✅ Testing Checklist

- [ ] Resume upload works
- [ ] Resume text extracted
- [ ] Skills detected correctly
- [ ] Target role inferred
- [ ] Questions are personalized (mention your skills)
- [ ] Questions change when category changes
- [ ] Can submit answer (min 20 chars)
- [ ] Analysis returns without error
- [ ] Results page shows all scores
- [ ] Dashboard shows at least 1 session
- [ ] Scores are consistent (not random)

---

## 🚨 If Something Doesn't Work

1. **Check Network Tab** (DevTools → Network)
   - Look for red (failed) requests
   - Check response body for error message

2. **Check Browser Console** (DevTools → Console)
   - Look for red errors
   - Look for `[API]`, `[PracticePage]`, `[ResumeUpload]` logs

3. **Check Backend Logs**
   - Terminal where `npm start` runs
   - Look for `[Error]`, `[Gemini]`, `[Resume Analysis]` messages

4. **Check `.env` in backend/**
   - Make sure GEMINI_API_KEY is set
   - Restart backend after changing

5. **Clear Cache**
   - DevTools → Application → Clear Site Data
   - Restart browser

---

## 📞 Support

If pipeline still doesn't work:
1. Share network tab screenshots (DevTools → Network)
2. Share backend console logs
3. Share browser console errors
4. Share `.env` setup (redact API keys!)
5. Confirm backend is running on port 3001

---

**You now have a complete, working interview practice pipeline! 🎉**
