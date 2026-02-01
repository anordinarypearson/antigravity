/**
 * Security Utilities
 * Comprehensive security functions for input validation, sanitization, and protection
 */

/**
 * Input Validation
 */

// Validate email format
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length <= 254;
}

// Validate username (alphanumeric, underscore, hyphen only)
export function isValidUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    return usernameRegex.test(username);
}

// Validate password strength
export function isStrongPassword(password: string): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    if (password.length > 128) {
        errors.push('Password must be less than 128 characters');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }

    // Check for common weak passwords
    const commonPasswords = [
        'password', '12345678', 'qwerty', 'abc123', 'password123',
        'admin', 'letmein', 'welcome', 'monkey', '1234567890'
    ];
    if (commonPasswords.some(weak => password.toLowerCase().includes(weak))) {
        errors.push('Password is too common');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

// Validate URL
export function isValidUrl(url: string): boolean {
    try {
        const urlObj = new URL(url);
        return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
        return false;
    }
}

// Validate phone number (international format)
export function isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/[\s()-]/g, ''));
}

/**
 * Input Sanitization
 */

// Sanitize HTML to prevent XSS attacks
export function sanitizeHtml(input: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
    };
    return input.replace(/[&<>"'/]/g, (char) => map[char] || char);
}

// Sanitize user input (remove control characters)
export function sanitizeInput(input: string): string {
    // Remove control characters except newlines and tabs
    return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

// Sanitize filename
export function sanitizeFilename(filename: string): string {
    // Remove path traversal attempts and special characters
    return filename
        .replace(/[\/\\]/g, '') // Remove slashes
        .replace(/\.\./g, '') // Remove parent directory references
        .replace(/[<>:"|?*\x00-\x1F]/g, '') // Remove special chars
        .trim()
        .substring(0, 255); // Limit length
}

// Remove SQL injection attempts (basic)
export function sanitizeSql(input: string): string {
    return input
        .replace(/['";\\]/g, '') // Remove SQL special characters
        .replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi, '');
}

/**
 * Content Security
 */

// Check for malicious patterns
export function containsMaliciousPatterns(input: string): boolean {
    const maliciousPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
        /javascript:/gi, // JavaScript protocol
        /on\w+\s*=/gi, // Event handlers
        /eval\(/gi, // eval function
        /expression\(/gi, // CSS expressions
        /vbscript:/gi, // VBScript protocol
        /data:text\/html/gi, // Data URLs with HTML
    ];

    return maliciousPatterns.some(pattern => pattern.test(input));
}

// Validate file type
export function isAllowedFileType(
    filename: string,
    allowedTypes: string[]
): boolean {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ext ? allowedTypes.includes(ext) : false;
}

// Validate file size
export function isAllowedFileSize(
    sizeInBytes: number,
    maxSizeInMB: number
): boolean {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return sizeInBytes <= maxSizeInBytes;
}

/**
 * Cryptographic Functions
 */

// Generate secure random string
export async function generateSecureToken(length: number = 32): Promise<string> {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // Fallback (less secure, for Node.js)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Hash password (client-side hashing before sending)
export async function hashPassword(password: string): Promise<string> {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    // Fallback - just return password (server should hash it)
    return password;
}

/**
 * Rate Limiting Helpers
 */

interface RateLimitRecord {
    count: number;
    firstRequest: number;
    lastRequest: number;
}

const rateLimitCache = new Map<string, RateLimitRecord>();

export function checkRateLimit(
    identifier: string,
    maxRequests: number,
    windowMs: number = 60000 // 1 minute default
): { allowed: boolean; remainingRequests: number; resetTime: number } {
    const now = Date.now();
    const record = rateLimitCache.get(identifier);

    // Clean old record
    if (record && now - record.firstRequest > windowMs) {
        rateLimitCache.delete(identifier);
    }

    const currentRecord = rateLimitCache.get(identifier);

    if (!currentRecord) {
        // First request in window
        rateLimitCache.set(identifier, {
            count: 1,
            firstRequest: now,
            lastRequest: now,
        });
        return {
            allowed: true,
            remainingRequests: maxRequests - 1,
            resetTime: now + windowMs,
        };
    }

    if (currentRecord.count >= maxRequests) {
        return {
            allowed: false,
            remainingRequests: 0,
            resetTime: currentRecord.firstRequest + windowMs,
        };
    }

    // Increment count
    currentRecord.count++;
    currentRecord.lastRequest = now;

    return {
        allowed: true,
        remainingRequests: maxRequests - currentRecord.count,
        resetTime: currentRecord.firstRequest + windowMs,
    };
}

// Clean up rate limit cache periodically
export function cleanupRateLimitCache(): void {
    const now = Date.now();
    const threshold = 5 * 60 * 1000; // 5 minutes

    for (const [key, record] of rateLimitCache.entries()) {
        if (now - record.lastRequest > threshold) {
            rateLimitCache.delete(key);
        }
    }
}

/**
 * CSRF Protection
 */

export function generateCsrfToken(): string {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
}

export function validateCsrfToken(token: string, storedToken: string): boolean {
    return token === storedToken && token.length > 0;
}

/**
 * API Security Headers
 */

export function getSecurityHeaders(): Record<string, string> {
    return {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(self), microphone=(self), geolocation=()',
    };
}

/**
 * Secure Error Messages (don't leak sensitive info)
 */

export function sanitizeErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        // In production, don't expose internal error details
        if (process.env.NODE_ENV === 'production') {
            return 'An error occurred. Please try again later.';
        }
        return error.message;
    }
    return 'An unknown error occurred.';
}

/**
 * IP Address Validation
 */

export function isValidIPv4(ip: string): boolean {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipv4Regex.test(ip)) return false;

    const parts = ip.split('.');
    return parts.every(part => {
        const num = parseInt(part, 10);
        return num >= 0 && num <= 255;
    });
}

export function isValidIPv6(ip: string): boolean {
    const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::1|::)$/;
    return ipv6Regex.test(ip);
}

/**
 * Data Encryption Helpers (for sensitive data)
 */

export async function encryptData(data: string, key: string): Promise<string> {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const keyBuffer = await crypto.subtle.importKey(
            'raw',
            encoder.encode(key.padEnd(32, '0').substring(0, 32)),
            'AES-GCM',
            false,
            ['encrypt']
        );

        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            keyBuffer,
            dataBuffer
        );

        // Combine IV and encrypted data
        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encrypted), iv.length);

        return btoa(String.fromCharCode(...combined));
    }

    // Fallback: no encryption (not recommended for production)
    console.warn('Encryption not supported in this environment');
    return btoa(data);
}

export async function decryptData(encryptedData: string, key: string): Promise<string> {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        const encoder = new TextEncoder();
        const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

        const iv = combined.slice(0, 12);
        const encrypted = combined.slice(12);

        const keyBuffer = await crypto.subtle.importKey(
            'raw',
            encoder.encode(key.padEnd(32, '0').substring(0, 32)),
            'AES-GCM',
            false,
            ['decrypt']
        );

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            keyBuffer,
            encrypted
        );

        return new TextDecoder().decode(decrypted);
    }

    // Fallback
    return atob(encryptedData);
}
