import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting store (in-memory, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Security configuration
const SECURITY_CONFIG = {
    // Rate limiting
    MAX_REQUESTS_PER_MINUTE: 60,
    MAX_API_REQUESTS_PER_MINUTE: 30,

    // Protected routes (require authentication)
    PROTECTED_ROUTES: ['/chat', '/inbox', '/settings', '/profile'],

    // Public routes (always accessible)
    PUBLIC_ROUTES: ['/login', '/signup', '/', '/api/webhooks'],

    // API routes that need stricter rate limiting
    API_ROUTES: ['/api/chat-stream', '/api/web-search', '/api/image-search'],
};

/**
 * Rate limiting implementation
 */
function checkRateLimit(
    identifier: string,
    maxRequests: number
): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute

    const record = rateLimitStore.get(identifier);

    if (!record || now > record.resetTime) {
        // New window
        rateLimitStore.set(identifier, {
            count: 1,
            resetTime: now + windowMs,
        });
        return { allowed: true, remaining: maxRequests - 1 };
    }

    if (record.count >= maxRequests) {
        return { allowed: false, remaining: 0 };
    }

    record.count++;
    return { allowed: true, remaining: maxRequests - record.count };
}

/**
 * Clean up old rate limit entries (prevent memory leak)
 * Called inline during each request instead of setInterval (unsupported in Edge runtime)
 */
function cleanupRateLimitStore() {
    const now = Date.now();
    // Only clean up if store has grown large enough to warrant it
    if (rateLimitStore.size < 100) return;
    for (const [key, value] of rateLimitStore.entries()) {
        if (now > value.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}

/**
 * Check if route is protected
 */
function isProtectedRoute(pathname: string): boolean {
    return SECURITY_CONFIG.PROTECTED_ROUTES.some(route =>
        pathname.startsWith(route)
    );
}

/**
 * Check if route is public
 */
function isPublicRoute(pathname: string): boolean {
    return SECURITY_CONFIG.PUBLIC_ROUTES.some(route =>
        pathname === route || pathname.startsWith(route)
    );
}

/**
 * Check if route is an API route
 */
function isApiRoute(pathname: string): boolean {
    return pathname.startsWith('/api/');
}

/**
 * Get user session token from cookies
 */
function getSessionToken(request: NextRequest): string | null {
    // Check for Firebase session cookie
    const sessionCookie = request.cookies.get('__session')?.value;
    if (sessionCookie) return sessionCookie;

    // Check for custom auth token
    const authToken = request.cookies.get('auth-token')?.value;
    if (authToken) return authToken;

    // Check Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }

    return null;
}

/**
 * Main middleware function
 */
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        'unknown';

    // ============================================
    // 1. RATE LIMITING
    // ============================================
    const isApi = isApiRoute(pathname);
    const maxRequests = isApi
        ? SECURITY_CONFIG.MAX_API_REQUESTS_PER_MINUTE
        : SECURITY_CONFIG.MAX_REQUESTS_PER_MINUTE;

    const rateLimitResult = checkRateLimit(ip, maxRequests);

    // Inline cleanup (Edge runtime does not support setInterval)
    cleanupRateLimitStore();

    if (!rateLimitResult.allowed) {
        return new NextResponse(
            JSON.stringify({
                error: 'Too many requests',
                message: 'Please slow down and try again later.',
            }),
            {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'Retry-After': '60',
                    'X-RateLimit-Limit': maxRequests.toString(),
                    'X-RateLimit-Remaining': '0',
                },
            }
        );
    }

    // ============================================
    // 2. AUTHENTICATION CHECK
    // ============================================
    const sessionToken = getSessionToken(request);
    const isAuthenticated = !!sessionToken;

    // Redirect unauthenticated users from protected routes
    if (isProtectedRoute(pathname) && !isAuthenticated) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
    }

    // Redirect authenticated users from login/signup
    if ((pathname === '/login' || pathname === '/signup') && isAuthenticated) {
        const redirect = request.nextUrl.searchParams.get('redirect');
        const url = request.nextUrl.clone();
        url.pathname = redirect || '/chat';
        url.searchParams.delete('redirect');
        return NextResponse.redirect(url);
    }

    // ============================================
    // 3. SECURITY HEADERS
    // ============================================
    const response = NextResponse.next();

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());

    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()');

    // Content Security Policy (strict)
    const csp = [
        "default-src 'self'",
        // Note: 'unsafe-eval' is required by Next.js in dev mode; remove in production if possible
        "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://apis.google.com https://*.googleapis.com https://checkout.razorpay.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: https: blob:",
        "media-src 'self' blob: data:",
        "connect-src 'self' https://*.googleapis.com https://*.google.com https://identitytoolkit.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://firestore.googleapis.com https://razorpay.com https://*.razorpay.com",
        "frame-src 'self' https://accounts.google.com https://api.razorpay.com https://*.firebaseapp.com https://www.youtube.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'self'",
        "upgrade-insecure-requests",
    ].join('; ');

    response.headers.set('Content-Security-Policy', csp);

    // HSTS (HTTP Strict Transport Security)
    response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
    );

    return response;
}

// Configure which routes middleware runs on
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    ],
};
