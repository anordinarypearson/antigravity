import { NextRequest } from 'next/server';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b';
const MAX_CONTEXT_CHARS = 8000;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Chunk long text into segments and summarize each via Ollama
 * to keep within model context limits.
 */
async function summarizeChunks(text: string, model: string): Promise<string> {
  const chunkSize = MAX_CONTEXT_CHARS;
  const chunks: string[] = [];
  
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }

  const summaries = await Promise.all(
    chunks.map(async (chunk, idx) => {
      try {
        const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            prompt: `Summarize this text concisely, preserving key details and code:\n\n${chunk}`,
            stream: false,
          }),
        });
        if (!res.ok) return `[Chunk ${idx + 1} summarization failed]`;
        const data = await res.json();
        return data.response || `[Chunk ${idx + 1}: empty summary]`;
      } catch {
        return `[Chunk ${idx + 1} summarization error]`;
      }
    })
  );

  return summaries.join('\n\n--- Section Break ---\n\n');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      messages = [] as ChatMessage[],
      model = DEFAULT_MODEL,
      fileContent = null as string | null,
      temperature = 0.7,
    } = body;

    if (!messages.length) {
      return Response.json({ error: 'No messages provided' }, { status: 400 });
    }

    // Sanitize messages
    const sanitized: ChatMessage[] = messages.map((m: ChatMessage) => ({
      role: m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user',
      content: String(m.content || '').slice(0, 50000), // hard cap per message
    }));

    // If file content is attached, process it
    if (fileContent && typeof fileContent === 'string') {
      let processedContent = fileContent;
      
      // If content is too long, summarize it
      if (processedContent.length > MAX_CONTEXT_CHARS) {
        processedContent = await summarizeChunks(processedContent, model);
      }
      
      // Prepend file context to the last user message
      const lastUserIdx = sanitized.findLastIndex(m => m.role === 'user');
      if (lastUserIdx >= 0) {
        sanitized[lastUserIdx].content = 
          `[Attached File Content]\n${processedContent}\n[End of File]\n\n${sanitized[lastUserIdx].content}`;
      }
    }

    // Stream from Ollama
    const ollamaRes = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: sanitized,
        stream: true,
        options: {
          temperature,
          num_predict: 4096,
        },
      }),
    });

    if (!ollamaRes.ok) {
      const errText = await ollamaRes.text().catch(() => 'Unknown Ollama error');
      return Response.json(
        { error: `Ollama error (${ollamaRes.status}): ${errText}` },
        { status: 502 }
      );
    }

    if (!ollamaRes.body) {
      return Response.json({ error: 'No response body from Ollama' }, { status: 502 });
    }

    // Create a ReadableStream that forwards Ollama's streamed tokens
    const reader = ollamaRes.body.getReader();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            return;
          }

          const text = decoder.decode(value, { stream: true });
          
          // Ollama streams newline-delimited JSON objects
          const lines = text.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.message?.content) {
                // Forward the token as plain text
                controller.enqueue(new TextEncoder().encode(parsed.message.content));
              }
              if (parsed.done) {
                controller.close();
                return;
              }
            } catch {
              // Skip malformed lines
            }
          }
        } catch (err) {
          controller.error(err);
        }
      },
      cancel() {
        reader.cancel();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error: any) {
    // Connection refused = Ollama not running
    if (error.cause?.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
      return Response.json(
        { 
          error: 'Ollama is not running. Please start Ollama on your computer first.\n\n1. Download from https://ollama.com\n2. Run: ollama run qwen2.5-coder:7b\n3. Keep the terminal open' 
        },
        { status: 503 }
      );
    }
    
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
