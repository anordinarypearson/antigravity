/**
 * Security Logging Service
 * Logs all security-related events to Firestore
 */

import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';

export type SecurityEventType =
    | 'LOGIN'
    | 'LOGOUT'
    | 'LOGIN_FAILED'
    | 'PASSWORD_CHANGE'
    | 'PASSWORD_RESET'
    | 'EMAIL_CHANGE'
    | '2FA_ENABLED'
    | '2FA_DISABLED'
    | 'PROFILE_UPDATE'
    | 'UNAUTHORIZED_ACCESS'
    | 'RATE_LIMIT_EXCEEDED'
    | 'SUSPICIOUS_ACTIVITY'
    | 'SESSION_CREATED'
    | 'SESSION_EXPIRED';

export type SecurityEventSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface SecurityEvent {
    userId: string;
    type: SecurityEventType;
    severity: SecurityEventSeverity;
    message: string;
    metadata?: {
        ip?: string;
        userAgent?: string;
        location?: string;
        deviceInfo?: string;
        attemptCount?: number;
        [key: string]: any;
    };
    timestamp: any; // Firestore serverTimestamp
}

/**
 * Log a security event
 */
export async function logSecurityEvent(
    userId: string,
    type: SecurityEventType,
    message: string,
    severity: SecurityEventSeverity = 'info',
    metadata?: SecurityEvent['metadata']
): Promise<void> {
    try {
        const event: SecurityEvent = {
            userId,
            type,
            severity,
            message,
            metadata: metadata || {},
            timestamp: serverTimestamp(),
        };

        await addDoc(collection(db, 'securityLogs'), event);

        // In production, also send to external logging service
        if (process.env.NODE_ENV === 'production') {
            // TODO: Send to external logging (Sentry, LogRocket, etc.)
            console.info('[SECURITY]', { type, userId, severity, message });
        }
    } catch (error) {
        // Don't fail the operation if logging fails
        console.error('Failed to log security event:', error);
    }
}

/**
 * Get security logs for a user
 */
export async function getUserSecurityLogs(
    userId: string,
    limitCount: number = 50
): Promise<SecurityEvent[]> {
    try {
        const q = query(
            collection(db, 'securityLogs'),
            where('userId', '==', userId),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as any;
    } catch (error) {
        console.error('Failed to fetch security logs:', error);
        return [];
    }
}

/**
 * Check for suspicious activity patterns
 */
export async function detectSuspiciousActivity(
    userId: string,
    type: SecurityEventType
): Promise<{ suspicious: boolean; reason?: string }> {
    try {
        const recentLogs = await getUserSecurityLogs(userId, 20);

        // Check for multiple failed login attempts
        if (type === 'LOGIN_FAILED') {
            const failedLogins = recentLogs.filter(
                log => log.type === 'LOGIN_FAILED' &&
                    log.timestamp > Date.now() - 15 * 60 * 1000 // Last 15 minutes
            );

            if (failedLogins.length >= 5) {
                return {
                    suspicious: true,
                    reason: 'Multiple failed login attempts detected',
                };
            }
        }

        // Check for rapid location changes
        const locationChanges = recentLogs.filter(
            log => log.metadata?.location &&
                log.timestamp > Date.now() - 60 * 60 * 1000 // Last hour
        );

        if (locationChanges.length >= 3) {
            const uniqueLocations = new Set(locationChanges.map(log => log.metadata?.location));
            if (uniqueLocations.size >= 3) {
                return {
                    suspicious: true,
                    reason: 'Multiple geographic locations detected',
                };
            }
        }

        return { suspicious: false };
    } catch (error) {
        console.error('Failed to detect suspicious activity:', error);
        return { suspicious: false };
    }
}

/**
 * Helper: Get client IP address
 */
export function getClientIP(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');

    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    if (realIP) {
        return realIP;
    }

    return 'unknown';
}

/**
 * Helper: Get user agent
 */
export function getUserAgent(request: Request): string {
    return request.headers.get('user-agent') || 'unknown';
}

/**
 * Helper: Parse device info from user agent
 */
export function parseDeviceInfo(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
    return 'Unknown';
}

/**
 * Log successful login
 */
export async function logLogin(userId: string, request?: Request): Promise<void> {
    const metadata: SecurityEvent['metadata'] = {};

    if (request) {
        metadata.ip = getClientIP(request);
        metadata.userAgent = getUserAgent(request);
        metadata.deviceInfo = parseDeviceInfo(metadata.userAgent);
    }

    await logSecurityEvent(
        userId,
        'LOGIN',
        `Successful login from ${metadata.deviceInfo || 'unknown'} device`,
        'info',
        metadata
    );
}

/**
 * Log failed login
 */
export async function logFailedLogin(userId: string, request?: Request): Promise<void> {
    const metadata: SecurityEvent['metadata'] = {};

    if (request) {
        metadata.ip = getClientIP(request);
        metadata.userAgent = getUserAgent(request);
        metadata.deviceInfo = parseDeviceInfo(metadata.userAgent);
    }

    await logSecurityEvent(
        userId,
        'LOGIN_FAILED',
        'Failed login attempt',
        'warning',
        metadata
    );

    // Check for suspicious activity
    const suspicious = await detectSuspiciousActivity(userId, 'LOGIN_FAILED');
    if (suspicious.suspicious) {
        await logSecurityEvent(
            userId,
            'SUSPICIOUS_ACTIVITY',
            suspicious.reason || 'Suspicious activity detected',
            'critical',
            metadata
        );

        // TODO: Send alert email to user
        // TODO: Temporarily lock account if needed
    }
}

/**
 * Log password change
 */
export async function logPasswordChange(userId: string): Promise<void> {
    await logSecurityEvent(
        userId,
        'PASSWORD_CHANGE',
        'Password changed successfully',
        'info'
    );
}

/**
 * Log 2FA status change
 */
export async function log2FAChange(userId: string, enabled: boolean): Promise<void> {
    await logSecurityEvent(
        userId,
        enabled ? '2FA_ENABLED' : '2FA_DISABLED',
        enabled ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled',
        enabled ? 'info' : 'warning'
    );
}

/**
 * Log unauthorized access attempt
 */
export async function logUnauthorizedAccess(
    userId: string,
    resource: string,
    request?: Request
): Promise<void> {
    const metadata: SecurityEvent['metadata'] = { resource };

    if (request) {
        metadata.ip = getClientIP(request);
        metadata.userAgent = getUserAgent(request);
    }

    await logSecurityEvent(
        userId,
        'UNAUTHORIZED_ACCESS',
        `Unauthorized access attempt to ${resource}`,
        'error',
        metadata
    );
}

/**
 * Log rate limit exceeded
 */
export async function logRateLimitExceeded(
    userId: string,
    endpoint: string,
    request?: Request
): Promise<void> {
    const metadata: SecurityEvent['metadata'] = { endpoint };

    if (request) {
        metadata.ip = getClientIP(request);
    }

    await logSecurityEvent(
        userId,
        'RATE_LIMIT_EXCEEDED',
        `Rate limit exceeded for ${endpoint}`,
        'warning',
        metadata
    );
}
