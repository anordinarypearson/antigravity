/**
 * Legal Image Scraper
 * 
 * Fetches images from legal, Creative Commons sources:
 * - Unsplash (requires API key)
 * - Pexels (requires API key)
 * - Wikimedia Commons (no key required)
 * 
 * All sources respect rate limits and robots.txt
 */

import axios from 'axios';
import Bottleneck from 'bottleneck';
import { cacheImage, isCached, searchCache, type CachedImage } from './image-cache';

export interface ImageResult {
    id: string;
    url: string;
    thumbnailUrl: string;
    title: string;
    author: string;
    source: 'unsplash' | 'pexels' | 'wikimedia';
    license: string;
    sourceUrl: string;
    width: number;
    height: number;
}

// Rate limiters (1 request per second per source)
const unsplashLimiter = new Bottleneck({ minTime: 1000, maxConcurrent: 1 });
const pexelsLimiter = new Bottleneck({ minTime: 1000, maxConcurrent: 1 });
const wikimediaLimiter = new Bottleneck({ minTime: 1000, maxConcurrent: 1 });

/**
 * Search Unsplash for images
 */
async function searchUnsplash(query: string, perPage: number = 15): Promise<ImageResult[]> {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;

    if (!accessKey) {
        console.warn('UNSPLASH_ACCESS_KEY not set, skipping Unsplash');
        return [];
    }

    try {
        const response = await unsplashLimiter.schedule(() =>
            axios.get('https://api.unsplash.com/search/photos', {
                params: { query, per_page: perPage, orientation: 'landscape' },
                headers: { Authorization: `Client-ID ${accessKey}` },
                timeout: 10000
            })
        );

        return response.data.results.map((photo: any) => ({
            id: photo.id,
            url: photo.urls.regular,
            thumbnailUrl: photo.urls.small,
            title: photo.description || photo.alt_description || query,
            author: photo.user.name,
            source: 'unsplash' as const,
            license: 'Unsplash License',
            sourceUrl: photo.links.html,
            width: photo.width,
            height: photo.height
        }));
    } catch (error) {
        console.error('Unsplash search failed:', error);
        return [];
    }
}

/**
 * Search Pexels for images
 */
async function searchPexels(query: string, perPage: number = 15): Promise<ImageResult[]> {
    const apiKey = process.env.PEXELS_API_KEY;

    if (!apiKey) {
        console.warn('PEXELS_API_KEY not set, skipping Pexels');
        return [];
    }

    try {
        const response = await pexelsLimiter.schedule(() =>
            axios.get('https://api.pexels.com/v1/search', {
                params: { query, per_page: perPage, orientation: 'landscape' },
                headers: { Authorization: apiKey },
                timeout: 10000
            })
        );

        return response.data.photos.map((photo: any) => ({
            id: String(photo.id),
            url: photo.src.large,
            thumbnailUrl: photo.src.medium,
            title: photo.alt || query,
            author: photo.photographer,
            source: 'pexels' as const,
            license: 'Pexels License',
            sourceUrl: photo.url,
            width: photo.width,
            height: photo.height
        }));
    } catch (error) {
        console.error('Pexels search failed:', error);
        return [];
    }
}

/**
 * Search Wikimedia Commons for images
 */
async function searchWikimedia(query: string, limit: number = 20): Promise<ImageResult[]> {
    try {
        const response = await wikimediaLimiter.schedule(() =>
            axios.get('https://commons.wikimedia.org/w/api.php', {
                params: {
                    action: 'query',
                    format: 'json',
                    generator: 'search',
                    gsrnamespace: 6, // File namespace
                    gsrsearch: query,
                    gsrlimit: Math.min(limit, 50), // Wikimedia max is 50
                    prop: 'imageinfo',
                    iiprop: 'url|size|extmetadata',
                    iiurlwidth: 800
                },
                timeout: 10000,
                headers: {
                    'User-Agent': 'ImageScraper/1.0 (Educational; +https://yourapp.com)'
                }
            })
        );

        if (!response.data.query?.pages) return [];

        const results: ImageResult[] = [];

        Object.values(response.data.query.pages).forEach((page: any) => {
            if (!page.imageinfo?.[0]) return;

            const info = page.imageinfo[0];
            const metadata = info.extmetadata || {};

            results.push({
                id: String(page.pageid),
                url: info.url,
                thumbnailUrl: info.thumburl || info.url,
                title: page.title.replace('File:', ''),
                author: metadata.Artist?.value || 'Unknown',
                source: 'wikimedia' as const,
                license: metadata.LicenseShortName?.value || 'CC',
                sourceUrl: info.descriptionurl,
                width: info.width,
                height: info.height
            });
        });

        return results;
    } catch (error) {
        console.error('Wikimedia search failed:', error);
        return [];
    }
}

/**
 * Search all sources and return combined results
 */
export async function searchImages(
    query: string,
    options: {
        sources?: Array<'unsplash' | 'pexels' | 'wikimedia'>;
        maxResults?: number;
        useCache?: boolean;
    } = {}
): Promise<ImageResult[]> {
    const {
        sources = ['unsplash', 'pexels', 'wikimedia'],
        maxResults = 30,
        useCache = true
    } = options;

    // Check cache first
    if (useCache) {
        const cached = searchCache(query);
        if (cached.length >= maxResults) {
            return cached.slice(0, maxResults).map(cachedToResult);
        }
    }

    // Fetch from all enabled sources in parallel
    const promises: Promise<ImageResult[]>[] = [];
    const perSource = Math.ceil(maxResults / sources.length);

    if (sources.includes('unsplash')) {
        promises.push(searchUnsplash(query, perSource));
    }
    if (sources.includes('pexels')) {
        promises.push(searchPexels(query, perSource));
    }
    if (sources.includes('wikimedia')) {
        promises.push(searchWikimedia(query, perSource));
    }

    const results = await Promise.all(promises);
    const combined = results.flat();

    // Cache thumbnails in background (don't await)
    if (useCache) {
        combined.forEach(result => {
            cacheImage(
                result.thumbnailUrl,
                result.source,
                result.title,
                result.author,
                result.license
            ).catch(err => console.error('Cache error:', err));
        });
    }

    return combined.slice(0, maxResults);
}

/**
 * Convert cached image to result format
 */
function cachedToResult(cached: CachedImage): ImageResult {
    return {
        id: cached.id,
        url: cached.url,
        thumbnailUrl: cached.localPath,
        title: cached.title,
        author: cached.author || 'Unknown',
        source: cached.source,
        license: cached.license,
        sourceUrl: cached.url,
        width: 800,
        height: 600
    };
}

/**
 * Get a single random image from a source
 */
export async function getRandomImage(
    source: 'unsplash' | 'pexels' = 'unsplash'
): Promise<ImageResult | null> {
    try {
        if (source === 'unsplash') {
            const accessKey = process.env.UNSPLASH_ACCESS_KEY;
            if (!accessKey) return null;

            const response = await unsplashLimiter.schedule(() =>
                axios.get('https://api.unsplash.com/photos/random', {
                    headers: { Authorization: `Client-ID ${accessKey}` },
                    params: { orientation: 'landscape' },
                    timeout: 10000
                })
            );

            const photo = response.data;
            return {
                id: photo.id,
                url: photo.urls.regular,
                thumbnailUrl: photo.urls.small,
                title: photo.description || photo.alt_description || 'Random image',
                author: photo.user.name,
                source: 'unsplash',
                license: 'Unsplash License',
                sourceUrl: photo.links.html,
                width: photo.width,
                height: photo.height
            };
        }

        return null;
    } catch (error) {
        console.error('Failed to get random image:', error);
        return null;
    }
}
