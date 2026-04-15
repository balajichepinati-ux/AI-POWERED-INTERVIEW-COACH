const { generateOTP } = require('./security');
const PrismaClient = require('@prisma/client').PrismaClient;
const prisma = new PrismaClient();

// TODO: Install speakeasy for TOTP
// npm install speakeasy qrcode crypto

// Enable TOTP MFA
async function enableTOTPMFA(userId) {
  try {
    // TODO: Use speakeasy library
    // const secret = speakeasy.generateSecret({
    //   name: `MockMate (${email})`,
    //   issuer: 'MockMate'
    // });

    const secret = require('crypto').randomBytes(32).toString('hex');

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      require('crypto').randomBytes(4).toString('hex').toUpperCase()
    );

    // Save to database
    const mfaConfig = await prisma.mFAConfig.upsert({
      where: { userId },
      update: {
        isEnabled: false, // Not enabled until verified
        method: 'totp',
        secret,
        backupCodes
      },
      create: {
        userId,
        isEnabled: false,
        method: 'totp',
        secret,
        backupCodes
      }
    });

    // TODO: Generate QR code
    // const qrCode = speakeasy.totp.keyuri({
    //   secret: secret.base32,
    //   label: email,
    //   issuer: 'MockMate'
    // });

    return {
      secret,
      backupCodes,
      // qrCode
    };
  } catch (error) {
    console.error('[Enable TOTP MFA Error]', error);
    throw error;
  }
}

// Enable SMS MFA
async function enableSMSMFA(userId, phoneNumber) {
  try {
    // TODO: Integrate with Twilio or similar
    const mfaConfig = await prisma.mFAConfig.upsert({
      where: { userId },
      update: {
        isEnabled: false,
        method: 'sms',
        phone: phoneNumber
      },
      create: {
        userId,
        isEnabled: false,
        method: 'sms',
        phone: phoneNumber
      }
    });

    // Send verification code
    const otp = generateOTP();
    // TODO: Store OTP temporarily and send via SMS

    return { sent: true };
  } catch (error) {
    console.error('[Enable SMS MFA Error]', error);
    throw error;
  }
}

// Verify MFA code
async function verifyMFACode(userId, code) {
  try {
    const mfaConfig = await prisma.mFAConfig.findUnique({
      where: { userId },
      select: { method: true, secret: true, backupCodes: true }
    });

    if (!mfaConfig) {
      return { valid: false, error: 'MFA not configured' };
    }

    if (mfaConfig.method === 'totp') {
      // TODO: Use speakeasy to verify
      // const isValid = speakeasy.totp.verify({
      //   secret: mfaConfig.secret,
      //   encoding: 'hex',
      //   token: code,
      //   window: 1
      // });

      // For now, simple validation
      const isValid = code.length === 6 && /^\d+$/.test(code);

      if (!isValid) {
        // Check if it's a backup code
        const backupCodes = Array.isArray(mfaConfig.backupCodes) ? mfaConfig.backupCodes : [];
        const backupIndex = backupCodes.indexOf(code);

        if (backupIndex === -1) {
          return { valid: false, error: 'Invalid MFA code' };
        }

        // Remove used backup code
        backupCodes.splice(backupIndex, 1);
        await prisma.mFAConfig.update({
          where: { userId },
          data: { backupCodes }
        });

        return { valid: true, isBackupCode: true };
      }

      return { valid: true };
    }

    if (mfaConfig.method === 'sms') {
      // Verify SMS code from cache
      // TODO: Check against stored OTP
      return { valid: true };
    }

    return { valid: false, error: 'Unknown MFA method' };
  } catch (error) {
    console.error('[Verify MFA Code Error]', error);
    return { valid: false, error: 'MFA verification failed' };
  }
}

// Finalize MFA setup
async function finalizeMFASetup(userId, code) {
  try {
    const verification = await verifyMFACode(userId, code);

    if (!verification.valid) {
      return { success: false, error: verification.error };
    }

    await prisma.mFAConfig.update({
      where: { userId },
      data: { isEnabled: true }
    });

    return { success: true };
  } catch (error) {
    console.error('[Finalize MFA Setup Error]', error);
    throw error;
  }
}

// Disable MFA
async function disableMFA(userId) {
  try {
    await prisma.mFAConfig.update({
      where: { userId },
      data: { isEnabled: false }
    });

    return { success: true };
  } catch (error) {
    console.error('[Disable MFA Error]', error);
    throw error;
  }
}

// Get MFA status
async function getMFAStatus(userId) {
  try {
    const mfaConfig = await prisma.mFAConfig.findUnique({
      where: { userId },
      select: {
        isEnabled: true,
        method: true,
        phone: true
      }
    });

    return mfaConfig || { isEnabled: false };
  } catch (error) {
    console.error('[Get MFA Status Error]', error);
    return { isEnabled: false };
  }
}

module.exports = {
  enableTOTPMFA,
  enableSMSMFA,
  verifyMFACode,
  finalizeMFASetup,
  disableMFA,
  getMFAStatus
};
