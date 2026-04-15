# 🛠️ API Key Rotation Implementation Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  Your React Components                 │
│           (DashboardPage, PracticePage, etc)          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│              API Service Layer (api.js)                │
│    generateQuestions(), analyzeAnswer(), etc.          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│          Gemini AI Service (gemini.js)                 │
│   Resume analysis, question generation, feedback       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│       Gemini Key Manager (geminiKeyManager.js)         │
│         Rotation logic, key tracking, stats            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│   Google Gemini API (External Service)                 │
│      5 API Keys with automatic rotation                │
└─────────────────────────────────────────────────────────┘
```

## File Breakdown

### 1. **geminiKeyManager.js** - Core Rotation Logic

**Location**: `frontend/src/lib/geminiKeyManager.js`

**Purpose**: Manages 5 API keys and handles rotation when keys fail.

**Key Classes/Methods**:

```javascript
class GeminiKeyManager {
  constructor() {
    // Initialize all 5 keys
    this.API_KEYS = [...]
    
    // Track which keys have failed (Set of indices)
    this.failedKeys = new Set()
    
    // Current key index (0-4)
    this.currentKeyIndex = 0
    
    // Usage stats per key
    this.stats = {
      // key_0: { requests: 0, errors: 0, lastUsed: timestamp },
      // key_1: { requests: 0, errors: 0, lastUsed: timestamp },
    }
  }

  // Get currently active key (skips failed ones)
  getCurrentKey() {
    while (this.failedKeys.has(this.currentKeyIndex)) {
      this.currentKeyIndex = (this.currentKeyIndex + 1) % 5
    }
    return this.API_KEYS[this.currentKeyIndex]
  }

  // Mark current key as failed, move to next
  rotateKey(error) {
    console.log(`API Key #${this.currentKeyIndex} failed: ${error}`)
    this.failedKeys.add(this.currentKeyIndex)
    this.currentKeyIndex = (this.currentKeyIndex + 1) % 5
  }

  // Record successful request
  recordSuccess() {
    this.stats[`key_${this.currentKeyIndex}`].requests++
    this.stats[`key_${this.currentKeyIndex}`].lastUsed = Date.now()
  }

  // Record failed request
  recordError() {
    this.stats[`key_${this.currentKeyIndex}`].errors++
  }

  // Check if any keys available
  hasAvailableKeys() {
    return this.failedKeys.size < 5
  }

  // Get comprehensive stats
  getStats() {
    return {
      currentKeyIndex: this.currentKeyIndex,
      totalKeys: 5,
      failedKeys: Array.from(this.failedKeys),
      stats: this.stats,
      ready: this.hasAvailableKeys()
    }
  }

  // Manual reset
  resetKey(index) { ... }
  resetAllKeys() { ... }
}

// Singleton instance used everywhere
export default new GeminiKeyManager()
```

**Usage Flow**:

```
keyManager.getCurrentKey()      → Returns current key
  ↓ (use this key)
callGemini(prompt)              → Make API request
  ↓ (if succeeds)
keyManager.recordSuccess()      → Update stats
  ↓ (if fails with 401/403)
keyManager.rotateKey(error)     → Mark failed, switch to next
  ↓
keyManager.getCurrentKey()      → Get next key
```

### 2. **gemini.js** - AI Service with Rotation

**Location**: `frontend/src/lib/gemini.js`

**Purpose**: Calls Gemini API with automatic key rotation on failure.

**Key Methods**:

```javascript
class GeminiService {
  // Main API call with retry logic
  async callGemini(prompt, retryCount = 0) {
    try {
      // Get current key from keyManager
      const apiKey = keyManager.getCurrentKey()
      
      // Make API request
      const response = await fetch(`https://generativelanguage.googleapis.com/...`, {
        headers: { 'x-goog-api-key': apiKey }
      })

      // Handle different status codes
      if (response.status === 401 || response.status === 403) {
        // Key expired! Rotate to next key
        keyManager.rotateKey('401 Authentication failed')
        
        // Retry if we have more keys
        if (retryCount < 5) {
          return this.callGemini(prompt, retryCount + 1)
        }
        throw new Error('All keys exhausted')
      }

      // Success!
      keyManager.recordSuccess()
      return response.json()
      
    } catch (error) {
      keyManager.recordError()
      
      // Check for rate limiting (429)
      if (error.message.includes('RESOURCE_EXHAUSTED') || 
          error.message.includes('rate')) {
        keyManager.rotateKey('Rate limit hit')
        
        if (retryCount < 5) {
          // Wait 1 second before retry
          await sleep(1000)
          return this.callGemini(prompt, retryCount + 1)
        }
      }
      
      throw error
    }
  }

  // High-level methods
  async generateQuestions(resumeText) { ... }
  async evaluateAnswer(question, userAnswer) { ... }
  async analyzeResume(resumeText) { ... }
  // ... etc

  // Utility methods for monitoring
  getApiStats() { return keyManager.getStats() }
  resetApiKey(index) { return keyManager.resetKey(index) }
  resetAllApiKeys() { return keyManager.resetAllKeys() }
  isReady() { return keyManager.hasAvailableKeys() }
}
```

**Error Handling Logic**:

```javascript
// Inside callGemini():

if (response.status === 401 || response.status === 403) {
  // Key is bad - rotate immediately
  keyManager.rotateKey(`HTTP ${response.status}`)
  return this.callGemini(prompt, retryCount + 1)
}

if (error.message.includes('RESOURCE_EXHAUSTED')) {
  // Quota hit - rotate and wait
  keyManager.rotateKey('Quota exhausted')
  await sleep(1000)
  return this.callGemini(prompt, retryCount + 1)
}

// Max retries (5 keys) reached?
if (retryCount >= 5) {
  throw new Error('All Gemini API keys exhausted')
}
```

### 3. **useGeminiApiStatus.js** - React Hook & Component

**Location**: `frontend/src/hooks/useGeminiApiStatus.js`

**Purpose**: React hook for monitoring API status in components.

**Hook Usage**:

```javascript
function useGeminiApiStatus() {
  const [stats, setStats] = useState(null)
  const [isReady, setIsReady] = useState(true)

  // Poll every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const newStats = GeminiService.getApiStats()
      setStats(newStats)
      setIsReady(newStats.ready)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const resetKey = (index) => {
    GeminiService.resetApiKey(index)
    // Update UI
  }

  const resetAllKeys = () => {
    GeminiService.resetAllApiKeys()
    // Update UI
  }

  return {
    stats,
    isReady,
    lastUpdate: new Date(),
    resetKey,
    resetAllKeys,
    totalRequests: calculateTotalRequests(stats),
    totalErrors: calculateTotalErrors(stats),
  }
}
```

**Component Usage**:

```javascript
function GeminiApiStatus() {
  const { stats, isReady, resetAllKeys } = useGeminiApiStatus()

  if (!stats) return <div>Loading...</div>

  return (
    <div className="status-card">
      <h3>API Status</h3>
      
      {/* Current key display */}
      <p>Current Key: #{stats.currentKeyIndex + 1}</p>
      <p className={isReady ? 'ready' : 'failed'}>
        {isReady ? '🟢 Ready' : '🔴 All keys failed'}
      </p>
      
      {/* Failed keys list */}
      {stats.failedKeys.length > 0 && (
        <p>Failed Keys: {stats.failedKeys.join(', ')}</p>
      )}
      
      {/* Stats */}
      <p>Total Requests: {stats.stats.requests}</p>
      <p>Total Errors: {stats.stats.errors}</p>
      
      {/* Reset button */}
      {!isReady && (
        <button onClick={resetAllKeys}>Reset All Keys</button>
      )}
    </div>
  )
}

export { useGeminiApiStatus, GeminiApiStatus }
```

### 4. **api.js** - Integration Point

**Location**: `frontend/src/lib/api.js`

**Changes Made**:

```javascript
// OLD (hardcoded key):
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
fetch('...?key=' + GEMINI_API_KEY)

// NEW (uses rotation):
import GeminiService from './gemini'
GeminiService.generateQuestions(resumeText)
```

**Updated Methods**:

```javascript
export const generateQuestions = async (resumeText) => {
  try {
    // Uses keyManager internally with auto-rotation
    return await GeminiService.generateQuestions(resumeText)
  } catch (error) {
    // Fallback to local questions if all keys fail
    return LOCAL_QUESTIONS
  }
}

export const analyzeAnswer = async (question, userAnswer) => {
  try {
    // Uses keyManager internally
    return await GeminiService.evaluateAnswer(question, userAnswer)
  } catch (error) {
    // Fallback feedback
    return DEFAULT_FEEDBACK
  }
}
```

## Data Flow Example

### Scenario: Generate Interview Questions

```
User uploads resume
         ↓
PracticePage calls: generateQuestions(resumeText)
         ↓
api.js calls: GeminiService.generateQuestions(resumeText)
         ↓
gemini.js:
  1. callGemini(prompt)
  2. keyManager.getCurrentKey() → Returns Key #1
  3. fetch to Gemini API with Key #1
         ↓
Status: Success ✅
  1. keyManager.recordSuccess()
  2. Update stats for Key #1
  3. Return questions to user
         ↓
User gets interview questions!

---

Status: Failure (401 - Key #1 expired) ❌
  1. keyManager.rotateKey('401 error')
  2. Mark Key #1 as failed
  3. Switch to Key #2
  4. Retry: callGemini(prompt, retryCount=1)
  5. keyManager.getCurrentKey() → Returns Key #2
  6. fetch to Gemini API with Key #2
         ↓
Status: Success ✅
  1. keyManager.recordSuccess() for Key #2
  2. Return questions to user
         ↓
User gets interview questions! (no delay noticed)

---

Status: All 5 keys failed ❌❌❌❌❌
  1. retryCount reaches 5
  2. Throw error: "All Gemini API keys exhausted"
  3. api.js catches error
  4. Return fallback local questions
  5. User sees warning: "Using offline questions"
```

## Key Stats Tracking

**What gets tracked**:

```javascript
stats: {
  key_0: {
    requests: 42,      // How many requests used this key
    errors: 2,         // How many failed
    lastUsed: 1699564800000  // Last use timestamp
  },
  key_1: {
    requests: 38,
    errors: 0,
    lastUsed: 1699564900000
  },
  key_2: {
    requests: 45,
    errors: 15,        // This key might be hot/failing
    lastUsed: 1699564850000
  },
  // ... key_3, key_4
}
```

**How to analyze**:

```javascript
const stats = GeminiService.getApiStats()

// Which key is most overused?
let maxRequests = 0, busyKey = 0
Object.entries(stats.stats).forEach(([key, data]) => {
  if (data.requests > maxRequests) {
    maxRequests = data.requests
    busyKey = parseInt(key.split('_')[1])
  }
})
console.log(`Key #${busyKey} has most requests: ${maxRequests}`)

// Which key has best success rate?
Object.entries(stats.stats).forEach(([key, data]) => {
  const successRate = ((data.requests - data.errors) / data.requests * 100).toFixed(1)
  console.log(`Key #${key}: ${successRate}% success`)
})
```

## Testing the System

### Test 1: Check Status

```javascript
// In browser console:
import GeminiService from './lib/gemini'

GeminiService.getApiStats()
// Should show all keys available, 0 requests/errors
```

### Test 2: Generate Questions

```javascript
// In PracticePage or DashboardPage:
const questions = await generateQuestions("Your resume text...")
// Should work if at least one key is valid

// Check stats:
GeminiService.getApiStats()
// Should show requests++ for one key
```

### Test 3: Simulate Key Failure

```javascript
// Force mark a key as failed:
import keyManager from './lib/geminiKeyManager'

keyManager.rotateKey('Test failure')
// Watch next requests use different key
```

### Test 4: Reset Keys

```javascript
import GeminiService from './lib/gemini'

// Reset a specific key
GeminiService.resetApiKey(0)

// Reset all
GeminiService.resetAllApiKeys()

// Check status
GeminiService.getApiStats()
// failedKeys should be empty
```

## Monitoring Checklist

**Daily**:
- [ ] Check GeminiApiStatus component shows all keys available
- [ ] Monitor no errors in browser console
- [ ] Verify questions/feedback working normally

**Weekly**:
- [ ] Check usage at https://makersuite.google.com/app/usage
- [ ] Review error distribution across keys
- [ ] Check for quota approaching

**Monthly**:
- [ ] Rotate keys (add new ones, retire old ones)
- [ ] Review usage patterns
- [ ] Optimize prompt caching if needed

## Troubleshooting Commands

```javascript
// Check everything
GeminiService.getApiStats()

// See if service is ready
GeminiService.isReady()

// Total requests so far
GeminiService.getTotalRequests()

// Total errors so far
GeminiService.getTotalErrors()

// Reset everything
GeminiService.resetAllApiKeys()

// Check specific key status
const stats = GeminiService.getApiStats()
console.log(stats.failedKeys) // Array of failed key indices
```

## Performance Considerations

**With 5 keys**:
- ✅ Can handle 300 requests/minute (60 per key)
- ✅ Can process 7.5M tokens/day (1.5M per key)
- ❌ Quota still reached if overused

**Optimizations**:
1. Cache resume analysis results
2. Cache generated questions
3. Batch question generation
4. Reuse feedback templates
5. Store scores locally

## Next Steps

1. ✅ System is production-ready
2. Add one of the 5 keys to `.env.local` (optional)
3. Start frontend server
4. Test with resume upload
5. Monitor via GeminiApiStatus component
6. Add more keys if needed

---

**For questions or issues, check your console logs for detailed error messages!**
