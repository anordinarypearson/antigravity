'use server';

import { webSearch } from '@/ai/tools/web-search';
import * as cheerio from 'cheerio';

export type WebScraperInput = {
    query: string;
};

export type WebScraperOutput = {
    answer: string;
    sources: {
        title: string;
        url: string;
        snippet: string;
    }[];
    responseTime: number;
    error?: string;
};

export type ActionResult<T> = {
    data?: T;
    error?: string;
};

const SCRAPE_TIMEOUT_MS = 2500; // 2.5 seconds timeout for scraping

/**
 * Scrapes a single website and extracts its main content.
 * @param url - The URL of the website to scrape.
 * @param retries - Number of retry attempts (default: 2).
 * @returns The extracted text content or an empty string if failed.
 */
async function scrapeSingleWebsite(url: string, retries = 2): Promise<string> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            }
        });

        clearTimeout(timeout);

        if (!response.ok) {
            if (retries > 0 && response.status !== 404) {
                return scrapeSingleWebsite(url, retries - 1);
            }
            return '';
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Remove unwanted elements
        $('script, style, nav, header, footer, aside, .advertisement, .ads, .cookie-banner, .popup, .modal, iframe, noscript').remove();

        // Try to find main content with more specific selectors
        const mainContent = $('main, article, .content, .main-content, #content, #main, .post-content, .entry-content, .article-body').first();

        let text: string;
        if (mainContent.length > 0) {
            text = mainContent.text();
        } else {
            // Fallback: try to find the element with the most text
            let maxTextLen = 0;
            let bestElement = $('body');

            $('div, section').each((_, el) => {
                const len = $(el).text().length;
                if (len > maxTextLen && len < 20000) { // Avoid huge containers
                    maxTextLen = len;
                    bestElement = $(el);
                }
            });
            text = bestElement.text();
        }

        // Clean up the text
        text = text
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/\n+/g, '\n') // Normalize newlines
            .trim();

        // Limit to first 4000 characters to capture more context
        return text.substring(0, 4000);
    } catch (error: any) {
        if (retries > 0) {
            return scrapeSingleWebsite(url, retries - 1);
        }
        console.error(`Error scraping ${url}:`, error.message);
        return '';
    }
}

/**
 * Synthesizes a final answer from the scraped content based on the user's query.
 * Uses a heuristic scoring system to find relevant paragraphs.
 * @param query - The user's search query.
 * @param sources - List of scraped sources with title, url, and content.
 * @returns A formatted markdown string containing the answer and sources.
 */
function synthesizeAnswer(query: string, sources: { title: string, url: string, content: string }[]): string {
    const queryKeywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const relevantParagraphs: { text: string, score: number, sourceIndex: number }[] = [];

    sources.forEach((source, index) => {
        const paragraphs = source.content.split(/\n+/);

        paragraphs.forEach(paragraph => {
            if (paragraph.length < 50) return; // Skip short paragraphs

            let score = 0;
            const lowerPara = paragraph.toLowerCase();

            // Score based on keyword matches
            queryKeywords.forEach(keyword => {
                if (lowerPara.includes(keyword)) {
                    score += 1;
                }
            });

            // Boost score if paragraph appears early in the content (often more relevant)
            if (sources[index].content.indexOf(paragraph) < 500) {
                score += 0.5;
            }

            if (score > 0) {
                relevantParagraphs.push({
                    text: paragraph,
                    score,
                    sourceIndex: index + 1
                });
            }
        });
    });

    // Sort by score descending
    relevantParagraphs.sort((a, b) => b.score - a.score);

    // Take top 5 paragraphs
    const topParagraphs = relevantParagraphs.slice(0, 5);

    if (topParagraphs.length === 0) {
        return "I found some websites but couldn't extract specific information matching your keywords. Please check the sources below.";
    }

    // Construct the answer
    let answer = `Here is what I found based on your query "**${query}**":\n\n`;

    topParagraphs.forEach(p => {
        answer += `> ${p.text} [Source ${p.sourceIndex}]\n\n`;
    });

    return answer;
}

/**
 * Server action to perform a web search and scrape results.
 * @param query - The search query.
 * @returns An object containing the synthesized answer and source references.
 */
export async function webScraperAction(input: WebScraperInput): Promise<ActionResult<WebScraperOutput>> {
    const startTime = Date.now();

    try {
        // Step 1: Search the web
        const searchResults = await webSearch({ query: input.query });

        if (searchResults.noResults || !searchResults.results || searchResults.results.length === 0) {
            const responseTime = (Date.now() - startTime) / 1000;
            return {
                data: {
                    answer: `I couldn't find any relevant websites for your query: "${input.query}". Please try rephrasing your question or being more specific.`,
                    sources: [],
                    responseTime
                }
            };
        }

        // Step 2: Scrape top 3 results in parallel
        const topResults = searchResults.results.slice(0, 3);
        const scrapePromises = topResults.map(result => scrapeSingleWebsite(result.url));
        const scrapedContents = await Promise.all(scrapePromises);

        // Combine scraped content with metadata
        const sourcesWithContent = topResults
            .map((result, index) => ({
                title: result.title,
                url: result.url,
                snippet: result.snippet,
                content: scrapedContents[index]
            }))
            .filter(source => source.content.length > 100); // Only keep sources with meaningful content

        if (sourcesWithContent.length === 0) {
            const responseTime = (Date.now() - startTime) / 1000;
            return {
                data: {
                    answer: `I found some websites but couldn't extract meaningful content from them. This might be due to access restrictions or the sites being too slow to respond. Here are the search results:\n\n${topResults.map(r => `- [${r.title}](${r.url})\n  ${r.snippet}`).join('\n\n')}`,
                    sources: topResults,
                    responseTime
                }
            };
        }

        // Step 3: Local synthesis (Heuristic based)
        const answer = synthesizeAnswer(input.query, sourcesWithContent);
        const responseTime = (Date.now() - startTime) / 1000;

        return {
            data: {
                answer,
                sources: sourcesWithContent.map(({ title, url, snippet }) => ({ title, url, snippet })),
                responseTime
            }
        };

    } catch (error: any) {
        console.error('Web scraper error:', error);
        const responseTime = (Date.now() - startTime) / 1000;

        return {
            error: error.message || 'An error occurred while processing your query. Please try again.',
            data: {
                answer: '',
                sources: [],
                responseTime
            }
        };
    }
}
