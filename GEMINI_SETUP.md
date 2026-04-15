# 🚀 GEMINI AI INTEGRATION SETUP GUIDE

## Step 1: Get Your Gemini API Key

1. Navigate to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key" or use an existing project
3. Copy your API key (it looks like: `AIzaSyD...`)
4. Keep it safe - do NOT share it publicly!

## Step 2: Add API Key to Frontend .env.local

Open `frontend/.env.local` and add:

```
VITE_GEMINI_API_KEY=your_api_key_here
```

**Example:**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:3001
VITE_GEMINI_API_KEY=AIzaSyD1234567890abcdefghijklmnopqrst
```

## Step 3: Verify Installation

Restart your frontend server:
```bash
cd frontend
npm run dev
```

Check the browser console:
- If you see no errors about missing API key, you're good!
- If API calls to Gemini fail, check the API key format

## ✨ Features Now Available

### 1. **Resume Analysis**
- AI-powered parsing of resume content
- Skill extraction and proficiency assessment
- Experience analysis and gaps identification
- Job role recommendations
- Difficulty level estimation

### 2. **Question Generation**
- AI creates personalized questions based on resume
- Different question types:
  - Behavioral (STAR method)
  - Technical (role-specific)
  - Situational
- Difficulty levels: Beginner, Intermediate, Advanced
- Focus areas tailored to weak points

### 3. **Answer Evaluation**
- Real-time scoring on multiple dimensions:
  - Content quality (75/100)
  - Clarity (70/100)
  - Structure (75/100)
  - Confidence (70/100)
  - Relevance (80/100)
- Specific improvement suggestions
- Ideal answer rewrite
- Follow-up question generation
- Filler word detection

### 4. **Dashboard Insights**
- Overall performance score
- Category-wise performance breakdown:
  - Behavioral questions
  - Technical questions
  - Situational questions
- Top strengths and critical areas
- Practice recommendations
- Readiness assessment
- Success rate estimation
- Motivational feedback

### 5. **STAR Method Coach**
- Converts answers to STAR format
- Adds power words and metrics
- Improves structure and clarity
- Provides ideal rewrite

### 6. **Study Plan Generation**
- Personalized prep plan for X days
- Daily tasks and goals
- Resource recommendations
- Weekly milestones
- Success criteria

## 📚 Using the AI Features

### In Resume Upload Page:
```javascript
import { analyzeResumeComprehensive } from '@/lib/resumeAnalysis'

const result = await analyzeResumeComprehensive(resumeText)
// Returns: { profile, initialQuestions, readyForPractice }
```

### In Practice Page:
```javascript
import GeminiService from '@/lib/gemini'

// Generate questions
const questions = await GeminiService.generateQuestions(resumeAnalysis, 'behavioral', 5)

// Evaluate answer
const feedback = await GeminiService.evaluateAnswer(question, userAnswer, 'behavioral')

// Get STAR rewrite
const rewrite = await GeminiService.generateStarRewrite(question, answer)
```

### In Dashboard:
```javascript
import { generateSessionDashboard } from '@/lib/resumeAnalysis'

const insights = await generateSessionDashboard(sessionData)
// Returns: { insights, generated }
```

## 🔒 Security Best Practices

1. **Never commit `.env.local`** to version control
2. **Keep API key private** - it's tied to your Google account
3. **Monitor usage** at https://makersuite.google.com/app/usage
4. **Rate limiting**: Free tier has quotas - monitor your usage
5. **Error handling**: App gracefully falls back to local questions if API fails

## 📊 API Usage & Quotas

Gemini API free tier includes:
- 60 requests per minute
- 1.5 million tokens per day
- Monitored for abuse

**Cost after free tier:**
- Approximately $0.00025 per 1K input tokens
- $0.00075 per 1K output tokens

## 🐛 Troubleshooting

### "Gemini API key not configured"
- Make sure `VITE_GEMINI_API_KEY` is in `.env.local`
- Restart the frontend server after adding env variable

### "Gemini API error" or "403 Forbidden"
- Verify API key is correct
- Check API key is enabled at https://makersuite.google.com
- Ensure project has Gemini API enabled

### API calls failing silently
- Check browser console for errors
- App automatically falls back to local questions
- Look for `isOfflineMode: true` in responses

### Rate limiting (429 errors)
- Too many requests in short time
- Wait a few seconds and retry
- Consider caching responses

## 📝 Features by Page

### ResumePage
- Upload resume
- AI analyzes content
- Shows extracted skills, experience, recommendations
- Generates initial 10 questions

### PracticePage
- Uses AI-generated questions
- Real-time answer evaluation
- Shows scores and feedback
- Suggests STAR method rewrites

### ResultsPage
- Shows all scores and feedback
- AI-generated dashboard insights
- Performance breakdown by category
- Recommendations for next practice

### DashboardPage
- Overall statistics
- Performance trends
- AI-powered insights
- Study plan recommendations

### SettingsPage
- Eventually: Toggle AI features on/off
- API usage stats
- Study preferences

## 🎯 Next Steps

1. Add your Gemini API key to `.env.local`
2. Restart frontend server
3. Test by uploading a resume
4. Practice with AI-generated questions
5. Check dashboard for AI insights

## 📞 Support

If you encounter issues:
1. Check your API key is correct
2. Verify internet connection
3. Check browser console for detailed errors
4. Check Google AI Studio for API status
5. Review rate limiting and quota usage

---

**Enjoy your AI-powered interview prep! 🚀**
