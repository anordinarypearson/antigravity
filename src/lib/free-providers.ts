/**
 * Free AI Provider Rotation System
 * 
 * When one provider hits its rate limit, the system automatically
 * tries the next one. The user never sees "credits exhausted".
 * 
 * All providers here are FREE — no credit card required.
 * Add your API keys to .env.local to enable each provider.
 * The more keys you add, the more fallbacks you have.
 */

import OpenAI from 'openai';

export interface FreeProvider {
  id: string;
  name: string;
  baseURL: string;
  apiKeyEnv: string;       // env variable name for the API key
  models: string[];        // available free models (first = default)
  enabled: boolean;        // computed at runtime from env
  client?: OpenAI;         // lazy-initialized OpenAI-compatible client
  maxTokens?: number;      // provider-specific max tokens
  supportsStreaming: boolean;
  cooldownUntil?: number;  // timestamp when the provider will be available again
}

/**
 * Master list of free AI providers.
 * All use the OpenAI-compatible chat completions format.
 * 
 * HOW TO ADD MORE:
 * 1. Sign up at the provider's website (all free, no credit card)
 * 2. Get your API key
 * 3. Add it to .env.local with the env variable name listed below
 * 4. Restart the dev server
 * 
 * The system automatically enables providers that have keys configured.
 */
const PROVIDER_CONFIGS: Omit<FreeProvider, 'enabled' | 'client'>[] = [
  // ─── TIER 1: The Speed Demons (Groq & Cerebras) ───
  {
    id: 'groq',
    name: 'Groq',
    baseURL: 'https://api.groq.com/openai/v1',
    apiKeyEnv: 'GROQ_API_KEY',
    models: [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
      'gemma2-9b-it',
    ],
    maxTokens: 4096,
    supportsStreaming: true,
  },
  {
    id: 'cerebras',
    name: 'Cerebras',
    baseURL: 'https://api.cerebras.ai/v1',
    apiKeyEnv: 'CEREBRAS_API_KEY',
    models: [
      'llama-3.3-70b',
      'llama-3.1-8b',
    ],
    maxTokens: 4096,
    supportsStreaming: true,
  },

  // ─── TIER 2: OpenRouter (Unlimited Free Tokens) ───
  {
    id: 'openrouter',
    name: 'OpenRouter',
    baseURL: 'https://openrouter.ai/api/v1',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    models: [
      'meta-llama/llama-3.3-70b-instruct:free',
      'mistralai/mistral-7b-instruct:free',
      'google/gemma-2-9b-it:free',
      'qwen/qwen-2.5-72b-instruct:free',
    ],
    maxTokens: 4096,
    supportsStreaming: true,
  },

  // ─── TIER 3: SambaNova (Heavy Duty) ───
  {
    id: 'sambanova',
    name: 'SambaNova',
    baseURL: 'https://api.sambanova.ai/v1',
    apiKeyEnv: 'SAMBANOVA_API_KEY',
    models: ['DeepSeek-V3.2', 'DeepSeek-V3.1', 'Meta-Llama-3.3-70B-Instruct'],
    maxTokens: 4096,
    supportsStreaming: true,
  },

  // ─── TIER 4: Google Gemini (via OpenAI-compatible endpoint) ───
  {
    id: 'together',
    name: 'Together AI',
    baseURL: 'https://api.together.xyz/v1',
    apiKeyEnv: 'TOGETHER_API_KEY',
    models: [
      'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
      'mistralai/Mixtral-8x7B-Instruct-v0.1',
    ],
    maxTokens: 4096,
    supportsStreaming: true,
  },

  // ─── TIER 6: HuggingFace Inference ───
  {
    id: 'huggingface',
    name: 'HuggingFace',
    baseURL: 'https://api-inference.huggingface.co/v1',
    apiKeyEnv: 'HF_API_KEY',
    models: [
      'meta-llama/Llama-3.1-70B-Instruct',
      'mistralai/Mixtral-8x7B-Instruct-v0.1',
      'Qwen/Qwen2.5-72B-Instruct',
    ],
    maxTokens: 2048,
    supportsStreaming: true,
  },

  // ─── TIER 7: DeepInfra (free credits on signup) ───
  {
    id: 'deepinfra',
    name: 'DeepInfra',
    baseURL: 'https://api.deepinfra.com/v1/openai',
    apiKeyEnv: 'DEEPINFRA_API_KEY',
    models: [
      'meta-llama/Llama-3.3-70B-Instruct',
      'meta-llama/Meta-Llama-3.1-8B-Instruct',
      'mistralai/Mixtral-8x7B-Instruct-v0.1',
    ],
    maxTokens: 4096,
    supportsStreaming: true,
  },

  // ─── TIER 8: Novita AI (free credits) ───
  {
    id: 'novita',
    name: 'Novita AI',
    baseURL: 'https://api.novita.ai/v3/openai',
    apiKeyEnv: 'NOVITA_API_KEY',
    models: [
      'meta-llama/llama-3.1-70b-instruct',
      'meta-llama/llama-3.1-8b-instruct',
    ],
    maxTokens: 4096,
    supportsStreaming: true,
  },

  // ─── TIER 9: Fireworks AI (free tier) ───
  {
    id: 'fireworks',
    name: 'Fireworks AI',
    baseURL: 'https://api.fireworks.ai/inference/v1',
    apiKeyEnv: 'FIREWORKS_API_KEY',
    models: [
      'accounts/fireworks/models/llama-v3p3-70b-instruct',
      'accounts/fireworks/models/llama-v3p1-8b-instruct',
    ],
    maxTokens: 4096,
    supportsStreaming: true,
  },

  // ─── TIER 10: Lepton AI ───
  {
    id: 'lepton',
    name: 'Lepton AI',
    baseURL: 'https://llama3-3-70b.lepton.run/api/v1',
    apiKeyEnv: 'LEPTON_API_KEY',
    models: [
      'llama3-3-70b',
    ],
    maxTokens: 4096,
    supportsStreaming: true,
  },

  // ─── TIER 11: Chutes AI (free tier) ───
  {
    id: 'chutes',
    name: 'Chutes AI',
    baseURL: 'https://llm.chutes.ai/v1',
    apiKeyEnv: 'CHUTES_API_KEY',
    models: [
      'deepseek-ai/DeepSeek-V3-0324',
      'meta-llama/Llama-3.3-70B-Instruct',
    ],
    maxTokens: 4096,
    supportsStreaming: true,
  },

  // ─── TIER 12: Local Ollama (last resort — needs PC running) ───
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    baseURL: 'http://localhost:11434/v1',
    apiKeyEnv: 'OLLAMA_ENABLED', // set to "true" to enable
    models: [
      'qwen2.5-coder:7b',
    ],
    maxTokens: 4096,
    supportsStreaming: true,
  },
];


// ═══════════════════════════════════════════════════
// Runtime: Build active provider list from env
// ═══════════════════════════════════════════════════

let _activeProviders: FreeProvider[] | null = null;

function getActiveProviders(): FreeProvider[] {
  if (_activeProviders) return _activeProviders;

  _activeProviders = PROVIDER_CONFIGS
    .map(config => {
      const apiKey = process.env[config.apiKeyEnv];
      const isOllama = config.id === 'ollama';
      const enabled = isOllama ? apiKey === 'true' : !!apiKey;

      return {
        ...config,
        enabled,
        client: enabled ? new OpenAI({
          baseURL: config.baseURL,
          apiKey: isOllama ? 'ollama' : apiKey!,
        }) : undefined,
      };
    })
    .filter(p => p.enabled);

  console.log(`[FreeProviders] Active providers: ${_activeProviders.map(p => p.name).join(', ') || 'NONE'}`);
  return _activeProviders;
}

/**
 * Try each active provider in sequence until one succeeds.
 * Returns a streaming OpenAI chat completion response.
 * 
 * @param messages - Chat messages in OpenAI format
 * @param preferredModel - Optional model ID hint (used if provider supports it)
 * @param maxTokens - Max tokens to generate
 */
export async function streamWithFallback(
  messages: any[],
  preferredModel?: string,
  maxTokens: number = 4096,
): Promise<{ stream: any; provider: FreeProvider; model: string }> {
  const providers = getActiveProviders();

  if (providers.length === 0) {
    throw new Error('No AI providers configured. Add at least one API key to .env.local');
  }

  let lastError: any = null;

  for (const provider of providers) {
    // Check if provider is on cooldown (rate limited recently)
    if (provider.cooldownUntil && Date.now() < provider.cooldownUntil) {
      const minutesLeft = Math.ceil((provider.cooldownUntil - Date.now()) / 60000);
      console.log(`[FreeProviders] ⏳ Skipping ${provider.name} (on cooldown for ${minutesLeft} more mins)`);
      continue;
    }

    // Pick the best model for this provider
    const model = provider.models[0]; // Use provider's default free model

    try {
      console.log(`[FreeProviders] Trying ${provider.name} → ${model}`);

      const stream = await provider.client!.chat.completions.create({
        model,
        messages,
        stream: true,
        max_tokens: Math.min(maxTokens, provider.maxTokens || 4096),
      });

      console.log(`[FreeProviders] ✅ ${provider.name} responded successfully`);
      return { stream, provider, model };

    } catch (error: any) {
      lastError = error;
      const status = error.status || error.statusCode || 0;
      console.error(`[FreeProviders] ❌ ${provider.name} failed (${status}): ${error.message}`);

      // If Rate Limited (429) or Payment Required/Out of Credits (402), trigger 1-hour cooldown
      if (status === 429 || status === 402) {
        console.log(`[FreeProviders] 🛑 ${provider.name} hit rate limit. Activating 1-hour cooldown.`);
        provider.cooldownUntil = Date.now() + 60 * 60 * 1000; // 1 hour
      }

      // Continue to next provider for rate limits, auth errors, server errors
      if ([401, 402, 403, 429, 500, 502, 503, 504].includes(status)) {
        continue;
      }

      // Connection errors — provider is down, skip it
      if (error.cause?.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
        continue;
      }

      // Timeout — skip
      if (error.name === 'TimeoutError' || error.code === 'ETIMEDOUT') {
        continue;
      }

      // Unknown error — still try next provider
      continue;
    }
  }

  // All providers exhausted
  throw new Error(
    `All ${providers.length} AI providers are unavailable. Last error: ${lastError?.message || 'Unknown'}. ` +
    `Add more API keys to .env.local for better reliability.`
  );
}

/**
 * Get a summary of all configured providers and their status.
 */
export function getProviderStatus(): Array<{
  id: string;
  name: string;
  enabled: boolean;
  models: string[];
  signupUrl: string;
}> {
  const signupUrls: Record<string, string> = {
    sambanova: 'https://cloud.sambanova.ai/',
    groq: 'https://console.groq.com/keys',
    cerebras: 'https://cloud.cerebras.ai/',
    gemini: 'https://aistudio.google.com/apikey',
    openrouter: 'https://openrouter.ai/keys',
    together: 'https://api.together.xyz/settings/api-keys',
    huggingface: 'https://huggingface.co/settings/tokens',
    deepinfra: 'https://deepinfra.com/dash/api_keys',
    novita: 'https://novita.ai/dashboard/key',
    fireworks: 'https://fireworks.ai/api-keys',
    lepton: 'https://dashboard.lepton.ai/',
    chutes: 'https://chutes.ai/app/api-keys',
    ollama: 'https://ollama.com',
  };

  return PROVIDER_CONFIGS.map(config => {
    const apiKey = process.env[config.apiKeyEnv];
    const isOllama = config.id === 'ollama';
    const enabled = isOllama ? apiKey === 'true' : !!apiKey;

    return {
      id: config.id,
      name: config.name,
      enabled,
      models: config.models,
      signupUrl: signupUrls[config.id] || '#',
    };
  });
}

// Force re-initialization on next call (useful after env changes)
export function resetProviders() {
  _activeProviders = null;
}
