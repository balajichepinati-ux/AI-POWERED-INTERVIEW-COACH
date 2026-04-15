/**
 * Caching Strategy & Offline Support
 */

const CACHE_PREFIX = 'mockmate_'
const CACHE_VERSION = 'v1'

/**
 * Cache manager
 */
class CacheManager {
  constructor(namespace = 'api') {
    this.namespace = `${CACHE_PREFIX}${namespace}_${CACHE_VERSION}`
  }

  set(key, value, ttl = 3600000) { // 1 hour default
    try {
      const item = {
        data: value,
        timestamp: Date.now(),
        ttl
      }
      localStorage.setItem(`${this.namespace}:${key}`, JSON.stringify(item))
      return true
    } catch (err) {
      console.warn('[Cache] Failed to set:', err)
      return false
    }
  }

  get(key) {
    try {
      const item = JSON.parse(localStorage.getItem(`${this.namespace}:${key}`))
      if (!item) return null

      // Check if expired
      if (Date.now() - item.timestamp > item.ttl) {
        this.delete(key)
        return null
      }

      return item.data
    } catch (err) {
      return null
    }
  }

  delete(key) {
    try {
      localStorage.removeItem(`${this.namespace}:${key}`)
      return true
    } catch (err) {
      return false
    }
  }

  clear() {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(this.namespace))
      keys.forEach(key => localStorage.removeItem(key))
      return true
    } catch (err) {
      return false
    }
  }
}

// Specific cache managers
export const apiCache = new CacheManager('api')
export const questionCache = new CacheManager('questions')
export const sessionCache = new CacheManager('sessions')

/**
 * API fetch with caching
 */
export async function cachedFetch(url, options = {}) {
  const {
    cacheTTL = 3600000,
    forceRefresh = false,
    cacheManager = apiCache
  } = options

  // Check cache first
  if (!forceRefresh && options.method !== 'POST' && options.method !== 'PUT' && options.method !== 'DELETE') {
    const cached = cacheManager.get(url)
    if (cached) {
      console.log('[Cache] Hit:', url)
      return cached
    }
  }

  try {
    const response = await fetch(url, options)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const data = await response.json()

    // Cache successful responses
    if (response.ok && !options.method) {
      cacheManager.set(url, data, cacheTTL)
    }

    return data
  } catch (err) {
    // Fallback to cache on error if available
    const cached = cacheManager.get(url)
    if (cached) {
      console.warn('[Cache] Using stale cache due to error:', url)
      return cached
    }
    throw err
  }
}

/**
 * Service Worker registration for offline support
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers not supported')
    return
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js')
    console.log('[SW] Registered:', registration)

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newSW = registration.installing
      newSW.addEventListener('statechange', () => {
        if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('[SW] New version available')
          window.dispatchEvent(new CustomEvent('sw-update'))
        }
      })
    })

    return registration
  } catch (err) {
    console.error('[SW] Registration failed:', err)
  }
}

/**
 * Network status detection
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine)

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

/**
 * Background sync for offline actions
 */
export async function setupBackgroundSync() {
  if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
    console.warn('Background Sync not supported')
    return
  }

  try {
    const registration = await navigator.serviceWorker.ready
    await registration.sync.register('sync-offline-sessions')
    console.log('[Sync] Registered background sync')
  } catch (err) {
    console.error('[Sync] Failed to register:', err)
  }
}

/**
 * Queue manager for offline requests
 */
class OfflineQueue {
  constructor() {
    this.queue = JSON.parse(localStorage.getItem(CACHE_PREFIX + 'queue') || '[]')
  }

  add(request) {
    this.queue.push({
      id: Date.now(),
      timestamp: Date.now(),
      ...request
    })
    this.save()
  }

  save() {
    localStorage.setItem(CACHE_PREFIX + 'queue', JSON.stringify(this.queue))
  }

  async processQueue() {
    const toProcess = [...this.queue]
    this.queue = []

    for (const request of toProcess) {
      try {
        const response = await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body
        })

        if (!response.ok) {
          this.queue.push(request)
        }
      } catch (err) {
        this.queue.push(request)
      }
    }

    this.save()
    return this.queue.length === 0
  }

  clear() {
    this.queue = []
    this.save()
  }
}

export const offlineQueue = new OfflineQueue()
