'use server';

import { z } from 'zod';

const ImageResultSchema = z.object({
    url: z.string().url(),
    thumbnailUrl: z.string().url(),
    source: z.string(),
    title: z.string(),
    width: z.number().optional(),
    height: z.number().optional(),
});

const ImageSearchResultSchema = z.object({
    type: z.literal('image_search_result'),
    query: z.string(),
    loading: z.object({
        status: z.enum(['completed', 'loading', 'error']),
        loaded: z.number(),
        total: z.number(),
        percentage: z.number(),
    }),
    images: z.array(ImageResultSchema),
});

export type ImageSearchInput = {
    query: string;
};

export type ImageSearchResult = z.infer<typeof ImageSearchResultSchema>;

/**
 * Search for images from multiple free sources
 * Uses Wikimedia Commons and Unsplash API (free tier)
 */
export async function searchImages({ query }: ImageSearchInput): Promise<ImageSearchResult> {
    const images: z.infer<typeof ImageResultSchema>[] = [];

    try {
        // Search Wikimedia Commons (free, no API key required)
        const wikimediaResults = await searchWikimedia(query);
        images.push(...wikimediaResults);

        // If we have fewer than 4 images, try Unsplash
        if (images.length < 4 && process.env.UNSPLASH_ACCESS_KEY) {
            const unsplashResults = await searchUnsplash(query);
            images.push(...unsplashResults);
        }

        // Limit to 10 images as requested
        const finalImages = images.slice(0, 10);

        return {
            type: 'image_search_result',
            query,
            loading: {
                status: 'completed',
                loaded: finalImages.length,
                total: finalImages.length,
                percentage: 100,
            },
            images: finalImages,
        };
    } catch (error) {
        console.error('Image search error:', error);
        return {
            type: 'image_search_result',
            query,
            loading: {
                status: 'error',
                loaded: 0,
                total: 0,
                percentage: 0,
            },
            images: [],
        };
    }
}

/**
 * Search Wikimedia Commons for images
 */
async function searchWikimedia(query: string): Promise<z.infer<typeof ImageResultSchema>[]> {
    try {
        const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}&gsrlimit=15&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=400`;

        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'SearnAI/1.0 (Educational Purpose)',
            },
        });

        if (!response.ok) {
            throw new Error(`Wikimedia API error: ${response.status}`);
        }

        const data = await response.json();
        const pages = data.query?.pages || {};
        const results: z.infer<typeof ImageResultSchema>[] = [];

        for (const pageId in pages) {
            const page = pages[pageId];
            const imageInfo = page.imageinfo?.[0];

            if (imageInfo?.url && imageInfo?.thumburl) {
                results.push({
                    url: imageInfo.url,
                    thumbnailUrl: imageInfo.thumburl,
                    source: 'Wikimedia Commons',
                    title: page.title?.replace('File:', '') || query,
                    width: imageInfo.width,
                    height: imageInfo.height,
                });
            }
        }

        return results;
    } catch (error) {
        console.error('Wikimedia search error:', error);
        return [];
    }
}

/**
 * Search Unsplash for images (requires API key)
 */
async function searchUnsplash(query: string): Promise<z.infer<typeof ImageResultSchema>[]> {
    try {
        const apiKey = process.env.UNSPLASH_ACCESS_KEY;
        if (!apiKey) return [];

        const searchUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`;

        const response = await fetch(searchUrl, {
            headers: {
                'Authorization': `Client-ID ${apiKey}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Unsplash API error: ${response.status}`);
        }

        const data = await response.json();
        const results: z.infer<typeof ImageResultSchema>[] = [];

        for (const photo of data.results || []) {
            results.push({
                url: photo.urls.regular,
                thumbnailUrl: photo.urls.small,
                source: `Unsplash (${photo.user.name})`,
                title: photo.alt_description || photo.description || query,
                width: photo.width,
                height: photo.height,
            });
        }

        return results;
    } catch (error) {
        console.error('Unsplash search error:', error);
        return [];
    }
}
