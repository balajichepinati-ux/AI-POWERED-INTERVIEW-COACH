const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Import security utilities
const {
  generateSecureToken,
  hashToken,
  verifyTokenHash,
  generateJWTToken,
  generateRefreshToken,
  verifyJWTToken,
  verifyRefreshToken,
  generateOTP,
  validatePasswordStrength,
  getClientInfo,
  getGenericAuthError
} = require('../utils/security');

const {
  isUserLockedOut,
  recordLoginAttempt,
  handleFailedLogin,
  handleSuccessfulLogin,
  checkIPRateLimit
} = require('../utils/rateLimiter');

const {
  createEmailVerificationToken,
  verifyEmailToken,
  createPasswordResetToken,
  verifyPasswordResetToken,
  markPasswordResetAsUsed,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendSuspiciousActivityAlert
} = require('../utils/emailService');

const {
  auditLog,
  detectSuspiciousActivity,
  alertSuspiciousActivity
} = require('../utils/auditLogger');

const {
  verifyMFACode,
  getMFAStatus
} = require('../utils/mfaService');

const PrismaClient = require('@prisma/client').PrismaClient;
const prisma = new PrismaClient();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ============================================
// 1. SIGNUP - Secure Registration
// ============================================
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const clientInfo = getClientInfo(req);

    // Rate limiting
    const rateLimit = checkIPRateLimit(clientInfo.ipAddress, 10, 60 * 1000);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: 'Too many signup attempts. Please try again later.',
        retryAfter: rateLimit.retryAfter
      });
    }

    // Input validation
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Password strength validation
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: 'Password does not meet requirements',
        requirements: passwordValidation.errors
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      // Generic response - don't reveal if email exists
      await auditLog('unknown', 'signup_duplicate_attempt', 'auth', clientInfo, 'suspicious', {
        email: email.substring(0, 5) + '*****'
      });

      return res.status(400).json({
        error: 'Unable to create account. Please check your information and try again.'
      });
    }

    // Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false // Require email verification
    });

    if (authError) {
      console.error('[Signup Auth Error]', authError);
      return res.status(400).json({
        error: 'Unable to create account. Please try again later.'
      });
    }

    // Create user in database
    const user = await prisma.user.create({
      data: {
        supabaseId: authData.user.id,
        email,
        name,
        isEmailVerified: false
      }
    });

    // Create email verification token
    const verificationToken = await createEmailVerificationToken(user.id, email);
    await sendVerificationEmail(email, verificationToken);

    // Log signup
    await auditLog(user.id, 'signup', 'auth', clientInfo, 'success', { email });

    return res.status(201).json({
      success: true,
      message: 'Account created. Please verify your email to continue.',
      userId: user.id
    });
  } catch (error) {
    console.error('[Signup Error]', error);
    const clientInfo = getClientInfo(req);
    await auditLog('unknown', 'signup_error', 'auth', clientInfo, 'failure', { error: error.message });

    res.status(500).json({ error: 'Unable to create account. Please try again later.' });
  }
});

// ============================================
// 2. EMAIL VERIFICATION
// ============================================
router.post('/verify-email', async (req, res) => {
  try {
    const { userId, token } = req.body;
    const clientInfo = getClientInfo(req);

    if (!userId || !token) {
      return res.status(400).json({ error: 'Missing verification token' });
    }

    const verification = await verifyEmailToken(userId, token);

    if (!verification.valid) {
      await auditLog(userId, 'email_verification_failed', 'auth', clientInfo, 'failure', {
        error: verification.error
      });

      return res.status(400).json({
        error: 'Email verification failed. The link may have expired.'
      });
    }

    await auditLog(userId, 'email_verified', 'auth', clientInfo, 'success');

    return res.json({
      success: true,
      message: 'Email verified successfully. You can now log in.'
    });
  } catch (error) {
    console.error('[Email Verification Error]', error);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
});

// ============================================
// 3. LOGIN - Secure Authentication
// ============================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const clientInfo = getClientInfo(req);

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ error: getGenericAuthError() });
    }

    // Rate limiting by email
    const rateLimit = checkIPRateLimit(email, 5, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: 'Too many login attempts. Please try again later.',
        retryAfter: rateLimit.retryAfter
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if email exists
      await recordLoginAttempt('unknown', email, false, clientInfo.ipAddress, clientInfo.userAgent, 'user_not_found');
      return res.status(401).json({ error: getGenericAuthError() });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      await recordLoginAttempt(user.id, email, false, clientInfo.ipAddress, clientInfo.userAgent, 'email_not_verified');
      return res.status(403).json({
        error: 'Please verify your email to continue.',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    // Check if account is locked
    const isLocked = await isUserLockedOut(user.id);
    if (isLocked) {
      await recordLoginAttempt(user.id, email, false, clientInfo.ipAddress, clientInfo.userAgent, 'account_locked');
      return res.status(403).json({
        error: 'Account temporarily locked due to multiple failed attempts. Please try again later.',
        code: 'ACCOUNT_LOCKED'
      });
    }

    // Authenticate with Supabase
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError || !signInData.session) {
        await handleFailedLogin(user.id, clientInfo.ipAddress, clientInfo.userAgent);
        await recordLoginAttempt(user.id, email, false, clientInfo.ipAddress, clientInfo.userAgent, 'invalid_credentials');

        return res.status(401).json({ error: getGenericAuthError() });
      }

      // Successful login
      await handleSuccessfulLogin(user.id);
      await recordLoginAttempt(user.id, email, true, clientInfo.ipAddress, clientInfo.userAgent);

      // Check for suspicious activity
      const suspiciousActivity = await detectSuspiciousActivity(user.id);
      if (suspiciousActivity.suspicious) {
        await alertSuspiciousActivity(user.id, email, {
          type: 'suspicious_login',
          failedAttempts: suspiciousActivity.failedAttempts,
          uniqueLocations: suspiciousActivity.unusualLocations
        });
      }

      // Create session record
      const accessToken = generateJWTToken({ id: user.id, email: user.email }, '1h');
      const refreshToken = generateRefreshToken({ id: user.id });

      const session = await prisma.userSession.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(accessToken),
          refreshTokenHash: hashToken(refreshToken),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent
        }
      });

      // Log login
      await auditLog(user.id, 'login', 'auth', clientInfo, 'success');

      // Check if MFA is enabled
      const mfaStatus = await getMFAStatus(user.id);
      if (mfaStatus.isEnabled) {
        return res.json({
          success: true,
          message: 'MFA verification required',
          mfaRequired: true,
          tempToken: accessToken, // Temporary token for MFA verification
          sessionId: session.id,
          user: {
            id: user.id,
            email: user.email,
            name: user.name
          }
        });
      }

      return res.json({
        success: true,
        accessToken,
        refreshToken,
        sessionId: session.id,
        expiresIn: 3600,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      });
    } catch (error) {
      console.error('[Login Error]', error);
      await handleFailedLogin(user.id, clientInfo.ipAddress, clientInfo.userAgent);
      return res.status(401).json({ error: getGenericAuthError() });
    }
  } catch (error) {
    console.error('[Login Error]', error);
    res.status(500).json({ error: 'Authentication failed. Please try again.' });
  }
});

// ============================================
// 4. MFA VERIFICATION
// ============================================
router.post('/verify-mfa', async (req, res) => {
  try {
    const { userId, code, tempToken } = req.body;
    const clientInfo = getClientInfo(req);

    if (!userId || !code || !tempToken) {
      return res.status(400).json({ error: 'Missing MFA information' });
    }

    // Verify temp token is valid
    const tempDecoded = verifyJWTToken(tempToken);
    if (!tempDecoded || tempDecoded.id !== userId) {
      return res.status(401).json({ error: 'Invalid MFA request' });
    }

    // Verify MFA code
    const mfaVerification = await verifyMFACode(userId, code);
    if (!mfaVerification.valid) {
      await auditLog(userId, 'mfa_verification_failed', 'auth', clientInfo, 'failure');
      return res.status(401).json({ error: 'Invalid MFA code' });
    }

    // Create full tokens
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true }
    });

    const accessToken = generateJWTToken({ id: user.id, email: user.email }, '1h');
    const refreshToken = generateRefreshToken({ id: user.id });

    const session = await prisma.userSession.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(accessToken),
        refreshTokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      }
    });

    await auditLog(userId, 'mfa_verified', 'auth', clientInfo, 'success');

    return res.json({
      success: true,
      accessToken,
      refreshToken,
      sessionId: session.id,
      expiresIn: 3600,
      user
    });
  } catch (error) {
    console.error('[MFA Verification Error]', error);
    res.status(500).json({ error: 'MFA verification failed' });
  }
});

// ============================================
// 5. REFRESH TOKEN
// ============================================
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const clientInfo = getClientInfo(req);

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Generate new access token
    const newAccessToken = generateJWTToken({ id: user.id, email: user.email }, '1h');

    // Update session
    await prisma.userSession.updateMany({
      where: {
        userId: user.id,
        isRevoked: false
      },
      data: {
        tokenHash: hashToken(newAccessToken),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000)
      }
    });

    await auditLog(user.id, 'token_refreshed', 'auth', clientInfo, 'success');

    return res.json({
      success: true,
      accessToken: newAccessToken,
      expiresIn: 3600
    });
  } catch (error) {
    console.error('[Token Refresh Error]', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// ============================================
// 6. LOGOUT
// ============================================
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const clientInfo = getClientInfo(req);

    if (!token) {
      return res.status(400).json({ error: 'No token provided' });
    }

    const decoded = verifyJWTToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Revoke all sessions for user (optional: or just this session)
    await prisma.userSession.updateMany({
      where: {
        userId: decoded.id,
        isRevoked: false
      },
      data: {
        isRevoked: true
      }
    });

    await auditLog(decoded.id, 'logout', 'auth', clientInfo, 'success');

    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('[Logout Error]', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// ============================================
// 7. PASSWORD RESET REQUEST
// ============================================
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const clientInfo = getClientInfo(req);

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Rate limiting
    const rateLimit = checkIPRateLimit(`reset_${email}`, 3, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: 'Too many password reset attempts. Please try again later.',
        retryAfter: rateLimit.retryAfter
      });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Generic response - don't reveal if email exists
    if (!user) {
      // Still log for security
      await auditLog('unknown', 'password_reset_invalid_email', 'auth', clientInfo, 'suspicious', {
        email: email.substring(0, 5) + '*****'
      });

      return res.json({
        success: true,
        message: 'If an account exists for this email, you will receive a password reset link.'
      });
    }

    // Create reset token
    const resetToken = await createPasswordResetToken(user.id);
    await sendPasswordResetEmail(email, resetToken);

    await auditLog(user.id, 'password_reset_requested', 'auth', clientInfo, 'success');

    return res.json({
      success: true,
      message: 'Password reset link sent to your email if it exists in our system.'
    });
  } catch (error) {
    console.error('[Forgot Password Error]', error);
    res.status(500).json({ error: 'Password reset request failed' });
  }
});

// ============================================
// 8. PASSWORD RESET
// ============================================
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    const clientInfo = getClientInfo(req);

    if (!token || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: 'Password does not meet requirements',
        requirements: passwordValidation.errors
      });
    }

    // Verify reset token
    const verification = await verifyPasswordResetToken(token);
    if (!verification.valid) {
      return res.status(400).json({
        error: 'Password reset link has expired or is invalid. Please request a new one.'
      });
    }

    // Update password in Supabase
    const supabaseUser = await prisma.user.findUnique({
      where: { id: verification.userId },
      select: { supabaseId: true }
    });

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      supabaseUser.supabaseId,
      { password }
    );

    if (updateError) {
      console.error('[Password Update Error]', updateError);
      return res.status(400).json({ error: 'Failed to update password' });
    }

    // Mark token as used
    await markPasswordResetAsUsed(token);

    // Revoke all sessions (force re-login)
    await prisma.userSession.updateMany({
      where: { userId: verification.userId },
      data: { isRevoked: true }
    });

    await auditLog(verification.userId, 'password_reset', 'auth', clientInfo, 'success');

    return res.json({
      success: true,
      message: 'Password reset successfully. Please log in with your new password.'
    });
  } catch (error) {
    console.error('[Password Reset Error]', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

// ============================================
// 9. GET CURRENT USER
// ============================================
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token' });
    }

    const decoded = verifyJWTToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        isEmailVerified: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('[Get User Error]', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
