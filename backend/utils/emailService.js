const { generateSecureToken, hashToken } = require('./security');
const PrismaClient = require('@prisma/client').PrismaClient;
const prisma = new PrismaClient();

const EMAIL_VERIFICATION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_RESET_EXPIRY = 1 * 60 * 60 * 1000; // 1 hour

// Create email verification token
async function createEmailVerificationToken(userId, email) {
  try {
    // Invalidate previous tokens
    await prisma.emailVerification.updateMany({
      where: {
        userId,
        isUsed: false
      },
      data: {
        isUsed: true
      }
    });

    const token = generateSecureToken();
    const hashedToken = hashToken(token);
    const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY);

    await prisma.emailVerification.create({
      data: {
        userId,
        email,
        token: hashedToken,
        expiresAt
      }
    });

    return token;
  } catch (error) {
    console.error('[Email Verification Token Error]', error);
    throw error;
  }
}

// Verify email token
async function verifyEmailToken(userId, token) {
  try {
    const hashedToken = hashToken(token);

    const verification = await prisma.emailVerification.findFirst({
      where: {
        userId,
        token: hashedToken,
        isUsed: false,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!verification) {
      return { valid: false, error: 'Invalid or expired verification token' };
    }

    // Mark token as used
    await prisma.emailVerification.update({
      where: { id: verification.id },
      data: { isUsed: true }
    });

    // Mark user email as verified
    await prisma.user.update({
      where: { id: userId },
      data: { isEmailVerified: true }
    });

    return { valid: true };
  } catch (error) {
    console.error('[Email Token Verification Error]', error);
    return { valid: false, error: 'Verification failed' };
  }
}

// Create password reset token
async function createPasswordResetToken(userId) {
  try {
    // Invalidate previous tokens
    await prisma.passwordReset.updateMany({
      where: {
        userId,
        isUsed: false
      },
      data: {
        isUsed: true
      }
    });

    const token = generateSecureToken();
    const hashedToken = hashToken(token);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY);

    await prisma.passwordReset.create({
      data: {
        userId,
        token: hashedToken,
        expiresAt
      }
    });

    return token;
  } catch (error) {
    console.error('[Password Reset Token Error]', error);
    throw error;
  }
}

// Verify password reset token
async function verifyPasswordResetToken(token) {
  try {
    const hashedToken = hashToken(token);

    const reset = await prisma.passwordReset.findFirst({
      where: {
        token: hashedToken,
        isUsed: false,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        user: {
          select: { id: true, email: true }
        }
      }
    });

    if (!reset) {
      return { valid: false, error: 'Invalid or expired reset token' };
    }

    return { valid: true, userId: reset.user.id, email: reset.user.email };
  } catch (error) {
    console.error('[Password Reset Token Verification Error]', error);
    return { valid: false, error: 'Verification failed' };
  }
}

// Mark password reset as used
async function markPasswordResetAsUsed(token) {
  try {
    const hashedToken = hashToken(token);

    await prisma.passwordReset.updateMany({
      where: {
        token: hashedToken,
        isUsed: false
      },
      data: {
        isUsed: true
      }
    });
  } catch (error) {
    console.error('[Mark Password Reset Error]', error);
  }
}

// Send verification email (placeholder)
async function sendVerificationEmail(email, token) {
  try {
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    // TODO: Integrate with email service (SendGrid, Nodemailer, etc.)
    console.log(`[EMAIL] Send verification email to ${email}`);
    console.log(`[EMAIL] Link: ${verificationLink}`);

    return { sent: true };
  } catch (error) {
    console.error('[Send Verification Email Error]', error);
    throw error;
  }
}

// Send password reset email (placeholder)
async function sendPasswordResetEmail(email, token) {
  try {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    // TODO: Integrate with email service (SendGrid, Nodemailer, etc.)
    console.log(`[EMAIL] Send password reset email to ${email}`);
    console.log(`[EMAIL] Link: ${resetLink}`);

    return { sent: true };
  } catch (error) {
    console.error('[Send Password Reset Email Error]', error);
    throw error;
  }
}

// Send suspicious activity alert (placeholder)
async function sendSuspiciousActivityAlert(email, activity) {
  try {
    // TODO: Integrate with email service
    console.log(`[EMAIL] Send suspicious activity alert to ${email}`);
    console.log(`[EMAIL] Activity:`, activity);

    return { sent: true };
  } catch (error) {
    console.error('[Send Alert Email Error]', error);
    throw error;
  }
}

module.exports = {
  createEmailVerificationToken,
  verifyEmailToken,
  createPasswordResetToken,
  verifyPasswordResetToken,
  markPasswordResetAsUsed,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendSuspiciousActivityAlert,
  EMAIL_VERIFICATION_EXPIRY,
  PASSWORD_RESET_EXPIRY
};
