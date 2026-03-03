/**
 * API Route: Search Images
 * 
 * Handles image search requests from the client.
 * Searches legal, Creative Commons sources with caching.
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchImages } from '@/lib/file-processors/image-scraper';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { query, maxResults = 20, sources } = body;

        if (!query || typeof query !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Query is required', results: [] },
                { status: 400 }
            );
        }

        // Sanitize query — prevent excessively long queries
        const sanitizedQuery = query.trim().slice(0, 200);

        const results = await searchImages(sanitizedQuery, {
            maxResults: Math.min(maxResults, 50),
            sources,
            useCache: true
        });

        return NextResponse.json({
            success: true,
            results,
            count: results.length,
            query: sanitizedQuery
        });
    } catch (error) {
        console.error('Image search error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to search images. Please try again.', results: [] },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const maxResults = parseInt(searchParams.get('maxResults') || '20');

    if (!query) {
        return NextResponse.json(
            { success: false, error: 'Query parameter is required', results: [] },
            { status: 400 }
        );
    }

    try {
        const sanitizedQuery = query.trim().slice(0, 200);

        const results = await searchImages(sanitizedQuery, {
            maxResults: Math.min(maxResults, 50),
            useCache: true
        });

        return NextResponse.json({
            success: true,
            results,
            count: results.length,
            query: sanitizedQuery
        });
    } catch (error) {
        console.error('Image search error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to search images. Please try again.', results: [] },
            { status: 500 }
        );
    }
}
