/**
 * Security Monitoring API
 * Provides security metrics and monitoring data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserSecurityLogs } from '@/lib/security-logging';
import { getUserSessions } from '@/lib/session-management';
// import { is2FAEnabled, getBackupCodesCount } from '@/lib/two-factor-auth';
import { getSecurityHeaders } from '@/lib/security';

/**
 * GET /api/security/dashboard
 * Get comprehensive security dashboard data
 */
export async function GET(request: NextRequest) {
    try {
        // TODO: Get userId from authenticated session
        const userId = 'mock-user-id'; // Replace with actual auth

        // Get recent security logs
        const logs = await getUserSecurityLogs(userId, 20);

        // Get active sessions
        const sessions = await getUserSessions(userId);

        // Get 2FA status (temporarily disabled due to build issues)
        const twoFactorEnabled = false; // await is2FAEnabled(userId);
        const backupCodesCount = 0; // twoFactorEnabled ? await getBackupCodesCount(userId) : 0;

        // Calculate security score
        const securityScore = calculateSecurityScore({
            twoFactorEnabled,
            activeSessions: sessions.length,
            recentFailedLogins: logs.filter(log => log.type === 'LOGIN_FAILED').length,
            hasRecentActivity: logs.length > 0,
        });

        // Compile dashboard data
        const dashboard = {
            score: securityScore,
            lastUpdated: new Date().toISOString(),
            twoFactor: {
                enabled: twoFactorEnabled,
                backupCodesRemaining: backupCodesCount,
            },
            sessions: {
                active: sessions.length,
                devices: sessions.map(s => ({
                    id: s.sessionId,
                    device: s.deviceInfo,
                    lastActive: s.lastActivityAt,
                    ip: s.ip.substring(0, s.ip.lastIndexOf('.')) + '.xxx', // Mask last octet
                })),
            },
            recentActivity: logs.slice(0, 10).map(log => ({
                type: log.type,
                message: log.message,
                severity: log.severity,
                timestamp: log.timestamp,
            })),
            statistics: {
                totalLogins: logs.filter(log => log.type === 'LOGIN').length,
                failedLogins: logs.filter(log => log.type === 'LOGIN_FAILED').length,
                passwordChanges: logs.filter(log => log.type === 'PASSWORD_CHANGE').length,
                suspiciousActivity: logs.filter(log => log.type === 'SUSPICIOUS_ACTIVITY').length,
            },
            recommendations: getSecurityRecommendations({
                twoFactorEnabled,
                activeSessions: sessions.length,
                backupCodesCount,
                recentFailedLogins: logs.filter(log => log.type === 'LOGIN_FAILED').length,
            }),
        };

        return NextResponse.json(dashboard, {
            headers: getSecurityHeaders(),
        });
    } catch (error) {
        console.error('Security dashboard error:', error);
        return NextResponse.json(
            { error: 'Failed to load security dashboard' },
            { status: 500, headers: getSecurityHeaders() }
        );
    }
}

/**
 * Calculate security score (0-100)
 */
function calculateSecurityScore(factors: {
    twoFactorEnabled: boolean;
    activeSessions: number;
    recentFailedLogins: number;
    hasRecentActivity: boolean;
}): number {
    let score = 40; // Base score

    // 2FA adds 35 points
    if (factors.twoFactorEnabled) score += 35;

    // Having active sessions adds 10 points
    if (factors.activeSessions > 0) score += 10;

    // Recent activity adds 5 points
    if (factors.hasRecentActivity) score += 5;

    // No failed logins adds 10 points
    if (factors.recentFailedLogins === 0) score += 10;

    // Deduct points for many active sessions (potential security risk)
    if (factors.activeSessions > 3) score -= 5;

    // Deduct points for failed logins
    score -= Math.min(factors.recentFailedLogins * 2, 20);

    return Math.max(0, Math.min(100, score));
}

/**
 * Get personalized security recommendations
 */
function getSecurityRecommendations(factors: {
    twoFactorEnabled: boolean;
    activeSessions: number;
    backupCodesCount: number;
    recentFailedLogins: number;
}): string[] {
    const recommendations: string[] = [];

    if (!factors.twoFactorEnabled) {
        recommendations.push('Enable Two-Factor Authentication for enhanced security');
    }

    if (factors.twoFactorEnabled && factors.backupCodesCount < 3) {
        recommendations.push('Regenerate backup codes - you\'re running low');
    }

    if (factors.activeSessions > 3) {
        recommendations.push('Review active sessions and remove unrecognized devices');
    }

    if (factors.recentFailedLogins > 0) {
        recommendations.push('Review failed login attempts - unauthorized access may have been attempted');
    }

    if (recommendations.length === 0) {
        recommendations.push('Great! Your account security is excellent');
        recommendations.push('Keep monitoring your security dashboard regularly');
    }
    recommendations.push('Use a strong, unique password with at least 12 characters');
    recommendations.push('Keep your recovery email and phone number up to date');

    return recommendations;
}
