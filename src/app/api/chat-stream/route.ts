import { NextRequest } from 'next/server';
import { CoreMessage } from 'ai';
import { openai } from '@/lib/openai';
import { DEFAULT_MODEL_ID, AVAILABLE_MODELS, AUTO_FALLBACK_CHAIN } from '@/lib/models';
import { webSearch } from '@/ai/tools/web-search';
import { searchYoutube } from '@/ai/tools/youtube-search';
import { searchImages } from '@/ai/tools/image-search';


const getSystemPrompt = (
    modelId: string,
    userName: string | null,
    fileContent: string | null | undefined,
    answerTypes: { [key: string]: boolean }
): string => {
    // 1. Determine Answer Style
    let answerStyleInstruction = "";
    const selectedTypes = Object.entries(answerTypes)
        .filter(([key, value]) => key !== 'auto' && value)
        .map(([key]) => key);

    if (selectedTypes.length > 0) {
        const stylePrompts: Record<string, string> = {
            long: "Provide a very detailed, comprehensive, and exhaustive answer. Cover every angle and nuance. Do not summarize — expand on everything.",
            short: "Keep your answer short, crisp, and to the point. Maximum 2-3 paragraphs unless the topic demands more.",
            funny: "Answer with a humorous, witty, and entertaining tone. Use clever wordplay, jokes, and fun analogies.",
            sad: "Answer with a deeply empathetic, thoughtful, and somber tone. Be compassionate and understanding.",
            education: "Explain this as an expert teacher would — structured like a lesson with clear stages, examples, analogies, and a summary."
        };
        answerStyleInstruction = "\n\n**Answer Style Override:**\n" + selectedTypes.map(type => stylePrompts[type] || '').filter(Boolean).join(" ");
    }

    // 2. Define Personas per SambaNova model
    const nativePersonas: Record<string, string> = {
        'DeepSeek-V3.1': `You are DeepSeek V3.1, a professional and highly analytical AI assistant known for precise, detailed answers and deep reasoning.`,
        'DeepSeek-V3.1-cb': `You are DeepSeek V3.1 Code, an expert coding assistant specialized in programming, debugging, and software architecture.`,
        'DeepSeek-V3.2': `You are DeepSeek V3.2, the latest and most capable DeepSeek model with enhanced reasoning and knowledge.`,
        'Llama-4-Maverick-17B-128E-Instruct': `You are Llama 4 Maverick, Meta's advanced mixture-of-experts AI with 128 expert layers for exceptional versatility.`,
        'Meta-Llama-3.3-70B-Instruct': `You are Llama 3.3 70B, a powerful and nuanced AI assistant capable of handling complex multi-step reasoning.`,
        'MiniMax-M2.5': `You are MiniMax M2.5, a highly efficient and multilingual AI assistant with strong creative and analytical skills.`,
        'gemma-3-12b-it': `You are Gemma 3, Google's open-source AI model. You are concise, helpful, and efficient.`,
        'gpt-oss-120b': `You are GPT-OSS 120B, a massive 120 billion parameter AI with deep knowledge and sophisticated reasoning capabilities.`,
    };

    const persona = nativePersonas[modelId] || `You are a highly capable and intelligent AI assistant.`;

    // 3. Build the full system prompt
    return `${persona}${userName ? ` You are chatting with ${userName}. Use their name naturally to make the chat feel personal.` : ''}

═══════════════════════════════════════════════════
🧠 PROMPT UNDERSTANDING & INTELLIGENCE
═══════════════════════════════════════════════════

You EXPERTLY understand what users mean, even with:
- Typos or spelling mistakes
   e.g. "strem" → "stream", "anser" → "answer", "beeter" → "better",
   "undredtaning" → "understanding", "phisics" → "physics"
- Broken grammar or informal language
- Vague questions — infer the best interpretation
- Slang/abbreviations (nvm, tbh, wdym, lmk, etc.)

**Before answering, silently:**
1. Parse the user's true intent past any errors
2. Use conversation history for follow-ups
3. Match response depth to question complexity
4. Identify if it's factual, creative, code, tutorial, comparison, etc.

NEVER say "I don't understand" for fixable typos. Just answer intelligently.

═══════════════════════════════════════════════════
✨ RESPONSE QUALITY & FORMATTING
═══════════════════════════════════════════════════

**Structure:**
- Use ## and ### headers to organize longer responses
- Use --- horizontal rules between major sections
- Bullet points and numbered lists with relevant emojis
- **Bold** for key terms, *italic* for nuance
- \`code blocks\` for technical terms/commands
- Syntax-highlighted fenced code blocks for code
- Short paragraphs (2-4 sentences max)

**Tone & Persona:**
- Be extremely concise, direct, and straight to the point.
- Provide short answers for simple questions.
- However, when asked for code, write comprehensive, production-ready, 50+ line code blocks. Provide the full code.
- Add relevant emojis 🚀✨💡🎯⚡🔥 but don't overdo it.

**Don't:**
- NEVER use conversational fillers (e.g., "Hi", "Hello", "How can I help you", "Sure!", "Here is the code").
- NEVER ask follow-up questions.
- NEVER start with "I" as the first word.
- NEVER repeat yourself when asked to go deeper — find new angles.

${fileContent ? `\n**📎 Attached Context:**\n---\n${fileContent.substring(0, 3000)}\n---\nReference this when relevant.\n` : ''}
${answerStyleInstruction}`;
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

        // ═══════════════════════════════════════════════════
        // STREAMING CHAT — All models via SambaNova OpenAI-compatible API
        // ═══════════════════════════════════════════════════

        const selectedModelId = model || DEFAULT_MODEL_ID;

        // Vision requests force gpt-oss-120b
        let finalModelId = imageDataUri ? 'gpt-oss-120b' : selectedModelId;
        if (finalModelId === 'auto') {
            finalModelId = AUTO_FALLBACK_CHAIN[0]; // Start with best model
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

        // Sanitize roles: frontend uses 'model' (Gemini convention) but SambaNova requires 'assistant'
        const sanitizedMessages: CoreMessage[] = messages.map(msg => ({
            ...msg,
            role: msg.role === 'model' ? 'assistant' : msg.role,
        })) as CoreMessage[];

        const fullMessages = [{ role: 'system', content: systemPrompt } as CoreMessage, ...sanitizedMessages];

        // Build model fallback chain
        const modelsToTry = selectedModelId === 'auto'
            ? AUTO_FALLBACK_CHAIN
            : [finalModelId];

        let lastError: any = null;

        for (const modelId of modelsToTry) {
            try {
                console.log(`[Streaming] Trying model: ${modelId} via SambaNova`);

                // All models go through the single SambaNova OpenAI-compatible endpoint
                const stream = await openai.chat.completions.create({
                    model: modelId,
                    messages: fullMessages as any,
                    stream: true,
                    max_tokens: 4096,
                });

                const encoder = new TextEncoder();

                const readableStream = new ReadableStream({
                    async start(controller) {
                        try {
                            console.log(`[Streaming] ✅ Stream started for model: ${modelId}`);

                            // AUTO IMAGE SEARCH INJECTION
                            const lowerContent = userMessageContent.toLowerCase();
                            const visualKeywords = [
                                "map", "location", "geography", "diagram", "chart", "anatomy",
                                "where is", "capital", "landscape", "mountain", "river", "lake",
                                "ocean", "planet", "stars", "nebula", "galaxy", "cell", "molecule",
                                "atom", "history", "ancient", "show me", "picture of", "image of",
                                "what does a", "look like", "structure of",
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
                            let imagePromise: Promise<any> | null = null;
                            if (!isSearch && !isMusic && !imageDataUri && visualKeywords.some(k => lowerContent.includes(k))) {
                                console.log(`[Streaming] Detected visual intent, starting background image search`);
                                imagePromise = searchImages({ query: userMessageContent }).catch(e => {
                                    console.error("[Streaming] Auto image search failed", e);
                                    return null;
                                });
                            }

                            let chunkCount = 0;
                            for await (const chunk of stream) {
                                const content = chunk.choices[0]?.delta?.content;
                                if (content) {
                                    for (const char of content) {
                                        controller.enqueue(encoder.encode(char));
                                    }
                                    chunkCount++;
                                }
                            }

                            // Append images at the end of the stream
                            if (imagePromise) {
                                const searchResult = await imagePromise;
                                if (searchResult && searchResult.images && searchResult.images.length > 0) {
                                    const footer = `\n\n:::IMAGE_SEARCH_RESULT=${JSON.stringify(searchResult)}:::`;
                                    controller.enqueue(encoder.encode(footer));
                                    console.log(`[Streaming] Injected ${searchResult.images.length} images`);
                                }
                            }

                            console.log(`[Streaming] ✅ Complete. Model: ${modelId}, Chunks: ${chunkCount}`);
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
                console.error(`[Streaming] ❌ Error with model ${modelId}:`, error.message || error);

                // 402 = Payment required — return immediately
                if (error.status === 402) {
                    return new Response(JSON.stringify({
                        error: 'PAYMENT_REQUIRED',
                        message: `Model "${modelId}" requires a payment method. Please add one at https://cloud.sambanova.ai/ or try a different model.`
                    }), {
                        status: 402,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // 429 = Rate limit — return immediately
                if (error.status === 429) {
                    return new Response(JSON.stringify({ error: '__LIMIT_EXHAUSTED__' }), {
                        status: 429,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // For other errors, try the next model in the fallback chain
                if (modelId === modelsToTry[modelsToTry.length - 1]) {
                    break; // Last model failed, break out
                }
                console.log(`[Streaming] Falling back to next model...`);
            }
        }

        return new Response(JSON.stringify({ error: lastError?.message || 'All models unavailable' }), {
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
