import { NextRequest, NextResponse } from 'next/server';
import { webScraperAction } from '@/app/web-scraper';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { query, maxSources } = body;

        if (!query || typeof query !== 'string') {
            return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
        }

        const result = await webScraperAction({
            query,
            maxSources: maxSources || 8,
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Web scraper API error:', error);
        return NextResponse.json(
            { error: error.message || 'Search failed' },
            { status: 500 }
        );
    }
}
