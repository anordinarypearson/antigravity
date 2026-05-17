import { getRandomProxy, respectRateLimit } from '@/lib/proxy-manager';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * Stealth Fetch Module — Perplexity-style anti-bot evasion
 * 
 * Rotates User-Agents, referrers, and headers to look like a real browser.
 * This is similar to how Perplexity's crawler avoids getting blocked.
 */

// Pool of realistic User-Agents — rotated per request
const USER_AGENTS = [
    // Chrome on Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    // Chrome on macOS
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    // Firefox on Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
    // Safari on macOS
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
    // Edge
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0',
    // Chrome on Linux
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
];

const REFERRERS = [
    'https://www.google.com/',
    'https://www.google.com/search?q=',
    'https://www.bing.com/search?q=',
    'https://search.yahoo.com/search?p=',
    'https://duckduckgo.com/?q=',
    '', // Direct visit (no referrer)
];

const ACCEPT_LANGUAGES = [
    'en-US,en;q=0.9',
    'en-US,en;q=0.9,hi;q=0.7',
    'en-GB,en;q=0.9,en-US;q=0.8',
    'en,en-US;q=0.9',
];

function randomPick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

export type StealthFetchOptions = {
    timeout?: number;
    method?: 'GET' | 'POST';
    body?: string;
    accept?: string;
    /** If true, adds a search-engine referrer matching the query */
    queryContext?: string;
};

/**
 * Make a fetch request with randomized, realistic browser headers.
 * This mimics how Perplexity's content retrieval system works.
 */
export async function stealthFetch(url: string, options: StealthFetchOptions = {}): Promise<Response> {
    const {
        timeout = 8000,
        method = 'GET',
        body,
        accept = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        queryContext,
    } = options;

    const ua = randomPick(USER_AGENTS);
    const isChrome = ua.includes('Chrome');
    const isFirefox = ua.includes('Firefox');

    // Build referrer — if we have a query, simulate coming from a search engine
    let referrer = randomPick(REFERRERS);
    if (queryContext && referrer.endsWith('=')) {
        referrer += encodeURIComponent(queryContext);
    }

    const headers: Record<string, string> = {
        'User-Agent': ua,
        'Accept': accept,
        'Accept-Language': randomPick(ACCEPT_LANGUAGES),
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'DNT': '1',
        'Upgrade-Insecure-Requests': '1',
    };

    if (referrer) {
        headers['Referer'] = referrer;
    }

    // Add Chrome-specific client hints (these are what Cloudflare checks)
    if (isChrome) {
        const version = ua.match(/Chrome\/(\d+)/)?.[1] || '125';
        headers['Sec-CH-UA'] = `"Chromium";v="${version}", "Google Chrome";v="${version}", "Not-A.Brand";v="99"`;
        headers['Sec-CH-UA-Mobile'] = '?0';
        headers['Sec-CH-UA-Platform'] = ua.includes('Windows') ? '"Windows"' : ua.includes('Mac') ? '"macOS"' : '"Linux"';
        headers['Sec-Fetch-Dest'] = 'document';
        headers['Sec-Fetch-Mode'] = 'navigate';
        headers['Sec-Fetch-Site'] = referrer ? 'cross-site' : 'none';
        headers['Sec-Fetch-User'] = '?1';
    }

    // Firefox-specific headers
    if (isFirefox) {
        headers['Sec-Fetch-Dest'] = 'document';
        headers['Sec-Fetch-Mode'] = 'navigate';
        headers['Sec-Fetch-Site'] = 'none';
        headers['Sec-Fetch-User'] = '?1';
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
    const proxy = await getRandomProxy();
    const agent = proxy ? new HttpsProxyAgent(proxy) : undefined;

    // ✅ Free anti-ban: enforce per-domain rate limiting before every request
    await respectRateLimit(url);

    const response = await fetch(url, {
        method,
        headers,
        body,
        signal: controller.signal,
        redirect: 'follow',
        ...(agent ? { agent } : {}),
    });
        clearTimeout(timeoutId);

        // Report proxy result for pool health tracking
        if (proxy) {
            try {
                const { reportProxySuccess, reportProxyFailure } = await import('@/lib/free-proxy-harvester');
                if (response.ok || response.status < 500) {
                    reportProxySuccess(proxy);
                } else {
                    reportProxyFailure(proxy);
                }
            } catch { /* harvester not available */ }
        }

        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

/**
 * Fetch with automatic retry and exponential backoff.
 * If the first attempt fails or returns a bot-detection page, retries with a different UA.
 */
export async function stealthFetchWithRetry(
    url: string,
    options: StealthFetchOptions = {},
    maxRetries = 2
): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await stealthFetch(url, options);

            // Check for common bot-detection responses
            if (response.status === 403 || response.status === 429 || response.status === 503) {
                // Wait a bit before retrying with a different UA
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
                    continue;
                }
            }

            return response;
        } catch (error: any) {
            lastError = error;
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)));
            }
        }
    }

    throw lastError || new Error(`Failed to fetch ${url} after ${maxRetries + 1} attempts`);
}
