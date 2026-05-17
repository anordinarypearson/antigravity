// src/lib/readability-engine.ts

/**
 * Readability Engine — Perplexity-style content extraction
 * 
 * Instead of relying on rigid CSS selectors, this module uses a scoring algorithm
 * similar to Mozilla's Readability.js and Arc90's readability to find the "main content"
 * of a webpage. This is exactly what Perplexity, DeepSeek, and other AI search engines do.
 * 
 * The algorithm:
 * 1. Score every <div>/<section>/<article> by text density, paragraph count, and link-to-text ratio
 * 2. Apply bonuses for semantic HTML (article, main, [role="main"])
 * 3. Apply penalties for boilerplate (nav, sidebar, ads, social)
 * 4. Extract the highest-scoring container as clean markdown text
 */

import { load } from 'cheerio';

type CheerioRoot = ReturnType<typeof load>;
type CheerioSel = ReturnType<CheerioRoot>;

// Boilerplate class/id patterns to penalize
const UNLIKELY_CANDIDATES = /combx|comment|community|disqus|extra|foot|header|menu|remark|rss|shoutbox|sidebar|sponsor|ad-break|agegate|pagination|pager|popup|tweet|twitter|cookie|consent|newsletter|subscribe|signup|social|share|related|follow|promo|banner|modal|overlay|widget/i;

// Positive class/id patterns
const LIKELY_CANDIDATES = /and|article|body|column|main|shadow|content|post|entry|text|blog|story|prose|documentation|wiki|paragraph|section-content|reading/i;

// Elements that should never be content
const ELEMENTS_TO_STRIP = [
    'script', 'style', 'link', 'meta', 'noscript', 'iframe', 'svg',
    'nav', 'footer', 'header[role="banner"]',
    '.advertisement', '.ads', '.ad', '.ad-container', '.ad-wrapper',
    '.cookie-banner', '.cookie-notice', '.cookie-consent', '#cookie-consent',
    '.popup', '.modal', '.overlay', '.lightbox',
    '.sidebar', '.side-bar', '.left-rail', '.right-rail',
    '.social-share', '.share-buttons', '.social-links', '.social-media',
    '.comments', '.comment-section', '#comments', '#disqus_thread',
    '.related-posts', '.related-articles', '.you-may-also-like',
    '.newsletter', '.newsletter-signup', '.subscribe', '#newsletter',
    '.login-form', '.signup-form', '.register-form',
    '.breadcrumb', '.breadcrumbs',
    '.skip-link', '.sr-only', '.screen-reader-text',
    '[aria-hidden="true"]', '[role="navigation"]', '[role="complementary"]',
    '.search-form', '.site-search',
    '.author-bio', '.author-info',
    '.table-of-contents', '.toc',
    '.print-only', '.no-print',
];

export type ExtractedContent = {
    /** Main article text as clean markdown */
    text: string;
    /** Extracted headings with hierarchy */
    headings: string[];
    /** Extracted outbound links */
    links: { text: string; url: string }[];
    /** Page metadata */
    meta: {
        title?: string;
        description?: string;
        author?: string;
        publishedDate?: string;
        ogImage?: string;
        siteName?: string;
        wordCount: number;
    };
    /** Content type classification */
    contentType: 'article' | 'docs' | 'forum' | 'wiki' | 'news' | 'other';
    /** Quality score 0-100 */
    qualityScore: number;
};

/**
 * Extract clean, readable content from raw HTML — Perplexity-style.
 */
export async function extractReadableContent(html: string, sourceUrl: string): Promise<ExtractedContent> {
    const $ = load(html);

    // Step 1: Extract metadata BEFORE stripping elements
    const meta = extractMeta($, sourceUrl);

    // Step 2: Remove all noise elements
    $(ELEMENTS_TO_STRIP.join(', ')).remove();

    // Also remove elements with inline display:none
    $('[style*="display:none"], [style*="display: none"], [style*="visibility:hidden"]').remove();

    // Step 3: Detect content type
    const contentType = classifyContent(sourceUrl, $);

    // Step 4: Extract headings
    const headings: string[] = [];
    $('h1, h2, h3, h4').each((_: number, el: any) => {
        const text = $(el).text().trim();
        if (text && text.length > 2 && text.length < 200) {
            const tag = (el.tagName || '') as string;
            const prefix = tag === 'h1' ? '# ' : tag === 'h2' ? '## ' : tag === 'h3' ? '### ' : '#### ';
            headings.push(prefix + text);
        }
    });

    // Step 5: Extract links
    const links: { text: string; url: string }[] = [];
    $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim();
        if (href && text && text.length > 2 && href.startsWith('http') && links.length < 25) {
            links.push({ text: text.substring(0, 120), url: href });
        }
    });

    // Step 6: Find the "main content" container using readability scoring
    const mainContent = findMainContent($);

    // Step 7: Convert to clean markdown text
    const text = containerToMarkdown($, mainContent);

    // Step 8: Calculate quality score
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    meta.wordCount = wordCount;

    const qualityScore = scoreQuality(text, headings, meta, contentType);

    return { text, headings, links, meta, contentType, qualityScore };
}


/**
 * Readability-inspired scoring to find the main content container.
 * This is the core algorithm that makes it work like Perplexity.
 */
function findMainContent($: CheerioRoot): CheerioSel {
    // First, try known semantic containers
    const semanticSelectors = [
        'article[role="main"]', 'main article', '[data-article-body]',
        '.article-body', '.post-body', '.post-content', '.article-content',
        '.entry-content', '.content-body', '.story-body',
        '.mw-parser-output', // Wikipedia
        '.markdown-body', // GitHub
        '.documentation-content', '.docs-content',
        '.prose', '.rich-text',
        'article', 'main', '[role="main"]',
        '#content', '#main-content', '.main-content', '.page-content',
    ];

    for (const selector of semanticSelectors) {
        const el = $(selector).first();
        if (el.length > 0 && el.text().trim().length > 200) {
            return el;
        }
    }

    // Fallback: Score every block-level container
    let bestScore = 0;
    let bestEl = $('body');

    $('div, section, td').each((_, el) => {
        const $el = $(el);
        const text = $el.text().trim();
        const textLen = text.length;

        if (textLen < 100 || textLen > 200000) return;

        let score = 0;

        // Text length bonus (logarithmic — diminishing returns for very long text)
        score += Math.min(Math.log(textLen) * 10, 100);

        // Paragraph density — the real signal
        const paragraphs = $el.find('p');
        const pCount = paragraphs.length;
        score += pCount * 5;

        // Average paragraph length bonus
        let totalParagraphText = 0;
        paragraphs.each((_, p) => {
            totalParagraphText += $(p).text().trim().length;
        });
        const avgPLen = pCount > 0 ? totalParagraphText / pCount : 0;
        if (avgPLen > 80) score += 20;
        else if (avgPLen > 40) score += 10;

        // Link density penalty — high link-to-text ratio = navigation, not content
        const linkCount = $el.find('a').length;
        const linkDensity = linkCount / Math.max(textLen / 100, 1);
        score *= (1 - Math.min(linkDensity * 0.3, 0.8));

        // Class/ID bonus/penalty
        const classId = ($el.attr('class') || '') + ' ' + ($el.attr('id') || '');
        if (LIKELY_CANDIDATES.test(classId)) score *= 1.5;
        if (UNLIKELY_CANDIDATES.test(classId)) score *= 0.3;

        // Depth penalty — very deeply nested elements are usually not main content
        const depth = $el.parents().length;
        if (depth > 15) score *= 0.5;

        // Heading presence bonus
        const headingCount = $el.find('h1, h2, h3').length;
        if (headingCount >= 2) score += 15;
        else if (headingCount >= 1) score += 8;

        if (score > bestScore) {
            bestScore = score;
            bestEl = $el;
        }
    });

    return bestEl;
}


/**
 * Convert a container element to clean markdown text.
 */
function containerToMarkdown($: CheerioRoot, container: CheerioSel): string {
    const lines: string[] = [];
    const MAX_LENGTH = 12000;
    let totalLen = 0;

    container.find('p, li, h1, h2, h3, h4, h5, h6, blockquote, pre, figcaption, td, th, dt, dd').each((_: number, el: any) => {
        if (totalLen >= MAX_LENGTH) return;

        const $el = $(el);
        const tag = (el.tagName ?? '') as string;
        let content = $el.text().trim();

        if (!content || content.length < 8) return;

        // Format based on tag type
        if (tag.startsWith('h')) {
            content = '#'.repeat(parseInt(tag[1])) + ' ' + content;
        } else if (tag === 'li') {
            content = '• ' + content;
        } else if (tag === 'blockquote') {
            content = '> ' + content;
        } else if (tag === 'pre') {
            content = '```\n' + content + '\n```';
        }

        lines.push(content);
        totalLen += content.length;
    });

    // Fallback: if structured extraction gave very little, use raw text
    let text = lines.join('\n\n');
    if (text.length < 200 && container.text().trim().length > 200) {
        text = container.text().trim();
    }

    // Clean up
    text = text
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    return text.substring(0, MAX_LENGTH);
}


/**
 * Extract page metadata.
 */
function extractMeta($: CheerioRoot, sourceUrl: string): ExtractedContent['meta'] {
    const ogImage = $('meta[property="og:image"]').attr('content')
        || $('meta[property="og:image:url"]').attr('content')
        || $('meta[name="twitter:image"]').attr('content')
        || $('meta[name="twitter:image:src"]').attr('content')
        || $('article img[src]').first().attr('src')
        || $('main img[src]').first().attr('src')
        || $('figure img[src]').first().attr('src')
        || $('img[src^="http"]').not('[src*="icon"]').not('[src*="logo"]').not('[src*="avatar"]').not('[width="1"]').first().attr('src')
        || '';

    // Resolve relative ogImage URLs
    let resolvedOgImage = ogImage;
    if (ogImage && !ogImage.startsWith('http')) {
        try {
            resolvedOgImage = new URL(ogImage, sourceUrl).href;
        } catch {
            resolvedOgImage = '';
        }
    }

    return {
        title: $('meta[property="og:title"]').attr('content')
            || $('title').text().trim()
            || $('h1').first().text().trim() || '',
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
        ogImage: resolvedOgImage,
        siteName: $('meta[property="og:site_name"]').attr('content') || '',
        wordCount: 0, // Will be set after extraction
    };
}


/**
 * Classify the type of content.
 */
function classifyContent(url: string, $: CheerioRoot): ExtractedContent['contentType'] {
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


/**
 * Score the quality of extracted content.
 */
function scoreQuality(
    text: string,
    headings: string[],
    meta: ExtractedContent['meta'],
    contentType: ExtractedContent['contentType']
): number {
    let score = 40;
    const wordCount = meta.wordCount;

    // Content length scoring
    if (wordCount > 800) score += 15;
    else if (wordCount > 400) score += 12;
    else if (wordCount > 200) score += 8;
    else if (wordCount > 100) score += 4;

    // Heading structure
    if (headings.length >= 5) score += 10;
    else if (headings.length >= 3) score += 7;
    else if (headings.length >= 1) score += 4;

    // Metadata completeness
    if (meta.description && meta.description.length > 50) score += 4;
    if (meta.author) score += 3;
    if (meta.publishedDate) score += 3;
    if (meta.ogImage) score += 3;

    // Paragraph structure
    const paragraphs = text.split('\n\n').filter(p => p.trim().length > 60);
    if (paragraphs.length >= 6) score += 10;
    else if (paragraphs.length >= 3) score += 6;
    else if (paragraphs.length >= 1) score += 2;

    // Penalties
    if (wordCount < 30) score -= 25;
    if (text.includes('Access Denied') || text.includes('403 Forbidden') ||
        text.includes('Please enable JavaScript') || text.includes('Captcha') ||
        text.includes('Just a moment') || text.includes('Checking your browser')) {
        score -= 35;
    }

    return Math.max(0, Math.min(100, score));
}
