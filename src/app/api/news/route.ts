
import { NextResponse, NextRequest } from 'next/server';
import RssParser from "rss-parser";

type Article = {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  source: { name: string };
  publishedAt: string;
};

const parser = new RssParser({
  timeout: 8000,
  customFields: {
    item: [
      ['media:thumbnail', 'media:thumbnail', { keepArray: false }],
      ['media:content', 'media:content', { keepArray: false }],
      ['media:group', 'media:group', { keepArray: false }],
      ['enclosure', 'enclosure', { keepArray: false }],
    ],
  },
});

// --- Category-specific RSS feed banks ---
const FEEDS: Record<string, { url: string; name: string }[]> = {
  general: [
    { url: 'https://feeds.reuters.com/reuters/topNews', name: 'Reuters' },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', name: 'NY Times' },
    { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', name: 'BBC World' },
    { url: 'https://www.theguardian.com/world/rss', name: 'The Guardian' },
    { url: 'https://feeds.npr.org/1001/rss.xml', name: 'NPR News' },
    { url: 'https://rss.cnn.com/rss/edition.rss', name: 'CNN' },
    { url: 'https://www.aljazeera.com/xml/rss/all.xml', name: 'Al Jazeera' },
    { url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms', name: 'Times of India' },
  ],
  technology: [
    { url: 'https://techcrunch.com/feed/', name: 'TechCrunch' },
    { url: 'https://feeds.arstechnica.com/arstechnica/index', name: 'Ars Technica' },
    { url: 'https://www.theverge.com/rss/index.xml', name: 'The Verge' },
    { url: 'https://www.wired.com/feed/rss', name: 'Wired' },
    { url: 'https://feeds.feedburner.com/venturebeat/SZYF', name: 'VentureBeat' },
    { url: 'https://www.engadget.com/rss.xml', name: 'Engadget' },
    { url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', name: 'BBC Tech' },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml', name: 'NYT Tech' },
  ],
  science: [
    { url: 'https://www.sciencedaily.com/rss/all.xml', name: 'Science Daily' },
    { url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml', name: 'BBC Science' },
    { url: 'https://www.nature.com/nature.rss', name: 'Nature' },
    { url: 'https://feeds.newscientist.com/full-rss/', name: 'New Scientist' },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Science.xml', name: 'NYT Science' },
    { url: 'https://phys.org/rss-feed/', name: 'Phys.org' },
    { url: 'https://spacenews.com/feed/', name: 'SpaceNews' },
  ],
  sports: [
    { url: 'https://www.espn.com/espn/rss/news', name: 'ESPN' },
    { url: 'https://feeds.bbci.co.uk/sport/rss.xml', name: 'BBC Sport' },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml', name: 'NYT Sports' },
    { url: 'https://www.skysports.com/rss/12040', name: 'Sky Sports' },
    { url: 'https://feeds.reuters.com/reuters/sportsNews', name: 'Reuters Sports' },
  ],
  entertainment: [
    { url: 'https://variety.com/feed/', name: 'Variety' },
    { url: 'https://deadline.com/feed/', name: 'Deadline' },
    { url: 'https://www.hollywoodreporter.com/feed/', name: 'Hollywood Reporter' },
    { url: 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml', name: 'BBC Entertainment' },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Arts.xml', name: 'NYT Arts' },
    { url: 'https://pitchfork.com/rss/news/feed.json', name: 'Pitchfork' },
  ],
  business: [
    { url: 'https://feeds.reuters.com/reuters/businessNews', name: 'Reuters Business' },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml', name: 'NYT Business' },
    { url: 'https://www.ft.com/?format=rss', name: 'Financial Times' },
    { url: 'https://feeds.bloomberg.com/markets/news.rss', name: 'Bloomberg' },
    { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', name: 'BBC Business' },
    { url: 'https://www.wsj.com/xml/rss/3_7014.xml', name: 'WSJ Markets' },
    { url: 'https://fortune.com/feed/', name: 'Fortune' },
  ],
  health: [
    { url: 'https://feeds.bbci.co.uk/news/health/rss.xml', name: 'BBC Health' },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Health.xml', name: 'NYT Health' },
    { url: 'https://www.medscape.com/cx/rssfeeds/2678.xml', name: 'Medscape' },
    { url: 'https://feeds.feedburner.com/webmd/HealthandWellness', name: 'WebMD' },
    { url: 'https://www.health.harvard.edu/blog/feed', name: 'Harvard Health' },
    { url: 'https://www.who.int/rss-feeds/news-english.xml', name: 'WHO' },
  ],
};

/** Extract the best image URL from an RSS item using multiple strategies */
function extractImage(item: any): string {
  // 1. media:group (CNN style)
  const group = item['media:group'];
  if (group?.['media:content']) {
    const contents = Array.isArray(group['media:content'])
      ? group['media:content']
      : [group['media:content']];
    const best = contents.find((c: any) => c?.$?.medium === 'image' && Number(c?.$?.width) > 800)
      ?? contents.find((c: any) => c?.$?.medium === 'image')
      ?? contents[0];
    if (best?.$?.url) return best.$.url;
  }

  // 2. media:content directly on item
  const mc = item['media:content'];
  if (mc) {
    const arr = Array.isArray(mc) ? mc : [mc];
    const best = arr.find((c: any) => c?.$?.medium === 'image' && Number(c?.$?.width) > 400)
      ?? arr.find((c: any) => c?.$?.url?.match(/\.(jpg|jpeg|png|webp)/i))
      ?? arr[0];
    if (best?.$?.url) return best.$.url;
  }

  // 3. media:thumbnail (BBC, etc.)
  const thumb = item['media:thumbnail'];
  if (thumb?.$?.url) return thumb.$.url;
  if (typeof thumb === 'string') return thumb;

  // 4. enclosure (podcasts / some news)
  const enc = item['enclosure'];
  if (enc?.$?.url && enc?.$?.type?.startsWith('image')) return enc.$.url;
  if (enc?.url && enc?.type?.startsWith('image')) return enc.url;

  // 5. Parse <img> tags out of content / description
  const raw = item.content || item['content:encoded'] || item.summary || '';
  const imgMatch = raw.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch?.[1]) return imgMatch[1];

  return '';
}

/** Fetch and normalize a single RSS feed */
async function fetchFeed(feedMeta: { url: string; name: string }): Promise<Article[]> {
  const feed = await parser.parseURL(feedMeta.url);
  return feed.items
    .map((item: any) => ({
      title: item.title?.trim() || '',
      description: (item.contentSnippet || item.content || item.summary || '').replace(/<[^>]+>/g, '').trim(),
      url: item.link || item.guid || '',
      urlToImage: extractImage(item),
      source: { name: feed.title || feedMeta.name },
      publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
    }))
    .filter(a => a.title && a.title !== '[Removed]' && a.urlToImage);
}

/** Fetch multiple feeds in parallel, return combined + deduped articles */
async function fetchCategoryFeeds(category: string): Promise<Article[]> {
  const feeds = FEEDS[category] ?? FEEDS.general;

  const results = await Promise.allSettled(
    feeds.map(f => fetchFeed(f).catch(() => [] as Article[]))
  );

  const all: Article[] = [];
  const seen = new Set<string>();

  for (const r of results) {
    if (r.status === 'fulfilled') {
      for (const a of r.value) {
        const key = a.url.split('#')[0];
        if (!seen.has(key) && a.title) {
          seen.add(key);
          all.push(a);
        }
      }
    }
  }

  // Sort newest first
  all.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return all.slice(0, 60); // up to 60 fresh articles
}


export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.NEWS_API_KEY;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'general';
    const q = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1', 10);

    // --- NewsAPI path (if key present and not a search) ---
    if (apiKey && !q) {
      const pageSize = 40;
      let url: string;

      if (category && category !== 'general') {
        url = `https://newsapi.org/v2/top-headlines?country=us&category=${category}&pageSize=${pageSize}&page=${page}&apiKey=${apiKey}`;
      } else {
        url = `https://newsapi.org/v2/top-headlines?country=us&pageSize=${pageSize}&page=${page}&apiKey=${apiKey}`;
      }

      try {
        const response = await fetch(url, { next: { revalidate: 300 } });
        if (response.ok) {
          const data = await response.json();
          if ((data.articles?.length ?? 0) > 0) {
            return NextResponse.json(data);
          }
        }
      } catch {
        // fall through to RSS
      }
    }

    // --- Search path ---
    if (q && apiKey) {
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=en&sortBy=publishedAt&pageSize=40&page=${page}&apiKey=${apiKey}`;
      try {
        const res = await fetch(url, { next: { revalidate: 180 } });
        if (res.ok) {
          const data = await res.json();
          if ((data.articles?.length ?? 0) > 0) return NextResponse.json(data);
        }
      } catch {
        // fall through to RSS
      }
    }

    // --- RSS fallback (always works, much richer) ---
    const articles = await fetchCategoryFeeds(category);
    return NextResponse.json({ articles });

  } catch (err: any) {
    console.error('News route error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch news', details: err?.message },
      { status: 500 }
    );
  }
}
