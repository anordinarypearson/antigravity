import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { query } = await request.json();

        if (!query || typeof query !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Query is required' },
                { status: 400 }
            );
        }

        // Use Google Custom Search API or SerpAPI for image search
        // For now, using a free alternative: Unsplash API or Pexels API
        const PEXELS_API_KEY = process.env.PEXELS_API_KEY || 'YOUR_PEXELS_API_KEY';

        const response = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=12`,
            {
                headers: {
                    'Authorization': PEXELS_API_KEY
                }
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch images from Pexels');
        }

        const data = await response.json();

        const images = data.photos.map((photo: any, index: number) => ({
            id: photo.id,
            url: photo.src.large,
            thumbnail: photo.src.medium,
            photographer: photo.photographer,
            alt: photo.alt || query,
            index: index + 1,
            total: data.photos.length
        }));

        return NextResponse.json({
            success: true,
            query,
            images,
            total: images.length,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('Image search error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Image search failed' },
            { status: 500 }
        );
    }
}
