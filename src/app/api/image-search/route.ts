import { NextRequest, NextResponse } from 'next/server';
import { searchImages } from '@/ai/tools/image-search';

export async function POST(request: NextRequest) {
    try {
        const { query } = await request.json();

        if (!query || typeof query !== 'string') {
            return NextResponse.json(
                { error: 'Query parameter is required' },
                { status: 400 }
            );
        }

        const result = await searchImages({ query });
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Image search API error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to search images' },
            { status: 500 }
        );
    }
}
