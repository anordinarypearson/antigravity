/**
 * Search Result Cache — LRU In-Memory Cache
 * 
 * Caches web search, image search, and page scrape results.
 * This dramatically reduces outbound requests:
 * - If a user searches "climate change" and another user searches the same 2 min later,
 *   the second search is instant with zero network requests.
 * 
 * Features:
 * - LRU eviction (oldest unused items get removed when cache is full)
 * - TTL-based expiry (results go stale after a configurable time)
 * - Separate TTLs for different content types (news = short, wiki = long)
 * - Memory-safe with configurable max entries
 */

interface CacheEntry<T> {
  data: T;
  createdAt: number;
  lastAccessed: number;
  ttl: number;
  hits: number;
}

/** TTL presets in milliseconds */
export const CACHE_TTL = {
  /** Web search results — 5 minutes (results change frequently) */
  WEB_SEARCH: 5 * 60 * 1000,
  /** Image search results — 15 minutes (images are more stable) */
  IMAGE_SEARCH: 15 * 60 * 1000,
  /** Page scrape content — 30 minutes (article text rarely changes) */
  PAGE_CONTENT: 30 * 60 * 1000,
  /** Wikipedia/docs — 1 hour (very stable content) */
  REFERENCE: 60 * 60 * 1000,
  /** News — 3 minutes (breaking news changes fast) */
  NEWS: 3 * 60 * 1000,
} as const;

// ─── LRU Cache Implementation ──────────────────────────────────────────────

const MAX_ENTRIES = 500;
const cache = new Map<string, CacheEntry<any>>();

/**
 * Generate a cache key from a namespace + query/url.
 */
function makeKey(namespace: string, identifier: string): string {
  return `${namespace}:${identifier.toLowerCase().trim()}`;
}

/**
 * Get a cached result. Returns undefined if not found or expired.
 */
export function cacheGet<T>(namespace: string, identifier: string): T | undefined {
  const key = makeKey(namespace, identifier);
  const entry = cache.get(key);

  if (!entry) return undefined;

  // Check TTL expiry
  if (Date.now() - entry.createdAt > entry.ttl) {
    cache.delete(key);
    return undefined;
  }

  // Update LRU tracking
  entry.lastAccessed = Date.now();
  entry.hits++;

  // Move to end (most recently used) by re-inserting
  cache.delete(key);
  cache.set(key, entry);

  return entry.data as T;
}

/**
 * Store a result in the cache.
 */
export function cacheSet<T>(namespace: string, identifier: string, data: T, ttl: number): void {
  const key = makeKey(namespace, identifier);

  // Evict oldest entries if at capacity
  if (cache.size >= MAX_ENTRIES && !cache.has(key)) {
    // Delete the first entry (oldest in Map insertion order = LRU)
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }

  cache.set(key, {
    data,
    createdAt: Date.now(),
    lastAccessed: Date.now(),
    ttl,
    hits: 0,
  });
}

/**
 * Check if a key exists and is not expired.
 */
export function cacheHas(namespace: string, identifier: string): boolean {
  return cacheGet(namespace, identifier) !== undefined;
}

/**
 * Invalidate a specific cache entry.
 */
export function cacheInvalidate(namespace: string, identifier: string): void {
  cache.delete(makeKey(namespace, identifier));
}

/**
 * Clear all entries in a namespace.
 */
export function cacheClearNamespace(namespace: string): void {
  const prefix = `${namespace}:`;
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

/**
 * Clear the entire cache.
 */
export function cacheClearAll(): void {
  cache.clear();
}

/**
 * Get cache statistics.
 */
export function getCacheStats() {
  let totalHits = 0;
  let expired = 0;
  const now = Date.now();
  const namespaces = new Map<string, number>();

  for (const [key, entry] of cache.entries()) {
    if (now - entry.createdAt > entry.ttl) {
      expired++;
    } else {
      totalHits += entry.hits;
    }
    const ns = key.split(':')[0];
    namespaces.set(ns, (namespaces.get(ns) || 0) + 1);
  }

  return {
    totalEntries: cache.size,
    expiredEntries: expired,
    totalHits,
    namespaces: Object.fromEntries(namespaces),
    maxEntries: MAX_ENTRIES,
  };
}


// ─── Convenience Wrappers ───────────────────────────────────────────────────

/**
 * Wrap any async function with caching.
 * 
 * @example
 *   const results = await withCache('web-search', query, CACHE_TTL.WEB_SEARCH, () => searchDuckDuckGo(query));
 */
export async function withCache<T>(
  namespace: string,
  identifier: string,
  ttl: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  // Try cache first
  const cached = cacheGet<T>(namespace, identifier);
  if (cached !== undefined) {
    console.log(`[Cache] HIT: ${namespace}:${identifier.substring(0, 40)}`);
    return cached;
  }

  // Cache miss — fetch fresh data
  console.log(`[Cache] MISS: ${namespace}:${identifier.substring(0, 40)}`);
  const data = await fetcher();

  // Only cache non-empty results
  if (data !== null && data !== undefined) {
    // For arrays, only cache if non-empty
    if (Array.isArray(data) && data.length === 0) {
      return data;
    }
    cacheSet(namespace, identifier, data, ttl);
  }

  return data;
}
