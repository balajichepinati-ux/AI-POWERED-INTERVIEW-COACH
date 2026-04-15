const PrismaClient = require('@prisma/client').PrismaClient;
const prisma = new PrismaClient();

// Log audit trail
async function auditLog(userId, action, resource, clientInfo, status = 'success', details = null) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        status,
        details: details || {}
      }
    });
  } catch (error) {
    console.error('[Audit Log Error]', error);
  }
}

// Detect suspicious activity
async function detectSuspiciousActivity(userId) {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Check for multiple failed attempts
    const failedAttempts = await prisma.loginAttempt.findMany({
      where: {
        userId,
        success: false,
        createdAt: {
          gte: oneHourAgo
        }
      }
    });

    // Check for unusual login locations/times
    const recentLogins = await prisma.auditLog.findMany({
      where: {
        userId,
        action: 'login',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      select: { ipAddress: true, userAgent: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const uniqueIPs = new Set(recentLogins.map(log => log.ipAddress));

    return {
      suspicious: failedAttempts.length > 3 || uniqueIPs.size > 3,
      failedAttempts: failedAttempts.length,
      unusualLocations: uniqueIPs.size > 2,
      recentLogins
    };
  } catch (error) {
    console.error('[Suspicious Activity Detection Error]', error);
    return { suspicious: false };
  }
}

// Get security summary for user
async function getSecuritySummary(userId) {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const loginAttempts = await prisma.loginAttempt.count({
      where: {
        userId,
        createdAt: {
          gte: oneWeekAgo
        }
      }
    });

    const failedAttempts = await prisma.loginAttempt.count({
      where: {
        userId,
        success: false,
        createdAt: {
          gte: oneWeekAgo
        }
      }
    });

    const suspiciousEvents = await prisma.auditLog.count({
      where: {
        userId,
        status: 'suspicious',
        createdAt: {
          gte: oneWeekAgo
        }
      }
    });

    const activeSessions = await prisma.userSession.count({
      where: {
        userId,
        isRevoked: false,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    return {
      loginAttempts,
      failedAttempts,
      suspiciousEvents,
      activeSessions
    };
  } catch (error) {
    console.error('[Security Summary Error]', error);
    return {
      loginAttempts: 0,
      failedAttempts: 0,
      suspiciousEvents: 0,
      activeSessions: 0
    };
  }
}

// Alert on suspicious activity (placeholder for email/notification)
async function alertSuspiciousActivity(userId, email, activity) {
  try {
    // TODO: Send email to user
    console.warn(`[SECURITY ALERT] User ${email} (${userId}) - ${activity.type}:`, activity);

    // Record in audit log
    await auditLog(userId, `alert_${activity.type}`, 'security', {
      ipAddress: 'system',
      userAgent: 'system'
    }, 'suspicious', activity);
  } catch (error) {
    console.error('[Alert Error]', error);
  }
}

module.exports = {
  auditLog,
  detectSuspiciousActivity,
  getSecuritySummary,
  alertSuspiciousActivity
};
