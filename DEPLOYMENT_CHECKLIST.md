# 🚀 Deployment & Production Checklist

Complete this checklist before deploying MockMate to production with Gemini API integration.

## Pre-Deployment (Development)

### Code Review
- [ ] `frontend/src/lib/geminiKeyManager.js` - All 5 keys configured
- [ ] `frontend/src/lib/gemini.js` - Retry logic implemented (up to 5 retries)
- [ ] `frontend/src/hooks/useGeminiApiStatus.js` - Monitoring ready
- [ ] `frontend/src/lib/api.js` - Using GeminiService not hardcoded key
- [ ] `frontend/src/lib/resumeAnalysis.js` - Analysis functions available
- [ ] No console errors when starting dev server

### Testing
- [ ] Upload test resume → generates questions ✅
- [ ] Practice questions → get AI feedback ✅
- [ ] Check stats: `GeminiService.getApiStats()` shows all keys available ✅
- [ ] Network tab shows requests going to Google API ✅
- [ ] Check `frontend/.env.local` doesn't have keys committed ✅

### Configuration
- [ ] All 5 API keys added to `geminiKeyManager.js` ✅
- [ ] Keys verified at https://makersuite.google.com ✅
- [ ] API quota limits checked (1.5M tokens/day per key) ✅
- [ ] Network connectivity verified ✅

## Build Optimization

### Frontend Build

```bash
cd frontend
npm run build
```

- [ ] Build completes with 0 errors
- [ ] Build completes with 0 warnings (non-critical only)
- [ ] `dist/` folder created (~500KB-1MB)
- [ ] Source maps generated (optional for prod)

**Check output:**
```
✓ dist/index.html
✓ dist/assets/index.*.js
✓ dist/assets/index.*.css
✓ 3 files, 850 KB
```

### Vite Configuration

In `frontend/vite.config.js`:
```javascript
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    minify: 'terser',
    sourcemap: false,  // For production
    outDir: 'dist',
  }
})
```

- [ ] Minification enabled
- [ ] Treeshaking enabled
- [ ] Source maps disabled (for security)

## Backend Setup

### Environment Variables

Create `backend/.env` with:
```
DATABASE_URL=postgresql://...
SUPABASE_URL=https://....supabase.co
SUPABASE_KEY=...
NODE_ENV=production
PORT=3001
```

- [ ] Database connection string correct
- [ ] Supabase credentials set
- [ ] Environment set to `production`
- [ ] Port accessible (not blocked by firewall)

### Dependencies Check

```bash
cd backend
npm install
npm list
```

- [ ] No unused dependencies
- [ ] Prisma client installed
- [ ] All required packages present
- [ ] No version conflicts

### Prisma Database

```bash
npx prisma migrate deploy  # Apply migrations
npx prisma seed            # Seed data if needed
npx prisma studio         # Test database connection
```

- [ ] All migrations applied successfully
- [ ] Database schema matches `schema.prisma`
- [ ] Can connect to database with `prisma studio`

## Security Checklist

### API Keys
- [ ] **NEVER** commit `.env`, `.env.local` to Git
- [ ] `.gitignore` includes `*.env*` files
- [ ] API keys only in server `.env`, not in frontend code
- [ ] Frontend keys are read-only (API key level)
- [ ] Rotate keys monthly (best practice)

### CORS & Headers
- [ ] Backend CORS allows frontend domain
- [ ] No wildcard `*` CORS in production
- [ ] Security headers configured (optional)

```javascript
// backend/server.js
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://mockmate.com',
  credentials: true
}))
```

- [ ] CORS configured for production domain

### Database
- [ ] SSL/TLS enabled for database connection
- [ ] Database password strong (20+ chars)
- [ ] Only backend can access database
- [ ] Network restricted (IP whitelist if possible)

## Performance Optimization

### Frontend

- [ ] Code splitting enabled (Vite default)
- [ ] Lazy loading for page components
- [ ] Images optimized (WebP format)
- [ ] CSS minified
- [ ] JS minified

**Check metrics:**
```bash
npm run build  # then check output sizes
```

- [ ] Main JS bundle < 300KB
- [ ] CSS bundle < 100KB
- [ ] Total transferred < 500KB

### Caching Strategy

In `geminiKeyManager.js`, consider adding caching:

```javascript
// Cache resume analysis for 1 hour
const cache = new Map()
const CACHE_TTL = 60 * 60 * 1000

// Before calling API:
const cacheKey = `resume_${resumeHash}`
if (cache.has(cacheKey)) {
  const { data, timestamp } = cache.get(cacheKey)
  if (Date.now() - timestamp < CACHE_TTL) {
    return data
  }
}
```

- [ ] Caching implemented for frequently accessed data
- [ ] Cache invalidation strategy defined

## Monitoring & Logging

### Error Tracking

Set up error reporting (Sentry/LogRocket):

```javascript
// frontend/main.jsx
import * as Sentry from "@sentry/react"

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.NODE_ENV,
})
```

- [ ] Error tracking service configured (optional but recommended)
- [ ] All errors automatically reported
- [ ] Error dashboard accessible

### Application Logging

In `backend/server.js`:
```javascript
const logger = require('winston')  // or similar

logger.info('API request', { endpoint, method, status })
logger.error('Database error', { error, query })
```

- [ ] Logging configured
- [ ] Critical errors go to alert system
- [ ] Logs stored securely

### API Monitoring

Track Gemini API usage:
```javascript
console.log('API Stats:', GeminiService.getApiStats())
// Intended to be logged to monitoring service
```

- [ ] API usage logged (requests/errors per key)
- [ ] Quota limits monitored
- [ ] Alerts set for quota approaching

## Deployment Steps

### Option 1: Vercel (Recommended)

**Backend + Frontend:**

```bash
# 1. Login to Vercel
npm i -g vercel
vercel login

# 2. Deploy backend
cd backend
vercel deploy

# 3. Deploy frontend
cd ../frontend
vercel deploy
```

- [ ] Vercel account created
- [ ] Projects connected to Git
- [ ] Environment variables added in Vercel dashboard
- [ ] Deployment URL noted

### Option 2: Traditional Server

**Backend:**
```bash
ssh user@server
cd /app/mockmate/backend
git pull origin main
npm install
npm run build
pm2 restart mockmate-backend
```

**Frontend:**
```bash
cd /app/mockmate/frontend
npm run build
cp -r dist/* /var/www/mockmate/
```

- [ ] Server access verified
- [ ] Git deploy configured
- [ ] PM2/systemd service configured
- [ ] Nginx/Apache reverse proxy configured

### Option 3: Docker

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["node", "server.js"]
```

- [ ] Docker configured
- [ ] Image builds without errors
- [ ] Container starts and serves requests

## Post-Deployment

### Smoke Tests

```bash
# Test API endpoints
curl https://api.mockmate.com/api/questions -X GET

# Test frontend loads
curl https://mockmate.com | grep "<!DOCTYPE"

# Check API health
curl https://api.mockmate.com/health
```

- [ ] Frontend loads (HTTP 200)
- [ ] API responds (HTTP 200/400 not 500)
- [ ] No hardcoded localhost URLs in front-end
- [ ] No hardcoded localhost URLs in back-end

### Feature Tests

- [ ] Can sign up/login
- [ ] Can upload resume
- [ ] Questions generate (4-6 seconds)
- [ ] Can practice questions
- [ ] Get AI feedback
- [ ] Dashboard loads

### Performance Tests

Using browser DevTools:

- [ ] Page load < 3 seconds
- [ ] API response < 10 seconds
- [ ] No console errors
- [ ] No network warnings

```javascript
// Chrome DevTools
Performance tab → Run test
// Should show: < 3 second load
// Should show: < 10 second questions generation
```

- [ ] Lighthouse score > 80
- [ ] Core Web Vitals pass

### API Health

```javascript
// Check in production
GeminiService.getApiStats()
// Should show: all keys available, requests tracking
```

- [ ] All 5 keys available
- [ ] Statistics tracking properly
- [ ] No errors in console

## Scaling & Optimization (If Needed)

### Load Balancing

If traffic increases:
- [ ] Set up multiple backend instances
- [ ] Configure nginx/load balancer
- [ ] Implement session/cache sharing (Redis)
- [ ] Monitor per-instance load

### Database

- [ ] Connection pooling enabled
- [ ] Indexes optimized
- [ ] Query performance monitored
- [ ] Database replicas set up (optional)

### Caching

- [ ] Redis cache deployed (optional)
- [ ] Cache hit ratio > 80%
- [ ] Cache invalidation working

### API Rate Limiting

Implement if needed:
```javascript
const rateLimit = require('express-rate-limit')

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})

app.use('/api/', limiter)
```

- [ ] Rate limiting configured
- [ ] Limits appropriate for usage
- [ ] Tested with concurrent requests

## Maintenance

### Regular Checks

**Daily:**
- [ ] No error alerts
- [ ] API status OK
- [ ] Database responsive

**Weekly:**
- [ ] Check API quota usage
- [ ] Review error logs
- [ ] Monitor performance metrics

**Monthly:**
- [ ] Update dependencies
- [ ] Rotate API keys
- [ ] Review security settings
- [ ] Backup database

### Monitoring Dashboard

Recommended tools:
- **Application Performance**: New Relic, DataDog
- **Error Tracking**: Sentry, Rollbar
- **Uptime**: Pingdom, StatusCake
- **Log Aggregation**: ELK Stack, Splunk

## Rollback Plan

If deployment fails:

```bash
# Option 1: Revert to previous Git commit
git revert <commit-hash>
git push

# Option 2: Manual rollback (keep backup)
cp -r /backups/mockmate-v1.0 /app/mockmate
pm2 restart mockmate-backend
```

- [ ] Backup of previous version available
- [ ] Rollback procedure documented
- [ ] Can rollback within 5 minutes

## Documentation

- [ ] README.md updated with deployment instructions
- [ ] API endpoints documented
- [ ] Architecture diagram included
- [ ] Troubleshooting guide created
- [ ] Contact info for support

## Sign-Off

- [ ] Product Manager approved
- [ ] QA completed all tests
- [ ] Security review passed
- [ ] Performance acceptable
- [ ] Documentation complete

**Deployment Date**: ________________
**Deployed By**: ________________
**Version**: ________________

## Post-Deployment Monitoring (First 24 Hours)

- [ ] Monitor error rates (target: <1%)
- [ ] Monitor API response times (target: <5s)
- [ ] Monitor uptime (target: >99.9%)
- [ ] Check user feedback/support tickets
- [ ] Prepare for quick rollback if needed

---

**Deployment successful! 🎉**

Your MockMate instance is now live with:
- ✅ 5 API key failover system
- ✅ Real-time monitoring
- ✅ Automatic retry logic
- ✅ Production-grade error handling

**Next: Monitor for 24 hours and celebrate! 🚀**
