import { NextRequest, NextResponse } from 'next/server';
import { webSearch } from '@/ai/tools/web-search';
import * as cheerio from 'cheerio';

export const maxDuration = 60;

interface SearchResult {
    title: string;
    link: string;
    snippet: string;
    favicon: string;
    content?: string;
    source?: string;
}

interface ImageResult {
    title: string;
    link: string;
    thumbnail: string;
    source: string;
}

async function fetchWithTimeout(url: string, timeout = 3000): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

// Boilerplate phrases to filter out
const BOILERPLATE_PHRASES = [
    'cookie', 'privacy policy', 'terms of service', 'subscribe', 'newsletter',
    'sign up', 'log in', 'accept cookies', 'we use cookies', 'consent',
    'all rights reserved', 'copyright', 'advertisement', 'sponsored',
];

async function extractPageContent(url: string): Promise<string | undefined> {
    try {
        const response = await fetchWithTimeout(url, 2000);
        if (!response.ok) return undefined;
        const html = await response.text();
        const $ = cheerio.load(html);

        // Remove scripts, styles, noise
        $('script, style, nav, footer, header, aside, .ad, .advertisement, .cookie-banner, .popup, .modal, .sidebar, .comments, form, iframe, noscript').remove();

        let content = '';

        // Extract headings for context
        $('h1, h2, h3').each((i: number, el: any) => {
            const text = $(el).text().trim();
            if (text.length > 5 && text.length < 150) {
                content += text + '. ';
            }
        });

        // Get paragraph text with quality filtering
        $('p').each((i: number, el: any) => {
            const text = $(el).text().trim();
            // Only substantial paragraphs, skip boilerplate
            if (text.length > 50) {
                const lowerText = text.toLowerCase();
                const isBoilerplate = BOILERPLATE_PHRASES.some(phrase => lowerText.includes(phrase));
                if (!isBoilerplate) {
                    content += text + ' ';
                }
            }
        });

        // Also extract list items for structured content
        $('li').each((i: number, el: any) => {
            const text = $(el).text().trim();
            if (text.length > 30 && text.length < 300 && content.length < 1800) {
                content += text + ' ';
            }
        });

        if (content.trim().length < 50) return undefined;

        return content.substring(0, 2000) + (content.length > 2000 ? '...' : '');
    } catch (e) {
        return undefined;
    }
}

async function performWebSearch(query: string): Promise<{
    results: SearchResult[];
    images: ImageResult[];
}> {
    try {
        // Use the shared multi-engine search (DDG + Brave + Wikipedia + Google News + Bing)
        const searchData = await webSearch({ query, maxResults: 12 });

        const results: SearchResult[] = [];

        if (searchData.results && searchData.results.length > 0) {
            for (const item of searchData.results.slice(0, 8)) {
                try {
                    const hostname = new URL(item.url).hostname;
                    results.push({
                        title: item.title,
                        link: item.url,
                        snippet: item.snippet,
                        favicon: `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`,
                        source: hostname.replace('www.', ''),
                    });
                } catch { }
            }
        }

        // Extract content from top 4 results for richer context
        if (results.length > 0) {
            const contentPromises = results.slice(0, 4).map(async (result) => {
                const content = await extractPageContent(result.link);
                if (content && content.length > 100) {
                    result.content = content;
                }
                return result;
            });
            await Promise.allSettled(contentPromises);
        }

        // Fetch images
        const images: ImageResult[] = [];
        try {
            const imageApiUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&t=h_`;
            const imageResponse = await fetch(imageApiUrl);
            const imageData = await imageResponse.json();

            if (imageData.RelatedTopics) {
                for (const topic of imageData.RelatedTopics) {
                    if (topic.Icon?.URL) {
                        let url = topic.Icon.URL;
                        if (!url.startsWith('http')) url = `https://duckduckgo.com${url}`;
                        images.push({
                            title: topic.Text || query,
                            link: topic.FirstURL || '#',
                            thumbnail: url,
                            source: 'DuckDuckGo'
                        });
                    }
                }
            }
        } catch (e) {
            // Image API failed
        }

        // Ensure at least 4 images
        if (images.length < 4) {
            const extras = [
                { suffix: 'visual', seed: 42 },
                { suffix: 'infographic', seed: 43 },
                { suffix: 'diagram', seed: 44 },
                { suffix: 'photo', seed: 45 }
            ];

            extras.forEach(({ suffix, seed }) => {
                images.push({
                    title: `${query} ${suffix}`,
                    link: `https://pollinations.ai`,
                    thumbnail: `https://image.pollinations.ai/prompt/${encodeURIComponent(query + ' ' + suffix)}?width=600&height=400&nologo=true&seed=${seed}`,
                    source: 'AI Generated'
                });
            });
        }

        return { results, images: images.slice(0, 8) };

    } catch (error) {
        console.error('Web search fatal error:', error);
        return { results: [], images: [] };
    }
}

export async function POST(request: NextRequest) {
    try {
        const { query } = await request.json();

        if (!query || typeof query !== 'string') {
            return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
        }

        const data = await performWebSearch(query);

        return NextResponse.json({
            success: true,
            query,
            ...data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json(
            { error: 'Failed to perform search', details: error instanceof Error ? error.message : 'Unknown' },
            { status: 500 }
        );
    }
}

