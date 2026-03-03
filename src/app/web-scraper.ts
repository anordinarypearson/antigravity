'use server';

import { webSearch } from '@/ai/tools/web-search';
import * as cheerio from 'cheerio';

export type WebScraperInput = {
    query: string;
    maxSources?: number;
    extractMode?: 'full' | 'summary' | 'structured';
};

export type ScrapedSource = {
    title: string;
    url: string;
    snippet: string;
    domain: string;
    favicon?: string;
    wordCount: number;
    headings: string[];
    links: { text: string; url: string }[];
    meta?: {
        description?: string;
        author?: string;
        publishedDate?: string;
        ogImage?: string;
    };
    qualityScore: number;
    trustScore: number;
    readingTimeMin: number;
    contentType: 'article' | 'docs' | 'forum' | 'wiki' | 'news' | 'other';
    scrapeTimeMs: number;
};

export type WebScraperOutput = {
    answer: string;
    quickSummary: string;
    keyTakeaways: string[];
    relatedQuestions: string[];
    sources: ScrapedSource[];
    responseTime: number;
    stats: {
        totalSourcesFound: number;
        sourcesScraped: number;
        totalWords: number;
        averageResponseMs: number;
        averageQuality: number;
        searchEngines: { duckduckgo: number; brave: number; wikipedia: number; googleNews: number };
    };
    error?: string;
};

export type ActionResult<T> = {
    data?: T;
    error?: string;
};

// ── Speed settings ───────────────────────────────────────────────────────────
const SCRAPE_TIMEOUT_MS = 3000;
const MAX_CONTENT_LENGTH = 8000;

// ── Domain Trust Database ────────────────────────────────────────────────────
const TRUSTED_DOMAINS: Record<string, number> = {
    // Tier 1: Highly trusted (90-100)
    'wikipedia.org': 95, 'en.wikipedia.org': 95,
    'reuters.com': 95, 'apnews.com': 95, 'bbc.com': 93, 'bbc.co.uk': 93,
    'nytimes.com': 92, 'washingtonpost.com': 91, 'theguardian.com': 91,
    'nature.com': 95, 'science.org': 95, 'arxiv.org': 93,
    'github.com': 90, 'stackoverflow.com': 90,
    // Tier 2: Well-known (75-89)
    'cnn.com': 85, 'aljazeera.com': 84, 'axios.com': 83, 'npr.org': 88,
    'techcrunch.com': 82, 'theverge.com': 81, 'arstechnica.com': 84,
    'wired.com': 83, 'forbes.com': 78, 'bloomberg.com': 87,
    'developer.mozilla.org': 92, 'docs.microsoft.com': 88, 'learn.microsoft.com': 88,
    'docs.python.org': 90, 'nodejs.org': 88, 'react.dev': 90,
    'nextjs.org': 88, 'developer.chrome.com': 88,
    'who.int': 92, 'cdc.gov': 90, 'nih.gov': 92,
    'espncricinfo.com': 85, 'espn.com': 83,
    // Tier 3: Decent (60-74)
    'medium.com': 65, 'dev.to': 68, 'hashnode.dev': 65,
    'reddit.com': 62, 'quora.com': 55,
    'geeksforgeeks.org': 72, 'w3schools.com': 68,
    'freecodecamp.org': 75, 'digitalocean.com': 78,
    'thehindu.com': 78, 'ndtv.com': 72, 'hindustantimes.com': 70,
    'indiatimes.com': 68, 'timesofindia.indiatimes.com': 72,
};

function getDomainTrust(domain: string): number {
    const d = domain.replace('www.', '').toLowerCase();
    if (TRUSTED_DOMAINS[d]) return TRUSTED_DOMAINS[d];
    // Check partial matches
    for (const [trusted, score] of Object.entries(TRUSTED_DOMAINS)) {
        if (d.endsWith(trusted) || d.includes(trusted)) return score;
    }
    // Default scoring by TLD
    if (d.endsWith('.gov') || d.endsWith('.edu')) return 85;
    if (d.endsWith('.org')) return 65;
    if (d.endsWith('.ac.uk') || d.endsWith('.edu.au')) return 82;
    return 50; // Unknown domains
}


// ── LRU Cache ────────────────────────────────────────────────────────────────
const MAX_CACHE_SIZE = 200;
const CACHE_TTL_MS = 15 * 60 * 1000;

type CacheEntry = {
    content: string;
    headings: string[];
    links: { text: string; url: string }[];
    meta: any;
    timestamp: number;
    accessCount: number;
};

const scrapeCache = new Map<string, CacheEntry>();

function getCached(url: string): CacheEntry | null {
    const entry = scrapeCache.get(url);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) { scrapeCache.delete(url); return null; }
    entry.accessCount++;
    return entry;
}

function setCache(url: string, entry: Omit<CacheEntry, 'accessCount'>) {
    if (scrapeCache.size >= MAX_CACHE_SIZE) {
        let minKey = '', minAccess = Infinity;
        for (const [key, val] of scrapeCache) {
            if (val.accessCount < minAccess) { minAccess = val.accessCount; minKey = key; }
        }
        if (minKey) scrapeCache.delete(minKey);
    }
    scrapeCache.set(url, { ...entry, accessCount: 1 });
}


// ── Content Type Detection ────────────────────────────────────────────────────
function detectContentType(url: string, $: cheerio.CheerioAPI): ScrapedSource['contentType'] {
    const hostname = (() => { try { return new URL(url).hostname.replace('www.', ''); } catch { return ''; } })();
    const path = (() => { try { return new URL(url).pathname; } catch { return ''; } })();

    if (hostname.includes('wikipedia.org')) return 'wiki';
    if (hostname.includes('github.com') || hostname.includes('docs.') ||
        hostname.includes('developer.') || path.includes('/docs/') ||
        path.includes('/api/') || path.includes('/reference/')) return 'docs';
    if (hostname.includes('reddit.com') || hostname.includes('stackoverflow.com') ||
        hostname.includes('stackexchange.com') || hostname.includes('forum') ||
        hostname.includes('discuss')) return 'forum';
    if ($('article[itemtype*="NewsArticle"]').length > 0 ||
        $('meta[property="og:type"][content="article"]').length > 0 ||
        hostname.includes('news') || hostname.includes('reuters') ||
        hostname.includes('bbc') || hostname.includes('guardian') ||
        hostname.includes('cnn') || hostname.includes('nytimes') ||
        hostname.includes('washingtonpost') || hostname.includes('aljazeera') ||
        hostname.includes('axios') || hostname.includes('apnews') ||
        hostname.includes('ndtv') || hostname.includes('thehindu')) return 'news';
    if (hostname.includes('blog') || $('article').length > 0) return 'article';
    return 'other';
}


// ── Quality Scoring ───────────────────────────────────────────────────────────
function calculateQualityScore(
    content: string, headings: string[], meta: any,
    contentType: ScrapedSource['contentType'], trustScore: number
): number {
    let score = 40;

    const wordCount = content.split(/\s+/).length;
    if (wordCount > 800) score += 15;
    else if (wordCount > 400) score += 12;
    else if (wordCount > 200) score += 8;
    else if (wordCount > 100) score += 4;

    if (headings.length >= 5) score += 10;
    else if (headings.length >= 3) score += 7;
    else if (headings.length >= 1) score += 4;

    if (meta.description && meta.description.length > 50) score += 4;
    if (meta.author) score += 3;
    if (meta.publishedDate) score += 3;
    if (meta.ogImage) score += 3;

    const paragraphs = content.split('\n\n').filter((p: string) => p.trim().length > 60);
    if (paragraphs.length >= 6) score += 10;
    else if (paragraphs.length >= 3) score += 6;
    else if (paragraphs.length >= 1) score += 2;

    // Trust bonus
    score += Math.round((trustScore - 50) / 10);

    // Penalties
    if (wordCount < 30) score -= 25;
    if (content.includes('Access Denied') || content.includes('403 Forbidden') ||
        content.includes('Please enable JavaScript') || content.includes('Captcha')) score -= 35;

    return Math.max(0, Math.min(100, score));
}


// ── HTML Extraction ───────────────────────────────────────────────────────────
function extractStructuredContent($: cheerio.CheerioAPI): {
    text: string; headings: string[];
    links: { text: string; url: string }[];
    meta: { description?: string; author?: string; publishedDate?: string; ogImage?: string };
} {
    const meta = {
        description: $('meta[name="description"]').attr('content')
            || $('meta[property="og:description"]').attr('content') || '',
        author: $('meta[name="author"]').attr('content')
            || $('meta[property="article:author"]').attr('content')
            || $('[rel="author"]').first().text().trim()
            || $('meta[name="twitter:creator"]').attr('content') || '',
        publishedDate: $('meta[property="article:published_time"]').attr('content')
            || $('time[datetime]').first().attr('datetime')
            || $('meta[name="date"]').attr('content')
            || $('meta[name="DC.date.issued"]').attr('content') || '',
        ogImage: $('meta[property="og:image"]').attr('content')
            || $('meta[property="og:image:url"]').attr('content')
            || $('meta[name="twitter:image"]').attr('content')
            || $('meta[name="twitter:image:src"]').attr('content') || '',
    };

    // Ensure ogImage is a full URL
    if (meta.ogImage && !meta.ogImage.startsWith('http')) {
        // Try to make it absolute
        const baseTag = $('base').attr('href');
        if (baseTag) meta.ogImage = new URL(meta.ogImage, baseTag).href;
        else meta.ogImage = ''; // Can't resolve relative URL
    }

    // Remove noise
    $(
        'script, style, nav, header, footer, aside, ' +
        '.advertisement, .ads, .ad, .cookie-banner, .popup, .modal, ' +
        '.sidebar, .nav, .menu, .social-share, .comments, .related-posts, ' +
        '#cookie-consent, #newsletter, .newsletter, .subscribe, ' +
        'iframe, noscript, svg, [role="navigation"], [role="banner"], ' +
        '[role="complementary"], [aria-hidden="true"], .breadcrumb, ' +
        '.skip-link, .sr-only, #disqus_thread, .share-buttons, ' +
        'form:not([role="search"]), .login-form, .signup-form'
    ).remove();

    const headings: string[] = [];
    $('h1, h2, h3, h4').each((_, el) => {
        const text = $(el).text().trim();
        if (text && text.length > 2 && text.length < 200) {
            const tag = (el as cheerio.Element).tagName;
            const prefix = tag === 'h1' ? '# ' : tag === 'h2' ? '## ' : tag === 'h3' ? '### ' : '#### ';
            headings.push(prefix + text);
        }
    });

    const links: { text: string; url: string }[] = [];
    $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim();
        if (href && text && text.length > 2 && href.startsWith('http') && links.length < 20) {
            links.push({ text: text.substring(0, 120), url: href });
        }
    });

    // Content extraction with multiple selectors
    const contentSelectors = [
        'article[role="main"]', 'main article', '[data-article-body]',
        '.article-body', '.post-body', 'article', 'main', '[role="main"]',
        '.post-content', '.article-content', '.entry-content', '.content-body',
        '.story-body', '#content', '#main-content', '.main-content',
        '.page-content', '.wiki-content', '.mw-parser-output', '.markdown-body',
        '.rich-text', '.prose', '.documentation-content',
    ];

    let mainEl: cheerio.Cheerio<cheerio.AnyNode> | null = null;
    for (const selector of contentSelectors) {
        const el = $(selector).first();
        if (el.length > 0 && el.text().trim().length > 150) { mainEl = el; break; }
    }

    if (!mainEl) {
        let maxScore = 0;
        let bestEl = $('body');
        $('div, section').each((_, el) => {
            const $el = $(el);
            const text = $el.text().trim();
            const len = text.length;
            const linkCount = $el.find('a').length;
            const linkDensity = linkCount / Math.max(len / 100, 1);
            const pCount = $el.find('p').length;
            const score = len * (1 - Math.min(linkDensity, 0.9)) * (1 + pCount * 0.1);
            if (score > maxScore && len > 150 && len < 100000) { maxScore = score; bestEl = $el; }
        });
        mainEl = bestEl;
    }

    let text = '';
    if (mainEl) {
        mainEl.find('p, li, h1, h2, h3, h4, h5, h6, blockquote, pre, figcaption, td, th, dt, dd').each((_, el) => {
            const $el = $(el);
            const tag = (el as cheerio.Element).tagName;
            let content = $el.text().trim();
            if (!content || content.length < 8) return;

            if (tag.startsWith('h')) {
                content = '#'.repeat(parseInt(tag[1])) + ' ' + content;
            } else if (tag === 'li') { content = '• ' + content; }
            else if (tag === 'blockquote') { content = '> ' + content; }
            else if (tag === 'pre') { content = '```\n' + content + '\n```'; }

            text += content + '\n\n';
        });
    }

    if (text.trim().length < 150 && mainEl) text = mainEl.text();

    text = text.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

    return { text: text.substring(0, MAX_CONTENT_LENGTH), headings, links, meta };
}


// ── Single Website Scraper ──────────────────────────────────────────────────
async function scrapeSingleWebsite(url: string): Promise<{
    content: string; headings: string[]; links: { text: string; url: string }[];
    meta: any; responseMs: number; contentType: ScrapedSource['contentType']; qualityScore: number; trustScore: number;
}> {
    const domain = (() => { try { return new URL(url).hostname.replace('www.', ''); } catch { return ''; } })();
    const trustScore = getDomainTrust(domain);

    const cached = getCached(url);
    if (cached) {
        return {
            content: cached.content, headings: cached.headings, links: cached.links,
            meta: cached.meta, responseMs: 0, contentType: 'other', qualityScore: 70, trustScore,
        };
    }

    const start = Date.now();

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache',
            },
            redirect: 'follow',
        });

        clearTimeout(timeout);

        if (!response.ok) {
            return { content: '', headings: [], links: [], meta: {}, responseMs: Date.now() - start, contentType: 'other', qualityScore: 0, trustScore };
        }

        const ct = response.headers.get('content-type') || '';
        if (!ct.includes('text/html') && !ct.includes('application/xhtml')) {
            return { content: '', headings: [], links: [], meta: {}, responseMs: Date.now() - start, contentType: 'other', qualityScore: 0, trustScore };
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        const extracted = extractStructuredContent($);
        const detectedType = detectContentType(url, $);
        const quality = calculateQualityScore(extracted.text, extracted.headings, extracted.meta, detectedType, trustScore);

        setCache(url, {
            content: extracted.text, headings: extracted.headings,
            links: extracted.links, meta: extracted.meta, timestamp: Date.now(),
        });

        return {
            content: extracted.text, headings: extracted.headings,
            links: extracted.links, meta: extracted.meta,
            responseMs: Date.now() - start, contentType: detectedType, qualityScore: quality, trustScore,
        };
    } catch (error: any) {
        console.error(`Scrape error ${url}:`, error.message?.substring(0, 80));
        return { content: '', headings: [], links: [], meta: {}, responseMs: Date.now() - start, contentType: 'other', qualityScore: 0, trustScore };
    }
}


// ── Related Questions Generator ───────────────────────────────────────────────
function generateRelatedQuestions(query: string, sources: { content: string; headings: string[] }[]): string[] {
    const related: string[] = [];
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const seenTopics = new Set<string>();

    // Extract subtopics from headings
    for (const source of sources) {
        for (const heading of source.headings) {
            const cleaned = heading.replace(/^#+\s*/, '').trim();
            if (cleaned.length > 10 && cleaned.length < 80) {
                const lc = cleaned.toLowerCase();
                const isRelated = queryWords.some(w => lc.includes(w));
                const fingerprint = lc.substring(0, 30);
                if (isRelated && !seenTopics.has(fingerprint) && lc !== query.toLowerCase()) {
                    seenTopics.add(fingerprint);
                    // Form a question from the heading
                    if (lc.startsWith('how') || lc.startsWith('what') || lc.startsWith('why') ||
                        lc.startsWith('when') || lc.startsWith('where') || lc.startsWith('who')) {
                        related.push(cleaned.endsWith('?') ? cleaned : cleaned + '?');
                    } else {
                        related.push(`What is ${cleaned}?`);
                    }
                }
            }
            if (related.length >= 4) break;
        }
        if (related.length >= 4) break;
    }

    // Fallback: generate from query pattern
    if (related.length < 3) {
        const patterns = [
            `Latest developments in ${query}`,
            `How does ${query} compare`,
            `${query} impact and effects`,
            `History and background of ${query}`,
        ];
        for (const p of patterns) {
            if (related.length < 4 && !related.some(r => r.toLowerCase().includes(p.toLowerCase().substring(0, 20)))) {
                related.push(p + '?');
            }
        }
    }

    return related.slice(0, 4);
}


// ── Answer Synthesis ──────────────────────────────────────────────────────────
function synthesizeAnswer(
    query: string,
    sources: { title: string; url: string; content: string; headings: string[]; qualityScore: number; trustScore: number }[]
): { answer: string; quickSummary: string; keyTakeaways: string[] } {
    const stopWords = new Set([
        'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
        'in', 'with', 'to', 'for', 'of', 'not', 'from', 'by', 'it', 'as',
        'this', 'that', 'are', 'was', 'were', 'will', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'can', 'could', 'would',
        'should', 'may', 'might', 'shall', 'what', 'how', 'why', 'when',
        'where', 'who', 'whom', 'whose', 'about', 'their', 'there', 'then',
    ]);

    const queryKeywords = query.toLowerCase()
        .split(/[\s,;.!?]+/)
        .filter(w => w.length > 2 && !stopWords.has(w));

    const queryBigrams: string[] = [];
    const words = query.toLowerCase().split(/\s+/);
    for (let i = 0; i < words.length - 1; i++) queryBigrams.push(words[i] + ' ' + words[i + 1]);

    const scored: { text: string; score: number; sourceIdx: number; heading?: string }[] = [];
    const seenSentences = new Set<string>();

    sources.forEach((source, index) => {
        if (!source.content) return;
        let currentHeading = '';
        const lines = source.content.split('\n');

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;
            if (trimmed.startsWith('#')) { currentHeading = trimmed.replace(/^#+\s*/, ''); return; }
            if (trimmed.length < 35 || trimmed.length > 1800) return;

            const fingerprint = trimmed.substring(0, 80).toLowerCase().replace(/\s+/g, ' ');
            if (seenSentences.has(fingerprint)) return;

            let score = 0;
            const lowerText = trimmed.toLowerCase();
            const qualMult = 0.4 + (source.qualityScore / 100) * 0.6;
            const trustMult = 0.5 + (source.trustScore / 100) * 0.5;
            const combined = qualMult * trustMult;

            queryKeywords.forEach(keyword => {
                const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
                const matches = lowerText.match(regex);
                if (matches) score += matches.length * 2.5 * combined;
            });

            queryBigrams.forEach(bigram => {
                if (lowerText.includes(bigram)) score += 6 * combined;
            });

            const position = source.content.indexOf(trimmed);
            if (position < 500) score += 3;
            else if (position < 1500) score += 1.5;

            if (trimmed.length > 100 && trimmed.length < 800) score += 1.5;

            if (currentHeading) {
                const headingLower = currentHeading.toLowerCase();
                queryKeywords.forEach(keyword => {
                    if (headingLower.includes(keyword)) score += 3;
                });
            }

            const boilerplate = [
                'cookie', 'privacy policy', 'terms of service', 'subscribe',
                'sign up', 'log in', 'newsletter', 'copyright', 'all rights reserved',
                'click here', 'read more', 'advertisement', 'sponsored',
            ];
            if (boilerplate.some(s => lowerText.includes(s))) score -= 5;

            if (score > 0) { seenSentences.add(fingerprint); scored.push({ text: trimmed, score, sourceIdx: index, heading: currentHeading || undefined }); }
        });
    });

    scored.sort((a, b) => b.score - a.score);

    const selected: typeof scored = [];
    const sourceCount = new Map<number, number>();
    for (const item of scored) {
        if (selected.length >= 15) break;
        const count = sourceCount.get(item.sourceIdx) || 0;
        if (count >= 4) continue;
        selected.push(item);
        sourceCount.set(item.sourceIdx, count + 1);
    }

    if (selected.length === 0) {
        return {
            answer: "I found some websites but couldn't extract specific information. Check the sources below.",
            quickSummary: "No specific information could be extracted from the scraped sources.",
            keyTakeaways: [],
        };
    }

    // Key takeaways — from highest-trust, highest-quality sources
    const keyTakeaways: string[] = [];
    for (const item of scored.slice(0, 10)) {
        const sentenceMatch = item.text.match(/^[^.!?]*[.!?]/);
        if (sentenceMatch && sentenceMatch[0].length > 20 && sentenceMatch[0].length < 250) {
            const takeaway = sentenceMatch[0].trim();
            if (!keyTakeaways.some(t => t.substring(0, 40) === takeaway.substring(0, 40))) {
                keyTakeaways.push(takeaway);
            }
        }
        if (keyTakeaways.length >= 6) break;
    }

    // Quick summary
    const summaryParts: string[] = [];
    for (const item of scored.slice(0, 4)) {
        const sentences = item.text.match(/[^.!?]*[.!?]/g);
        if (sentences && sentences.length > 0) summaryParts.push(sentences.slice(0, 2).join('').trim());
    }
    const quickSummary = summaryParts.join(' ').substring(0, 600) || "Multiple sources were analyzed but a concise summary could not be generated.";

    // Formatted answer grouped by source
    let answer = '';
    const grouped = new Map<number, typeof scored>();
    selected.forEach(item => {
        const arr = grouped.get(item.sourceIdx) || [];
        arr.push(item);
        grouped.set(item.sourceIdx, arr);
    });

    grouped.forEach((items, sourceIdx) => {
        const source = sources[sourceIdx];
        const trustLabel = source.trustScore >= 85 ? '⭐ Highly Trusted' : source.trustScore >= 70 ? '✓ Trusted' : '';
        answer += `### From: ${source.title}${trustLabel ? ` (${trustLabel})` : ''}\n\n`;
        items.forEach(item => {
            if (item.heading) answer += `**${item.heading}**\n\n`;
            answer += `${item.text}\n\n`;
        });
    });

    const sourceNames = sources.map(s => `[${s.title}](${s.url})`);
    answer += `\n---\n*Synthesized from ${sources.length} source${sources.length > 1 ? 's' : ''}: ${sourceNames.join(', ')}*`;

    return { answer, quickSummary, keyTakeaways };
}


// ── Domain & Favicon ──────────────────────────────────────────────────────────
function extractDomainInfo(url: string): { domain: string; favicon: string } {
    try {
        const parsed = new URL(url);
        return {
            domain: parsed.hostname.replace('www.', ''),
            favicon: `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=32`,
        };
    } catch { return { domain: url, favicon: '' }; }
}


// ── Main Action ──────────────────────────────────────────────────────────────
export async function webScraperAction(input: WebScraperInput): Promise<ActionResult<WebScraperOutput>> {
    const startTime = Date.now();
    const maxSources = input.maxSources || 12;

    try {
        // Step 1: Multi-engine search (4 engines)
        const searchResults = await webSearch({ query: input.query, maxResults: maxSources + 4 });

        if (searchResults.noResults || !searchResults.results || searchResults.results.length === 0) {
            const responseTime = (Date.now() - startTime) / 1000;
            return {
                data: {
                    answer: `I couldn't find any relevant websites for: "${input.query}". Please try rephrasing.`,
                    quickSummary: 'No results found.', keyTakeaways: [], relatedQuestions: [],
                    sources: [], responseTime,
                    stats: {
                        totalSourcesFound: 0, sourcesScraped: 0, totalWords: 0,
                        averageResponseMs: 0, averageQuality: 0,
                        searchEngines: { duckduckgo: 0, brave: 0, wikipedia: 0, googleNews: 0 },
                    },
                }
            };
        }

        const searchMeta = searchResults.searchMeta || {
            sources: { duckduckgo: 0, brave: 0, wikipedia: 0, googleNews: 0 }, totalFound: 0,
        };

        // Step 2: Scrape ALL in parallel
        const topResults = searchResults.results.slice(0, maxSources);
        const scrapeResults = await Promise.allSettled(
            topResults.map(result => scrapeSingleWebsite(result.url))
        );

        const sourcesWithContent: (ScrapedSource & { content: string; headingsRaw: string[] })[] = [];
        let totalResponseMs = 0, scrapedCount = 0, totalQuality = 0;

        scrapeResults.forEach((result, index) => {
            const { domain, favicon } = extractDomainInfo(topResults[index].url);
            const trustScore = getDomainTrust(domain);

            if (result.status === 'fulfilled' && result.value.content.length > 40) {
                const wordCount = result.value.content.split(/\s+/).length;

                // If no OG image found, generate an AI placeholder
                let ogImage = result.value.meta.ogImage || '';
                if (!ogImage) {
                    ogImage = `https://image.pollinations.ai/prompt/${encodeURIComponent(topResults[index].title.substring(0, 60) + ' news photo')}?width=600&height=300&nologo=true&seed=${index + 10}`;
                }

                sourcesWithContent.push({
                    title: topResults[index].title,
                    url: topResults[index].url,
                    snippet: topResults[index].snippet,
                    domain, favicon,
                    wordCount,
                    headings: result.value.headings.slice(0, 12),
                    links: result.value.links.slice(0, 15),
                    meta: { ...result.value.meta, ogImage },
                    qualityScore: result.value.qualityScore,
                    trustScore,
                    readingTimeMin: Math.max(1, Math.round(wordCount / 200)),
                    contentType: result.value.contentType,
                    scrapeTimeMs: result.value.responseMs,
                    content: result.value.content,
                    headingsRaw: result.value.headings,
                });

                totalResponseMs += result.value.responseMs;
                totalQuality += result.value.qualityScore;
                scrapedCount++;
            } else {
                // Still include with snippet data — AI-generated image as fallback
                sourcesWithContent.push({
                    title: topResults[index].title,
                    url: topResults[index].url,
                    snippet: topResults[index].snippet,
                    domain, favicon,
                    wordCount: 0, headings: [], links: [],
                    meta: {
                        ogImage: `https://image.pollinations.ai/prompt/${encodeURIComponent(topResults[index].title.substring(0, 60) + ' illustration')}?width=600&height=300&nologo=true&seed=${index + 20}`,
                    },
                    qualityScore: 10, trustScore,
                    readingTimeMin: 0, contentType: 'other',
                    scrapeTimeMs: result.status === 'fulfilled' ? result.value.responseMs : SCRAPE_TIMEOUT_MS,
                    content: '', headingsRaw: [],
                });
            }
        });

        // Sort by combined quality+trust score
        sourcesWithContent.sort((a, b) => (b.qualityScore + b.trustScore) - (a.qualityScore + a.trustScore));

        // Step 3: Synthesize answer
        const sourcesForSynthesis = sourcesWithContent.filter(s => s.content.length > 40);
        const { answer, quickSummary, keyTakeaways } = synthesizeAnswer(
            input.query,
            sourcesForSynthesis.map(s => ({
                title: s.title, url: s.url, content: s.content,
                headings: s.headingsRaw, qualityScore: s.qualityScore, trustScore: s.trustScore,
            }))
        );

        // Step 4: Generate related questions
        const relatedQuestions = generateRelatedQuestions(input.query, sourcesForSynthesis);

        const responseTime = (Date.now() - startTime) / 1000;
        const totalWords = sourcesWithContent.reduce((sum, s) => sum + s.wordCount, 0);

        const cleanSources: ScrapedSource[] = sourcesWithContent.map(({ content, headingsRaw, ...rest }) => rest);

        return {
            data: {
                answer, quickSummary, keyTakeaways, relatedQuestions,
                sources: cleanSources, responseTime,
                stats: {
                    totalSourcesFound: searchResults.results.length,
                    sourcesScraped: scrapedCount, totalWords,
                    averageResponseMs: scrapedCount > 0 ? Math.round(totalResponseMs / scrapedCount) : 0,
                    averageQuality: scrapedCount > 0 ? Math.round(totalQuality / scrapedCount) : 0,
                    searchEngines: searchMeta.sources,
                },
            }
        };

    } catch (error: any) {
        console.error('Web scraper error:', error);
        const responseTime = (Date.now() - startTime) / 1000;
        return {
            error: error.message || 'An error occurred.',
            data: {
                answer: '', quickSummary: '', keyTakeaways: [], relatedQuestions: [],
                sources: [], responseTime,
                stats: {
                    totalSourcesFound: 0, sourcesScraped: 0, totalWords: 0,
                    averageResponseMs: 0, averageQuality: 0,
                    searchEngines: { duckduckgo: 0, brave: 0, wikipedia: 0, googleNews: 0 },
                },
            }
        };
    }
}
