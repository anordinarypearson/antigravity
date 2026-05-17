'use server';

import { webSearch } from '@/ai/tools/web-search';
import { searchImages } from '@/ai/tools/image-search';
import * as cheerio from 'cheerio';
import { openai } from '@/lib/openai';
import { DEFAULT_MODEL_ID } from '@/lib/models';
import { stealthFetchWithRetry } from '@/lib/stealth-fetch';
import { extractReadableContent, type ExtractedContent } from '@/lib/readability-engine';

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
        searchEngines: { duckduckgo: number; brave: number; wikipedia: number; googleNews: number; bing: number; searxng: number; scholar: number; mojeek: number };
    };
    error?: string;
};

export type ActionResult<T> = {
    data?: T;
    error?: string;
};

// ── Speed settings ───────────────────────────────────────────────────────────
const SCRAPE_TIMEOUT_MS = 10000;  // 10 seconds timeout for slower sites
const MAX_CONTENT_LENGTH = 10000;  // Increased to get more content per page

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
    'reddit.com': 70, 'quora.com': 60,
    'geeksforgeeks.org': 72, 'w3schools.com': 68,
    'freecodecamp.org': 75, 'digitalocean.com': 78,
    'thehindu.com': 78, 'ndtv.com': 72, 'hindustantimes.com': 70,
    'indiatimes.com': 68, 'timesofindia.indiatimes.com': 72,
    // Tier 4: Community & blogs (50-65)
    'substack.com': 62, 'news.ycombinator.com': 72,
    'hackernews.com': 72, 'lobste.rs': 65,
    'producthunt.com': 60, 'devhunt.org': 58,
    'css-tricks.com': 75, 'smashingmagazine.com': 78,
    'towardsdatascience.com': 70, 'analyticsvidhya.com': 68,
    'kaggle.com': 72, 'huggingface.co': 78,
    'indiabix.com': 60, 'javatpoint.com': 65,
    'tutorialspoint.com': 68, 'programiz.com': 70,
    'cricket.com': 70, 'cricbuzz.com': 78, 'iplt20.com': 72,
    'bollywoodhungama.com': 60, 'filmfare.com': 62,
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
            || $('meta[name="twitter:image:src"]').attr('content')
            // Fallback: first large image in article content
            || $('article img[src]').first().attr('src')
            || $('main img[src]').first().attr('src')
            || $('[role="main"] img[src]').first().attr('src')
            || $('figure img[src]').first().attr('src')
            || $('img[src^="http"]').not('[src*="icon"]').not('[src*="logo"]').not('[src*="avatar"]').not('[width="1"]').first().attr('src')
            || '',
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
        // Perplexity-style: Use stealth fetch with rotating UA and automatic retry
        const response = await stealthFetchWithRetry(url, {
            timeout: SCRAPE_TIMEOUT_MS,
            queryContext: url,
        }, 2);

        if (!response.ok) {
            return { content: '', headings: [], links: [], meta: {}, responseMs: Date.now() - start, contentType: 'other', qualityScore: 0, trustScore };
        }

        const ct = response.headers.get('content-type') || '';
        if (!ct.includes('text/html') && !ct.includes('application/xhtml')) {
            return { content: '', headings: [], links: [], meta: {}, responseMs: Date.now() - start, contentType: 'other', qualityScore: 0, trustScore };
        }

        const html = await response.text();

        // Perplexity-style: Use readability engine instead of basic CSS selectors
        const extracted = await extractReadableContent(html, url);

        // Apply trust score bonus to quality
        const adjustedQuality = Math.min(100, extracted.qualityScore + Math.round((trustScore - 50) / 10));

        setCache(url, {
            content: extracted.text, headings: extracted.headings,
            links: extracted.links, meta: extracted.meta, timestamp: Date.now(),
        });

        return {
            content: extracted.text, headings: extracted.headings,
            links: extracted.links, meta: extracted.meta,
            responseMs: Date.now() - start, contentType: extracted.contentType,
            qualityScore: adjustedQuality, trustScore,
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


// ── AI-Powered Answer Synthesis ──────────────────────────────────────────────

async function aiSynthesizeAnswer(
    query: string,
    sources: { title: string; url: string; content: string; headings: string[]; qualityScore: number; trustScore: number }[],
    extractMode: 'full' | 'summary' | 'structured' = 'summary'
): Promise<{ answer: string; quickSummary: string; keyTakeaways: string[]; relatedQuestions: string[] } | null> {
    try {
        // Dramatically optimize inference speed by sending ONLY the top N most relevant dense paragraphs 
        // across ALL scraped sources instead of dumping thousands of raw HTML bytes.
        const { selected } = rankPassages(query, sources);
        
        const contextParts: string[] = [];
        let totalLen = 0;
        const MAX_CONTEXT = extractMode === 'full' ? 50000 : 7000; // Deep Research gets huge context block

        for (const item of selected) {
            if (totalLen >= MAX_CONTEXT) break;
            const source = sources[item.sourceIdx];
            const passage = `[From: ${source.title} (${source.url})]\n${item.heading ? `${item.heading}\n` : ''}${item.text}`;
            contextParts.push(passage);
            totalLen += passage.length;
        }

        if (contextParts.length === 0) return null;

        const context = contextParts.join('\n\n---\n\n');

        const systemPrompt = `You are a search answer synthesizer. Given a user query and scraped web content from multiple sources, produce a well-structured, accurate answer.

RULES:
- Write a natural, comprehensive answer in markdown format
- Use headers (##, ###), bullet points, and bold for key terms
- Cite source names naturally (e.g. "According to [Source Name]...")
- Do NOT make up facts — only use information from the provided sources
- Be concise but thorough — target 200-400 words for the answer
- If sources conflict, mention both perspectives
- Use a warm, informative tone

You MUST respond ONLY with a valid JSON object. Do NOT include any conversational text before or after the JSON.
Your entire response must be parseable by JSON.parse().

{
  "answer": "The full markdown answer...",
  "quickSummary": "A 1-2 sentence summary (max 150 words)",
  "keyTakeaways": ["takeaway 1", "takeaway 2", "takeaway 3", "takeaway 4"],
  "relatedQuestions": ["question 1?", "question 2?", "question 3?", "question 4?"]
}`;

        const userPrompt = `Query: "${query}"

Sources:
${context}

Synthesize a comprehensive answer from these sources. Remember, you must return ONLY a valid JSON object matching the exact format specified in your system prompt. Do not output anything else.`;

        const response = await openai.chat.completions.create({
            model: 'Meta-Llama-3.3-70B-Instruct', // Fast SambaNova model
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            // Removed response_format as it causes 404s on some SambaNova endpoints
            max_tokens: extractMode === 'full' ? 3000 : 1500, // Longer answer for deep research
            temperature: 0.3,
            top_p: 0.9,
        });

        const raw = response.choices[0]?.message?.content?.trim();
        if (!raw) return null;

        // Robust JSON extraction — handle markdown fences, bad control chars, etc.
        let jsonStr = raw;

        // Strip markdown code fences if present
        jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

        // Try to extract JSON object using regex if the model added surrounding text
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) jsonStr = jsonMatch[0];

        // Sanitize: remove bad control characters that are not valid JSON whitespace
        jsonStr = jsonStr.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ');

        // Fix unquoted JSON keys (which LLaMa sometimes outputs like { answer: "..." })
        jsonStr = jsonStr.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');

        let parsed: any;
        try {
            parsed = JSON.parse(jsonStr);
        } catch (e1) {
            try {
                // Last resort: replace unescaped newlines that may be inside JSON strings
                const sanitized = jsonStr.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
                parsed = JSON.parse(sanitized);
            } catch (e2) {
                console.error('[AI Synthesis] JSON parse failed entirely. Raw output:', raw.substring(0, 500));
                throw e2; // Propagate to catch block
            }
        }

        // Validate structure
        if (!parsed.answer || typeof parsed.answer !== 'string') return null;

        // Unescape newlines in answer for proper markdown rendering
        parsed.answer = parsed.answer.replace(/\\n/g, '\n');
        if (typeof parsed.quickSummary === 'string') parsed.quickSummary = parsed.quickSummary.replace(/\\n/g, '\n');

        // Append source attribution to the answer
        const sourceLinks = sources.slice(0, 6).map(s => `[${s.title}](${s.url})`);
        parsed.answer += `\n\n---\n*Synthesized from ${sources.length} source${sources.length > 1 ? 's' : ''}: ${sourceLinks.join(', ')}*`;

        return {
            answer: parsed.answer,
            quickSummary: parsed.quickSummary || '',
            keyTakeaways: Array.isArray(parsed.keyTakeaways) ? parsed.keyTakeaways.slice(0, 6) : [],
            relatedQuestions: Array.isArray(parsed.relatedQuestions) ? parsed.relatedQuestions.slice(0, 5) : [],
        };
    } catch (error: any) {
        console.error('[AI Synthesis] Failed, falling back to manual:', error.message?.substring(0, 500));
        return null;
    }
}


// ── Manual Answer Synthesis (Fallback) ───────────────────────────────────────

// Utility: split text into proper sentences handling abbreviations
function splitSentences(text: string): string[] {
    // Protect common abbreviations from false sentence breaks
    const protected_ = text
        .replace(/\b(Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|vs|etc|Inc|Ltd|Corp|Dept|Univ|approx|est)\./gi, '$1\u2024')
        .replace(/\b(U\.S|U\.K|U\.N|E\.U|A\.I)\./gi, (m) => m.replace(/\./g, '\u2024'))
        .replace(/\b([A-Z])\./g, '$1\u2024');

    const sentences = protected_.split(/(?<=[.!?])\s+(?=[A-Z\u201c"(])|(?<=[.!?])$/g)
        .map(s => s.replace(/\u2024/g, '.').trim())
        .filter(s => s.length > 15);

    return sentences.length > 0 ? sentences : [text.trim()].filter(s => s.length > 15);
}

// Utility: Jaccard similarity between two strings (word-level)
function jaccardSimilarity(a: string, b: string): number {
    const setA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const setB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    if (setA.size === 0 || setB.size === 0) return 0;
    let intersection = 0;
    for (const word of setA) { if (setB.has(word)) intersection++; }
    return intersection / (setA.size + setB.size - intersection);
}

function rankPassages(
    query: string,
    sources: { title: string; url: string; content: string; headings: string[]; qualityScore: number; trustScore: number }[]
) {
    const stopWords = new Set([
        'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
        'in', 'with', 'to', 'for', 'of', 'not', 'from', 'by', 'it', 'as',
        'this', 'that', 'are', 'was', 'were', 'will', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'can', 'could', 'would',
        'should', 'may', 'might', 'shall', 'what', 'how', 'why', 'when',
        'where', 'who', 'whom', 'whose', 'about', 'their', 'there', 'then',
        'also', 'just', 'more', 'some', 'such', 'than', 'too', 'very',
        'into', 'over', 'only', 'other', 'its', 'our', 'your', 'any',
    ]);

    const queryKeywords = query.toLowerCase()
        .split(/[\s,;.!?]+/)
        .filter(w => w.length > 2 && !stopWords.has(w));

    // TF-IDF-like term weighting: rarer keywords across sources get higher weight
    const keywordDocFreq = new Map<string, number>();
    for (const kw of queryKeywords) {
        let docCount = 0;
        for (const source of sources) {
            if (source.content.toLowerCase().includes(kw)) docCount++;
        }
        keywordDocFreq.set(kw, docCount);
    }
    const totalDocs = Math.max(sources.length, 1);
    const keywordWeights = new Map<string, number>();
    for (const kw of queryKeywords) {
        const df = keywordDocFreq.get(kw) || 0;
        const idf = 1.0 + Math.log(totalDocs / Math.max(df, 1));
        keywordWeights.set(kw, idf);
    }

    const queryBigrams: string[] = [];
    const words = query.toLowerCase().split(/\s+/);
    for (let i = 0; i < words.length - 1; i++) queryBigrams.push(words[i] + ' ' + words[i + 1]);

    const boilerplate = [
        'cookie', 'privacy policy', 'terms of service', 'subscribe',
        'sign up', 'log in', 'newsletter', 'copyright', 'all rights reserved',
        'click here', 'read more', 'advertisement', 'sponsored',
        'accept cookies', 'share this article', 'follow us on', 'join our',
        'related articles', 'trending now', 'you may also like',
        'enable javascript', 'browser does not support', 'skip to content',
        'we use cookies', 'manage preferences', 'consent', 'gdpr',
        'unsubscribe', 'your email address', 'sign in to', 'create an account',
        'download the app', 'get the latest', 'breaking news alert',
    ];

    const scored: { text: string; score: number; sourceIdx: number; heading?: string; keywordsCovered: Set<string> }[] = [];
    const seenSentences = new Set<string>();

    sources.forEach((source, index) => {
        if (!source.content) return;
        let currentHeading = '';
        let headingRelevance = 0;
        const lines = source.content.split('\n');

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;

            if (trimmed.startsWith('#')) {
                currentHeading = trimmed.replace(/^#+\s*/, '');
                const headingLower = currentHeading.toLowerCase();
                headingRelevance = 0;
                queryKeywords.forEach(keyword => {
                    if (headingLower.includes(keyword)) headingRelevance += 4;
                });
                return;
            }

            if (trimmed.length < 40 || trimmed.length > 1800) return;

            const fingerprint = trimmed.substring(0, 80).toLowerCase().replace(/\s+/g, ' ');
            if (seenSentences.has(fingerprint)) return;

            let score = 0;
            const lowerText = trimmed.toLowerCase();
            const qualMult = 0.4 + (source.qualityScore / 100) * 0.6;
            const trustMult = 0.5 + (source.trustScore / 100) * 0.5;
            const combined = qualMult * trustMult;

            const coveredKeywords = new Set<string>();

            queryKeywords.forEach(keyword => {
                const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
                const matches = lowerText.match(regex);
                const weight = keywordWeights.get(keyword) || 1.0;
                if (matches) {
                    score += matches.length * 2.5 * weight * combined;
                    coveredKeywords.add(keyword);
                }
            });

            queryBigrams.forEach(bigram => {
                if (lowerText.includes(bigram)) score += 7 * combined;
            });

            if (queryKeywords.length > 1 && coveredKeywords.size > 1) {
                const coverageRatio = coveredKeywords.size / queryKeywords.length;
                score += coverageRatio * 8 * combined;
            }

            const position = source.content.indexOf(trimmed);
            if (position < 500) score += 4;
            else if (position < 1500) score += 2;
            else if (position < 3000) score += 1;

            if (trimmed.length > 120 && trimmed.length < 600) score += 2.5;
            else if (trimmed.length > 80 && trimmed.length < 900) score += 1.5;

            if (headingRelevance > 0) score += headingRelevance * combined;

            if (boilerplate.some(s => lowerText.includes(s))) score -= 8;
            if (trimmed.length < 50) score -= 3;
            if (trimmed.split(' ').length < 5 && !trimmed.endsWith('.')) score -= 2;

            if (score > 0) {
                seenSentences.add(fingerprint);
                scored.push({ text: trimmed, score, sourceIdx: index, heading: currentHeading || undefined, keywordsCovered: coveredKeywords });
            }
        });
    });

    scored.sort((a, b) => b.score - a.score);

    const selected: typeof scored = [];
    const sourceCount = new Map<number, number>();
    for (const item of scored) {
        if (selected.length >= 30) break;
        const count = sourceCount.get(item.sourceIdx) || 0;
        if (count >= 5) continue;
        selected.push(item);
        sourceCount.set(item.sourceIdx, count + 1);
    }
    
    return { selected, scored, boilerplate }; 
}

function synthesizeAnswer(
    query: string,
    sources: { title: string; url: string; content: string; headings: string[]; qualityScore: number; trustScore: number }[]
): { answer: string; quickSummary: string; keyTakeaways: string[] } {
    const { selected, scored, boilerplate } = rankPassages(query, sources);


    if (selected.length === 0) {
        return {
            answer: "I found some websites but couldn't extract specific information. Check the sources below.",
            quickSummary: "No specific information could be extracted from the scraped sources.",
            keyTakeaways: [],
        };
    }

    // ── Direct-answer intro ──
    // Build an intro sentence that directly addresses the query
    const topPassage = scored[0];
    const topSource = sources[topPassage.sourceIdx];
    const topSentences = splitSentences(topPassage.text);
    const introSentence = topSentences[0] || topPassage.text.substring(0, 200);
    const sourceCountUsed = new Set(selected.map(s => s.sourceIdx)).size;
    const directIntro = `Based on ${sourceCountUsed} source${sourceCountUsed > 1 ? 's' : ''}, here's what we found:\n\n> ${introSentence}${introSentence.endsWith('.') || introSentence.endsWith('!') || introSentence.endsWith('?') ? '' : '.'}\n\n`;

    // ── Key takeaways — with Jaccard deduplication and source diversity ──
    const keyTakeaways: string[] = [];
    const takeawaySourceSeen = new Set<number>();

    for (const item of scored.slice(0, 20)) {
        if (keyTakeaways.length >= 6) break;

        const sentences = splitSentences(item.text);
        for (const sentence of sentences) {
            if (sentence.length < 25 || sentence.length > 280) continue;
            const cleaned = sentence.trim();

            // Skip if too similar to existing takeaways (Jaccard > 0.5)
            const isDuplicate = keyTakeaways.some(existing => jaccardSimilarity(existing, cleaned) > 0.45);
            if (isDuplicate) continue;

            // Skip boilerplate
            const lc = cleaned.toLowerCase();
            if (boilerplate.some(b => lc.includes(b))) continue;

            // Prefer diverse sources
            if (takeawaySourceSeen.size < sourceCountUsed || !takeawaySourceSeen.has(item.sourceIdx)) {
                keyTakeaways.push(cleaned);
                takeawaySourceSeen.add(item.sourceIdx);
            }

            if (keyTakeaways.length >= 6) break;
        }
    }

    // ── Quick summary — coherent paragraph from best passages ──
    let quickSummary = '';
    const summaryPassages: string[] = [];
    const summarySources = new Set<number>();

    // Pick top 3 highest-scoring passages from different sources
    for (const item of scored) {
        if (summaryPassages.length >= 3) break;
        if (summarySources.has(item.sourceIdx) && summarySources.size < Math.min(sourceCountUsed, 3)) continue;

        const sentences = splitSentences(item.text);
        // Take the first 1-2 most informative sentences
        const goodSentences = sentences
            .filter(s => s.length > 25 && s.length < 300)
            .filter(s => !boilerplate.some(b => s.toLowerCase().includes(b)))
            .slice(0, 2);

        if (goodSentences.length > 0) {
            const passage = goodSentences.join(' ').trim();
            // Check it's not too similar to existing summary passages
            if (!summaryPassages.some(p => jaccardSimilarity(p, passage) > 0.5)) {
                summaryPassages.push(passage);
                summarySources.add(item.sourceIdx);
            }
        }
    }

    if (summaryPassages.length > 0) {
        quickSummary = summaryPassages.join(' ').substring(0, 700);
        // Ensure it ends at a sentence boundary
        const lastPeriod = Math.max(
            quickSummary.lastIndexOf('.'),
            quickSummary.lastIndexOf('!'),
            quickSummary.lastIndexOf('?')
        );
        if (lastPeriod > quickSummary.length * 0.5) {
            quickSummary = quickSummary.substring(0, lastPeriod + 1);
        }
    } else {
        quickSummary = "Multiple sources were analyzed but a concise summary could not be generated.";
    }

    // ── Formatted answer grouped by source ──
    let answer = directIntro;
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
    const maxSources = input.maxSources || 20; // Expanded to 20 for much wider search footprint

    try {
        // Step 1: Multi-engine search (4 engines)
        const searchResults = await webSearch({ query: input.query, maxResults: maxSources + 4 });

        if (!searchResults.results || searchResults.results.length === 0) {
            const responseTime = (Date.now() - startTime) / 1000;
            return {
                data: {
                    answer: `I couldn't find any relevant websites for: "${input.query}". Please try rephrasing.`,
                    quickSummary: 'No results found.', keyTakeaways: [], relatedQuestions: [],
                    sources: [], responseTime,
                    stats: {
                        totalSourcesFound: 0, sourcesScraped: 0, totalWords: 0,
                        averageResponseMs: 0, averageQuality: 0,
                        searchEngines: { duckduckgo: 0, brave: 0, wikipedia: 0, googleNews: 0, bing: 0, searxng: 0, scholar: 0, mojeek: 0 },
                    },
                }
            };
        }

        const searchMeta = searchResults.searchMeta || {
            sources: { duckduckgo: 0, brave: 0, wikipedia: 0, googleNews: 0, bing: 0 }, totalFound: 0,
        };

        // Step 2: Scrape ALL in parallel + query for real background images
        const topResults = searchResults.results.slice(0, maxSources);
        
        const [scrapeResults, imageSearchData] = await Promise.all([
            Promise.allSettled(topResults.map(result => scrapeSingleWebsite(result.url))),
            searchImages({ query: input.query }).catch(() => ({ images: [] }))
        ]);

        const accurateImages = imageSearchData.images || [];
        let imageIndex = 0;

        const sourcesWithContent: (ScrapedSource & { content: string; headingsRaw: string[] })[] = [];
        let totalResponseMs = 0, scrapedCount = 0, totalQuality = 0;

        scrapeResults.forEach((result, index) => {
            const { domain, favicon } = extractDomainInfo(topResults[index].url);
            const trustScore = getDomainTrust(domain);

            if (result.status === 'fulfilled' && result.value.content.length > 40) {
                const wordCount = result.value.content.split(/\s+/).length;

                // Use accurate real web images
                let ogImage = result.value.meta.ogImage || '';
                
                // If missing, look at our Bing Web Search results for matching query images
                if (!ogImage) {
                    if (imageIndex < accurateImages.length) {
                        ogImage = accurateImages[imageIndex].url;
                        imageIndex++;
                    } else {
                        ogImage = `https://image.pollinations.ai/prompt/${encodeURIComponent(topResults[index].title.substring(0, 60) + ' informative scene')}?width=600&height=300&nologo=true&seed=${index + 10}`;
                    }
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
                        ogImage: (imageIndex < accurateImages.length) ? accurateImages[imageIndex++].url : `https://image.pollinations.ai/prompt/${encodeURIComponent(topResults[index].title.substring(0, 60) + ' illustration')}?width=600&height=300&nologo=true&seed=${index + 20}`,
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

        // Step 3: Synthesize answer — AI-first with manual fallback
        const sourcesForSynthesis = sourcesWithContent.filter(s => s.content.length > 40);
        const synthInput = sourcesForSynthesis.map(s => ({
            title: s.title, url: s.url, content: s.content,
            headings: s.headingsRaw, qualityScore: s.qualityScore, trustScore: s.trustScore,
        }));

        let answer: string;
        let quickSummary: string;
        let keyTakeaways: string[];
        let relatedQuestions: string[];

        // Try AI synthesis first for much better quality
        const aiResult = synthInput.length > 0 ? await aiSynthesizeAnswer(input.query, synthInput, input.extractMode) : null;

        if (aiResult) {
            console.log('[Web Scraper] Using AI-synthesized answer');
            answer = aiResult.answer;
            quickSummary = aiResult.quickSummary;
            keyTakeaways = aiResult.keyTakeaways;
            relatedQuestions = aiResult.relatedQuestions;
        } else {
            // Fallback to manual synthesis
            console.log('[Web Scraper] Using manual synthesis (AI unavailable)');
            const manual = synthesizeAnswer(input.query, synthInput);
            answer = manual.answer;
            quickSummary = manual.quickSummary;
            keyTakeaways = manual.keyTakeaways;
            relatedQuestions = generateRelatedQuestions(input.query, sourcesForSynthesis);
        }

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
                    searchEngines: {
                        duckduckgo: searchMeta.sources.duckduckgo ?? 0,
                        brave: searchMeta.sources.brave ?? 0,
                        wikipedia: searchMeta.sources.wikipedia ?? 0,
                        googleNews: searchMeta.sources.googleNews ?? 0,
                        bing: searchMeta.sources.bing ?? 0,
                        searxng: searchMeta.sources.searxng ?? 0,
                        scholar: searchMeta.sources.scholar ?? 0,
                        mojeek: searchMeta.sources.mojeek ?? 0,
                    },
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
                    searchEngines: { duckduckgo: 0, brave: 0, wikipedia: 0, googleNews: 0, bing: 0, searxng: 0, scholar: 0, mojeek: 0 },
                },
            }
        };
    }
}
