const { verifyJWTToken, getClientInfo } = require('./security');
const { auditLog } = require('./auditLogger');
const PrismaClient = require('@prisma/client').PrismaClient;
const prisma = new PrismaClient();

// Verify JWT Token Middleware
async function verifyTokenMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'NO_TOKEN'
      });
    }

    const decoded = verifyJWTToken(token);
    if (!decoded) {
      return res.status(401).json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    // Verify session is not revoked
    const session = await prisma.userSession.findFirst({
      where: {
        userId: decoded.id,
        isRevoked: false,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!session) {
      return res.status(401).json({
        error: 'Session expired or revoked',
        code: 'INVALID_SESSION'
      });
    }

    req.user = decoded;
    req.sessionId = session.id;
    next();
  } catch (error) {
    console.error('[Token Verification Error]', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

// Verify Email Middleware
async function verifyEmailMiddleware(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { isEmailVerified: true }
    });

    if (!user?.isEmailVerified) {
      return res.status(403).json({
        error: 'Email verification required',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    next();
  } catch (error) {
    console.error('[Email Verification Error]', error);
    res.status(500).json({ error: 'Verification failed' });
  }
}

// Verify MFA if enabled
async function verifyMFAMiddleware(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const mfaConfig = await prisma.mFAConfig.findUnique({
      where: { userId: req.user.id },
      select: { isEnabled: true }
    });

    if (mfaConfig?.isEnabled) {
      const mfaToken = req.headers['x-mfa-token'];
      if (!mfaToken) {
        return res.status(403).json({
          error: 'MFA verification required',
          code: 'MFA_REQUIRED'
        });
      }

      // MFA verification would happen here
      // For now, mark that MFA is enabled
      req.mfaRequired = true;
    }

    next();
  } catch (error) {
    console.error('[MFA Verification Error]', error);
    res.status(500).json({ error: 'MFA verification failed' });
  }
}

// Role-based access control
function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      const clientInfo = getClientInfo(req);
      auditLog(req.user.id, 'access_denied', 'authorization', clientInfo, 'failure', {
        resource: req.path,
        requiredRole: allowedRoles,
        userRole: req.user.role
      });

      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

// Rate limiting middleware for APIs
function rateLimitMiddleware(maxRequests = 100, windowMs = 60 * 1000) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const key = `${ip}_${req.path}`;

    // Simple in-memory rate limiting
    if (!req.app.locals.rateLimit) {
      req.app.locals.rateLimit = new Map();
    }

    const now = Date.now();
    const data = req.app.locals.rateLimit.get(key) || { count: 0, resetTime: now + windowMs };

    if (now > data.resetTime) {
      data.count = 0;
      data.resetTime = now + windowMs;
    }

    data.count++;
    req.app.locals.rateLimit.set(key, data);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - data.count));

    if (data.count > maxRequests) {
      const clientInfo = getClientInfo(req);
      auditLog('unknown', 'rate_limit_exceeded', 'api', clientInfo, 'suspicious', {
        path: req.path,
        attempts: data.count
      });

      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((data.resetTime - now) / 1000)
      });
    }

    next();
  };
}

// CORS security header
function securityHeadersMiddleware(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
  next();
}

// Request logging and monitoring
function requestLoggingMiddleware(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const clientInfo = getClientInfo(req);

    if (res.statusCode >= 400) {
      console.warn(`[${req.method}] ${req.path} - ${res.statusCode} (${duration}ms) from ${clientInfo.ipAddress}`);
    }
  });

  next();
}

module.exports = {
  verifyTokenMiddleware,
  verifyEmailMiddleware,
  verifyMFAMiddleware,
  requireRole,
  rateLimitMiddleware,
  securityHeadersMiddleware,
  requestLoggingMiddleware
};
