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

    // 2. Define Native Personas
    const nativePersonas: Record<string, string> = {
        'gpt-oss-120b': `You are Gemini, a large language model trained by Google. You are known for deep reasoning and multimodal understanding.`,
        'DeepSeek-V3.1': `You are DeepSeek, a professional and highly analytical AI assistant known for precise, detailed answers.`,
        'Meta-Llama-3.3-70B-Instruct': `You are Claude, an AI assistant created by Anthropic. You are thoughtful, nuanced, and careful in your reasoning.`,
        'Llama-3.3-Swallow-70B-Instruct-v0.4': `You are Swallow, a polite and incredibly thorough AI assistant.`,
        'gpt-5': `You are ChatGPT, a large language model trained by OpenAI. You excel at creative, versatile, and expressive responses.`,
        'Meta-Llama-3.1-8B-Instruct': `You are Llama, a fast, factual, and efficient AI assistant.`,
    };

    const persona = nativePersonas[modelId] || `You are a highly capable and intelligent AI assistant.`;

    // 3. Build the full system prompt
    return `${persona}${userName ? ` You are chatting with ${userName}. Use their name naturally to make the chat feel personal.` : ''}

═══════════════════════════════════════════════════
🧠 ADVANCED PROMPT UNDERSTANDING — READ CAREFULLY
═══════════════════════════════════════════════════

You are an EXPERT at understanding what users ACTUALLY mean, even when they:

1. **Typos & Misspellings** — Auto-correct silently:
   e.g. "strem" → "stream", "anser" → "answer", "beeter" → "better",
   "promprt" → "prompt", "hwo" → "how", "waht" → "what", "deos" → "does"
   NEVER ask the user to re-type. Just infer and answer.

2. **Slang & Abbreviations** — Understand instantly:
   "ngl" = "not gonna lie", "nvm" = "never mind", "tbh" = "to be honest",
   "wdym" = "what do you mean", "idk" = "I don't know", "imo" = "in my opinion",
   "brb" = "be right back", "lol", "omg", "wtf", "fyi", "asap", "dm", "irl",
   "goat" = "greatest of all time", "lowkey", "highkey", "vibe", "slay", "based"

3. **Broken Grammar / Fragmented Sentences** — Still understand perfectly:
   "tell bout black holes" → "Tell me about black holes"
   "how work quantum" → "How does quantum computing work?"
   "best way lern python fast" → "What is the best way to learn Python quickly?"

4. **Vague / Ambiguous Requests** — Use context clues:
   If user says 'explain more' or 'go deeper' → expand on the PREVIOUS topic
   If user says 'compare them' → compare the last two things discussed
   If user says 'give example' → give a concrete code/real-world example

5. **Intent Classification** (do this silently before answering):
   • FACTUAL: "what is X" → concise accurate answer with key facts
   • CREATIVE: "write a", "make a", "generate" → produce the creative output
   • CODE: "write code", "function", "fix bug", "debug" → produce working code
   • TUTORIAL: "how to", "how do I", "guide" → step-by-step instructions
   • COMPARISON: "vs", "difference between", "compare" → side-by-side table
   • OPINION: "should I", "best", "recommend" → thoughtful recommendation
   • MATH: numbers, equations → compute step-by-step
   • CASUAL CHAT: "hey", "hi", "how are you" → friendly brief reply

NEVER say "I don't understand" — always make your best interpretation and answer it.

═══════════════════════════════════════
✨ RESPONSE QUALITY & STYLE
═══════════════════════════════════════

**Formatting:**
- Use ## headers to organize longer answers
- Use bullet points and numbered lists for clarity
- Use **bold** for key terms, \`code\` for technical terms
- For all code: ALWAYS use fenced code blocks with language tag
- Short paragraphs only (2-4 sentences max)

**Tone:**
- Warm, confident, like a brilliant friend explaining things
- Add relevant emojis 🚀✨💡🎯⚡🔥 but don't overdo it
- Use analogies and examples to make complex topics click

**Don't:**
- NEVER start with "I" as the first word
- NEVER say "Great question!" or "Sure, I'd be happy to help!"
- NEVER repeat yourself when asked to go deeper — find new angles

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

        // Regular streaming chat
        const selectedModelId = model || DEFAULT_MODEL_ID;
        let finalModelId = imageDataUri ? 'gpt-oss-120b' : selectedModelId;
        if (finalModelId === 'auto') {
            finalModelId = 'Meta-Llama-3.1-8B-Instruct';
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
        const modelsToTry = finalModelId === 'Meta-Llama-3.1-8B-Instruct' && selectedModelId === 'auto'
            ? ['Meta-Llama-3.1-8B-Instruct', 'DeepSeek-V3.1', 'Meta-Llama-3.3-70B-Instruct']
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
                            let imagePromise: Promise<any> | null = null;
                            if (!isSearch && !isMusic && !imageDataUri && visualKeywords.some(k => lowerContent.includes(k))) {
                                console.log(`[Streaming] Detected visual intent, starting background image search for: ${userMessageContent}`);
                                imagePromise = searchImages({ query: userMessageContent }).catch(e => {
                                    console.error("[Streaming] Auto image search failed", e);
                                    return null;
                                });
                            }

                            let chunkCount = 0;
                            for await (const chunk of stream) {
                                const content = chunk.choices[0]?.delta?.content;
                                if (content) {
                                    // Send each character individually for true letter-by-letter streaming
                                    for (const char of content) {
                                        controller.enqueue(encoder.encode(char));
                                    }
                                    chunkCount++;
                                }
                            }

                            // Append images at the end of the stream without blocking TTFT
                            if (imagePromise) {
                                const searchResult = await imagePromise;
                                if (searchResult && searchResult.images && searchResult.images.length > 0) {
                                    const footer = `\n\n:::IMAGE_SEARCH_RESULT=${JSON.stringify(searchResult)}:::`;
                                    controller.enqueue(encoder.encode(footer));
                                    console.log(`[Streaming] Injected ${searchResult.images.length} images at the end of stream`);
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
