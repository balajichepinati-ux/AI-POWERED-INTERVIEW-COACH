# MockMate Authentication & Security Implementation

## Overview
This document outlines the comprehensive security features implemented in MockMate's authentication system.

---

## 1. LOGIN PROTECTION

### Rate Limiting
- **Failed Attempts**: Max 5 failed attempts per email in 15-minute window
- **Account Lockout**: Automatic 15-minute lockout after 5 failed attempts
- **IP-Based Limiting**: Additional rate limiting by IP address
- **Generic Responses**: Never reveal if email/password is wrong

**Implementation**: `backend/utils/rateLimiter.js`

```javascript
// Example: Rate limit will block after 5 failed attempts
const rateLimit = checkIPRateLimit(email, 5, 15 * 60 * 1000);
```

---

## 2. SIGNUP & EMAIL VERIFICATION

### Requirements
- ✅ Email format validation
- ✅ Prevent duplicate accounts (check before creating)
- ✅ Generic error responses (don't reveal if email exists)
- ✅ Password strength requirements:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character (!@#$%^&*)

### Email Verification Flow
1. User creates account with email
2. Verification token sent to email (24-hour expiry)
3. User clicks link to verify email
4. Account unlocked for login

**Implementation**: `backend/utils/emailService.js`

```javascript
// Create verification token (single-use, 24h expiry)
const token = await createEmailVerificationToken(userId, email);
await sendVerificationEmail(email, token);

// Verify token
const result = await verifyEmailToken(userId, token);
```

---

## 3. SESSION SECURITY

### Secure Token Management
- **HttpOnly Cookies**: Ready for frontend implementation
- **Token Hashing**: Tokens never stored in plain text
- **Session Tracking**: All active sessions recorded
- **Token Rotation**: New tokens generated on refresh
- **Session Expiry**: 1-hour access token, 7-day refresh token

### Implementation
```javascript
// Create session with hashed tokens
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
```

### Session Revocation
- Logout revokes all user sessions
- Password reset invalidates all sessions (force re-login)
- Suspicious activity triggers session review

---

## 4. ERROR MESSAGES

### Generic Responses Policy
- ❌ DON'T: "Email not found"
- ❌ DON'T: "Password is incorrect"
- ✅ DO: "Invalid credentials"

All authentication failures return: **"Invalid credentials. Please check your email and password."**

```javascript
// Security utility function
const genericError = getGenericAuthError();
// Returns: "Invalid credentials. Please check your email and password."
```

---

## 5. PASSWORD RESET FLOW

### Security Features
- ✅ Single-use tokens (used token invalidated immediately)
- ✅ 1-hour token expiry
- ✅ Generic responses ("If email exists, link sent...")
- ✅ Multiple tokens invalidated when new reset requested
- ✅ All sessions revoked after password reset
- ✅ Token hash stored (not plain tokens)

### Flow
1. User requests password reset with email
2. System checks if email exists (doesn't reveal result)
3. Secure token generated and emailed
4. User clicks link and enters new password
5. Password updated in Supabase
6. All sessions revoked (forces re-login)

**Implementation**: `backend/utils/emailService.js`

---

## 6. MULTI-FACTOR AUTHENTICATION (MFA)

### Supported Methods
- **TOTP** (Time-based One-Time Password): Google Authenticator, Authy
- **SMS**: Phone-based verification (requires Twilio integration)
- **Email**: OTP sent to registered email
- **Backup Codes**: 10 recovery codes for account recovery

### Implementation Files
- `backend/utils/mfaService.js` - MFA logic
- `backend/routes/auth.js` - MFA endpoints

### API Endpoints

#### Enable TOTP MFA
```bash
POST /api/auth/setup-mfa-totp
Body: {}
Response: { secret, qrCode, backupCodes }
```

#### Verify MFA Code
```bash
POST /api/auth/verify-mfa
Body: { userId, code, tempToken }
Response: { accessToken, refreshToken, user }
```

---

## 7. BACKEND SECURITY

### Input Validation
- Email format validation using regex
- Password strength validation
- SQL injection prevention (Prisma ORM)
- Request size limits (10MB max)

### Password Security
- Passwords hashed by Supabase (bcrypt)
- Passwords never logged
- Passwords transmitted over HTTPS only

### Security Middleware
```javascript
// Applied in server.js
app.use(helmet()); // Set security HTTP headers
app.use(securityHeadersMiddleware); // Custom security headers
app.use(requestLoggingMiddleware); // Monitor requests
app.use(rateLimitMiddleware); // Rate limiting
```

### Headers Set
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`
- `Content-Security-Policy: default-src 'self'`

---

## 8. LOGGING & MONITORING

### Audit Trail
All security events logged to `AuditLog` table:
- Login attempts (success/failure)
- Password resets
- Email verifications
- MFA setup changes
- Failed authentication
- Unusual activity detection

**Fields Tracked**:
- `userId` - User ID
- `action` - What happened
- `resource` - Affected resource
- `ipAddress` - Client IP
- `userAgent` - Browser/client info
- `status` - Success/Failure/Suspicious
- `details` - Additional context
- `createdAt` - Timestamp

### Suspicious Activity Detection
```javascript
// Detects:
// 1. Multiple failed attempts in 1 hour
// 2. Logins from unusual locations (>2 unique IPs in 24h)
// 3. Unusual time patterns
const suspicious = await detectSuspiciousActivity(userId);
```

### Alerts
- Email sent when suspicious activity detected
- Account lockout triggered after threshold
- Failed attempt counters tracked

---

## 9. AUTHORIZATION (ACCESS CONTROL)

### Role-Based Access Control (RBAC)
```javascript
// Middleware to protect routes
app.use('/api/protected', requireRole(['admin', 'user']));
```

### Verification Layers
1. **Token Verification**: Is token valid?
2. **Email Verification**: Is email confirmed?
3. **MFA Verification**: Is MFA passed?
4. **Role Check**: Does user have permission?
5. **Session Validity**: Is session not revoked?

All checks happen on backend - never trust frontend-only checks.

---

## DATABASE SCHEMA UPDATES

### New Security Tables

#### LoginAttempt
```javascript
model LoginAttempt {
  id        String   @id @default(uuid())
  userId    String
  email     String
  success   Boolean
  ipAddress String
  userAgent String
  reason    String?
  createdAt DateTime @default(now())
}
```

#### UserSession
```javascript
model UserSession {
  id              String   @id @default(uuid())
  userId          String
  tokenHash       String   // Never store raw tokens
  refreshTokenHash String?
  expiresAt       DateTime
  ipAddress       String
  userAgent       String
  isRevoked       Boolean  @default(false)
  createdAt       DateTime @default(now())
}
```

#### MFAConfig
```javascript
model MFAConfig {
  id          String   @id @default(uuid())
  userId      String   @unique
  isEnabled   Boolean  @default(false)
  method      String   // "totp", "sms", "email"
  secret      String?  // For TOTP
  phone       String?  // For SMS
  backupCodes Json?
}
```

#### EmailVerification & PasswordReset
```javascript
model EmailVerification {
  id        String   @id @default(uuid())
  userId    String
  email     String
  token     String   @unique
  expiresAt DateTime
  isUsed    Boolean  @default(false)
}

model PasswordReset {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  isUsed    Boolean  @default(false)
}
```

#### AuditLog
```javascript
model AuditLog {
  id        String   @id @default(uuid())
  userId    String
  action    String   // login, logout, password_reset, etc.
  resource  String   // auth, user, session
  details   Json?
  ipAddress String
  userAgent String
  status    String   // success, failure, suspicious
  createdAt DateTime @default(now())
}
```

---

## ENVIRONMENT VARIABLES

Create `.env` file in backend directory:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mockmate

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT Secrets (change in production!)
JWT_SECRET=your_jwt_secret_key
REFRESH_SECRET=your_refresh_secret_key

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Email Service (when implementing)
SENDGRID_API_KEY=your_sendgrid_key
# OR
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Twilio (for SMS MFA)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx

# App
NODE_ENV=development
PORT=3001
```

---

## API ENDPOINTS

### Authentication Endpoints

#### Sign Up
```bash
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}

Response 201:
{
  "success": true,
  "message": "Account created. Please verify your email.",
  "userId": "uuid"
}
```

#### Verify Email
```bash
POST /api/auth/verify-email
Body: { "userId": "uuid", "token": "token_from_email" }
Response: { "success": true, "message": "Email verified successfully" }
```

#### Login
```bash
POST /api/auth/login
Body: { "email": "user@example.com", "password": "SecurePassword123!" }

Response 200:
{
  "success": true,
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token",
  "sessionId": "session_uuid",
  "expiresIn": 3600,
  "user": { "id", "email", "name" }
}

Response (MFA Required):
{
  "success": true,
  "message": "MFA verification required",
  "mfaRequired": true,
  "tempToken": "temp_jwt",
  "sessionId": "session_uuid"
}
```

#### Verify MFA
```bash
POST /api/auth/verify-mfa
Body: { "userId": "uuid", "code": "123456", "tempToken": "temp_jwt" }
Response: { "success": true, "accessToken": "jwt", "refreshToken": "refresh", ... }
```

#### Refresh Token
```bash
POST /api/auth/refresh
Body: { "refreshToken": "refresh_token" }
Response: { "success": true, "accessToken": "new_jwt", "expiresIn": 3600 }
```

#### Logout
```bash
POST /api/auth/logout
Headers: { "Authorization": "Bearer jwt_token" }
Response: { "success": true, "message": "Logged out successfully" }
```

#### Forgot Password
```bash
POST /api/auth/forgot-password
Body: { "email": "user@example.com" }
Response: { "success": true, "message": "If email exists, reset link sent..." }
```

#### Reset Password
```bash
POST /api/auth/reset-password
Body: { "token": "reset_token", "password": "NewPassword123!" }
Response: { "success": true, "message": "Password reset successfully" }
```

#### Get Current User
```bash
GET /api/auth/me
Headers: { "Authorization": "Bearer jwt_token" }
Response: { "user": { "id", "email", "name", "isEmailVerified", ... } }
```

---

## INSTALLATION STEPS

### 1. Update Dependencies
```bash
npm install
```

The following packages were added:
- `jsonwebtoken` - JWT token signing
- `bcryptjs` - Password hashing
- `helmet` - Security headers
- `speakeasy` - TOTP MFA
- `express-rate-limit` - Rate limiting

### 2. Update Database
```bash
# Generate Prisma client
npm run prisma:generate

# Run migration
npm run prisma:migrate
```

### 3. Configure Environment
- Copy `.env.example` to `.env`
- Update all values with your credentials

### 4. Start Server
```bash
npm run dev
```

---

## TESTING SECURITY

### 1. Rate Limiting Test
```bash
# Try logging in 6 times with wrong password
for i in {1..6}; do
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
  sleep 1
done
# Should return 429 after 5 attempts
```

### 2. Session Security Test
```bash
# Login
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  | jq -r '.accessToken')

# Use token in header
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Try using after logout
curl -X POST http://localhost:3001/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"

# Should return 401
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Password Reset Test
- Request reset -> Check email logs
- Use invalid token -> Should fail
- Use same token twice -> Second should fail (single-use)

---

## PRODUCTION CHECKLIST

- [ ] Update `JWT_SECRET` and `REFRESH_SECRET` with strong random values
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS/SSL
- [ ] Configure email service (SendGrid/Nodemailer)
- [ ] Set up Twilio for SMS (if using SMS MFA)
- [ ] Configure database backups
- [ ] Enable audit log retention policy
- [ ] Set up monitoring for suspicious activities
- [ ] Review CORS origins (don't use * in production)
- [ ] Enable rate limiting appropriately for production load
- [ ] Set up logging service (e.g., DataDog, Sentry)
- [ ] Regular security audits
- [ ] Penetration testing

---

## NEXT STEPS / TODO

1. **Email Service Integration**
   - Integrate SendGrid or Nodemailer
   - Create email templates
   - Test email delivery

2. **SMS MFA**
   - Integrate Twilio
   - Create SMS templates
   - Test OTP delivery

3. **Frontend Implementation**
   - Login/Signup pages with validation
   - Token refresh logic
   - MFA setup/verification UI
   - Password reset flow UI
   - Session management

4. **Monitoring & Analytics**
   - Dashboard for security alerts
   - Analytics on failed attempts
   - Unusual activity patterns
   - Performance metrics

5. **Advanced Features**
   - Biometric authentication
   - WebAuthn/FIDO2 support
   - Device fingerprinting
   - Geolocation checks
   - IP allowlisting

---

## SECURITY REFERENCES

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Password Storage Recommendations](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [Rate Limiting](https://cheatsheetseries.owasp.org/cheatsheets/Rate_Limiting_Cheat_Sheet.html)

---

## Support

For security issues, please do not create public issues. Follow responsible disclosure practices.

Last Updated: April 2026
