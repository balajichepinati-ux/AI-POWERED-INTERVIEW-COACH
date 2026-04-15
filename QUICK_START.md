# MockMate Quick Reference

## 🚀 Start the System (3 Steps)

### Step 1: Setup Environment
```bash
# In backend/ folder, create .env
cat > .env << EOF
GEMINI_API_KEY=your_new_key_here
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
EOF
```

### Step 2: Start Backend
```bash
cd backend
npm install  # First time only
npm start
```

**Should see:**
```
🎙️  MockMate API running on http://localhost:3001
```

### Step 3: Start Frontend
```bash
cd frontend
npm install  # First time only
npm run dev
```

**Should see:**
```
➜  Local:   http://localhost:5173/
```

---

## 🧪 Verify Pipeline Works

### Windows
```batch
verify_pipeline.bat
```

### Mac/Linux
```bash
bash verify_pipeline.sh
```

### Manual Test
```bash
# Test 1: Backend running
curl http://localhost:3001/health

# Test 2: Resume analysis
curl -X POST http://localhost:3001/api/analyze/resume \
  -H "Content-Type: application/json" \
  -d '{"resumeText":"Senior engineer. React, Node.js. 5 years."}'

# Test 3: Question generation
curl -X POST http://localhost:3001/api/questions/generate \
  -H "Content-Type: application/json" \
  -d '{
    "resumeData":{"skills":["React"],"targetRole":"Engineer"},
    "category":"Technical","count":1
  }'
```

---

## 📱 Using the App

### 1. Upload Resume
```
http://localhost:5173/resume → Upload PDF/DOCX
```

✅ When working:
- File uploads
- Text extracts
- Shows "Resume Parsed ✓"
- Skills detected
- Target role shown

### 2. Practice Questions
```
http://localhost:5173/practice → Select category
```

✅ When working:
- Questions load (personalized from your resume)
- Can type or speak answer
- Minimum 20 characters

### 3. Get Results
```
Submit answer → Redirects to http://localhost:5173/results
```

✅ When working:
- Shows overall score (0-100)
- Shows 6 dimension scores
- Shows strengths & improvements
- Shows follow-up question

### 4. Dashboard
```
http://localhost:5173/dashboard
```

✅ When working:
- Shows total sessions
- Shows average score
- Shows trend chart

---

## 🔧 Common Commands

### Restart Everything
```bash
# Terminal 1: Backend
cd backend && npm start

# Terminal 2: Frontend (new terminal)
cd frontend && npm run dev
```

### Clear Cache & Restart
```bash
# Browser
DevTools → Application → Clear Site Data → Reload

# Backend
Ctrl+C → npm start
```

### View Backend Logs
```bash
# Look at Terminal where npm start runs
# Search for: [Error], [Gemini], [Resume]
```

### View Frontend Logs
```javascript
// Browser Console (F12)
console.log(JSON.parse(sessionStorage.getItem('mockmate_resume')))
console.log(JSON.parse(sessionStorage.getItem('mockmate_last_analysis')))
```

### Test Network Requests
```
Browser DevTools → Network tab → Upload resume
Look for: POST /api/analyze/resume (status 200)
```

---

## 🚨 Security Checklist

- [ ] Rotated API keys (**CRITICAL!**)
- [ ] Created `backend/.env`
- [ ] Set `GEMINI_API_KEY=...` in `.env`
- [ ] Added `.env` to `.gitignore`
- [ ] Restarted backend after creating `.env`

---

## 🆘 Troubleshooting Quick Fixes

| Problem | Check | Fix |
|---------|-------|-----|
| Backend won't start | Terminal shows error | Check `backend/.env` exists |
| Backend crashes | Console error | Install dotenv: `npm install dotenv` |
| API returns 500 | Network tab | Check `GEMINI_API_KEY` in `.env` |
| Questions are generic | SessionStorage | Upload resume again |
| Nothing loads | Port conflict | Check port 3001 & 5173 free |
| CORS error | Browser console | Verify FRONTEND_URL in `.env` |

---

## 📊 Data Flow Diagram

```
USER UPLOADS RESUME
        ↓
   FRONTEND extracts text
        ↓
   POST /api/analyze/resume ← BACKEND Gemini API
        ↓
   PARSE: skills, tools, role
        ↓
   SAVE: sessionStorage
        ↓
   ✅ "Resume Parsed"
   
─────────────────────────

USER GOES TO PRACTICE
        ↓
   LOAD: sessionStorage resume
        ↓
   SELECT: category
        ↓
   POST /api/questions/generate ← BACKEND
        ↓
   ✅ 5 personalized questions
   
─────────────────────────

USER ANSWERS QUESTION
        ↓
   TYPE: answer (20+ chars)
        ↓
   CLICK: SUBMIT ANALYSIS
        ↓
   POST /api/analyze ← BACKEND Gemini API
        ↓
   SCORE: 0-100
   FEEDBACK: strengths, improvements
        ↓
   REDIRECT: /results
        ↓
   SHOW: all scores + feedback
        ↓
   SAVE: sessionStorage + backend
        ↓
   ✅ Results displayed
```

---

## 🎯 What Should Happen

### When Things Work ✅

**Reset:**
```
File uploaded ✓
Text extracted ✓
Skills detected ✓
Parsed ✓
```

**Practice:**
```
Resume loaded ✓
Questions generated ✓
Personalized (mentions your skills) ✓
Can answer ✓
Analysis returned ✓
```

**Results:**
```
Overall score shown ✓
All 6 scores shown ✓
Strengths listed ✓
Improvements listed ✓
Feedback given ✓
No errors ✓
```

---

## 💡 Pro Tips

1. **Browser DevTools is your friend**
   - F12 → Console for errors
   - Network tab shows API calls
   - Application tab shows sessionStorage

2. **Backend logs show everything**
   - Look terminal where npm start runs
   - Search for `[Error]` or `[Gemini]`

3. **Clear cache if stuck**
   - DevTools → Application → Clear Site Data
   - Restart backend and frontend
   - Reload page

4. **Test endpoints independently**
   - Use curl to test each endpoint
   - Helps isolate backend vs frontend issues

5. **API Key issues are common**
   - If seeing 401/403 errors
   - Rotate keys immediately
   - Restart backend after updating `.env`

---

## 📞 When to Check What

| Issue | Where to Look |
|-------|---------------|
| Page won't load | Browser console (F12) |
| API returns error | Network tab → Response |
| Backend crashes | Terminal where npm runs |
| Questions are generic | SessionStorage → mockmate_resume |
| Scores are random | Backend logs for `[Gemini]` |
| CORS error | backend/.env FRONTEND_URL |
| Resume won't upload | Network tab → /api/resume/upload |
| Analysis takes forever | Check API logs for hangs |

---

## 🚀 Deploy to Production

When ready:

1. **Update environment variables** on server
2. **Set NODE_ENV=production**
3. **Enable HTTPS**
4. **Restrict CORS** to your domain
5. **Use real database** instead of sessionStorage
6. **Setup CI/CD** for auto-deployment

---

## 📝 Key Files

| File | Purpose |
|------|---------|
| `backend/routes/analyze.js` | Resume & answer analysis |
| `backend/routes/questions.js` | Question generation |
| `backend/server.js` | Server setup & routing |
| `frontend/src/lib/api.js` | API calls |
| `frontend/src/pages/ResumePage.jsx` | Upload interface |
| `frontend/src/pages/PracticePage.jsx` | Practice interface |
| `backend/.env` | Configuration (**CRITICAL**) |

---

## ✨ Success Indicators

When pipeline works, you'll see:

1. **Resume Page:**
   - Upload works
   - Skills show as tags
   - Green checkmark appears

2. **Practice Page:**
   - Questions appear (2-3 seconds after category select)
   - Question mentions your specific skills
   - Can type answer

3. **Results Page:**
   - Score displays with animation
   - 6 different scores shown
   - Feedback is specific to your answer

4. **Dashboard Page:**
   - Shows at least 1 practice session
   - Shows your scores
   - Shows trends

---

**You're all set! Start from Step 1 above and run the system. 🎉**
