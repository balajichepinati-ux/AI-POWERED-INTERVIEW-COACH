/**
 * Configuration manager for different environments
 */

const ENV = process.env.NODE_ENV || 'development'

const config = {
  development: {
    name: 'development',
    port: 3001,
    frontend_url: 'http://localhost:5173',
    db_url: 'postgresql://postgres:postgres@localhost:5432/mockmate',
    cors_enabled: true,
    log_level: 'debug',
    cache_enabled: true,
    cache_ttl: 3600000, // 1 hour
    rate_limit: {
      enabled: true,
      windowMs: 15 * 60 * 1000,
      maxRequests: 1000
    },
    session_timeout: 24 * 60 * 60 * 1000, // 24 hours
    api_keys: {
      gemini: process.env.GEMINI_API_KEY || '',
      anthropic: process.env.ANTHROPIC_API_KEY || ''
    }
  },

  staging: {
    name: 'staging',
    port: process.env.PORT || 3001,
    frontend_url: process.env.FRONTEND_URL || 'https://staging.mockmate.com',
    db_url: process.env.DATABASE_URL,
    cors_enabled: true,
    log_level: 'info',
    cache_enabled: true,
    cache_ttl: 7200000, // 2 hours
    rate_limit: {
      enabled: true,
      windowMs: 15 * 60 * 1000,
      maxRequests: 500
    },
    session_timeout: 24 * 60 * 60 * 1000,
    api_keys: {
      gemini: process.env.GEMINI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY
    }
  },

  production: {
    name: 'production',
    port: process.env.PORT || 3001,
    frontend_url: process.env.FRONTEND_URL || 'https://mockmate.com',
    db_url: process.env.DATABASE_URL,
    cors_enabled: false,
    log_level: 'warn',
    cache_enabled: true,
    cache_ttl: 86400000, // 24 hours
    rate_limit: {
      enabled: true,
      windowMs: 15 * 60 * 1000,
      maxRequests: 100
    },
    session_timeout: 12 * 60 * 60 * 1000, // 12 hours
    api_keys: {
      gemini: process.env.GEMINI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY
    },
    features: {
      google_analytics: true,
      error_tracking: true,
      performance_monitoring: true
    }
  }
}

const currentConfig = config[ENV] || config.development

module.exports = {
  env: ENV,
  config: currentConfig,
  isDevelopment: ENV === 'development',
  isStaging: ENV === 'staging',
  isProduction: ENV === 'production'
}
