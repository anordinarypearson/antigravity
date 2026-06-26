import { NextRequest } from 'next/server';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';

export async function GET(_request: NextRequest) {
  try {
    const ollamaRes = await fetch(`${OLLAMA_HOST}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!ollamaRes.ok) {
      return Response.json({ error: 'Failed to fetch models from Ollama' }, { status: 502 });
    }

    const data = await ollamaRes.json();
    const models = (data.models || []).map((m: any) => ({
      name: m.name,
      size: m.size,
      modified: m.modified_at,
      digest: m.digest?.slice(0, 12),
      family: m.details?.family,
      parameterSize: m.details?.parameter_size,
      quantization: m.details?.quantization_level,
    }));

    return Response.json({ models });
  } catch (error: any) {
    const isConnectionRefused = 
      error.cause?.code === 'ECONNREFUSED' || 
      error.message?.includes('ECONNREFUSED') ||
      error.name === 'TimeoutError';

    if (isConnectionRefused) {
      return Response.json({ 
        error: 'Ollama is not running',
        models: [] 
      }, { status: 503 });
    }

    return Response.json({ error: error.message, models: [] }, { status: 500 });
  }
}
