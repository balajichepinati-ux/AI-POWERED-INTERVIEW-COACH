# 🔄 Gemini API Key Rotation System

## Overview

MockMate now includes an intelligent **multi-key API rotation system** that automatically switches between 5 Gemini API keys when one expires or fails. This ensures uninterrupted service and maximum uptime.

## Features

✅ **5 Backup Keys** - Automatically rotates through all keys
✅ **Auto Rotation** - Switches to next key when current one fails
✅ **Smart Retry Logic** - Retries with different keys up to 5 times
✅ **Error Tracking** - Monitors and logs all failures
✅ **Usage Statistics** - Track requests, errors, and key usage
✅ **Manual Control** - Reset keys or manual rotation if needed
✅ **Status Component** - Visual indicator of API health


### Override with Environment Variable:
You can also provide a key via `.env.local`:
```
VITE_GEMINI_API_KEY=your_key_here
```
This will be used as the primary key (before the hardcoded 5 keys).

## How It Works

### Automatic Rotation

```
Request → Current Key (Key 1)
    ↓
  Success? ✅ → Record success, continue
    ↓
  Failure? ❌ 
    ↓
  Mark Key 1 as failed
    ↓
  Switch to Key 2
    ↓
  Retry request
    ↓
  Success? ✅ → Move forward
    ↓
  Failure? ❌
    ↓
  Rotate to Key 3, 4, 5...
    ↓
  All failed? → Throw error, offer manual reset
```

### Scenario Example

**You have 5 keys. Here's what happens:**

1. Day 1: Using Key 1 → Works fine ✅
2. Day 3: Key 1 quota expires → Automatic rotation to Key 2 ✅
3. Day 5: Key 2 quota expires → Automatic rotation to Key 3 ✅
4. Day 7: Keys 1, 2, 3 all expired...
   - Key 4 active → No problems ✅
5. All 5 keys expired?
   - User sees message: "All Gemini API keys exhausted"
   - Offer to reset/add new keys

## API Reference

### Check Service Status

```javascript
import GeminiService from '@/lib/gemini'

// Check if service is ready
const isReady = GeminiService.isReady()

// Get detailed stats
const stats = GeminiService.getApiStats()
console.log(stats)
// {
//   currentKeyIndex: 1,
//   currentKeyPreview: "AIzaSyBeVV...",
//   totalKeys: 5,
//   failedKeys: [0, 3],
//   failedKeysCount: 2,
//   stats: {...},
//   ready: true
// }

// Get usage stats
const totalRequests = GeminiService.getTotalRequests()
const totalErrors = GeminiService.getTotalErrors()
```

### Manual Key Management

```javascript
// Reset specific key
GeminiService.resetApiKey(0) // Reset Key 1

// Reset all keys
GeminiService.resetAllApiKeys()
```

## React Hook Usage

Use the provided hook in any component:

```javascript
import { useGeminiApiStatus } from '@/hooks/useGeminiApiStatus'

function MyComponent() {
  const { stats, isReady, totalRequests, totalErrors, resetAllKeys } = useGeminiApiStatus()

  return (
    <div>
      <p>API Ready: {isReady ? 'Yes' : 'No'}</p>
      <p>Current Key: #{stats?.currentKeyIndex + 1}</p>
      <p>Failed Keys: {stats?.failedKeysCount}</p>
      <p>Total Requests: {totalRequests}</p>
      {!isReady && (
        <button onClick={resetAllKeys}>Reset All Keys</button>
      )}
    </div>
  )
}
```

## Status Component

Display API health in your dashboard:

```javascript
import { GeminiApiStatus } from '@/hooks/useGeminiApiStatus'

export default function Dashboard() {
  return (
    <div>
      <GeminiApiStatus /> {/* Shows status, failed keys, option to reset */}
      {/* Rest of dashboard */}
    </div>
  )
}
```

## Implementation Details

### Files

- **`frontend/src/lib/geminiKeyManager.js`** - Manages key rotation logic
- **`frontend/src/lib/gemini.js`** - Updated with key rotation integration
- **`frontend/src/hooks/useGeminiApiStatus.js`** - React hook + component for status display

### Key Manager Features

```javascript
import keyManager from '@/lib/geminiKeyManager'

// Get current key
const key = keyManager.getCurrentKey()

// Mark as failed and rotate
keyManager.rotateKey(errorMessage)

// Record request
keyManager.recordSuccess()
keyManager.recordError()

// Get stats
keyManager.getStats()

// Check availability
keyManager.hasAvailableKeys()

// Manual reset
keyManager.resetKey(keyIndex)
keyManager.resetAllKeys()
```

## Error Types & Handling

### 1. **Authentication Errors (401/403)**
- API key invalid or expired
- → **Action**: Immediately rotate to next key
- → **Retry**: Up to 5 times with different keys

### 2. **Quota Exceeded (429)**
- Rate limit hit or quota exhausted
- → **Action**: Rotate to next key
- → **Retry**: After 1 second delay with next key
- → **Max Retries**: 5 keys total

### 3. **Network Errors**
- Connection failed
- → **Action**: Retry with same key
- → **Max Retries**: 3 times, then rotate

### 4. **All Keys Failed**
- All 5 keys marked as failed
- → **Action**: Offer to reset keys
- → **User Option**: Manual reset or add new keys

## Monitoring & Logging

Console logs for debugging:

```javascript
// Watching for key rotations
"API Key #1 failed: 403 Forbidden"
"Failed key: AIzaSyCHRr8fVIVkCRW..."
"Switched to API Key #2"

// Successful requests
// (recorded silently, no console spam)

// Service ready check
"All API keys have been exhausted. Please check your API keys."
```

## Usage Guidelines

### Daily Quota
Each Gemini API key has:
- **1.5M tokens/day** (free tier)
- **60 requests/minute** (rate limit)

### With 5 Keys
- **Total: 7.5M tokens/day**
- **60 requests/minute** (per key, independent)

### Recommendations
- ✅ Use for all features (resume analysis, questions, feedback)
- ✅ Cache results when possible
- ⚠️ Monitor usage at https://makersuite.google.com/app/usage
- ⚠️ Add more keys if approaching limits

## Troubleshooting

### "All Gemini API keys have been exhausted"
**Reason**: All 5 keys have failed  
**Solution**: 
1. Check if keys are valid at https://makersuite.google.com
2. Reset keys: Click "Reset All Keys" or run `GeminiService.resetAllApiKeys()`
3. Add new keys if old ones are permanently exhausted

### Keys keep rotating rapidly
**Reason**: Keys hitting quota too quickly  
**Solution**:
1. Check usage at https://makersuite.google.com/app/usage
2. Consider adding cache/caching responses
3. Add more API keys
4. Reduce request frequency

### Specific key not working
**Reason**: Single key is bad  
**Solution**:
1. Remove bad key from `geminiKeyManager.js` `API_KEYS` array
2. Add new key from Google AI Studio
3. Restart server

## Adding More Keys

To add more API keys:

1. Get keys from https://makersuite.google.com/app/apikey
2. Edit `frontend/src/lib/geminiKeyManager.js`:

```javascript
const API_KEYS = [
  'Key1',
  'Key2',
  'Key3',
  'Key4',
  'Key5',
  'Key6', // Add here
  'Key7', // Add here
]
```

3. Restart server
4. New keys will be used in rotation

## Best Practices

✅ **Do:**
- Monitor API usage regularly
- Add new keys before all existing ones expire
- Use the status component to track health
- Reset keys manually if they fail temporarily
- Cache responses when possible

❌ **Don't:**
- Share API keys publicly
- Commit keys to GitHub
- Use same keys across multiple projects
- Ignore warning messages

## Production Considerations

For production deployment:

1. **Use 10+ API keys** for reliability
2. **Store keys securely** (encrypted environment variables)
3. **Monitor usage** with alerting
4. **Implement caching** to reduce API calls
5. **Add key rotation schedule** (rotate keys weekly)
6. **Backup plan** - Store responses, fallback UI

## Support

If you encounter issues:

1. Check browser console for errors
2. Run `GeminiService.getApiStats()` to see status
3. Verify keys at https://makersuite.google.com
4. Check usage/quota
5. Reset keys if needed

---

**Your MockMate interview prep is now resilient with multi-key failover! 🚀**
