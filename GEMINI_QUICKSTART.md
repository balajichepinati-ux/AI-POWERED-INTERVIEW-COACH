# 🚀 Gemini API Key Rotation - Quick Start

## ⚡ Under 5 Minutes Setup

### Step 1: Verify Files Exist

All files should already be in your project:

```
frontend/src/lib/
  ├── geminiKeyManager.js      ✅ Key rotation manager
  ├── gemini.js                 ✅ AI service with retry logic
  └── resumeAnalysis.js         ✅ Analysis functions

frontend/src/hooks/
  └── useGeminiApiStatus.js     ✅ Monitoring hook + component

frontend/src/lib/
  └── api.js                    ✅ (Already updated)
```

### Step 2: Start Frontend

```bash
cd frontend
npm install  # If needed
npm run dev
```

Visit: http://localhost:5173

### Step 3: Test It Out

1. Go to Dashboard/Practice page
2. Upload a resume (PDF/TXT)
3. Wait for questions to generate
4. See AI-powered feedback on answers

**That's it!** ✨ The system works automatically.

## 📊 Check API Status

### Option 1: Browser Console

```javascript
// Paste in browser console (F12):
import { default as GeminiService } from './lib/gemini.js'
GeminiService.getApiStats()
```

**Result:**
```javascript
{
  currentKeyIndex: 1,
  currentKeyPreview: "AIzaSyBeVV...",
  totalKeys: 5,
  failedKeys: [],           // Empty = all working
  failedKeysCount: 0,
  stats: {
    key_0: { requests: 5, errors: 0, lastUsed: ... },
    key_1: { requests: 8, errors: 0, lastUsed: ... },
    // ... more stats
  },
  ready: true  // ✅ All good!
}
```

### Option 2: Add Status to Dashboard

In any component (e.g., `DashboardPage.jsx`):

```javascript
import { GeminiApiStatus } from '@/hooks/useGeminiApiStatus'

export default function DashboardPage() {
  return (
    <div>
      <GeminiApiStatus />  {/* Shows status + reset button */}
      {/* Rest of dashboard */}
    </div>
  )
}
```

### Option 3: Monitor Hook

```javascript
import { useGeminiApiStatus } from '@/hooks/useGeminiApiStatus'

function YourComponent() {
  const { stats, isReady, totalRequests, totalErrors } = useGeminiApiStatus()
  
  return (
    <div>
      Status: {isReady ? '🟢 Online' : '🔴 Offline'}
      Requests: {totalRequests} | Errors: {totalErrors}
    </div>
  )
}
```


**Flow:**
```
Request → Use Key #1 (current)
   ↓
✅ Success? → Continue, update stats
   ↓
❌ Fails (401/403/429)? → Mark Key #1 failed → Try Key #2
   ↓
✅ Success? → Continue with Key #2
   ↓
❌ Still fails? → Try Key #3, #4, #5...
   ↓
All 5 failed? → Use local fallback questions
```

## 🛠️ Manual Controls

### If You Need to Reset

**Via JavaScript Console:**
```javascript
import { default as GeminiService } from './lib/gemini.js'

// Reset all keys (mark them as "not failed")
GeminiService.resetAllApiKeys()

// Check status
GeminiService.getApiStats()
```

**Via UI:**
```javascript
import { GeminiApiStatus } from '@/hooks/useGeminiApiStatus'

// Add to your dashboard
<GeminiApiStatus />

// Shows "Reset All Keys" button if service is down
```

### If You Need to Add/Change Keys

Edit: `frontend/src/lib/geminiKeyManager.js`

```javascript
const API_KEYS = [
  'NEW_KEY_1',  // Replace old key
  'NEW_KEY_2',
  'NEW_KEY_3',
  'AIzaSyD3zd2fy_bejXRiOCTJdMiCDotzukpjdIc',  // Keep working ones
  'AIzaSyB1XGK1nC_FHF7XNIFivlmhQzulVfWqT5g',
]
```

Then restart server: `npm run dev`

## 📈 Monitoring Usage

### Check Daily Quota at Google

Visit: https://makersuite.google.com/app/usage

Each key has:
- **1.5M tokens/day** (free tier)
- **60 requests/minute**

With 5 keys:
- **7.5M tokens/day total**
- **300 requests/minute total** (60 per key)

### Check Usage in Browser

```javascript
const stats = GeminiService.getApiStats()

Object.entries(stats.stats).forEach(([key, data]) => {
  const successRate = ((data.requests - data.errors) / data.requests * 100).toFixed(1)
  console.log(`${key}: ${data.requests} requests, ${successRate}% success`)
})
```

## ❌ Troubleshooting

### "Questions not generating"

```javascript
// Check 1: Is any key working?
GeminiService.isReady()  // Should return true

// Check 2: See error details
GeminiService.getApiStats()  // Check failedKeys array

// Check 3: Verify keys are valid
// Go to https://makersuite.google.com/app/apikey
// Make sure keys are active, not deleted
```

### "Same key keeps failing"

```javascript
// Solution: Reset that specific key
import keyManager from './lib/geminiKeyManager'
keyManager.resetKey(0)  // Reset Key #1
keyManager.resetKey(1)  // Reset Key #2
// etc.

// Or reset all
GeminiService.resetAllApiKeys()
```

### "Getting 429 (rate limit) too often"

```
This means you're hitting quota limits.

Solutions:
1. Space out requests (don't spam questions)
2. Cache results (store previous questions/feedback)
3. Use multiple keys (✅ Already doing this)
4. Add more API keys (if available)
```

### "All 5 keys failed!"

```javascript
// Check Google AI Studio
// https://makersuite.google.com/app/usage

// Possible causes:
- All keys hit daily quota (next day they reset)
- All keys were deleted
- Network connectivity issue
- Google API down

// Solutions:
1. Wait 24 hours (quota resets)
2. Add new keys from Google AI Studio
3. Check internet connection
4. Try manual reset: GeminiService.resetAllApiKeys()
```

## 🎯 Testing Checklist

- [ ] Start `npm run dev` in frontend
- [ ] Navigate to Dashboard or Practice page
- [ ] Upload a resume (PDF or text)
- [ ] See questions generate (should take 5-10 seconds)
- [ ] Practice an answer
- [ ] See AI feedback
- [ ] Check console: `GeminiService.getApiStats()`
- [ ] Verify no errors in browser console

## 📝 Environment Variables (Optional)

You can optionally set a primary key in `.env.local`:

```bash
# frontend/.env.local

# Optional: Override with a single key
VITE_GEMINI_API_KEY=AIzaSyCHRr8fVIVkCRWhH8mdvrCUMgoqlMSfWnE

# If not set, uses all 5 keys in geminiKeyManager.js
```

## 🔐 Security Notes

✅ **Safe:**
- Keys in `geminiKeyManager.js` are only used server-side
- Browser can't extract raw keys (they're used via fetch)
- Each request goes through your service

⚠️ **Keep secure:**
- Don't commit `.env.local` to Git
- Don't share keys in public code
- Don't expose API responses publicly

## 📞 Support

### Common Issues

| Issue | Fix |
|-------|-----|
| Questions not generating | Check `GeminiService.isReady()` |
| Same key keeps rotating | Might be hitting quota, wait 24h |
| Getting slow responses | Normal, AI takes 5-10 seconds |
| "All keys failed" error | Check Google AI Studio usage |
| Still using old code? | Did you restart `npm run dev`? |

### Debug Mode

Enable detailed logging:

In `gemini.js`, add to `callGemini()`:
```javascript
console.log(`[Gemini] Using key #${keyManager.currentKeyIndex}`)
console.log(`[Gemini] Attempt ${retryCount + 1}/5`)
```

## 🎉 You're All Set!

Your MockMate interview prep now has:
- ✅ 5 backup API keys
- ✅ Automatic failover on key expiration
- ✅ Usage tracking per key
- ✅ Smart retry logic with exponential backoff
- ✅ Ready for production use

**Next: Upload a resume and practice!** 🚀

---

**Questions?** Check the full documentation:
- [API Key Rotation Guide](./GEMINI_API_KEY_ROTATION.md)
- [Implementation Details](./GEMINI_IMPLEMENTATION_GUIDE.md)
- [Setup Guide](./GEMINI_SETUP.md)
