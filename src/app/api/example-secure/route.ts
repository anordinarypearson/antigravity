/**
 * Example Secure API Route
 * Demonstrates security best practices for API endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    sanitizeInput,
    isValidEmail,
    checkRateLimit,
    sanitizeErrorMessage,
    getSecurityHeaders
} from '@/lib/security';

// Maximum request size (1MB)
const MAX_REQUEST_SIZE = 1024 * 1024;

/**
 * Verify authentication token
 */
async function verifyAuth(request: NextRequest): Promise<{
    authenticated: boolean;
    userId?: string;
    error?: string;
}> {
    try {
        // Get token from cookie or header
        const token = request.cookies.get('__session')?.value ||
            request.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return { authenticated: false, error: 'No authentication token provided' };
        }

        // TODO: Verify token with Firebase Admin SDK
        // const decodedToken = await admin.auth().verifyIdToken(token);
        // return { authenticated: true, userId: decodedToken.uid };

        // Mock verification for demo
        return { authenticated: true, userId: 'mock-user-id' };
    } catch (error) {
        return {
            authenticated: false,
            error: sanitizeErrorMessage(error)
        };
    }
}

/**
 * Validate request body
 */
function validateRequestBody(body: any): {
    valid: boolean;
    errors: string[];
    sanitizedData?: any;
} {
    const errors: string[] = [];

    // Check required fields
    if (!body.email) {
        errors.push('Email is required');
    } else if (!isValidEmail(body.email)) {
        errors.push('Invalid email format');
    }

    if (!body.message) {
        errors.push('Message is required');
    } else if (body.message.length > 1000) {
        errors.push('Message too long (max 1000 characters)');
    }

    if (errors.length > 0) {
        return { valid: false, errors };
    }

    // Sanitize data
    const sanitizedData = {
        email: sanitizeInput(body.email.toLowerCase().trim()),
        message: sanitizeInput(body.message.trim()),
    };

    return { valid: true, errors: [], sanitizedData };
}

/**
 * POST /api/example
 * Secure API endpoint example
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Check request size
        const contentLength = request.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
            return NextResponse.json(
                { error: 'Request too large' },
                { status: 413, headers: getSecurityHeaders() }
            );
        }

        // 2. Rate limiting
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown';
        const rateLimitResult = checkRateLimit(ip, 10, 60000); // 10 requests per minute

        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                {
                    error: 'Too many requests',
                    resetTime: rateLimitResult.resetTime
                },
                {
                    status: 429,
                    headers: {
                        ...getSecurityHeaders(),
                        'Retry-After': '60',
                        'X-RateLimit-Limit': '10',
                        'X-RateLimit-Remaining': '0',
                    }
                }
            );
        }

        // 3. Verify authentication
        const authResult = await verifyAuth(request);
        if (!authResult.authenticated) {
            return NextResponse.json(
                { error: 'Unauthorized', message: authResult.error },
                { status: 401, headers: getSecurityHeaders() }
            );
        }

        // 4. Validate request body
        let body;
        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json(
                { error: 'Invalid JSON' },
                { status: 400, headers: getSecurityHeaders() }
            );
        }

        const validation = validateRequestBody(body);
        if (!validation.valid) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.errors },
                { status: 400, headers: getSecurityHeaders() }
            );
        }

        // 5. Process request with sanitized data
        const { sanitizedData } = validation;

        // TODO: Implement your business logic here
        // Example: Save to Firestore, send email, etc.
        console.log('Processing request for user:', authResult.userId);
        console.log('Sanitized data:', sanitizedData);

        // 6. Return success response
        return NextResponse.json(
            {
                success: true,
                message: 'Request processed successfully',
                data: {
                    userId: authResult.userId,
                    timestamp: new Date().toISOString(),
                }
            },
            {
                status: 200,
                headers: {
                    ...getSecurityHeaders(),
                    'X-RateLimit-Limit': '10',
                    'X-RateLimit-Remaining': rateLimitResult.remainingRequests.toString(),
                }
            }
        );

    } catch (error) {
        // Log error securely (don't log sensitive data)
        console.error('API Error:', sanitizeErrorMessage(error));

        // Return generic error message
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: process.env.NODE_ENV === 'production'
                    ? 'An error occurred. Please try again later.'
                    : sanitizeErrorMessage(error)
            },
            { status: 500, headers: getSecurityHeaders() }
        );
    }
}

/**
 * GET /api/example
 * Example GET endpoint
 */
export async function GET(request: NextRequest) {
    try {
        // Rate limiting
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown';
        const rateLimitResult = checkRateLimit(ip, 30, 60000); // 30 requests per minute

        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                { error: 'Too many requests' },
                {
                    status: 429,
                    headers: {
                        ...getSecurityHeaders(),
                        'Retry-After': '60',
                    }
                }
            );
        }

        // Authentication (optional for public endpoints)
        const authResult = await verifyAuth(request);

        // Return data
        return NextResponse.json(
            {
                success: true,
                authenticated: authResult.authenticated,
                message: 'This is a secure API endpoint',
                timestamp: new Date().toISOString(),
            },
            {
                status: 200,
                headers: {
                    ...getSecurityHeaders(),
                    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
                    'X-RateLimit-Remaining': rateLimitResult.remainingRequests.toString(),
                }
            }
        );

    } catch (error) {
        return NextResponse.json(
            { error: sanitizeErrorMessage(error) },
            { status: 500, headers: getSecurityHeaders() }
        );
    }
}

/**
 * OPTIONS /api/example
 * Handle CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
            'Access-Control-Max-Age': '86400',
        },
    });
}
