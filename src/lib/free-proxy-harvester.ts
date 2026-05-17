/**
 * Free Proxy Harvester
 * 
 * Automatically fetches working HTTP/HTTPS proxies from public, free proxy APIs.
 * No signup, no API keys, no cost.
 * 
 * The harvester:
 * 1. Pulls proxy lists from multiple free sources
 * 2. Tests each proxy for speed and reliability
 * 3. Maintains a rotating pool of verified working proxies
 * 4. Auto-refreshes the pool every 10 minutes (free proxies die fast)
 * 
 * This gives you 50-200+ rotating IPs at zero cost.
 * Trade-off: free proxies are slower and less reliable than paid ones.
 */

export interface ProxyEntry {
  host: string;
  port: number;
  protocol: 'http' | 'https';
  url: string;
  /** Last successful test timestamp */
  lastVerified: number;
  /** Average response time in ms */
  avgSpeed: number;
  /** Number of consecutive failures */
  failures: number;
  /** Country code (if known) */
  country?: string;
}

// ─── State ──────────────────────────────────────────────────────────────────

let proxyPool: ProxyEntry[] = [];
let lastHarvest = 0;
let isHarvesting = false;

/** How often to refresh the proxy pool (ms) */
const HARVEST_INTERVAL = 10 * 60 * 1000; // 10 minutes
/** Max proxies to keep in pool */
const MAX_POOL_SIZE = 100;
/** Timeout for testing a proxy (ms) */
const TEST_TIMEOUT = 5000;
/** Max failures before removing a proxy */
const MAX_FAILURES = 3;

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Get a random working proxy URL string.
 * Returns undefined if no proxies are available yet.
 * Automatically triggers harvesting if the pool is empty or stale.
 */
export async function getFreeProxy(): Promise<string | undefined> {
  // Trigger harvest if pool is empty or stale
  if (proxyPool.length < 5 || Date.now() - lastHarvest > HARVEST_INTERVAL) {
    // Don't await — harvest in background so we don't block the request
    harvestProxies().catch(err => console.warn('[ProxyHarvester] Background harvest failed:', err));
  }

  if (proxyPool.length === 0) return undefined;

  // Pick a random proxy, weighted towards faster ones
  const sorted = [...proxyPool].sort((a, b) => a.avgSpeed - b.avgSpeed);
  // Top 60% by speed, pick randomly from those
  const topTier = sorted.slice(0, Math.max(3, Math.ceil(sorted.length * 0.6)));
  const pick = topTier[Math.floor(Math.random() * topTier.length)];

  return pick.url;
}

/**
 * Report that a proxy failed (so we can remove bad ones).
 */
export function reportProxyFailure(proxyUrl: string): void {
  const entry = proxyPool.find(p => p.url === proxyUrl);
  if (entry) {
    entry.failures++;
    if (entry.failures >= MAX_FAILURES) {
      proxyPool = proxyPool.filter(p => p.url !== proxyUrl);
      console.log(`[ProxyHarvester] Removed dead proxy: ${proxyUrl} (pool: ${proxyPool.length})`);
    }
  }
}

/**
 * Report that a proxy succeeded (reset failure count).
 */
export function reportProxySuccess(proxyUrl: string): void {
  const entry = proxyPool.find(p => p.url === proxyUrl);
  if (entry) {
    entry.failures = 0;
    entry.lastVerified = Date.now();
  }
}

/**
 * Get current pool stats.
 */
export function getProxyStats() {
  return {
    poolSize: proxyPool.length,
    lastHarvest: lastHarvest ? new Date(lastHarvest).toISOString() : 'never',
    isHarvesting,
    avgSpeed: proxyPool.length > 0
      ? Math.round(proxyPool.reduce((sum, p) => sum + p.avgSpeed, 0) / proxyPool.length)
      : 0,
  };
}


// ─── Harvesting Engine ──────────────────────────────────────────────────────

/**
 * Fetch proxies from all free sources and test them.
 */
async function harvestProxies(): Promise<void> {
  if (isHarvesting) return; // Prevent concurrent harvests
  isHarvesting = true;

  console.log('[ProxyHarvester] Starting harvest...');

  try {
    // Fetch from multiple free sources in parallel
    const [
      proxyScrapeList,
      geoNodeList,
      freeProxyListNet,
    ] = await Promise.allSettled([
      fetchFromProxyScrape(),
      fetchFromGeoNode(),
      fetchFromFreeProxyListAPI(),
    ]);

    const candidates: ProxyEntry[] = [];

    if (proxyScrapeList.status === 'fulfilled') candidates.push(...proxyScrapeList.value);
    if (geoNodeList.status === 'fulfilled') candidates.push(...geoNodeList.value);
    if (freeProxyListNet.status === 'fulfilled') candidates.push(...freeProxyListNet.value);

    console.log(`[ProxyHarvester] Fetched ${candidates.length} proxy candidates`);

    // Deduplicate by host:port
    const seen = new Set<string>();
    const unique = candidates.filter(p => {
      const key = `${p.host}:${p.port}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Test proxies in batches (don't overwhelm the network)
    const batchSize = 15;
    const verified: ProxyEntry[] = [];

    for (let i = 0; i < unique.length && verified.length < MAX_POOL_SIZE; i += batchSize) {
      const batch = unique.slice(i, i + batchSize);
      const results = await Promise.allSettled(batch.map(testProxy));

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          verified.push(result.value);
        }
      }
    }

    // Merge with existing pool (keep verified ones that are still alive)
    const existingAlive = proxyPool.filter(p => p.failures < MAX_FAILURES);
    const allProxies = [...verified, ...existingAlive];

    // Deduplicate and keep top by speed
    const finalSeen = new Set<string>();
    proxyPool = allProxies
      .filter(p => {
        const key = `${p.host}:${p.port}`;
        if (finalSeen.has(key)) return false;
        finalSeen.add(key);
        return true;
      })
      .sort((a, b) => a.avgSpeed - b.avgSpeed)
      .slice(0, MAX_POOL_SIZE);

    lastHarvest = Date.now();
    console.log(`[ProxyHarvester] Harvest complete. Pool: ${proxyPool.length} working proxies`);

  } catch (error) {
    console.error('[ProxyHarvester] Harvest error:', error);
  } finally {
    isHarvesting = false;
  }
}


// ─── Free Proxy Sources ─────────────────────────────────────────────────────

/**
 * Source 1: ProxyScrape API (free, no key)
 * Returns a plain-text list of ip:port
 */
async function fetchFromProxyScrape(): Promise<ProxyEntry[]> {
  try {
    const url = 'https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=5000&country=all&ssl=yes&anonymity=elite,anonymous';
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return [];

    const text = await response.text();
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    return lines.slice(0, 80).map(line => {
      const [host, portStr] = line.split(':');
      const port = parseInt(portStr);
      return {
        host,
        port,
        protocol: 'http' as const,
        url: `http://${host}:${port}`,
        lastVerified: 0,
        avgSpeed: 9999,
        failures: 0,
      };
    }).filter(p => p.host && !isNaN(p.port));
  } catch (error) {
    console.warn('[ProxyHarvester] ProxyScrape fetch failed:', error);
    return [];
  }
}

/**
 * Source 2: GeoNode free proxy API
 */
async function fetchFromGeoNode(): Promise<ProxyEntry[]> {
  try {
    const url = 'https://proxylist.geonode.com/api/proxy-list?limit=50&page=1&sort_by=lastChecked&sort_type=desc&protocols=http,https&anonymityLevel=elite,anonymous';
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return [];

    const data = await response.json();
    if (!data.data || !Array.isArray(data.data)) return [];

    return data.data.map((p: any) => ({
      host: p.ip,
      port: parseInt(p.port),
      protocol: (p.protocols?.[0] || 'http') as 'http' | 'https',
      url: `${p.protocols?.[0] || 'http'}://${p.ip}:${p.port}`,
      lastVerified: 0,
      avgSpeed: p.responseTime || 9999,
      failures: 0,
      country: p.country,
    })).filter((p: ProxyEntry) => p.host && !isNaN(p.port));
  } catch (error) {
    console.warn('[ProxyHarvester] GeoNode fetch failed:', error);
    return [];
  }
}

/**
 * Source 3: Free Proxy List API
 */
async function fetchFromFreeProxyListAPI(): Promise<ProxyEntry[]> {
  try {
    const url = 'https://www.proxy-list.download/api/v1/get?type=https&anon=elite';
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return [];

    const text = await response.text();
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    return lines.slice(0, 60).map(line => {
      const [host, portStr] = line.split(':');
      const port = parseInt(portStr);
      return {
        host,
        port,
        protocol: 'https' as const,
        url: `https://${host}:${port}`,
        lastVerified: 0,
        avgSpeed: 9999,
        failures: 0,
      };
    }).filter(p => p.host && !isNaN(p.port));
  } catch (error) {
    console.warn('[ProxyHarvester] FreeProxyList fetch failed:', error);
    return [];
  }
}


// ─── Proxy Testing ──────────────────────────────────────────────────────────

/**
 * Test if a proxy is alive and fast enough.
 * Returns the proxy entry with speed data, or null if dead.
 */
async function testProxy(proxy: ProxyEntry): Promise<ProxyEntry | null> {
  try {
    const { HttpsProxyAgent } = await import('https-proxy-agent');
    const agent = new HttpsProxyAgent(proxy.url);

    const start = Date.now();
    const response = await fetch('https://httpbin.org/ip', {
      // @ts-ignore — agent works with node-fetch / undici
      agent,
      signal: AbortSignal.timeout(TEST_TIMEOUT),
    } as any);

    const elapsed = Date.now() - start;

    if (!response.ok) return null;

    // Verify it actually returned an IP (proxy is working)
    const data = await response.json();
    if (!data.origin) return null;

    return {
      ...proxy,
      lastVerified: Date.now(),
      avgSpeed: elapsed,
      failures: 0,
    };
  } catch {
    return null;
  }
}
