/**
 * API Route: Search Images
 * 
 * Handles image search requests from the client
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchImages } from '@/lib/file-processors/image-scraper';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { query, maxResults = 12, sources } = body;

        if (!query || typeof query !== 'string') {
            return NextResponse.json(
                { error: 'Query is required' },
                { status: 400 }
            );
        }

        const results = await searchImages(query, {
            maxResults,
            sources,
            useCache: true
        });

        return NextResponse.json({
            success: true,
            results,
            count: results.length
        });
    } catch (error) {
        console.error('Image search error:', error);
        return NextResponse.json(
            { error: 'Failed to search images' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const maxResults = parseInt(searchParams.get('maxResults') || '12');

    if (!query) {
        return NextResponse.json(
            { error: 'Query parameter is required' },
            { status: 400 }
        );
    }

    try {
        const results = await searchImages(query, {
            maxResults,
            useCache: true
        });

        return NextResponse.json({
            success: true,
            results,
            count: results.length
        });
    } catch (error) {
        console.error('Image search error:', error);
        return NextResponse.json(
            { error: 'Failed to search images' },
            { status: 500 }
        );
    }
}
