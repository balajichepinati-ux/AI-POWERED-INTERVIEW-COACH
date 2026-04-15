/**
 * Error Handler Middleware for Express
 * Centralizes all error handling and logging
 */

// Custom error class
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.timestamp = new Date().toISOString()
  }
}

// Error handler middleware
function errorHandler(err, req, res, next) {
  console.error('[ERROR]', {
    code: err.code || 'UNKNOWN',
    message: err.message,
    statusCode: err.statusCode || 500,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  })

  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal Server Error'

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message,
      timestamp: err.timestamp || new Date().toISOString()
    }
  })
}

// Validation error handler
function validationError(field, message) {
  const err = new AppError(message, 400, 'VALIDATION_ERROR')
  err.field = field
  return err
}

// Async wrapper to catch errors in async handlers
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

module.exports = {
  AppError,
  errorHandler,
  validationError,
  asyncHandler
}
