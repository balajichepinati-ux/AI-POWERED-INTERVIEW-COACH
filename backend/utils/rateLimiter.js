const PrismaClient = require('@prisma/client').PrismaClient;
const prisma = new PrismaClient();

const RATE_LIMIT_CONFIG = {
  maxAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  attemptWindow: 15 * 60 * 1000 // 15 minutes
};

// Check if user is locked out
async function isUserLockedOut(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isLocked: true, lockedUntil: true }
  });

  if (!user) return false;

  if (user.isLocked && user.lockedUntil) {
    if (new Date() < user.lockedUntil) {
      return true;
    } else {
      // Unlock user
      await prisma.user.update({
        where: { id: userId },
        data: {
          isLocked: false,
          lockedUntil: null,
          failedLoginAttempts: 0
        }
      });
      return false;
    }
  }

  return false;
}

// Record login attempt
async function recordLoginAttempt(userId, email, success, ipAddress, userAgent, reason = null) {
  try {
    await prisma.loginAttempt.create({
      data: {
        userId,
        email,
        success,
        ipAddress,
        userAgent,
        reason
      }
    });
  } catch (error) {
    console.error('[LoginAttempt Error]', error);
  }
}

// Get recent failed attempts
async function getRecentFailedAttempts(userId) {
  const fifteenMinutesAgo = new Date(Date.now() - RATE_LIMIT_CONFIG.attemptWindow);

  const attempts = await prisma.loginAttempt.findMany({
    where: {
      userId,
      success: false,
      createdAt: {
        gte: fifteenMinutesAgo
      }
    },
    select: { createdAt: true }
  });

  return attempts;
}

// Handle failed login
async function handleFailedLogin(userId, ipAddress, userAgent) {
  const failedAttempts = await getRecentFailedAttempts(userId);
  const newAttemptCount = failedAttempts.length + 1;

  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: newAttemptCount
    }
  });

  if (newAttemptCount >= RATE_LIMIT_CONFIG.maxAttempts) {
    // Lock account
    const lockUntil = new Date(Date.now() + RATE_LIMIT_CONFIG.lockoutDuration);
    await prisma.user.update({
      where: { id: userId },
      data: {
        isLocked: true,
        lockedUntil: lockUntil,
        failedLoginAttempts: newAttemptCount
      }
    });

    return {
      locked: true,
      unlockTime: lockUntil
    };
  }

  return {
    locked: false,
    remainingAttempts: RATE_LIMIT_CONFIG.maxAttempts - newAttemptCount
  };
}

// Handle successful login
async function handleSuccessfulLogin(userId) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: 0,
      isLocked: false,
      lockedUntil: null
    }
  });
}

// Rate limiting by IP (API-wide)
const ipRateLimitStore = new Map();

function checkIPRateLimit(ip, maxRequests = 100, windowMs = 60 * 1000) {
  const now = Date.now();
  const key = `ip_${ip}`;

  if (!ipRateLimitStore.has(key)) {
    ipRateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    return { allowed: true };
  }

  const data = ipRateLimitStore.get(key);

  if (now > data.resetTime) {
    ipRateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    return { allowed: true };
  }

  data.count += 1;

  if (data.count > maxRequests) {
    return { allowed: false, retryAfter: Math.ceil((data.resetTime - now) / 1000) };
  }

  return { allowed: true, remaining: maxRequests - data.count };
}

// Clean up old rate limit entries
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of ipRateLimitStore.entries()) {
    if (now > data.resetTime) {
      ipRateLimitStore.delete(key);
    }
  }
}, 60 * 1000); // Clean every minute

module.exports = {
  isUserLockedOut,
  recordLoginAttempt,
  getRecentFailedAttempts,
  handleFailedLogin,
  handleSuccessfulLogin,
  checkIPRateLimit,
  RATE_LIMIT_CONFIG
};
