/**
 * Session Management Service
 * Manages user sessions with security features
 */

import { db } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { generateSecureToken } from './security';
import { logSecurityEvent } from './security-logging';

export interface UserSession {
    sessionId: string;
    userId: string;
    createdAt: Date;
    lastActivityAt: Date;
    expiresAt: Date;
    ip: string;
    userAgent: string;
    deviceInfo: string;
    location?: string;
    active: boolean;
}

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const MAX_SESSIONS_PER_USER = 5;

/**
 * Create a new session
 */
export async function createSession(
    userId: string,
    ip: string,
    userAgent: string,
    deviceInfo: string
): Promise<string> {
    try {
        const sessionId = await generateSecureToken(32);
        const now = new Date();

        const session: UserSession = {
            sessionId,
            userId,
            createdAt: now,
            lastActivityAt: now,
            expiresAt: new Date(now.getTime() + SESSION_DURATION),
            ip,
            userAgent,
            deviceInfo,
            active: true,
        };

        // Store session
        await setDoc(doc(db, 'sessions', sessionId), session);

        // Clean up old sessions for this user
        await cleanupUserSessions(userId);

        // Log session creation
        await logSecurityEvent(
            userId,
            'SESSION_CREATED',
            `New session created from ${deviceInfo}`,
            'info',
            { ip, userAgent, deviceInfo }
        );

        return sessionId;
    } catch (error) {
        console.error('Failed to create session:', error);
        throw new Error('Failed to create session');
    }
}

/**
 * Get session by ID
 */
export async function getSession(sessionId: string): Promise<UserSession | null> {
    try {
        const sessionDoc = await getDoc(doc(db, 'sessions', sessionId));

        if (!sessionDoc.exists()) {
            return null;
        }

        const session = sessionDoc.data() as UserSession;

        // Check if session is expired
        if (new Date() > session.expiresAt) {
            await deleteSession(sessionId);
            return null;
        }

        return session;
    } catch (error) {
        console.error('Failed to get session:', error);
        return null;
    }
}

/**
 * Update session activity
 */
export async function updateSessionActivity(sessionId: string): Promise<void> {
    try {
        await updateDoc(doc(db, 'sessions', sessionId), {
            lastActivityAt: new Date(),
        });
    } catch (error) {
        console.error('Failed to update session activity:', error);
    }
}

/**
 * Delete session (logout)
 */
export async function deleteSession(sessionId: string): Promise<void> {
    try {
        const session = await getSession(sessionId);

        if (session) {
            await deleteDoc(doc(db, 'sessions', sessionId));

            // Log session expiration
            await logSecurityEvent(
                session.userId,
                'SESSION_EXPIRED',
                'Session expired or logged out',
                'info'
            );
        }
    } catch (error) {
        console.error('Failed to delete session:', error);
    }
}

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(userId: string): Promise<UserSession[]> {
    try {
        const q = query(
            collection(db, 'sessions'),
            where('userId', '==', userId),
            where('active', '==', true)
        );

        const snapshot = await getDocs(q);
        const sessions: UserSession[] = [];

        for (const doc of snapshot.docs) {
            const session = doc.data() as UserSession;

            // Check if expired
            if (new Date() > session.expiresAt) {
                await deleteSession(session.sessionId);
            } else {
                sessions.push(session);
            }
        }

        return sessions;
    } catch (error) {
        console.error('Failed to get user sessions:', error);
        return [];
    }
}

/**
 * Clean up old sessions for a user (keep only MAX_SESSIONS_PER_USER)
 */
async function cleanupUserSessions(userId: string): Promise<void> {
    try {
        const sessions = await getUserSessions(userId);

        if (sessions.length > MAX_SESSIONS_PER_USER) {
            // Sort by last activity (oldest first)
            sessions.sort((a, b) => a.lastActivityAt.getTime() - b.lastActivityAt.getTime());

            // Delete oldest sessions
            const sessionsToDelete = sessions.slice(0, sessions.length - MAX_SESSIONS_PER_USER);

            for (const session of sessionsToDelete) {
                await deleteSession(session.sessionId);
            }
        }
    } catch (error) {
        console.error('Failed to cleanup user sessions:', error);
    }
}

/**
 * Delete all sessions for a user (force logout everywhere)
 */
export async function deleteAllUserSessions(userId: string): Promise<void> {
    try {
        const sessions = await getUserSessions(userId);

        for (const session of sessions) {
            await deleteSession(session.sessionId);
        }

        await logSecurityEvent(
            userId,
            'LOGOUT',
            'Logged out from all devices',
            'info'
        );
    } catch (error) {
        console.error('Failed to delete all user sessions:', error);
    }
}

/**
 * Extend session expiration
 */
export async function extendSession(sessionId: string): Promise<void> {
    try {
        const newExpiresAt = new Date(Date.now() + SESSION_DURATION);

        await updateDoc(doc(db, 'sessions', sessionId), {
            expiresAt: newExpiresAt,
            lastActivityAt: new Date(),
        });
    } catch (error) {
        console.error('Failed to extend session:', error);
    }
}
