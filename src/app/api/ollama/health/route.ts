import { NextRequest } from 'next/server';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';

export async function GET(_request: NextRequest) {
  try {
    const ollamaRes = await fetch(`${OLLAMA_HOST}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!ollamaRes.ok) {
      return Response.json({
        status: 'degraded',
        server: 'ok',
        ollama: 'error',
        message: `Ollama responded with status ${ollamaRes.status}`,
      }, { status: 200 });
    }

    const data = await ollamaRes.json();
    const modelCount = data.models?.length ?? 0;

    return Response.json({
      status: 'ok',
      server: 'ok',
      ollama: 'connected',
      models: modelCount,
      host: OLLAMA_HOST,
    });
  } catch (error: any) {
    const isConnectionRefused = 
      error.cause?.code === 'ECONNREFUSED' || 
      error.message?.includes('ECONNREFUSED') ||
      error.name === 'TimeoutError';

    return Response.json({
      status: 'offline',
      server: 'ok',
      ollama: 'disconnected',
      message: isConnectionRefused
        ? 'Ollama is not running. Start it with: ollama serve'
        : error.message,
    }, { status: 200 });
  }
}
