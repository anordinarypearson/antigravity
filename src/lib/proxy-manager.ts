// src/lib/proxy-manager.ts

/**
 * Proxy Manager + Smart Rate Limiter
 * 
 * Two layers of IP-ban protection:
 * 
 * Layer 1 — Proxy Rotation (optional, paid):
 *   Set PROXY_URLS as a comma-separated list of proxy strings in .env.local
 *   Example: PROXY_URLS="http://user:pass@proxy1.com:3128,http://user:pass@proxy2.com:3128"
 *   Without this, the system still works but uses your server's IP.
 * 
 * Layer 2 — Per-Domain Rate Limiting (FREE, always active):
 *   Automatically enforces a minimum gap between requests to the same domain.
 *   This mimics human browsing behaviour and prevents "too many requests" bans.
 *   Default: max 1 request per domain per 1.5 seconds.
 */

// ─── Layer 1: Proxy Rotation ────────────────────────────────────────────────

let _proxyList: string[] | null = null;

function getProxyList(): string[] {
  if (_proxyList !== null) return _proxyList;
  const env = process.env.PROXY_URLS;
  if (!env) {
    _proxyList = [];
    return _proxyList;
  }
  _proxyList = env.split(',').map(p => p.trim()).filter(Boolean);
  return _proxyList;
}

/**
 * Returns a random proxy URL string.
 * Priority: 1) Paid proxies from PROXY_URLS env  2) Free harvested proxies  3) undefined (direct)
 */
export async function getRandomProxy(): Promise<string | undefined> {
  // Priority 1: Paid proxies from environment (most reliable)
  const list = getProxyList();
  if (list.length > 0) {
    return list[Math.floor(Math.random() * list.length)];
  }

  // Priority 2: Free harvested proxies (zero cost, less reliable)
  try {
    const { getFreeProxy } = await import('@/lib/free-proxy-harvester');
    return await getFreeProxy();
  } catch {
    return undefined;
  }
}

/** Synchronous version — only returns paid proxies (for backward compat). */
export function getRandomProxySync(): string | undefined {
  const list = getProxyList();
  if (list.length === 0) return undefined;
  return list[Math.floor(Math.random() * list.length)];
}

/** Returns true if at least one proxy source is available. */
export function hasProxies(): boolean {
  return getProxyList().length > 0;
}


// ─── Layer 2: Per-Domain Smart Rate Limiter (Free Anti-Block) ───────────────

/**
 * Minimum milliseconds to wait between requests to the same domain.
 * Tune these per domain if needed.
 */
const DOMAIN_RATE_LIMITS: Record<string, number> = {
  'google.com':       2000,  // 1 req / 2 sec
  'bing.com':         1500,
  'duckduckgo.com':   1500,
  'reddit.com':       2000,
  'twitter.com':      3000,
  'x.com':            3000,
  'linkedin.com':     3000,
  'instagram.com':    4000,
  'facebook.com':     3000,
  'wikipedia.org':    500,   // Wikipedia is very open
  'github.com':       1000,
  'stackoverflow.com':1000,
  'default':          1200,  // fallback for all other domains
};

/** Timestamp of last request per domain */
const lastRequestTime = new Map<string, number>();

/**
 * Extract the root domain from a URL (e.g. "www.google.com" → "google.com").
 */
function getRootDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    // Match the last two parts (e.g. "bbc.co.uk" → "bbc.co.uk")
    const parts = hostname.split('.');
    return parts.length >= 2 ? parts.slice(-2).join('.') : hostname;
  } catch {
    return 'unknown';
  }
}

/**
 * Wait if needed to respect the per-domain rate limit.
 * Call this before every stealth fetch to avoid IP bans — even without proxies.
 * 
 * @example
 *   await respectRateLimit('https://www.google.com/search?q=...');
 */
export async function respectRateLimit(url: string): Promise<void> {
  const domain = getRootDomain(url);
  const minGap = DOMAIN_RATE_LIMITS[domain] ?? DOMAIN_RATE_LIMITS['default'];
  const last = lastRequestTime.get(domain);
  const now = Date.now();

  if (last !== undefined) {
    const elapsed = now - last;
    if (elapsed < minGap) {
      const waitMs = minGap - elapsed + Math.floor(Math.random() * 300); // +0-300ms jitter
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }
  }

  lastRequestTime.set(domain, Date.now());
}
