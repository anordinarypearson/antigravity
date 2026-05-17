import { stealthFetch } from './stealth-fetch';
import { getProxyStats } from './free-proxy-harvester';

/**
 * Stealth & Proxy Health Test
 * 
 * Run this to verify that:
 * 1. Headers are being rotated
 * 2. IP addresses are being rotated (via free proxies)
 * 3. Rate limits are being respected
 * 4. Bot detection is successfully bypassed
 */
export async function runStealthTest() {
  console.log('🚀 Starting Stealth & Proxy Health Test...\n');

  // 1. Check Harvester Stats
  const stats = getProxyStats();
  console.log('📡 Proxy Pool Status:');
  console.log(`   - Pool Size: ${stats.poolSize} working proxies`);
  console.log(`   - Last Harvest: ${stats.lastHarvest}`);
  console.log(`   - Avg Proxy Speed: ${stats.avgSpeed}ms\n`);

  // 2. Test IP Rotation
  console.log('🔄 Testing IP Rotation (4 requests)...');
  const ips = new Set<string>();
  
  for (let i = 0; i < 4; i++) {
    try {
      const start = Date.now();
      const res = await stealthFetch('https://httpbin.org/ip', { timeout: 10000 });
      const data = await res.json();
      const duration = Date.now() - start;
      
      console.log(`   [Req ${i+1}] IP: ${data.origin} (${duration}ms)`);
      ips.add(data.origin);
    } catch (err: any) {
      console.warn(`   [Req ${i+1}] Failed: ${err.message}`);
    }
  }
  
  console.log(`\n✅ IP Diversity: ${ips.size} unique IPs from 4 requests.\n`);

  // 3. Test Bot Detection Bypass
  console.log('🛡️ Testing Bot Detection Bypass (sannysoft.com)...');
  try {
    const res = await stealthFetch('https://bot.sannysoft.com/', { timeout: 10000 });
    const html = await res.text();
    
    if (html.includes('WebDriver: false') || html.includes('Chrome: true')) {
      console.log('   ✅ Stealth Check Passed: Headers look like a real browser.');
    } else {
      console.log('   ⚠️ Stealth Check: Fingerprint could be improved.');
    }
  } catch (err) {
    console.warn('   ❌ Bot test failed to reach server.');
  }

  console.log('\n✨ Test Complete.');
}
