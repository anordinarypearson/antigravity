# Security Framework Documentation

## 🔒 Overview

This document outlines the comprehensive security framework implemented in this application. The framework includes multiple layers of protection to ensure data security, privacy, and compliance with best practices.

## Table of Contents

1. [Firebase Security Rules](#firebase-security-rules)
2. [Next.js Middleware Security](#nextjs-middleware-security)
3. [Security Headers](#security-headers)
4. [Input Validation & Sanitization](#input-validation--sanitization)
5. [Rate Limiting](#rate-limiting)
6. [Content Security Policy (CSP)](#content-security-policy)
7. [Security Best Practices](#security-best-practices)
8. [Deployment Checklist](#deployment-checklist)

---

## Firebase Security Rules

### Firestore Security Rules

Located in `firestore.rules`, these rules implement:

- **Field-level validation**: All data inputs are validated for type, format, and size
- **Rate limiting**: Prevents abuse by limiting action frequency
- **Size limits**: Maximum 1MB per document to prevent data spam
- **Access control**: Users can only access their own data or shared resources
- **Immutable fields**: Critical fields like `createdAt` and `email` cannot be changed
- **Data validation**: Email format, string lengths, and numeric ranges are validated

**Key Features:**
- 🔐 Authentication required for all operations
- 📏 String length limits (displayName: 100 chars, bio: 500 chars, messages: 10k chars)
- ⏱️ Rate limiting on profile updates (30s), follows (6s), messages (1s)
- 🚫 Deny-by-default for unknown collections
- ✅ Validation for follower/following counts (must be >= 0)

### Storage Security Rules

Located in `storage.rules`, these rules protect file uploads:

- **File type validation**: Only allowed file types (images, videos, documents)
- **Size limits**: Images (10MB), Videos (50MB), Documents (20MB)
- **Access control**: Users can only access their own files or shared resources
- **Content type verification**: Prevents malicious file uploads

**Deployment:**
```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage:rules

# Deploy both
firebase deploy --only firestore:rules,storage:rules
```

---

## Next.js Middleware Security

Located in `src/middleware.ts`, this provides:

### Authentication Checks
- Redirects unauthenticated users from protected routes
- Redirects authenticated users away from login/signup pages
- Supports multiple session token sources (cookies, headers)

### Rate Limiting
- **Default routes**: 60 requests per minute
- **API routes**: 30 requests per minute
- In-memory storage with automatic cleanup
- Returns 429 status with retry-after header

### Protected Routes
```typescript
PROTECTED_ROUTES: ['/chat', '/inbox', '/settings', '/profile']
PUBLIC_ROUTES: ['/login', '/signup', '/', '/api/webhooks']
API_ROUTES: ['/api/chat-stream', '/api/web-search', '/api/image-search']
```

---

## Security Headers

### Enhanced Headers (next.config.ts)

```typescript
- X-Content-Type-Options: nosniff
- X-Frame-Options: SAMEORIGIN
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
- Expect-CT: max-age=86400, enforce
- Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
```

### CORS Configuration
- Credentials enabled for API routes
- Origin restricted to `NEXT_PUBLIC_APP_URL` or `*` fallback
- Preflight cache: 24 hours
- CSRF token support via `X-CSRF-Token` header

---

## Content Security Policy

Comprehensive CSP implemented to prevent XSS attacks:

```
default-src 'self'
script-src 'self' 'unsafe-eval' 'unsafe-inline' [trusted domains]
style-src 'self' 'unsafe-inline' [Google Fonts]
img-src 'self' data: https: blob:
connect-src 'self' [Firebase, Razorpay, API endpoints]
frame-src 'self' [Google, Razorpay]
object-src 'none'
upgrade-insecure-requests
```

**Trusted Domains:**
- Google APIs (authentication, fonts)
- Firebase services
- Razorpay payment gateway
- Creative Commons image sources (Unsplash, Pexels)

---

## Input Validation & Sanitization

Located in `src/lib/security.ts`:

### Validation Functions

**Email Validation:**
```typescript
isValidEmail(email: string): boolean
// Max 254 characters, standard email regex
```

**Password Strength:**
```typescript
isStrongPassword(password: string): { isValid: boolean; errors: string[] }
// Requirements:
// - 8-128 characters
// - Uppercase & lowercase letters
// - Numbers & special characters
// - Not common passwords
```

**URL Validation:**
```typescript
isValidUrl(url: string): boolean
// Only allows http: and https: protocols
```

### Sanitization Functions

**HTML Sanitization:**
```typescript
sanitizeHtml(input: string): string
// Escapes: & < > " ' /
```

**Input Sanitization:**
```typescript
sanitizeInput(input: string): string
// Removes control characters except newlines/tabs
```

**Filename Sanitization:**
```typescript
sanitizeFilename(filename: string): string
// Removes path traversal attempts
// Limits to 255 characters
```

**SQL Injection Prevention:**
```typescript
sanitizeSql(input: string): string
// Removes SQL keywords and special characters
```

### Malicious Pattern Detection

```typescript
containsMaliciousPatterns(input: string): boolean
// Detects:
// - Script tags
// - JavaScript/VBScript protocols
// - Event handlers
// - eval() calls
// - Data URLs with HTML
```

---

## Rate Limiting

### Client-Side Rate Limiting

```typescript
checkRateLimit(identifier: string, maxRequests: number, windowMs: number)
// Returns: { allowed, remainingRequests, resetTime }
// Automatic cleanup of old entries
```

### Server-Side Middleware

Implemented in middleware with:
- Per-IP rate limiting
- Different limits for API vs page routes
- Automatic cache cleanup
- 429 responses with rate limit headers

---

## Cryptography

### Token Generation

```typescript
generateSecureToken(length: number = 32): Promise<string>
// Uses crypto.getRandomValues for secure randomness
```

### Data Encryption

```typescript
encryptData(data: string, key: string): Promise<string>
decryptData(encryptedData: string, key: string): Promise<string>
// Uses AES-GCM encryption
// IV + encrypted data format
```

### Password Hashing

```typescript
hashPassword(password: string): Promise<string>
// Client-side SHA-256 hashing
// Server should use bcrypt/argon2
```

---

## Security Best Practices

### For Developers

1. **Always validate input** on both client and server
2. **Use parameterized queries** for database operations
3. **Never trust client data** - validate everything server-side
4. **Keep dependencies updated** - run `npm audit` regularly
5. **Use environment variables** for sensitive data
6. **Enable HTTPS** in production (HSTS header enforces this)
7. **Implement proper error handling** - don't leak sensitive info

### For Users

1. **Enable 2FA** for additional security
2. **Use strong, unique passwords** (12+ characters)
3. **Enable login notifications** to detect unauthorized access
4. **Review security logs** regularly
5. **Keep recovery information** up to date

---

## Deployment Checklist

### Before Deploying to Production

- [ ] Set `NODE_ENV=production`
- [ ] Configure `NEXT_PUBLIC_APP_URL` environment variable
- [ ] Deploy Firebase security rules
- [ ] Enable HTTPS/SSL certificate
- [ ] Configure CORS origins properly (remove `*`)
- [ ] Set up proper logging and monitoring
- [ ] Enable rate limiting in production (consider Redis)
- [ ] Review and test all security headers
- [ ] Run security audit: `npm audit`
- [ ] Test CSP in production environment
- [ ] Set up security monitoring/alerts
- [ ] Configure backup strategy
- [ ] Document incident response procedures

### Environment Variables

Required for production:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Application
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Razorpay (if using payments)
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Security (server-side only)
SESSION_SECRET=
CSRF_SECRET=
ENCRYPTION_KEY=
```

### Testing Security

```bash
# Run security audit
npm audit

# Fix vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated

# Test Firebase rules
firebase emulators:start --only firestore,storage

# Run type checking
npm run typecheck

# Build for production
npm run build
```

---

## Monitoring & Logging

### Security Events to Log

1. **Authentication events**
   - Login attempts (success/failure)
   - Password changes
   - 2FA enable/disable
   - Session creation/destruction

2. **Authorization failures**
   - Unauthorized access attempts
   - Permission denials

3. **Rate limit violations**
   - IP addresses hitting limits
   - Endpoints being abused

4. **Suspicious activity**
   - Multiple failed login attempts
   - Unusual access patterns
   - SQL injection attempts

### Log Storage

Consider implementing:
- Firestore collection: `securityLogs`
- Server-side only writes
- User-specific read access
- Automatic 90-day retention

---

## Additional Security Measures

### Recommended Additions

1. **IP Blocking**: Implement IP-based blocking for malicious actors
2. **CAPTCHA**: Add CAPTCHA for login/signup forms
3. **Email Verification**: Require email verification for account creation
4. **Session Management**: Implement proper session timeout and renewal
5. **Security Audits**: Regular third-party security audits
6. **Penetration Testing**: Annual penetration testing
7. **Bug Bounty Program**: Consider implementing a bug bounty program

### Advanced Features

1. **Anomaly Detection**: ML-based anomaly detection for unusual patterns
2. **Geographic Restrictions**: Restrict access by geographic location if needed
3. **Device Fingerprinting**: Track and verify known devices
4. **Behavioral Analysis**: Monitor user behavior for suspicious activity

---

## Security Incident Response

### In Case of Security Breach

1. **Immediate Actions**
   - Identify and isolate affected systems
   - Revoke compromised credentials
   - Enable additional logging
   - Notify affected users

2. **Investigation**
   - Analyze security logs
   - Identify attack vector
   - Assess data exposure
   - Document findings

3. **Remediation**
   - Patch vulnerabilities
   - Update security rules
   - Force password resets if needed
   - Deploy fixes

4. **Post-Incident**
   - Conduct post-mortem
   - Update security procedures
   - Implement preventive measures
   - Document lessons learned

---

## Contact & Support

For security-related concerns:
- **Security Issues**: Report via [security contact method]
- **Questions**: Refer to this documentation
- **Updates**: Check for security updates regularly

## Version History

- **v1.0.0** (2026-01-16): Initial comprehensive security framework implementation
  - Firestore security rules with field validation
  - Storage security rules
  - Next.js middleware with rate limiting
  - Security utility functions
  - Enhanced security headers
  - Content Security Policy
  - Security dashboard for users
