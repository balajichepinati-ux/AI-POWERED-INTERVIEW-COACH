/**
 * Logging and Error Middleware
 */

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
}

const LOG_LEVEL = process.env.LOG_LEVEL || 'INFO'

/**
 * Centralized logger
 */
class Logger {
  constructor(name) {
    this.name = name
  }

  log(level, message, data = {}) {
    const timestamp = new Date().toISOString()
    const levelName = Object.keys(LOG_LEVELS).find(k => LOG_LEVELS[k] === level)

    const logEntry = {
      timestamp,
      level: levelName,
      service: this.name,
      message,
      ...data
    }

    if (level <= LOG_LEVELS[LOG_LEVEL]) {
      const output = JSON.stringify(logEntry)
      
      if (level === LOG_LEVELS.ERROR) {
        console.error(output)
      } else if (level === LOG_LEVELS.WARN) {
        console.warn(output)
      } else {
        console.log(output)
      }
    }

    // In production, send to logging service (e.g., Winston, Bunyan)
    // sendToLoggingService(logEntry)
  }

  error(message, data) { this.log(LOG_LEVELS.ERROR, message, data) }
  warn(message, data) { this.log(LOG_LEVELS.WARN, message, data) }
  info(message, data) { this.log(LOG_LEVELS.INFO, message, data) }
  debug(message, data) { this.log(LOG_LEVELS.DEBUG, message, data) }
}

/**
 * Request logging middleware
 */
function requestLogger(req, res, next) {
  const start = Date.now()
  const logger = new Logger('HTTP')

  const originalSend = res.send

  res.send = function(data) {
    const duration = Date.now() - start
    
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')?.substring(0, 100)
    })

    originalSend.call(this, data)
  }

  next()
}

/**
 * Security headers middleware
 */
function securityHeaders(req, res, next) {
  // Prevent XSS attacks
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:5173')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Content Security Policy (basic)
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'")

  next()
}

/**
 * Global error handler
 */
function errorHandler(err, req, res, next) {
  const logger = new Logger('ErrorHandler')

  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal Server Error'

  logger.error('Unhandled error', {
    message,
    statusCode,
    stack: err.stack?.substring(0, 500),
    path: req.path,
    method: req.method,
    ip: req.ip
  })

  res.status(statusCode).json({
    error: message,
    status: statusCode,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
}

/**
 * 404 handler
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method
  })
}

module.exports = {
  Logger,
  requestLogger,
  securityHeaders,
  errorHandler,
  notFoundHandler,
  LOG_LEVELS
}
