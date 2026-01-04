import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const runtime = 'edge';
export const maxDuration = 60; // Increase duration for content fetching

interface SearchResult {
    title: string;
    link: string;
    snippet: string;
    favicon: string;
    content?: string; // Extracted content
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

async function extractPageContent(url: string): Promise<string | undefined> {
    try {
        const response = await fetchWithTimeout(url, 1500); // 1.5s max per page
        if (!response.ok) return undefined;
        const html = await response.text();
        const $ = cheerio.load(html);

        // Remove scripts, styles, etc.
        $('script, style, nav, footer, header, aside, .ad, .advertisement').remove();

        // Get paragraph text
        let content = '';
        $('p').each((i, el) => {
            const text = $(el).text().trim();
            if (text.length > 50) { // Only substantial paragraphs
                content += text + ' ';
            }
        });

        return content.substring(0, 500) + (content.length > 500 ? '...' : '');
    } catch (e) {
        return undefined;
    }
}

async function performWebSearch(query: string): Promise<{
    results: SearchResult[];
    images: ImageResult[];
}> {
    try {
        const results: SearchResult[] = [];

        try {
            // 1. Perform Search (DuckDuckGo HTML)
            // Attempt to scrape DuckDuckGo for rich results
            const textSearchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
            const textResponse = await fetch(textSearchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
                }
            });

            if (textResponse.ok) {
                const html = await textResponse.text();
                const $ = cheerio.load(html);

                $('.result').each((i, el) => {
                    if (results.length >= 8) return;
                    const titleLink = $(el).find('.result__a');
                    const snippetElement = $(el).find('.result__snippet');

                    const title = titleLink.text().trim();
                    let link = titleLink.attr('href');
                    const snippet = snippetElement.text().trim();

                    if (link && link.startsWith('//duckduckgo.com/l/?uddg=')) {
                        link = decodeURIComponent(link.replace('//duckduckgo.com/l/?uddg=', '').split('&')[0]);
                    }

                    if (title && link && link.startsWith('http')) {
                        results.push({
                            title,
                            link,
                            snippet,
                            favicon: `https://www.google.com/s2/favicons?domain=${new URL(link).hostname}&sz=32`,
                            source: new URL(link).hostname
                        });
                    }
                });
            }
        } catch (ddgError) {
            console.error("DuckDuckGo text search failed:", ddgError);
        }

        // 2. Fallback: Wikipedia if results are empty
        if (results.length === 0) {
            try {
                const wikiSearchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=6&namespace=0&format=json`;
                const wikiResponse = await fetch(wikiSearchUrl);
                if (wikiResponse.ok) {
                    const wikiData = await wikiResponse.json();
                    // Wikipedia API returns: [query, [titles], [descriptions], [urls]]
                    const titles = wikiData[1] || [];
                    const descriptions = wikiData[2] || [];
                    const urls = wikiData[3] || [];

                    for (let i = 0; i < titles.length; i++) {
                        if (titles[i] && urls[i]) {
                            results.push({
                                title: titles[i],
                                link: urls[i],
                                snippet: descriptions[i] || 'Wikipedia entry',
                                favicon: 'https://www.wikipedia.org/static/favicon/wikipedia.ico',
                                source: 'Wikipedia'
                            });
                        }
                    }
                }
            } catch (wikiError) {
                console.error("Wikipedia fallback failed:", wikiError);
            }
        }

        // 3. Extract Content from Top results (whether DDG or Wiki)
        // Only extract if we have results. Limit to 3 to be faster.
        if (results.length > 0) {
            const contentPromises = results.slice(0, 3).map(async (result) => {
                // If it's a wikipedia link, extractContent might work well, or we can use specific wiki API
                // For now, use generic extractor
                const content = await extractPageContent(result.link);
                if (content && content.length > 100) {
                    result.content = content;
                }
                return result;
            });
            await Promise.allSettled(contentPromises);
        }

        // 4. Fetch Images
        const images: ImageResult[] = [];
        try {
            // Try DuckDuckGo API for images
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
            // Image API failed, continue to fallback
        }

        // Always ensure we have at least 4 images using Pollinations as reliable fallback
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
        // Return empty structure rather than throwing to prevent UI crash, 
        // allowing chat to explain it couldn't find anything.
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
