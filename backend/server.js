require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// Import security middleware
const {
  securityHeadersMiddleware,
  requestLoggingMiddleware,
  rateLimitMiddleware
} = require('./utils/authMiddleware');

// Import error handler
const { errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const resumeRoutes = require('./routes/resume');
const questionsRoutes = require('./routes/questions');
const analyzeRoutes = require('./routes/analyze');
const sessionsRoutes = require('./routes/sessions');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// SECURITY MIDDLEWARE - Apply First
// ============================================

// Helmet security headers
app.use(helmet());

// Security headers
app.use(securityHeadersMiddleware);

// Request logging and monitoring
app.use(requestLoggingMiddleware);

// ============================================
// CORS & BODY PARSING
// ============================================
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-MFA-Token']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// API RATE LIMITING
// ============================================
// General API rate limiting
app.use('/api/', rateLimitMiddleware(1000, 60 * 1000)); // 1000 requests per minute

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'MockMate API', timestamp: new Date().toISOString() });
});

// ============================================
// ROOT ROUTE - API DOCUMENTATION
// ============================================
app.get('/', (req, res) => {
  res.json({
    service: 'MockMate - AI Interview Coach API',
    version: '2.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    available_endpoints: {
      health: '/health',
      auth: '/api/auth',
      resume: '/api/resume',
      questions: '/api/questions',
      analyze: '/api/analyze',
      sessions: '/api/sessions'
    },
    documentation: {
      auth: 'POST /api/auth/register, POST /api/auth/login',
      resume: 'POST /api/resume/upload',
      questions: 'POST /api/questions/generate, POST /api/questions/generate-all-categories',
      analyze: 'POST /api/analyze',
      sessions: 'GET /api/sessions, POST /api/sessions, GET /api/sessions/stats'
    }
  });
});

// ============================================
// API ROUTES
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/sessions', sessionsRoutes);

// ============================================
// ERROR HANDLERS
// ============================================

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  
  // Don't expose internal errors in production
  const message = process.env.NODE_ENV === 'development' 
    ? err.message 
    : 'Internal server error';

  res.status(err.status || 500).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// SERVER STARTUP
// ============================================
app.listen(PORT, () => {
  console.log(`\n🎙️  MockMate API running on http://localhost:${PORT}`);
  console.log(`📚  Health: http://localhost:${PORT}/health`);
  console.log(`🔒  Security Features: Enabled\n`);
});

module.exports = app;
