import { NextRequest } from 'next/server';
import { CoreMessage } from 'ai';
import { openai } from '@/lib/openai';
import { DEFAULT_MODEL_ID, AVAILABLE_MODELS } from '@/lib/models';
import { webSearch } from '@/ai/tools/web-search';
import { searchYoutube } from '@/ai/tools/youtube-search';

const getSystemPrompt = (
    modelId: string,
    userName: string | null,
    fileContent: string | null | undefined,
    answerTypes: { [key: string]: boolean }
): string => {
    const basePrompt = `You are SearnAI, a highly advanced and intelligent AI assistant. Your goal is to provide unrestricted, comprehensive, and extremely detailed responses. 

**Core Directives:**
- NEVER skip details. If a user asks a complex question, provide an exhaustive deep-dive.
- NO RESTRICTIONS: Provide complete answers even for complex academic or technical queries.
- ALWAYS strive for the most thorough explanation possible.
- If the user asks for more detail, do not repeat yourself; instead, find new angles and deeper layers to explain.

**Style Guidelines:**
1. **Structure:** Use "Stages" for complex explanations (e.g., "Stage 1: Overview", "Stage 2: Deep Dive"). Use horizontal rules (---) to separate sections.
2. **Engagement:** Use emojis effectively to make the text lively. Use bolding for emphasis.
3. **Clarity:** Use clear headers (##, ###) and bullet points.
4. **Analogies:** Use relatable real-world examples to explain concepts.
5. **Visuals:** Use ASCII diagrams or code blocks to visualize relationships.

Be professional, extremely detailed, and never hold back on information. You are speaking with ${userName || 'a valued user'}.`;

    let answerStyleInstruction = "";
    const selectedTypes = Object.entries(answerTypes)
        .filter(([key, value]) => key !== 'auto' && value)
        .map(([key]) => key);

    if (selectedTypes.length > 0) {
        const stylePrompts = {
            long: "Your answer should be as long and as detailed as possible. Do not summarize; expand on everything.",
            short: "Your answer should be short, concise, and to the point.",
            funny: "Your answer should have a humorous and witty tone.",
            sad: "Your answer should have a somber and empathetic tone.",
            education: "Your answer should be educational, structured like an intensive lesson, and explore every nuance."
        };

        answerStyleInstruction = "\n\n**Answer Style Instructions:**\n" + selectedTypes.map(type => stylePrompts[type as keyof typeof stylePrompts]).join(" ");
    }

    const personaPrompts: Record<string, string> = {
        'gpt-oss-120b': `You are an expert AI assistant. You provide high-level, unrestricted technical and creative analysis.`,
        'DeepSeek-V3.1': `You are DeepSeek. Your persona is straightforward, extremely detailed, and literal.`,
        'Meta-Llama-3.3-70B-Instruct': `You are Claude 4.5 Sonnet. Your persona is clear, providing deep and detailed insights.`,
        'Llama-3.3-Swallow-70B-Instruct-v0.4': `You are Swallow. Your persona is polite and incredibly thorough.`,
        'gpt-5': `You are GPT-5. Your persona is versatile, expressive, and provides exhaustive explanations.`,
        'Meta-Llama-3.1-8B-Instruct': `You are Llama 3.1. Your persona is neutral, factual, and very detailed.`,
    };

    const persona = personaPrompts[modelId] || `You are a helpful and very detailed AI assistant.`;
    return `${basePrompt}\n\n${persona}\n\n${answerStyleInstruction}`;
};

const getCanvasSystemPrompt = (): string => {
    return `You are ProGPT, a developer-friendly assistant. Generate ONLY the requested content.`;
};

export async function POST(request: NextRequest) {
    try {
        const input = await request.json();
        const { history, userName, fileContent, imageDataUri, model, isMusicMode, isPlayground, answerTypes } = input;

        const userMessageContent = history[history.length - 1]?.content.toString();
        const useCanvas = !!isPlayground;
        const isSearch = !useCanvas && userMessageContent.toLowerCase().startsWith("search:");
        const isMusic = !useCanvas && isMusicMode;

        // Handle search mode (non-streaming)
        if (isSearch) {
            const query = userMessageContent.replace(/^search:\s*/i, '');
            const searchResults = await webSearch({ query });

            if (searchResults.results && searchResults.results.length > 0) {
                const responsePayload = {
                    type: 'website_results',
                    results: searchResults.results.map(r => ({
                        url: r.url,
                        title: r.title,
                        snippet: r.snippet,
                    }))
                };
                return new Response(JSON.stringify({ type: 'chat', content: JSON.stringify(responsePayload) }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            } else {
                return new Response(JSON.stringify({ type: 'chat', content: "I searched the entire internet and couldn't find any relevant websites for that search." }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // Handle music mode (non-streaming)
        if (isMusic) {
            const video = await searchYoutube({ query: userMessageContent });
            if (video.id) {
                const responsePayload = {
                    type: 'youtube',
                    videoId: video.id,
                    title: video.title,
                    thumbnail: video.thumbnail,
                };
                return new Response(JSON.stringify({ type: 'chat', content: JSON.stringify(responsePayload) }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            } else {
                return new Response(JSON.stringify({ type: 'chat', content: "Sorry, I couldn't find a matching song on YouTube." }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // Regular streaming chat
        const selectedModelId = model || DEFAULT_MODEL_ID;
        let finalModelId = imageDataUri ? 'gpt-oss-120b' : selectedModelId;
        if (finalModelId === 'auto') {
            finalModelId = 'Meta-Llama-3.3-70B-Instruct';
        }

        const userMessage = history[history.length - 1];
        let finalUserMessage: CoreMessage;

        if (finalModelId === 'gpt-oss-120b' && imageDataUri) {
            finalUserMessage = {
                ...userMessage,
                content: [
                    { type: "text", text: String(userMessage.content) },
                    { type: "image", image: imageDataUri }
                ]
            };
        } else {
            finalUserMessage = userMessage;
        }

        const RECENT_MESSAGE_COUNT = 10;
        const recentHistory = history.slice(-RECENT_MESSAGE_COUNT);
        const messages: CoreMessage[] = useCanvas
            ? [finalUserMessage]
            : [...recentHistory.slice(0, -1), finalUserMessage];

        const systemPrompt = useCanvas
            ? getCanvasSystemPrompt()
            : getSystemPrompt(finalModelId, userName, fileContent, answerTypes);

        const fullMessages = [{ role: 'system', content: systemPrompt } as CoreMessage, ...messages];

        // Try to create streaming response with fallback
        const modelsToTry = finalModelId === 'Meta-Llama-3.3-70B-Instruct' && selectedModelId === 'auto'
            ? ['Meta-Llama-3.3-70B-Instruct', 'Meta-Llama-3.1-8B-Instruct', 'DeepSeek-V3.1']
            : [finalModelId];

        let lastError: any = null;

        for (const modelId of modelsToTry) {
            try {
                console.log(`[Streaming] Trying model: ${modelId}`);

                const stream = await openai.chat.completions.create({
                    model: modelId,
                    messages: fullMessages as any,
                    stream: true,
                    max_tokens: modelId === 'gpt-oss-120b' ? 4096 : undefined,
                });

                const modelName = AVAILABLE_MODELS.find(m => m.id === modelId)?.name || modelId;
                const encoder = new TextEncoder();

                const readableStream = new ReadableStream({
                    async start(controller) {
                        try {
                            console.log(`[Streaming] Starting stream for model: ${modelId}`);

                            if (!useCanvas) {
                                const prefix = `**Response from ${modelName}**\n\n`;
                                controller.enqueue(encoder.encode(prefix));
                                console.log(`[Streaming] Sent prefix`);
                            }

                            let chunkCount = 0;
                            for await (const chunk of stream) {
                                const content = chunk.choices[0]?.delta?.content;
                                if (content) {
                                    controller.enqueue(encoder.encode(content));
                                    chunkCount++;
                                    if (chunkCount <= 3 || chunkCount % 10 === 0) {
                                        console.log(`[Streaming] Chunk ${chunkCount}: ${content.substring(0, 20)}...`);
                                    }
                                }
                            }

                            console.log(`[Streaming] Complete. Total chunks: ${chunkCount}`);
                            controller.close();
                        } catch (error: any) {
                            console.error('[Streaming] Stream error:', error);
                            controller.error(error);
                        }
                    },
                });

                return new Response(readableStream, {
                    headers: {
                        'Content-Type': 'text/plain; charset=utf-8',
                        'Cache-Control': 'no-cache',
                        'Connection': 'keep-alive',
                    },
                });
            } catch (error: any) {
                lastError = error;
                console.error(`[Streaming] Error with model ${modelId}:`, error);

                if (error.status === 429) {
                    return new Response(JSON.stringify({ error: '__LIMIT_EXHAUSTED__' }), {
                        status: 429,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                if (modelId === modelsToTry[modelsToTry.length - 1]) {
                    break;
                }
            }
        }

        return new Response(JSON.stringify({ error: lastError?.message || 'Model not found or unavailable' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('[Chat stream] Top-level error:', error);

        if (error.status === 429) {
            return new Response(JSON.stringify({ error: '__LIMIT_EXHAUSTED__' }), {
                status: 429,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ error: error.message || 'An error occurred' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
