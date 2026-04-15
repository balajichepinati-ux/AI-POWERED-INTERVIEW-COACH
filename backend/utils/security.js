const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Generate secure random token
function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

// Hash token for storage (never store raw tokens)
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Verify token hash
function verifyTokenHash(token, hash) {
  return hashToken(token) === hash;
}

// Generate JWT token with secure options
function generateJWTToken(payload, expiresIn = '1h') {
  return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', { expiresIn });
}

// Generate refresh token (longer expiry)
function generateRefreshToken(payload) {
  return jwt.sign(payload, process.env.REFRESH_SECRET || 'refresh-secret-key', { expiresIn: '7d' });
}

// Verify JWT token
function verifyJWTToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  } catch (error) {
    return null;
  }
}

// Verify refresh token
function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, process.env.REFRESH_SECRET || 'refresh-secret-key');
  } catch (error) {
    return null;
  }
}

// Generate OTP for MFA
function generateOTP(length = 6) {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
}

// Hash password using crypto (prefer bcrypt in production)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Validate password strength
function validatePasswordStrength(password) {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain a number');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain a special character (!@#$%^&*)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Extract client info from request
function getClientInfo(req) {
  return {
    ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
    userAgent: req.get('user-agent') || 'unknown'
  };
}

// Generic error response (never reveal specifics)
function getGenericAuthError() {
  return 'Invalid credentials. Please check your email and password.';
}

module.exports = {
  generateSecureToken,
  hashToken,
  verifyTokenHash,
  generateJWTToken,
  generateRefreshToken,
  verifyJWTToken,
  verifyRefreshToken,
  generateOTP,
  hashPassword,
  validatePasswordStrength,
  getClientInfo,
  getGenericAuthError
};
