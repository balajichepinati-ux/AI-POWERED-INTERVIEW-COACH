# ❓ FAQ & Troubleshooting Guide

## Common Questions

### 🎯 General Questions

#### Q: How do I get started with MockMate?
**A:** Follow the [Quick Start Guide](./GEMINI_QUICKSTART.md):
1. Clone the repo
2. Install dependencies (`npm install`)
3. Set up environment variables
4. Start servers (`npm run dev`)
5. Upload a resume and practice!

#### Q: What are the system requirements?
**A:** 
- Node.js 18 or higher
- 4GB RAM minimum
- PostgreSQL 12+
- Internet connection for Gemini API
- Modern web browser (Chrome, Firefox, Safari, Edge)

#### Q: Do I need to pay for this?
**A:**
- Frontend: Free to host (Vercel, Netlify, GitHub Pages)
- Backend: Free tier available (AWS Free Tier, Heroku Hobby)
- Gemini API: Free tier available (1.5M tokens/day per key)
- With 5 keys: 7.5M tokens/day free tier

#### Q: Can I use this with other AI models?
**A:** Currently configured for Google Gemini Pro. To use other models:
1. Install model SDK (e.g., `npm install openai`)
2. Update `frontend/src/lib/gemini.js`
3. Port the functions to new API
4. Implement similar key rotation if needed

---

## 🔧 Troubleshooting

### Installation Issues

#### ❌ Problem: `npm install` fails
**Error**: `npm ERR! code ERESOLVE`

**Solution**:
```bash
# Option 1: Use legacy peer deps
npm install --legacy-peer-deps

# Option 2: Delete node_modules and try again
rm -rf node_modules package-lock.json
npm install

# Option 3: Use Node 18 LTS
nvm install 18
nvm use 18
npm install
```

#### ❌ Problem: `node_modules` is huge (1GB+)
**Why**: Dependencies have many sub-dependencies

**Solution**:
```bash
# Clean up
npm prune --production

# Or skip optional dependencies
npm install --no-optional
```

#### ❌ Problem: Port 3001/5173 already in use
**Error**: `EADDRINUSE: address already in use :::3001`

**Solution**:
```bash
# Find process using port
lsof -i :3001           # macOS/Linux
netstat -ano | grep 3001  # Windows

# Kill process
kill -9 <PID>           # macOS/Linux

# Or use different port
PORT=3002 npm run dev
```

---

### Database Issues

#### ❌ Problem: Cannot connect to PostgreSQL
**Error**: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solution**:
```bash
# Check if PostgreSQL is running
psql --version
postgres --version

# Start PostgreSQL
# macOS
brew services start postgresql

# Linux
sudo service postgresql start

# Windows
Start PostgreSQL from Services

# Or use remote database
# Update DATABASE_URL in .env
DATABASE_URL=postgresql://user:pass@host:5432/db
```

#### ❌ Problem: Database migration fails
**Error**: `Migration error: column "..." does not exist`

**Solution**:
```bash
# Reset database (warning: deletes data)
npx prisma migrate reset

# Or view current schema
npx prisma studio
```

#### ❌ Problem: Prisma client generation failed
**Error**: `Could not find a valid tsconfig or jsconfig file`

**Solution**:
```bash
# Regenerate Prisma client
npx prisma generate

# Or clear Prisma cache
rm -rf node_modules/.prisma
npm install
```

---

### Frontend Issues

#### ❌ Problem: Vite dev server won't start
**Error**: `Error: listen EADDRINUSE: address already in use :::5173`

**Solution**:
```bash
# Kill existing process or use different port
PORT=5174 npm run dev

# Or check in browser:
# http://localhost:5173
# http://localhost:5174
```

#### ❌ Problem: Styles not loading (Tailwind broken)
**Error**: Classes not working, styles appear broken

**Solution**:
```bash
# Clear Tailwind cache
rm -rf node_modules/.cache

# Rebuild styles
npm run dev

# Or rebuild completely
npm run build
npm run preview
```

#### ❌ Problem: Component not rendering
**Error**: Blank page or component missing

**Solution**:
```javascript
// Check browser console for errors (F12)
console.error()

// Add debug logs
console.log('Component mounted', props)

// Check React DevTools: F12 → Components tab
```

#### ❌ Problem: API calls return 404
**Error**: `Fetch failed: 404 Not Found`

**Solution**:
1. Check backend is running: `curl http://localhost:3001`
2. Check API_URL in frontend `.env.local`:
   ```
   VITE_API_URL=http://localhost:3001
   ```
3. Check backend routes exist in `backend/routes/`
4. Verify backend not blocked by firewall

---

### API & Integration Issues

#### ❌ Problem: "All Gemini API keys have been exhausted"
**Error**: Cannot generate questions or feedback

**Solution**:
```javascript
// Step 1: Check which keys failed
GeminiService.getApiStats()
// Look at failedKeys array

// Step 2: Try resetting
GeminiService.resetAllApiKeys()

// Step 3: Verify keys at Google
// https://makersuite.google.com/app/apikey
// Check if keys are active (not deleted)

// Step 4: Add new keys
// Edit: frontend/src/lib/geminiKeyManager.js
// Add new keys to API_KEYS array
// Restart server: npm run dev
```

#### ❌ Problem: "401 Unauthorized" errors repeatedly
**Why**: API key in keyManager might be invalid

**Solution**:
```bash
# Option 1: Regenerate keys at Google AI Studio
# https://makersuite.google.com/app/apikey
# Delete old - Create new - Copy

# Option 2: Update geminiKeyManager.js
# Replace invalid keys with new ones

# Option 3: Override via environment
# Create frontend/.env.local
VITE_GEMINI_API_KEY=your_new_key_here

# Restart server
npm run dev
```

#### ❌ Problem: "429 Too Many Requests" / Quota exceeded
**Why**: Hit rate limit or daily quota

**Solution**:
```javascript
// Option 1: Wait - quota resets every 24 hours
// Keep using app, auto-rotates to next key

// Option 2: Add more keys
// Edit geminiKeyManager.js

// Option 3: Implement caching
// Cache questions/feedback for same resume

// Option 4: Reduce request frequency
// Add delays between requests
// Batch operations together
```

**How much quota do you have?**
- Per key: 1.5M tokens/day (free)
- Resume analysis: ~1,000 tokens
- 10 questions: ~500 tokens
- Question evaluation: ~200 tokens
- So per key: ~150 resume + feedback cycles/day

#### ❌ Problem: Responses very slow (API taking 10+ seconds)
**Why**: Gemini API slow or network latency

**Solution**:
```javascript
// This is normal - Gemini takes 5-10 seconds
// But you can optimize:

// 1. Implement response caching
// 2. Show loading animation (✓ already done)
// 3. Process in background
// 4. Use shorter prompts

// Check current latency:
const start = Date.now()
const response = await GeminiService.generateQuestions(resume)
console.log('Time taken:', Date.now() - start, 'ms')
```

---

### Authentication Issues

#### ❌ Problem: Cannot sign up / Login fails
**Error**: `Supabase Auth Error`

**Solution**:
```bash
# Check Supabase credentials in .env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_KEY=eyJhbGc...

# Verify credentials at https://supabase.com/dashboard

# Clear browser cache/cookies
# Or use private/incognito window
```

#### ❌ Problem: Session expires unexpectedly
**Why**: JWT token expired or cleared

**Solution**:
```javascript
// This is normal - tokens expire after 24-72 hours
// Just log in again

// To keep logged in longer:
// Update Auth context to refresh tokens automatically
//  (Optional enhancement)
```

#### ❌ Problem: CORS errors ("Access to XMLHttpRequest blocked")
**Error**: `Access to XMLHttpRequest at 'http://...' from origin has been blocked by CORS policy`

**Solution**:
```javascript
// Backend (backend/server.js)
const cors = require('cors')
app.use(cors({
  origin: 'http://localhost:5173'
}))

// Or for production:
app.use(cors({
  origin: process.env.FRONTEND_URL
}))
```

---

### Resume Upload Issues

#### ❌ Problem: Resume upload fails
**Error**: `File upload failed` or no response

**Solution**:
1. Check file size < 10MB
2. File format: PDF, DOC, DOCX, TXT
3. Check backend `/api/resume/upload` exists
4. Verify file permissions
5. Check disk space available

```bash
# Test upload manually
curl -X POST \
  -F "file=@resume.pdf" \
  http://localhost:3001/api/resume/upload
```

#### ❌ Problem: Resume not being parsed correctly
**Error**: Questions don't match resume content

**Solution**:
1. Try different file format (PDF → TXT)
2. Ensure text is extractable (not scanned image)
3. Check file is valid (not corrupted)
4. Try simpler resume format first

---

### Performance Issues

#### ❌ Problem: App very slow to load
**Speed**: > 5 seconds to first page

**Solution**:
```bash
# Check what's slow - use Chrome DevTools
# F12 → Performance → Record

# Optimize:
1. Check network tab - what's downloading?
2. Check JavaScript - unnecessary code?
3. Reduce image sizes
4. Enable compression in backend

# Test build performance:
npm run build
npm run preview
```

#### ❌ Problem: Memory usage too high
**Symptom**: App crashes with "out of memory"

**Solution**:
```bash
# Check what's using memory
node --max-old-space-size=4096 server.js

# Or optimize:
1. Clear unused data in state
2. Remove console logs
3. Implement pagination
4. Clear caches periodically
```

#### ❌ Problem: Database queries too slow
**Symptom**: Dashboard takes 10+ seconds to load

**Solution**:
```javascript
// Check query time - add logging
console.time('query')
const data = await prisma.session.findMany()
console.timeEnd('query')

// Optimize:
1. Add database indexes
2. Use select() to fetch fewer fields
3. Implement pagination
4. Cache results
```

---

### Deployment Issues

#### ❌ Problem: Build fails (`npm run build`)
**Error**: Various build errors

**Solution**:
```bash
# Clear cache and rebuild
rm -rf node_modules .next dist
npm install
npm run build

# Check for errors:
npm run lint
npm run type-check  # If using TypeScript
```

#### ❌ Problem: Deploy to Vercel fails
**Error**: Build or deployment error

**Solution**:
```bash
# Option 1: Test locally first
npm run build
npm run preview

# Option 2: Check Vercel logs
# https://vercel.com/dashboard/project-name/logs

# Option 3: Check environment variables
# Add all .env variables to Vercel dashboard
```

#### ❌ Problem: App works locally but not in production
**Symptom**: Different behavior in prod vs dev

**Solution**:
1. Check environment variables are set
2. Check NODE_ENV=production
3. Check API URLs are correct
4. Check CORS is configured for prod domain
5. Check database connection string
6. Clear browser cache

---

## 🔍 Debugging Tips

### Enable Debug Logging

```javascript
// Add to frontend/main.jsx
if (process.env.NODE_ENV === 'development') {
  window.DEBUG = true
  console.log('Debug mode enabled')
}

// Now use:
if (DEBUG) console.log('My debug info')
```

### Check API Responses

```javascript
// In browser console:
fetch('http://localhost:3001/api/questions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ resume: 'test' })
})
.then(r => r.json())
.then(d => console.log(d))
```

### Monitor API Keys

```javascript
// In browser console (every 5 seconds):
setInterval(() => {
  import('lib/gemini.js').then(m => 
    console.log(m.default.getApiStats())
  )
}, 5000)
```

### Network Inspection

1. Open DevTools: F12
2. Go to "Network" tab
3. Refresh page
4. Look for:
   - Red requests (404, 500 errors)
   - Slow requests (>10s)
   - Failed requests
5. Click request to see details

---

## 📊 Performance Monitoring

### Browser DevTools

```
F12 → Performance → Record → (use app) → Stop

Check:
- First Contentful Paint (target: <1s)
- Largest Contentful Paint (target: <2.5s)
- Cumulative Layout Shift (target: <0.1)
```

### Console Monitoring

```javascript
// Measure any operation
console.time('operation-name')
// ... do something ...
console.timeEnd('operation-name')
// Output: operation-name: 234ms
```

---

## 🆘 Getting Help

### Before asking for help, try:

- [ ] Check browser console (F12 → Console) for errors
- [ ] Check network tab for failed requests
- [ ] Try clearing browser cache (Ctrl+Shift+Delete)
- [ ] Try incognito/private window
- [ ] Restart servers (stop and `npm run dev`)
- [ ] Search this FAQ document
- [ ] Check GitHub Issues
- [ ] Check error logs in terminal

### When asking for help, provide:

1. **What you did**: Step-by-step reproduction
2. **What happened**: Error messages, screenshots
3. **What you expected**: What should happen
4. **Environment**: OS, Node version, browser
5. **Code**: Relevant code snippet
6. **Logs**: Full error stacktrace

---

## 📞 Contact Support

- **Issues**: [GitHub Issues](https://github.com/mockmate/issues)
- **Email**: support@mockmate.com
- **Discord**: [Join community](https://discord.gg/mockmate)

---

**Most problems? Check your console logs! 🎯**

Keep this guide bookmarked for quick reference! 📚
