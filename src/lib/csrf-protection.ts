/**
 * CSRF Protection Service
 * Implements CSRF token generation and validation
 */

import { cookies } from 'next/headers';
import { generateSecureToken } from './security';

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generate a new CSRF token
 */
export async function generateCsrfToken(): Promise<string> {
    return await generateSecureToken(CSRF_TOKEN_LENGTH);
}

/**
 * Set CSRF token in cookie (server-side)
 */
export async function setCsrfToken(): Promise<string> {
    const token = await generateCsrfToken();

    const cookieStore = cookies();
    cookieStore.set(CSRF_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
    });

    return token;
}

/**
 * Get CSRF token from cookie
 */
export function getCsrfToken(): string | undefined {
    const cookieStore = cookies();
    return cookieStore.get(CSRF_COOKIE_NAME)?.value;
}

/**
 * Validate CSRF token from request
 */
export function validateCsrfToken(request: Request): boolean {
    const cookieStore = cookies();
    const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;
    const headerToken = request.headers.get(CSRF_HEADER_NAME);

    if (!cookieToken || !headerToken) {
        return false;
    }

    return cookieToken === headerToken;
}

/**
 * Client-side: Get CSRF token from meta tag
 */
export function getClientCsrfToken(): string | null {
    if (typeof document === 'undefined') return null;

    const meta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
    return meta?.content || null;
}

/**
 * Client-side: Add CSRF token to fetch request
 */
export function addCsrfTokenToHeaders(headers: HeadersInit = {}): HeadersInit {
    const token = getClientCsrfToken();

    if (token) {
        return {
            ...headers,
            [CSRF_HEADER_NAME]: token,
        };
    }

    return headers;
}

/**
 * Middleware helper: Require CSRF token for mutation requests
 */
export function requireCsrfToken(request: Request): boolean {
    const method = request.method.toUpperCase();

    // Only check for state-changing methods
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        return validateCsrfToken(request);
    }

    // GET, HEAD, OPTIONS don't need CSRF protection
    return true;
}
