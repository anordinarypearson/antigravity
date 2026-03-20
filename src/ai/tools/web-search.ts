'use server';

import { z } from 'zod';
import * as cheerio from 'cheerio';

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

  // Run ALL 6 search engines in parallel for maximum speed & coverage
  const [ddgResults, braveResults, wikiResults, newsResults, bingResults, searxResults] = await Promise.allSettled([
    searchDuckDuckGo(query),
    searchBrave(query),
    searchWikipedia(query),
    searchGoogleNews(query),
    searchBing(query),
    searchSearXNG(query),
  ]);

  // Log search engine results for debugging
  console.log(`[WebSearch] DDG: ${ddgResults.status === 'fulfilled' ? ddgResults.value.length : 'failed'}, Brave: ${braveResults.status === 'fulfilled' ? braveResults.value.length : 'failed'}, Wiki: ${wikiResults.status === 'fulfilled' ? wikiResults.value.length : 'failed'}, News: ${newsResults.status === 'fulfilled' ? newsResults.value.length : 'failed'}, Bing: ${bingResults.status === 'fulfilled' ? bingResults.value.length : 'failed'}, SearX: ${searxResults.status === 'fulfilled' ? searxResults.value.length : 'failed'}`);

  // Interleave results: news first for freshness, then DDG, SearX, Bing, Brave, Wiki
  const allBuckets: WebSearchResult[][] = [];

  if (newsResults.status === 'fulfilled' && newsResults.value.length > 0) allBuckets.push(newsResults.value);
  if (ddgResults.status === 'fulfilled' && ddgResults.value.length > 0) allBuckets.push(ddgResults.value);
  if (searxResults.status === 'fulfilled' && searxResults.value.length > 0) allBuckets.push(searxResults.value);
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
    return { noResults: true };
  }

  return {
    results,
    searchMeta: {
      sources: {
        duckduckgo: ddgResults.status === 'fulfilled' ? ddgResults.value.length : 0,
        brave: braveResults.status === 'fulfilled' ? braveResults.value.length : 0,
        wikipedia: wikiResults.status === 'fulfilled' ? wikiResults.value.length : 0,
        googleNews: newsResults.status === 'fulfilled' ? newsResults.value.length : 0,
        bing: bingResults.status === 'fulfilled' ? bingResults.value.length : 0,
        searxng: searxResults.status === 'fulfilled' ? searxResults.value.length : 0,
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

    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
      signal: AbortSignal.timeout(8000),
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

    const response = await fetch(searchUrl, {
      headers: { 'User-Agent': 'SearnAI/2.0 (Educational Platform)' },
      signal: AbortSignal.timeout(8000),
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
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return [];
    const html = await response.text();
    const results: WebSearchResult[] = [];
    const $ = cheerio.load(html);

    $('.result').slice(0, 12).each((_, element) => {
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
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return [];
    const html = await response.text();
    const results: WebSearchResult[] = [];
    const $ = cheerio.load(html);

    $('[data-type="web"]').slice(0, 10).each((_, element) => {
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
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return [];
    const html = await response.text();
    const results: WebSearchResult[] = [];
    const $ = cheerio.load(html);

    $('li.b_algo').slice(0, 10).each((_, element) => {
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
 * Search using SearXNG — a privacy-respecting meta-search engine.
 * Uses public instances for broader coverage across many search engines.
 */
async function searchSearXNG(query: string): Promise<WebSearchResult[]> {
  // Try multiple public SearXNG instances for reliability
  const instances = [
    'https://searx.be',
    'https://search.ononoki.org',
    'https://searx.tiekoetter.com',
  ];

  for (const instance of instances) {
    try {
      const searchUrl = `${instance}/search?q=${encodeURIComponent(query)}&format=json&categories=general&language=en`;
      const response = await fetch(searchUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) continue;

      const data = await response.json();
      if (!data.results || !Array.isArray(data.results)) continue;

      const results: WebSearchResult[] = [];
      for (const item of data.results.slice(0, 10)) {
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
