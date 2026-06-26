import { NextRequest } from 'next/server';
import { getProviderStatus } from '@/lib/free-providers';

/**
 * GET /api/providers — List all configured AI providers and their status.
 * Shows which providers are enabled (have API keys) and signup URLs for new ones.
 */
export async function GET(_request: NextRequest) {
  const providers = getProviderStatus();
  
  const enabled = providers.filter(p => p.enabled);
  const disabled = providers.filter(p => !p.enabled);

  return Response.json({
    total: providers.length,
    active: enabled.length,
    inactive: disabled.length,
    providers: providers.map(p => ({
      ...p,
      onCooldown: p.cooldownUntil ? Date.now() < p.cooldownUntil : false,
      cooldownMinutesLeft: p.cooldownUntil && Date.now() < p.cooldownUntil 
        ? Math.ceil((p.cooldownUntil - Date.now()) / 60000) 
        : 0
    })),
    tip: enabled.length < 3
      ? '⚡ Add more API keys to .env.local for better reliability. The more providers you enable, the less likely you are to hit rate limits.'
      : `✅ ${enabled.length} providers active — you have excellent coverage!`,
  });
}
