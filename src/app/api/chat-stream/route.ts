import { NextRequest } from 'next/server';
import { CoreMessage } from 'ai';
import { openai } from '@/lib/openai';
import { DEFAULT_MODEL_ID, AVAILABLE_MODELS } from '@/lib/models';
import { webSearch } from '@/ai/tools/web-search';
import { searchYoutube } from '@/ai/tools/youtube-search';
import { searchImages } from '@/ai/tools/image-search';

const getSystemPrompt = (
    modelId: string,
    userName: string | null,
    fileContent: string | null | undefined,
    answerTypes: { [key: string]: boolean }
): string => {
    // 1. Determine Answer Style (if explicitly selected by user)
    let answerStyleInstruction = "";
    const selectedTypes = Object.entries(answerTypes)
        .filter(([key, value]) => key !== 'auto' && value)
        .map(([key]) => key);

    if (selectedTypes.length > 0) {
        const stylePrompts = {
            long: "Proivde a very detailed and comprehensive answer.",
            short: "Keep your answer short and concise.",
            funny: "Answer with a humorous and witty tone.",
            sad: "Answer with a empathetic and somber tone.",
            education: "Explain this as if you are teaching a class, covering all nuances."
        };
        answerStyleInstruction = "\n\nStyle Instructions:\n" + selectedTypes.map(type => stylePrompts[type as keyof typeof stylePrompts]).join(" ");
    }

    // 2. Define Native Personas
    const nativePersonas: Record<string, string> = {
        'gpt-oss-120b': `You are Gemini, a large language model trained by Google.`,
        'DeepSeek-V3.1': `You are DeepSeek, a helpful and professional assistant.`,
        'Meta-Llama-3.3-70B-Instruct': `You are Claude, an AI assistant created by Anthropic.`,
        'Llama-3.3-Swallow-70B-Instruct-v0.4': `You are Swallow, a helpful AI assistant.`,
        'gpt-5': `You are ChatGPT, a large language model trained by OpenAI.`,
        'Meta-Llama-3.1-8B-Instruct': `You are Llama, a helpful AI assistant.`,
    };

    const persona = nativePersonas[modelId] || `You are a helpful AI assistant.`;

    // 3. Construct System Prompt
    return `${persona} ${userName ? `You are interacting with ${userName}.` : ''} 
    
${fileContent ? `\nContext file provided:\n${fileContent}\n` : ''}
${answerStyleInstruction}

IMPORTANT: If the user requests images, photos, or visual information, assume that relevant images are being displayed to the user by the system. Do NOT state that you cannot generate or show images. Instead, introduce the images, describe the subject matter in detail, or explain the context of what is being shown. Always be helpful and provide information about the visual topics requested.`;
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
                    max_tokens: 4096,
                });

                const modelName = AVAILABLE_MODELS.find(m => m.id === modelId)?.name || modelId;
                const encoder = new TextEncoder();

                const readableStream = new ReadableStream({
                    async start(controller) {
                        try {
                            // No prefix, send model output directly
                            console.log(`[Streaming] Starting stream for model: ${modelId}`);

                            // AUTO IMAGE SEARCH INJECTION
                            const lowerContent = userMessageContent.toLowerCase();
                            const visualKeywords = [
                                "map", "location", "geography", "diagram", "chart", "anatomy",
                                "where is", "capital", "landscape", "mountain", "river", "lake",
                                "ocean", "planet", "stars", "nebula", "galaxy", "cell", "molecule",
                                "atom", "history", "ancient", "show me", "picture of", "image of",
                                "what does a", "look like", "structure of",
                                // Expanded keywords as requested
                                "technology", "tech", "gadget", "device", "innovation",
                                "science", "physics", "chemistry", "biology", "space", "universe",
                                "nature", "animal", "bird", "fish", "insect", "plant", "flower",
                                "tree", "forest", "city", "building", "architecture", "car", "vehicle",
                                "airplane", "boat", "computer", "robot", "ai", "network", "internet",
                                "news", "latest", "info", "information", "real time", "who is", "what is",
                                "pm of", "president of", "king of", "queen of", "leader of",
                                "actor", "actress", "movie", "film", "celebrity", "singer", "band",
                                "sport", "game", "player", "team", "match", "tournament",
                                "tell me about", "describe", "explain", "smartphone", "laptop", "console"
                            ];

                            // Only search if not explicitly using other modes and contains keywords
                            if (!isSearch && !isMusic && !imageDataUri && visualKeywords.some(k => lowerContent.includes(k))) {
                                try {
                                    console.log(`[Streaming] Detected visual intent, searching images for: ${userMessageContent}`);
                                    const searchResult = await searchImages({ query: userMessageContent });

                                    if (searchResult.images && searchResult.images.length > 0) {
                                        const header = `:::IMAGE_SEARCH_RESULT=${JSON.stringify(searchResult)}:::\n\n`;
                                        controller.enqueue(encoder.encode(header));
                                        console.log(`[Streaming] Injected ${searchResult.images.length} images`);
                                    }
                                } catch (e) {
                                    console.error("[Streaming] Auto image search failed", e);
                                }
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
