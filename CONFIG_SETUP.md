# MockMate Environment Setup Guide

## 🚨 CRITICAL: API Keys Security

**Your Gemini API keys are now EXPOSED. You must rotate them immediately.**

### Rotate Exposed Keys Now

1. **Go to:** https://console.cloud.google.com
2. **Navigate:** APIs & Services → Credentials
3. **Find & Delete:** All exposed API keys (AIzaSy...)
4. **Create New:** Click "Create Credentials" → API Key
5. **Copy:** Your new key

---

## 📝 Backend Configuration

### Create `.env` file in `backend/` directory

```bash
# backend/.env

# Gemini API Key (REQUIRED - rotate immediately)
GEMINI_API_KEY=your_new_key_here

# Optional: Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Port
PORT=3001

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Environment
NODE_ENV=development
```

### Update Backend Routes to Use env Variables

#### File: `backend/routes/analyze.js`

Replace hardcoded keys with:

```javascript
// OLD (REMOVE):
// const GEMINI_API_KEYS = [
//   'AIzaSyCHRr8fVIVkCRWhH8mdvrCUMgoqlMSfWnE',
//   ...
// ];

// NEW (REPLACE WITH):
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not set in environment variables');
  process.exit(1);
}

async function callGeminiAPI(prompt, retryCount = 0) {
  if (retryCount >= 3) {
    throw new Error('Gemini API call failed after 3 retries');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7,
        }
      })
    });

    if (response.status === 401 || response.status === 403) {
      console.error('❌ [Gemini] Invalid API key. Key may be expired or revoked.');
      throw new Error('Invalid Gemini API key');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Gemini API call failed');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (err) {
    console.error(`[Gemini] Error (attempt ${retryCount + 1}):`, err.message);
    
    if (retryCount < 2) {
      await new Promise(r => setTimeout(r, 1000)); // Wait 1 second
      return callGeminiAPI(prompt, retryCount + 1);
    }
    throw err;
  }
}
```

#### Do the same for:
- `backend/routes/questions.js`
- `backend/routes/resume.js`

---

## 🚀 Running the Application

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Start Backend

```bash
cd backend
npm start
```

**Expected Output:**
```
🎙️  MockMate API running on http://localhost:3001
📚  Health: http://localhost:3001/health
🔒  Security Features: Enabled
```

### 3. Start Frontend

In a new terminal:
```bash
cd frontend
npm run dev
```

**Expected Output:**
```
VITE v4.x.x  ready in 123 ms

➜  Local:   http://localhost:5173/
```

### 4. Verify Pipeline

**Option A: Automatic Verification**
```bash
# Windows
./verify_pipeline.bat

# Mac/Linux
bash verify_pipeline.sh
```

**Option B: Manual Testing**

1. Open http://localhost:5173/resume
2. Upload a sample resume
3. Go to http://localhost:5173/practice
4. Select a category
5. Answer a question
6. Check results at http://localhost:5173/results

---

## 📊 Environment Variables Summary

### Backend Required

| Variable | Purpose | Example |
|----------|---------|---------|
| `GEMINI_API_KEY` | Gemini AI API key | `AIzaSy...` |
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |

### Backend Optional

| Variable | Purpose | Default |
|----------|---------|---------|
| `FRONTEND_URL` | Frontend origin | `http://localhost:5173` |
| `SUPABASE_URL` | Supabase project URL | None (optional) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase key | None (optional) |

### Frontend

Check `frontend/.env.local` or `frontend/vite.config.js`:

```javascript
// frontend/vite.config.js
export default defineConfig({
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify('/api')
  }
})
```

---

## 🔍 Troubleshooting

### Issue: "GEMINI_API_KEY is not defined"

**Error in backend logs:**
```
TypeError: Cannot read property 'generateContent' of undefined
```

**Solution:**
1. Create `.env` file in `backend/` directory
2. Add `GEMINI_API_KEY=your_key_here`
3. Restart backend: `npm start`
4. Verify: `echo $GEMINI_API_KEY` (Mac/Linux) or `echo %GEMINI_API_KEY%` (Windows)

### Issue: "Invalid API key"

**Error:**
```
401 Unauthorized from Gemini API
```

**Solutions:**
1. Check key is correct (no extra spaces)
2. Rotate key immediately (keys are compromised)
3. Regenerate at: https://console.cloud.google.com/apis/credentials
4. Wait 5-10 seconds after creating new key before using

### Issue: Backend crashes on startup

**Error:**
```
Error: Cannot find module 'dotenv'
```

**Solution:**
```bash
cd backend
npm install dotenv
npm start
```

### Issue: CORS errors

**Error in browser console:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**
1. Make sure backend is running on port 3001
2. Check `frontend/src/lib/api.js` has correct API_URL
3. Verify `server.js` has CORS configured:
```javascript
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5174'
  ],
  credentials: true
}));
```

---

## 🧪 Testing Endpoints with cURL

### Test Resume Analysis

```bash
curl -X POST http://localhost:3001/api/analyze/resume \
  -H "Content-Type: application/json" \
  -d '{
    "resumeText": "John Doe. Software Engineer. Skills: React, Node.js, Python. 5 years experience."
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "analysis": {
    "skills": ["React", "Node.js", "Python"],
    "technologies": ["JavaScript"],
    "targetRole": "Full Stack Engineer",
    ...
  }
}
```

### Test Question Generation

```bash
curl -X POST http://localhost:3001/api/questions/generate \
  -H "Content-Type: application/json" \
  -d '{
    "resumeData": {
      "skills": ["React", "Node.js"],
      "tools": ["TypeScript"],
      "targetRole": "Full Stack Developer",
      "projects": []
    },
    "category": "Technical",
    "count": 3
  }'
```

### Test Answer Analysis

```bash
curl -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Describe a challenging project",
    "answer": "I built a real-time chat application with 100k+ users using Node.js and React...",
    "category": "Behavioral"
  }'
```

---

## 📝 .env File Template

Save this as `backend/.env`:

```
# ============ REQUIRED ============
GEMINI_API_KEY=your_new_key_here

# ============ OPTIONAL ============
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Supabase (if using database)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Logging
LOG_LEVEL=debug
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Backend started without errors
- [ ] Frontend running on http://localhost:5173
- [ ] Can access http://localhost:3001/health
- [ ] `/api/analyze/resume` responds with data
- [ ] `/api/questions/generate` returns questions
- [ ] `/api/analyze` returns scores
- [ ] Resume upload works
- [ ] Questions are personalized
- [ ] Answers are evaluated
- [ ] Results page shows all scores

---

## 🚨 Security Checklist

- [ ] **Rotated all exposed API keys**
- [ ] Created `.env` file (never commit this!)
- [ ] Added `.env` to `.gitignore`
- [ ] Using environment variables, not hardcoded keys
- [ ] HTTPS enabled in production (not on localhost)
- [ ] CORS restricted to known domains
- [ ] Rate limiting enabled
- [ ] No secrets in logs

---

## 📞 Getting Help

If you still have issues:

1. **Check backend logs:**
   ```bash
   # Terminal where backend is running
   # Look for [Error], [Gemini], [Resume Analysis] messages
   ```

2. **Check frontend logs:**
   ```javascript
   // Browser DevTools Console
   // Look for red errors, [API], [PracticePage] logs
   ```

3. **Check network requests:**
   - DevTools → Network tab
   - Upload resume and look for requests
   - Check response bodies for error messages

4. **Verify .env is read:**
   ```bash
   # In backend root
   node -e "require('dotenv').config(); console.log(process.env.GEMINI_API_KEY)"
   ```

---

**Setup complete! Your MockMate pipeline is ready to run. 🎉**
