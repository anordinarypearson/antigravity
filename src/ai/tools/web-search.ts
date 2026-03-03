'use server';

import { z } from 'zod';

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
 *
 * All sources are queried in parallel for maximum speed.
 */
export async function webSearch({ query, maxResults = 15 }: WebSearchInput) {
  const results: WebSearchResult[] = [];
  const seenUrls = new Set<string>();
  const seenDomains = new Map<string, number>();

  // Run ALL searches in parallel for maximum speed
  const [ddgResults, braveResults, wikiResults, newsResults] = await Promise.allSettled([
    searchDuckDuckGo(query),
    searchBrave(query),
    searchWikipedia(query),
    searchGoogleNews(query),
  ]);

  // Interleave results for source diversity — news first for freshness, then DDG, Brave, Wiki
  const allBuckets: WebSearchResult[][] = [];

  if (newsResults.status === 'fulfilled' && newsResults.value.length > 0) allBuckets.push(newsResults.value);
  if (ddgResults.status === 'fulfilled') allBuckets.push(ddgResults.value);
  if (braveResults.status === 'fulfilled') allBuckets.push(braveResults.value);
  if (wikiResults.status === 'fulfilled') allBuckets.push(wikiResults.value);

  // Round-robin interleave for diverse results
  const maxLen = Math.max(...allBuckets.map(b => b.length), 0);
  for (let i = 0; i < maxLen && results.length < maxResults; i++) {
    for (const bucket of allBuckets) {
      if (i < bucket.length && results.length < maxResults) {
        const result = bucket[i];
        const domain = extractDomain(result.url);
        const domainCount = seenDomains.get(domain) || 0;

        // Allow max 3 results per domain for diversity
        if (!seenUrls.has(result.url) && domainCount < 3) {
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
      signal: AbortSignal.timeout(3500),
    });

    if (!response.ok) return [];

    const xml = await response.text();
    const results: WebSearchResult[] = [];

    // Parse RSS XML manually (no XML parser needed)
    const items = xml.split('<item>').slice(1);

    for (let i = 0; i < Math.min(items.length, 8); i++) {
      const item = items[i];

      const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]>/s) || item.match(/<title>(.*?)<\/title>/s);
      const linkMatch = item.match(/<link>(.*?)<\/link>/s) || item.match(/<link\/>(.*?)(?:<|$)/s);
      const descMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]>/s) || item.match(/<description>(.*?)<\/description>/s);
      const sourceMatch = item.match(/<source[^>]*>(.*?)<\/source>/s);
      const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/s);

      const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : '';
      let link = linkMatch ? linkMatch[1].trim() : '';
      const description = descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim() : '';
      const source = sourceMatch ? sourceMatch[1].trim() : '';
      const pubDate = pubDateMatch ? pubDateMatch[1].trim() : '';

      // Google News links are redirects — try to extract original URL
      if (link.includes('news.google.com')) {
        // The link stays as-is; OG image extraction will follow redirect
      }

      if (title && link) {
        const snippet = source
          ? `${source}${pubDate ? ' — ' + pubDate : ''}${description ? ': ' + description : ''}`
          : description || 'News article';
        results.push({ title, url: link, snippet: snippet.substring(0, 300) });
      }
    }

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
      signal: AbortSignal.timeout(3000),
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
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) return [];
    const html = await response.text();
    const results: WebSearchResult[] = [];
    const resultBlocks = html.split(/class="result\s/);

    for (let i = 1; i < resultBlocks.length && results.length < 12; i++) {
      const block = resultBlocks[i];

      const urlMatch = block.match(/href="\/\/duckduckgo\.com\/l\/\?uddg=([^&"]+)/);
      const directUrlMatch = block.match(/href="(https?:\/\/[^"]+)"/);
      let url = '';
      if (urlMatch) url = decodeURIComponent(urlMatch[1]);
      else if (directUrlMatch) url = directUrlMatch[1];

      const titleMatch = block.match(/class="result__a"[^>]*>([^<]+)/);
      const title = titleMatch ? titleMatch[1].trim() : '';

      const snippetMatch = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);
      let snippet = '';
      if (snippetMatch) {
        snippet = snippetMatch[1]
          .replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
          .replace(/\s+/g, ' ').trim().substring(0, 250);
      }

      if (url && title && !url.includes('duckduckgo.com')) {
        try { new URL(url); results.push({ title, url, snippet: snippet || 'No description available.' }); } catch { }
      }
    }
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
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) return [];
    const html = await response.text();
    const results: WebSearchResult[] = [];
    const snippetBlocks = html.split(/data-type="web"/);

    for (let i = 1; i < snippetBlocks.length && results.length < 10; i++) {
      const block = snippetBlocks[i];

      const urlMatch = block.match(/href="(https?:\/\/[^"]+)"/);
      if (!urlMatch) continue;
      const url = urlMatch[1];

      const titleMatch = block.match(/<a[^>]*class="[^"]*heading[^"]*"[^>]*>([^<]+)/)
        || block.match(/<span[^>]*class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/span>/)
        || block.match(/<a[^>]*href="[^"]*"[^>]*>([^<]{5,})/);
      if (!titleMatch) continue;
      const title = titleMatch[1].replace(/<[^>]*>/g, '').trim();

      const snippetMatch = block.match(/<p[^>]*class="[^"]*snippet[^"]*"[^>]*>([\s\S]*?)<\/p>/)
        || block.match(/<div[^>]*class="[^"]*snippet[^"]*"[^>]*>([\s\S]*?)<\/div>/);
      const snippet = snippetMatch
        ? snippetMatch[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().substring(0, 250)
        : '';

      if (url && title && title.length > 3 && !url.includes('brave.com')) {
        try { new URL(url); results.push({ title, url, snippet: snippet || 'No description available.' }); } catch { }
      }
    }
    return results;
  } catch (error) {
    console.error('Brave search error:', error);
    return [];
  }
}
