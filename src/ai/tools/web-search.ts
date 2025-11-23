'use server';

import { z } from 'zod';
import * as cheerio from 'cheerio';

const SearchResultSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  snippet: z.string(),
});

const SearchOutputSchema = z.object({
  results: z.array(SearchResultSchema).optional(),
  noResults: z.boolean().optional(),
  error: z.string().optional(),
});

export type WebSearchInput = {
  query: string;
};

export async function webSearch({ query }: WebSearchInput) {
  try {
    // Use Wikipedia API for search (free, no auth required)
    const wikiSearchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=8&namespace=0&format=json`;

    const response = await fetch(wikiSearchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch search results. Status: ${response.status}`);
    }

    const data = await response.json();

    // Wikipedia API returns: [query, [titles], [descriptions], [urls]]
    const titles = data[1] || [];
    const descriptions = data[2] || [];
    const urls = data[3] || [];

    const results: z.infer<typeof SearchResultSchema>[] = [];

    for (let i = 0; i < titles.length && i < 8; i++) {
      if (titles[i] && urls[i]) {
        results.push({
          title: titles[i],
          url: urls[i],
          snippet: descriptions[i] || 'No description available.'
        });
      }
    }

    if (results.length === 0) {
      return { noResults: true };
    }

    return { results };

  } catch (error) {
    console.error('Web search error:', error);
    return { noResults: true, error: (error as Error).message };
  }
}
