'use server';

import { z } from 'zod';
import * as cheerio from 'cheerio';
import { stealthFetch } from '@/lib/stealth-fetch';
import { withCache, CACHE_TTL } from '@/lib/search-cache';
import { generateExtractiveSummary } from '@/lib/summarizer';

const SearchResultSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  snippet: z.string(),
});

export type WebSearchInput = {
  query: string;
  maxResults?: number;
};

export type WebSearchResult = z.infer<typeof SearchResultSchema>;

// Decode HTML entities from snippet text
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&#\d+;/g, '') // Remove other numeric entities
    .replace(/\s+/g, ' ')
    .trim();
}

// Quick summary generation from top snippets (no AI — pure heuristic)
function generateQuickSummary(results: WebSearchResult[], query: string): string {
  if (results.length === 0) return '';

  const cleanSnippet = (raw: string): string => {
    let s = decodeHtmlEntities(raw);
    // Strip news attribution: "The New York Times — Thu, 07 May 2026 22:15:33 GMT:"
    s = s.replace(/^[A-Z][\w\s&'.,-]+(?: —| –| -| \|)\s*(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[^:]*:\s*/i, '');
    s = s.replace(/^(?:Reuters|AP|BBC[\w\s]*|CNN|The [\w\s]+Times|The Guardian|Al Jazeera|NDTV|Bloomberg|Forbes|Axios|NPR)[\s.—–:-]+/i, '');
    s = s.replace(/(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s+\d{1,2}\s+\w+\s+\d{4}[\s\d:]*(?:GMT|UTC|EST|PST|IST)?:?\s*/gi, '');
    s = s.replace(/^\s*\d{1,2}:\d{2}(?:\s*(?:AM|PM|GMT|UTC|EST|PST|IST))?[\s:|-]*\s*/i, '');
    s = s.replace(/(?:Updated\s+)?\d+\s+(?:hours?|minutes?|mins?|days?|seconds?)\s+ago\.?\s*/gi, '');
    return s.trim();
  };

  const rankedResults = [...results]
    .filter(r => !r.url.includes('news.google') && !r.url.includes('reuters.com') && !r.url.includes('bbc.'))
    .sort((a, b) => {
      const isAInfo = a.url.includes('wikipedia.org') || a.url.includes('britannica.com') || a.url.includes('.edu') || a.url.includes('.org');
      const isBInfo = b.url.includes('wikipedia.org') || b.url.includes('britannica.com') || b.url.includes('.edu') || b.url.includes('.org');
      if (isAInfo && !isBInfo) return -1;
      if (!isAInfo && isBInfo) return 1;
      return 0;
    });

  const topSnippets = rankedResults
    .slice(0, 12)
    .map(r => cleanSnippet(r.snippet))
    .filter(s => s.length > 50 && s.length < 350
      && !s.startsWith('No description')
      && !/cookie|privacy|subscribe|sign.?up|copyright|shop|cart|checkout/i.test(s)
      && !/^(home|menu|search|skip to|share|order online|delivery)/i.test(s));
  
  if (topSnippets.length === 0) return '';

  const combinedText = topSnippets.join(' . ');
  return generateExtractiveSummary(combinedText, 8, query);
}

/**
 * Multi-source web search combining:
 * 1. DuckDuckGo HTML (web search, no API key)
 * 2. Brave Search (web search, no API key)
 * 3. Wikipedia (reliable knowledge base)
 * 4. Google News RSS (fresh news articles with images)
 * 5. Bing Search (web search, no API key)
 *
 * All sources are queried in parallel for maximum speed.
 */
export async function webSearch({ query, maxResults = 20 }: WebSearchInput) {
  const results: WebSearchResult[] = [];
  const seenUrls = new Set<string>();
  const seenDomains = new Map<string, number>();

  // Run ALL 8 search engines in parallel — each individually cached
  const [ddgResults, braveResults, wikiResults, newsResults, bingResults, searxResults, scholarResults, mojeekResults] = await Promise.allSettled([
    withCache('ddg', query, CACHE_TTL.WEB_SEARCH, () => searchDuckDuckGo(query)),
    withCache('brave', query, CACHE_TTL.WEB_SEARCH, () => searchBrave(query)),
    withCache('wiki', query, CACHE_TTL.REFERENCE, () => searchWikipedia(query)),
    withCache('gnews', query, CACHE_TTL.NEWS, () => searchGoogleNews(query)),
    withCache('bing', query, CACHE_TTL.WEB_SEARCH, () => searchBing(query)),
    withCache('searx', query, CACHE_TTL.WEB_SEARCH, () => searchSearXNG(query)),
    withCache('scholar', query, CACHE_TTL.REFERENCE, () => searchGoogleScholar(query)),
    withCache('mojeek', query, CACHE_TTL.WEB_SEARCH, () => searchMojeek(query)),
  ]);

  // Log search engine results for debugging
  console.log(`[WebSearch] DDG: ${ddgResults.status === 'fulfilled' ? ddgResults.value.length : 'failed'}, Brave: ${braveResults.status === 'fulfilled' ? braveResults.value.length : 'failed'}, Wiki: ${wikiResults.status === 'fulfilled' ? wikiResults.value.length : 'failed'}, News: ${newsResults.status === 'fulfilled' ? newsResults.value.length : 'failed'}, Bing: ${bingResults.status === 'fulfilled' ? bingResults.value.length : 'failed'}, SearX: ${searxResults.status === 'fulfilled' ? searxResults.value.length : 'failed'}, Scholar: ${scholarResults.status === 'fulfilled' ? scholarResults.value.length : 'failed'}, Mojeek: ${mojeekResults.status === 'fulfilled' ? mojeekResults.value.length : 'failed'}`);

  // Interleave results: news first for freshness, then DDG, Scholar, SearX, Mojeek, Bing, Brave, Wiki
  const allBuckets: WebSearchResult[][] = [];

  if (newsResults.status === 'fulfilled' && newsResults.value.length > 0) allBuckets.push(newsResults.value);
  if (ddgResults.status === 'fulfilled' && ddgResults.value.length > 0) allBuckets.push(ddgResults.value);
  if (scholarResults.status === 'fulfilled' && scholarResults.value.length > 0) allBuckets.push(scholarResults.value);
  if (searxResults.status === 'fulfilled' && searxResults.value.length > 0) allBuckets.push(searxResults.value);
  if (mojeekResults.status === 'fulfilled' && mojeekResults.value.length > 0) allBuckets.push(mojeekResults.value);
  if (bingResults.status === 'fulfilled' && bingResults.value.length > 0) allBuckets.push(bingResults.value);
  if (braveResults.status === 'fulfilled' && braveResults.value.length > 0) allBuckets.push(braveResults.value);
  if (wikiResults.status === 'fulfilled' && wikiResults.value.length > 0) allBuckets.push(wikiResults.value);

  // Round-robin interleave for diverse results with snippet quality filtering
  const maxLen = Math.max(...allBuckets.map(b => b.length), 0);
  for (let i = 0; i < maxLen && results.length < maxResults; i++) {
    for (const bucket of allBuckets) {
      if (i < bucket.length && results.length < maxResults) {
        const result = bucket[i];
        const domain = extractDomain(result.url);
        const domainCount = seenDomains.get(domain) || 0;

        // Skip results with very poor snippets (< 15 chars or just "No description")
        const hasGoodSnippet = result.snippet && result.snippet.length > 15 && !result.snippet.startsWith('No description');

        // Allow max 3 results per domain for diversity
        if (!seenUrls.has(result.url) && domainCount < 3 && (hasGoodSnippet || results.length < 5)) {
          seenUrls.add(result.url);
          seenDomains.set(domain, domainCount + 1);
          results.push(result);
        }
      }
    }
  }

  if (results.length === 0) {
    return { results: [], quickSummary: '', searchMeta: { sources: {}, totalFound: 0 } };
  }

  // Generate a quick summary from the top results
  const quickSummary = generateQuickSummary(results, query);

  return {
    results,
    quickSummary,
    searchMeta: {
      sources: {
        duckduckgo: ddgResults.status === 'fulfilled' ? ddgResults.value.length : 0,
        brave: braveResults.status === 'fulfilled' ? braveResults.value.length : 0,
        wikipedia: wikiResults.status === 'fulfilled' ? wikiResults.value.length : 0,
        googleNews: newsResults.status === 'fulfilled' ? newsResults.value.length : 0,
        bing: bingResults.status === 'fulfilled' ? bingResults.value.length : 0,
        searxng: searxResults.status === 'fulfilled' ? searxResults.value.length : 0,
        scholar: scholarResults.status === 'fulfilled' ? scholarResults.value.length : 0,
        mojeek: mojeekResults.status === 'fulfilled' ? mojeekResults.value.length : 0,
      },
      totalFound: results.length,
    },
  };
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

/**
 * Search Google News RSS for fresh, trending articles.
 * This returns real news with usually reliable OG images.
 */
async function searchGoogleNews(query: string): Promise<WebSearchResult[]> {
  try {
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;

    const response = await stealthFetch(rssUrl, {
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
      timeout: 6000,
    });

    if (!response.ok) return [];

    const xml = await response.text();
    const results: WebSearchResult[] = [];
    const $ = cheerio.load(xml, { xmlMode: true });

    $('item').slice(0, 8).each((_, element) => {
      const el = $(element);
      const title = el.find('title').text().trim();
      const link = el.find('link').text().trim();
      const description = el.find('description').text().replace(/<[^>]*>/g, '').trim();
      const source = el.find('source').text().trim();
      const pubDate = el.find('pubDate').text().trim();

      if (title && link) {
        const snippet = source
          ? `${source}${pubDate ? ' — ' + pubDate : ''}${description ? ': ' + description : ''}`
          : description || 'News article';
        results.push({ title, url: link, snippet: snippet.substring(0, 300) });
      }
    });

    return results;
  } catch (error) {
    console.error('Google News RSS error:', error);
    return [];
  }
}

/**
 * Search Wikipedia using the search + extracts API for rich snippets.
 */
async function searchWikipedia(query: string): Promise<WebSearchResult[]> {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(query)}&srlimit=5&srprop=snippet&origin=*`;

    const response = await stealthFetch(searchUrl, {
      timeout: 6000,
    });

    if (!response.ok) return [];
    const data = await response.json();
    const searchResults = data.query?.search || [];

    return searchResults.map((item: any) => ({
      title: item.title,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
      snippet: item.snippet
        ? item.snippet.replace(/<[^>]*>/g, '').substring(0, 200) + '...'
        : 'Wikipedia article',
    }));
  } catch (error) {
    console.error('Wikipedia search error:', error);
    return [];
  }
}

/**
 * Search using DuckDuckGo's HTML search (no API key required).
 */
async function searchDuckDuckGo(query: string): Promise<WebSearchResult[]> {
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    // Stealth fetch — rotates UA per request like Perplexity does
    const response = await stealthFetch(searchUrl, {
      timeout: 6000,
      queryContext: query,
    });

    if (!response.ok) return [];
    const html = await response.text();
    const results: WebSearchResult[] = [];
    const $ = cheerio.load(html);

    $('.result').slice(0, 20).each((_, element) => {
      const el = $(element);
      const titleLink = el.find('a.result__a');
      const title = titleLink.text().trim();
      let url = titleLink.attr('href') || '';
      
      const uddgMatch = url.match(/uddg=([^&]+)/);
      if (uddgMatch) url = decodeURIComponent(uddgMatch[1]);
      else if (url.startsWith('//')) url = 'https:' + url;

      const snippet = el.find('a.result__snippet').text().replace(/\s+/g, ' ').trim().substring(0, 250);

      if (url && title && !url.includes('duckduckgo.com')) {
        try { new URL(url); results.push({ title, url, snippet: snippet || 'No description available.' }); } catch { }
      }
    });

    return results;
  } catch (error) {
    console.error('DuckDuckGo search error:', error);
    return [];
  }
}

/**
 * Search using Brave Search's web interface (no API key required).
 */
async function searchBrave(query: string): Promise<WebSearchResult[]> {
  try {
    const searchUrl = `https://search.brave.com/search?q=${encodeURIComponent(query)}&source=web`;
    // Stealth fetch with rotating browser fingerprint
    const response = await stealthFetch(searchUrl, {
      timeout: 6000,
      queryContext: query,
    });

    if (!response.ok) return [];
    const html = await response.text();
    const results: WebSearchResult[] = [];
    const $ = cheerio.load(html);

    $('[data-type="web"]').slice(0, 15).each((_, element) => {
      const el = $(element);
      const titleLink = el.find('a').first();
      const url = titleLink.attr('href') || '';
      const title = el.find('.heading, .title').first().text().trim() || titleLink.text().trim();
      
      const snippet = el.find('.snippet').first().text().replace(/\s+/g, ' ').trim().substring(0, 250);

      if (url && title && title.length > 3 && !url.includes('brave.com')) {
        try { new URL(url); results.push({ title, url, snippet: snippet || 'No description available.' }); } catch { }
      }
    });

    return results;
  } catch (error) {
    console.error('Brave search error:', error);
    return [];
  }
}

/**
 * Search using Bing's web interface (no API key required).
 */
async function searchBing(query: string): Promise<WebSearchResult[]> {
  try {
    const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=en`;
    // Stealth fetch — Bing is aggressive about bot detection
    const response = await stealthFetch(searchUrl, {
      timeout: 6000,
      queryContext: query,
    });

    if (!response.ok) return [];
    const html = await response.text();
    const results: WebSearchResult[] = [];
    const $ = cheerio.load(html);

    $('li.b_algo').slice(0, 15).each((_, element) => {
      const el = $(element);
      const titleLink = el.find('h2 a').first();
      const url = titleLink.attr('href') || '';
      const title = titleLink.text().trim();
      
      const snippet = el.find('.b_caption p, p').first().text().replace(/\s+/g, ' ').trim().substring(0, 250);

      if (url && title && title.length > 3 && !url.includes('bing.com') && !url.includes('microsoft.com/bing')) {
        try { new URL(url); results.push({ title, url, snippet: snippet || 'No description available.' }); } catch { }
      }
    });

    return results;
  } catch (error) {
    console.error('Bing search error:', error);
    return [];
  }
}

/**
 * Dynamically fetch the list of active public SearXNG instances from searx.space
 * and sort them to get the healthiest and fastest JSON-enabled instances.
 */
async function getHealthySearXNGInstances(): Promise<string[]> {
  try {
    const response = await stealthFetch('https://searx.space/data/instances.json', {
      timeout: 5000,
    });
    if (!response.ok) return [];
    const data = await response.json();
    if (!data || !data.instances) return [];

    const list: { url: string; score: number }[] = [];
    for (const [url, info] of Object.entries<any>(data.instances)) {
      if (info && info.http?.status_code === 200 && !info.http?.error) {
        const searchMedian = info.timing?.search?.all?.median ?? info.timing?.search?.median ?? 9.9;
        const successRate = info.timing?.search?.success_percentage ?? 100;
        
        // Filter out onion addresses and rate-limited instances
        if (successRate > 80 && !url.includes('.onion')) {
          list.push({ url, score: searchMedian });
        }
      }
    }

    list.sort((a, b) => a.score - b.score);
    return list.map(item => item.url.replace(/\/$/, ''));
  } catch (e) {
    console.error('[WebSearch] Failed to fetch SearXNG instances from searx.space:', e);
    return [];
  }
}

/**
 * Search using SearXNG — a privacy-respecting meta-search engine.
 * Uses public instances for broader coverage across many search engines.
 */
async function searchSearXNG(query: string): Promise<WebSearchResult[]> {
  // Try multiple public SearXNG instances for reliability
  const fallbackInstances = [
    'https://searx.be',
    'https://search.ononoki.org',
    'https://searx.tiekoetter.com',
  ];

  let instances = await getHealthySearXNGInstances();
  if (instances.length === 0) {
    instances = fallbackInstances;
  } else {
    // Interleave the hardcoded fallback instances at the end of the top 6 healthy ones
    instances = [...new Set([...instances.slice(0, 6), ...fallbackInstances])];
  }

  for (const instance of instances) {
    try {
      const searchUrl = `${instance}/search?q=${encodeURIComponent(query)}&format=json&categories=general&language=en`;
      const response = await stealthFetch(searchUrl, {
        headers: {
          'Accept': 'application/json',
        },
        timeout: 6000,
      });

      if (!response.ok) continue;

      const data = await response.json();
      if (!data.results || !Array.isArray(data.results)) continue;

      const results: WebSearchResult[] = [];
      for (const item of data.results.slice(0, 15)) {
        if (item.url && item.title) {
          try {
            new URL(item.url);
            results.push({
              title: item.title,
              url: item.url,
              snippet: (item.content || item.description || 'No description available.').substring(0, 250),
            });
          } catch { }
        }
      }

      if (results.length > 0) return results;
    } catch (error) {
      // Try next instance
      continue;
    }
  }

  console.error('SearXNG: all instances failed');
  return [];
}

/**
 * Search Google Scholar for academic and research results.
 * Uses the public HTML interface — no API key required.
 */
async function searchGoogleScholar(query: string): Promise<WebSearchResult[]> {
  try {
    const searchUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}&hl=en`;
    // Stealth fetch — Google Scholar is very strict about bots
    const response = await stealthFetch(searchUrl, {
      timeout: 6000,
      queryContext: query,
    });

    if (!response.ok) return [];
    const html = await response.text();
    const results: WebSearchResult[] = [];
    const $ = cheerio.load(html);

    $('.gs_ri').slice(0, 10).each((_, element) => {
      const el = $(element);
      const titleLink = el.find('h3 a').first();
      const title = titleLink.text().trim();
      let url = titleLink.attr('href') || '';
      const snippet = el.find('.gs_rs').text().replace(/\s+/g, ' ').trim().substring(0, 300);
      const authors = el.find('.gs_a').text().trim();

      if (url && title && title.length > 3 && !url.includes('scholar.google.com')) {
        try {
          new URL(url);
          results.push({
            title: `📄 ${title}`,
            url,
            snippet: authors ? `${authors} — ${snippet}` : snippet || 'Academic publication',
          });
        } catch { }
      }
    });

    return results;
  } catch (error) {
    console.error('Google Scholar search error:', error);
    return [];
  }
}

/**
 * Search using Mojeek — an independent, crawler-based search engine.
 * Provides unique results not sourced from Google/Bing.
 */
async function searchMojeek(query: string): Promise<WebSearchResult[]> {
  try {
    const searchUrl = `https://www.mojeek.com/search?q=${encodeURIComponent(query)}&fmt=json`;
    // Stealth fetch for Mojeek
    const response = await stealthFetch(searchUrl, {
      timeout: 6000,
      accept: 'application/json, text/html',
      queryContext: query,
    });

    if (!response.ok) {
      // Mojeek might not support JSON, fallback to HTML scraping
      const htmlResponse = await fetch(`https://www.mojeek.com/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html',
        },
        signal: AbortSignal.timeout(6000),
      });
      if (!htmlResponse.ok) return [];
      const html = await htmlResponse.text();
      const $ = cheerio.load(html);
      const results: WebSearchResult[] = [];
      
      $('li.result, .results-standard li').slice(0, 15).each((_, element) => {
        const el = $(element);
        const titleLink = el.find('a.ob').first().length ? el.find('a.ob').first() : el.find('h2 a, a').first();
        const url = titleLink.attr('href') || '';
        const title = titleLink.text().trim();
        const snippet = el.find('p.s, .s').first().text().replace(/\s+/g, ' ').trim().substring(0, 250);
        if (url && title && !url.includes('mojeek.com')) {
          try { new URL(url); results.push({ title, url, snippet: snippet || 'No description available.' }); } catch { }
        }
      });
      return results;
    }

    const data = await response.json();
    if (!data.response?.results) return [];

    return data.response.results.slice(0, 8).map((item: any) => ({
      title: item.title || '',
      url: item.url || '',
      snippet: (item.desc || 'No description available.').substring(0, 250),
    })).filter((r: WebSearchResult) => {
      try { new URL(r.url); return r.title.length > 3; } catch { return false; }
    });
  } catch (error) {
    console.error('Mojeek search error:', error);
    return [];
  }
}
