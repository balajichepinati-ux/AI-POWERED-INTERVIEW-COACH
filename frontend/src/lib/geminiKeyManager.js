/**
 * Gemini API Key Manager
 * Manages multiple API keys with automatic rotation
 * When one expires, automatically switches to the next available key
 */

// List of API keys (primary at index 0, fallbacks after)
const API_KEYS = [
  'AIzaSyCTgD0pjhVxxIs1YohdRWkcL4Bu6nlJPuw',  // Key 1 (primary - latest)
  'AIzaSyBdZGtWm8_e2hmICg348gLOXAPBoPs4Bn8',  // Key 2
  'AIzaSyCHRr8fVIVkCRWhH8mdvrCUMgoqlMSfWnE',  // Key 3
  'AIzaSyBeVVSC9LrHGu4xA2AqBv9ikW-Ya-2_cdo',  // Key 4
  'AIzaSyDre2zAUomOR2Lz4OBkXyH-IhuwZ7q0GBc',  // Key 5
  'AIzaSyD3zd2fy_bejXRiOCTJdMiCDotzukpjdIc',  // Key 6
  'AIzaSyB1XGK1nC_FHF7XNIFivlmhQzulVfWqT5g'   // Key 7
]

// Override with environment variable if provided (supports both naming conventions)
const ENV_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_API_KEY

class GeminiAPIKeyManager {
  constructor() {
    this.keys = ENV_API_KEY ? [ENV_API_KEY, ...API_KEYS] : API_KEYS
    this.currentKeyIndex = 0
    this.failedKeys = new Set()
    this.keyUsageStats = {}
    this.lastRotationTime = Date.now()
    
    // Initialize usage stats
    this.keys.forEach((key, index) => {
      this.keyUsageStats[index] = {
        requests: 0,
        errors: 0,
        lastUsed: null,
        failed: false
      }
    })
  }

  /**
   * Get the current active API key
   */
  getCurrentKey() {
    // Skip failed keys
    while (this.failedKeys.has(this.currentKeyIndex) && this.currentKeyIndex < this.keys.length) {
      this.currentKeyIndex++
    }

    if (this.currentKeyIndex >= this.keys.length) {
      // All keys have failed, reset to start and try again
      console.warn('All API keys have failed. Retrying from the beginning.')
      this.failedKeys.clear()
      this.currentKeyIndex = 0
    }

    const key = this.keys[this.currentKeyIndex]
    this.keyUsageStats[this.currentKeyIndex].lastUsed = new Date().toISOString()
    return key
  }

  /**
   * Mark current key as failed and rotate to next
   */
  rotateKey(errorMessage = 'Unknown error') {
    const failedKeyIndex = this.currentKeyIndex
    const failedKey = this.keys[failedKeyIndex]

    console.warn(`API Key #${failedKeyIndex + 1} failed: ${errorMessage}`)
    console.warn(`Failed key: ${failedKey.substring(0, 20)}...`)

    // Mark as failed
    this.failedKeys.add(failedKeyIndex)
    this.keyUsageStats[failedKeyIndex].failed = true
    this.keyUsageStats[failedKeyIndex].errors++

    // Move to next key
    this.currentKeyIndex++
    this.lastRotationTime = Date.now()

    // Get next available key
    const nextKey = this.getCurrentKey()
    console.log(`Switched to API Key #${this.currentKeyIndex + 1}`)

    return nextKey
  }

  /**
   * Record successful request
   */
  recordSuccess() {
    if (this.currentKeyIndex < this.keys.length) {
      this.keyUsageStats[this.currentKeyIndex].requests++
    }
  }

  /**
   * Record failed request
   */
  recordError() {
    if (this.currentKeyIndex < this.keys.length) {
      this.keyUsageStats[this.currentKeyIndex].errors++
    }
  }

  /**
   * Get stats for all keys
   */
  getStats() {
    return {
      currentKeyIndex: this.currentKeyIndex,
      currentKeyPreview: this.keys[this.currentKeyIndex]?.substring(0, 20) + '...',
      totalKeys: this.keys.length,
      failedKeys: Array.from(this.failedKeys),
      failedKeysCount: this.failedKeys.size,
      stats: this.keyUsageStats,
      lastRotationTime: new Date(this.lastRotationTime).toISOString(),
      ready: this.currentKeyIndex < this.keys.length
    }
  }

  /**
   * Check if any keys are still available
   */
  hasAvailableKeys() {
    return this.failedKeys.size < this.keys.length
  }

  /**
   * Get total request count across all keys
   */
  getTotalRequests() {
    return Object.values(this.keyUsageStats).reduce((sum, stat) => sum + stat.requests, 0)
  }

  /**
   * Get total error count across all keys
   */
  getTotalErrors() {
    return Object.values(this.keyUsageStats).reduce((sum, stat) => sum + stat.errors, 0)
  }

  /**
   * Reset specific key (allow it to be retried)
   */
  resetKey(keyIndex) {
    if (keyIndex >= 0 && keyIndex < this.keys.length) {
      this.failedKeys.delete(keyIndex)
      this.keyUsageStats[keyIndex].failed = false
      console.log(`API Key #${keyIndex + 1} has been reset and can be retried`)
    }
  }

  /**
   * Reset all keys
   */
  resetAllKeys() {
    this.failedKeys.clear()
    this.currentKeyIndex = 0
    Object.values(this.keyUsageStats).forEach(stat => {
      stat.failed = false
      stat.errors = 0
    })
    console.log('All API keys have been reset')
  }
}

// Create singleton instance
const keyManager = new GeminiAPIKeyManager()

export default keyManager
