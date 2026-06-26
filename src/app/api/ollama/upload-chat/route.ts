import { NextRequest } from 'next/server';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_CONTEXT_CHARS = 8000;

// Supported file extensions for plain text extraction
const TEXT_EXTENSIONS = new Set([
  '.txt', '.md', '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c',
  '.h', '.hpp', '.html', '.css', '.json', '.xml', '.yaml', '.yml', '.sh',
  '.bat', '.ps1', '.sql', '.rb', '.go', '.rs', '.swift', '.kt', '.dart',
  '.r', '.m', '.php', '.vue', '.svelte', '.toml', '.ini', '.cfg', '.env',
  '.log', '.csv',
]);

/**
 * Extract text from uploaded file based on type
 */
async function extractText(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
  const ext = '.' + filename.split('.').pop()?.toLowerCase();

  // PDF extraction
  if (ext === '.pdf' || mimeType === 'application/pdf') {
    try {
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(buffer);
      return data.text || '[Empty PDF]';
    } catch (e: any) {
      return `[PDF extraction error: ${e.message}]`;
    }
  }

  // DOCX extraction
  if (ext === '.docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    try {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '[Empty DOCX]';
    } catch (e: any) {
      return `[DOCX extraction error: ${e.message}]`;
    }
  }

  // Plain text / code files
  if (TEXT_EXTENSIONS.has(ext) || mimeType.startsWith('text/')) {
    return buffer.toString('utf-8');
  }

  return `[Unsupported file type: ${ext}]`;
}

/**
 * Chunk and summarize long text to fit within context limits
 */
async function summarizeIfNeeded(text: string, model: string): Promise<string> {
  if (text.length <= MAX_CONTEXT_CHARS) return text;

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
            prompt: `Summarize this text concisely, preserving all key details, code logic, and structure:\n\n${chunk}`,
            stream: false,
          }),
        });
        if (!res.ok) return `[Section ${idx + 1} summarization failed]`;
        const data = await res.json();
        return data.response || '';
      } catch {
        return `[Section ${idx + 1} summarization error]`;
      }
    })
  );

  return summaries.join('\n\n--- ---\n\n');
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const prompt = formData.get('prompt') as string || 'Analyze this file.';
    const model = formData.get('model') as string || DEFAULT_MODEL;
    const historyRaw = formData.get('history') as string || '[]';

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // File size check
    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` },
        { status: 400 }
      );
    }

    // Extract text
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let extractedText = await extractText(buffer, file.name, file.type);

    // Summarize if too long
    extractedText = await summarizeIfNeeded(extractedText, model);

    // Parse conversation history
    let history: Array<{ role: string; content: string }> = [];
    try {
      history = JSON.parse(historyRaw);
    } catch {
      history = [];
    }

    // Build messages for Ollama
    const messages = [
      ...history.map((h: any) => ({
        role: h.role === 'assistant' ? 'assistant' : 'user',
        content: String(h.content),
      })),
      {
        role: 'user' as const,
        content: `[Uploaded File: ${file.name}]\n\n${extractedText}\n\n---\n\n${prompt}`,
      },
    ];

    // Stream from Ollama
    const ollamaRes = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        options: { temperature: 0.7, num_predict: 4096 },
      }),
    });

    if (!ollamaRes.ok) {
      const errText = await ollamaRes.text().catch(() => 'Unknown error');
      return Response.json({ error: `Ollama error: ${errText}` }, { status: 502 });
    }

    if (!ollamaRes.body) {
      return Response.json({ error: 'No response body from Ollama' }, { status: 502 });
    }

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
          const lines = text.split('\n').filter(l => l.trim());

          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.message?.content) {
                controller.enqueue(new TextEncoder().encode(parsed.message.content));
              }
              if (parsed.done) {
                controller.close();
                return;
              }
            } catch {
              // skip
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
    if (error.cause?.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
      return Response.json({
        error: 'Ollama is not running. Please start Ollama first.',
      }, { status: 503 });
    }
    return Response.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
