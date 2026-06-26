import { NextRequest, NextResponse } from 'next/server';
import { webSearch } from '@/ai/tools/web-search';
import { searchImages } from '@/ai/tools/image-search';
import { generateExtractiveSummary } from '@/lib/summarizer';
import * as cheerio from 'cheerio';
import { stealthFetch } from '@/lib/stealth-fetch';
import { extractReadableContent } from '@/lib/readability-engine';

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

// Decode HTML entities from text
function decode(text: string): string {
    return (text || '')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&apos;/g, "'")
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/&#\d+;/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// fetchWithTimeout and BOILERPLATE_PHRASES removed — now handled by stealth-fetch + readability-engine

async function extractPageContent(url: string): Promise<string | undefined> {
    try {
        // Perplexity-style: Use stealth fetch with rotating UA
        const response = await stealthFetch(url, { timeout: 3000, queryContext: url });
        if (!response.ok) return undefined;
        const html = await response.text();

        // Use the readability engine for much better content extraction
        const extracted = await extractReadableContent(html, url);

        if (extracted.text.trim().length < 50) return undefined;
        return extracted.text.substring(0, 2000) + (extracted.text.length > 2000 ? '...' : '');
    } catch (e) {
        return undefined;
    }
}

async function performWebSearch(query: string): Promise<{
    results: SearchResult[];
    images: ImageResult[];
    quickSummary?: string;
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
                        title: decode(item.title),
                        link: item.url,
                        snippet: decode(item.snippet),
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
            const imageResult = await searchImages({ query, maxImages: 6 });
            if (imageResult && imageResult.images) {
                images.push(...imageResult.images.map(img => ({
                    title: img.title,
                    link: img.url,
                    thumbnail: img.thumbnailUrl,
                    source: img.source
                })));
            }
        } catch (e) {
            console.error('Fast web search image fetch failed:', e);
        }

        let quickSummary = '';
        try {
            // Filter out news feeds so headlines don't pollute the summary
            const nonNewsResults = results.filter(r => 
                !r.link.includes('news.google') && 
                !r.link.includes('reuters.com') &&
                !r.link.includes('bbc.')
            );

            // Clean up the text before passing to the summarizer
            const contextText = (nonNewsResults.length > 2 ? nonNewsResults : results)
                .slice(0, 5)
                .map(r => r.content || r.snippet || '')
                .join(' . ') // Ensure sentence boundaries
                // Strip obvious boilerplate
                .replace(/cookie|privacy policy|terms of use|all rights reserved/gi, '')
                .replace(/\s+/g, ' ');

            if (contextText.length > 100) {
                // Use our local TF-IDF summarizer (NO LLM REQUIRED!)
                quickSummary = generateExtractiveSummary(contextText, 8, query);
            }

            if (!quickSummary || quickSummary.length < 30) {
                quickSummary = searchData.quickSummary || '';
            }
        } catch (e) {
            console.error('Fast web search summary failed:', e);
            quickSummary = searchData.quickSummary || '';
        }

        return { results, images: images.slice(0, 8), quickSummary };

    } catch (error) {
        console.error('Web search fatal error:', error);
        return { results: [], images: [], quickSummary: '' };
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

