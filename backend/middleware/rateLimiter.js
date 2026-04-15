/**
 * Rate Limiter Middleware for Express
 * Prevents API abuse and DDoS attacks
 */

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map()

/**
 * Rate limit per IP
 * Usage: app.use(rateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 100 }))
 */
function rateLimit(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100,
    message = 'Too many requests, please try again later'
  } = options

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress
    const key = `${ip}:${req.path}`
    const now = Date.now()

    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, [])
    }

    const timestamps = rateLimitStore.get(key)
    const recentTimestamps = timestamps.filter(t => now - t < windowMs)

    if (recentTimestamps.length >= maxRequests) {
      console.warn(`[Rate Limit] IP ${ip} exceeded limit on ${req.path}`)
      return res.status(429).json({
        error: message,
        retryAfter: Math.ceil((recentTimestamps[0] + windowMs - now) / 1000)
      })
    }

    recentTimestamps.push(now)
    rateLimitStore.set(key, recentTimestamps)

    // Cleanup old entries periodically
    if (Math.random() < 0.01) {
      for (const [storeKey, ts] of rateLimitStore.entries()) {
        const valid = ts.filter(t => now - t < windowMs)
        if (valid.length === 0) {
          rateLimitStore.delete(storeKey)
        } else {
          rateLimitStore.set(storeKey, valid)
        }
      }
    }

    next()
  }
}

/**
 * Specific rate limiters for different endpoints
 */
const createLimiter = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return rateLimit({ maxRequests, windowMs })
}

const questionLimiter = createLimiter(50, 60 * 1000) // 50 per minute
const authLimiter = createLimiter(10, 15 * 60 * 1000) // 10 per 15 minutes
const resumeLimiter = createLimiter(5, 60 * 60 * 1000) // 5 per hour
const analyzeLimiter = createLimiter(20, 60 * 1000) // 20 per minute

module.exports = {
  rateLimit,
  createLimiter,
  questionLimiter,
  authLimiter,
  resumeLimiter,
  analyzeLimiter
}
