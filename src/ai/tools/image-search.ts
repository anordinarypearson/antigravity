'use server';

import * as cheerio from 'cheerio';
import { z } from 'zod';
import { stealthFetch } from '@/lib/stealth-fetch';
import { withCache, CACHE_TTL } from '@/lib/search-cache';

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
    maxImages?: number;
};

export type ImageSearchResult = z.infer<typeof ImageSearchResultSchema>;

/**
 * Search for images from multiple free sources
 * Now uses powerful Bing scraping for extremely accurate results, falling back to Wikimedia
 */
export async function searchImages({ query, maxImages = 30 }: ImageSearchInput): Promise<ImageSearchResult> {
    const images: z.infer<typeof ImageResultSchema>[] = [];

    try {
        // Try Bing first as it provides the most accurate and diverse images
        console.log(`[ImageSearch] Fetching Bing images for: ${query}`);
        const bingResults = await withCache('bing-images', query, CACHE_TTL.IMAGE_SEARCH, () => searchBingImages(query));
        images.push(...bingResults);

        // Fallback to Wikimedia Commons if we didn't get enough
        if (images.length < Math.min(10, maxImages)) {
            console.log(`[ImageSearch] Bing gave few results, adding Wikimedia for: ${query}`);
            const wikimediaResults = await withCache('wiki-images', query, CACHE_TTL.IMAGE_SEARCH, () => searchWikimedia(query));
            images.push(...wikimediaResults);
        }

        // Limit to maxImages
        const finalImages = images.slice(0, maxImages);

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
 * Scrape Bing Images for highly accurate web results
 */
async function searchBingImages(query: string): Promise<z.infer<typeof ImageResultSchema>[]> {
    try {
        const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2&first=1&safesearch=Moderate`;

        // Stealth fetch — rotating UA to avoid Bing bot detection
        const response = await stealthFetch(searchUrl, {
            timeout: 8000,
            queryContext: query,
        });

        if (!response.ok) throw new Error(`Bing HTTP error: ${response.status}`);

        const html = await response.text();
        const $ = cheerio.load(html);
        const results: z.infer<typeof ImageResultSchema>[] = [];

        $('.iusc').each((i, el) => {
            const mData = $(el).attr('m');
            if (mData && results.length < 40) { // Increased to get more images
                try {
                    const m = JSON.parse(mData);
                    if (m.murl) {
                        try {
                            const parsedUrl = new URL(m.murl);
                            let sourceHost = 'Bing';
                            if (m.purl) sourceHost = new URL(m.purl).hostname.replace('www.', '');

                            results.push({
                                url: m.murl, // high res
                                thumbnailUrl: m.turl || m.murl,
                                source: sourceHost,
                                title: m.t || query,
                            });
                        } catch (e) {
                            // Invalid URL format
                        }
                    }
                } catch (e) {
                    // JSON parse error
                }
            }
        });

        return results;
    } catch (error) {
        console.error('Bing scraping error:', error);
        return [];
    }
}

/**
 * Search Wikimedia Commons for open source images
 */
async function searchWikimedia(query: string): Promise<z.infer<typeof ImageResultSchema>[]> {
    try {
        const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}&gsrlimit=10&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=400`;

        const response = await stealthFetch(searchUrl, {
            timeout: 6000,
        });

        if (!response.ok) throw new Error(`Wikimedia API error: ${response.status}`);

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
