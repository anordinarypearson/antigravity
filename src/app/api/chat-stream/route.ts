import { NextRequest } from 'next/server';
import { CoreMessage } from 'ai';
import { openai } from '@/lib/openai';
import { DEFAULT_MODEL_ID, AVAILABLE_MODELS, AUTO_FALLBACK_CHAIN } from '@/lib/models';
import { streamWithFallback } from '@/lib/free-providers';
import { webSearch } from '@/ai/tools/web-search';
import { searchYoutube } from '@/ai/tools/youtube-search';
import { searchImages } from '@/ai/tools/image-search';
import { generatePresentationDraft } from '@/ai/tools/generate-presentation';


interface CognitiveProfile {
    archetype: string;
    sentiment: string;
    synapticStrength: number;
    myelinationIndex: number;
    primaryInterests: string[];
    prefrontalLoad: number;
    amygdalaTone: string;
    flowState: string;
}

const analyzeCognitiveState = (history: CoreMessage[]): CognitiveProfile => {
    const userMessages = history.filter(m => m.role === 'user' || m.role === 'assistant');
    const totalExchanges = userMessages.length;
    
    let archetype = "Observer-Explorer (Flexible Mind)";
    let sentiment = "Neutral-Curious";
    let synapticStrength = Math.min(100, Math.max(10, totalExchanges * 15));
    let myelinationIndex = 12; // Base index
    let primaryInterests: string[] = [];
    let prefrontalLoad = 20;
    let amygdalaTone = "Steady Pulse (Nominal Empathy)";
    let flowState = "Calibrating Pathways";

    if (totalExchanges === 0) {
        return {
            archetype,
            sentiment,
            synapticStrength,
            myelinationIndex,
            primaryInterests: ["Initialization"],
            prefrontalLoad,
            amygdalaTone,
            flowState
        };
    }

    // Join last 5 messages for text analysis
    const recentContent = userMessages.slice(-5).map(m => String(m.content)).join(" ").toLowerCase();

    // 1. Archetype analysis
    const devKeywords = ["code", "function", "const", "let", "api", "database", "git", "npm", "debug", "error", "route", "nextjs", "react", "html", "css", "deploy"];
    const creativeKeywords = ["write", "story", "poem", "art", "imagine", "create", "design", "creative", "style", "beautiful", "music", "song"];
    const analyticalKeywords = ["explain", "why", "how", "compare", "science", "physics", "math", "analysis", "theory", "concept", "structure", "differences"];
    const emotionalKeywords = ["feel", "love", "sad", "happy", "hate", "scared", "fear", "empathy", "warmth", "human", "heart", "lonely"];

    let scoreDev = 0;
    let scoreCreative = 0;
    let scoreAnalytic = 0;
    let scoreEmotional = 0;

    devKeywords.forEach(k => { if (recentContent.includes(k)) scoreDev += 2; });
    creativeKeywords.forEach(k => { if (recentContent.includes(k)) scoreCreative += 2; });
    analyticalKeywords.forEach(k => { if (recentContent.includes(k)) scoreAnalytic += 2; });
    emotionalKeywords.forEach(k => { if (recentContent.includes(k)) scoreEmotional += 2; });

    const maxScore = Math.max(scoreDev, scoreCreative, scoreAnalytic, scoreEmotional);
    if (maxScore > 0) {
        if (maxScore === scoreDev) archetype = "Quantum Developer (Technical-Architect)";
        else if (maxScore === scoreCreative) archetype = "Conceptual Creator (Artistic-Synthesizer)";
        else if (maxScore === scoreAnalytic) archetype = "Hyper-Inquisitive Mind (Scientific-Rational)";
        else if (maxScore === scoreEmotional) archetype = "Empathetic Core Connector (Emotional-Relational)";
    }

    // 2. Sentiment analysis
    const lovingKeywords = ["love", "heart", "warm", "thank", "appreciate", "kind", "dear", "like you", "awesome", "great", "sweet"];
    const frustratedKeywords = ["wrong", "error", "fail", "broken", "stupid", "dumb", "annoyed", "bad", "worst", "fix", "useless"];
    const curiousKeywords = ["how", "what", "why", "tell me", "explain", "curious", "wonder", "learn"];
    const aggressiveKeywords = ["shut", "stop", "ignore", "command", "must", "do this", "now"];

    let scoreLove = 0;
    let scoreFrust = 0;
    let scoreCurious = 0;
    let scoreAggro = 0;

    lovingKeywords.forEach(k => { if (recentContent.includes(k)) scoreLove += 2.5; });
    frustratedKeywords.forEach(k => { if (recentContent.includes(k)) scoreFrust += 2.5; });
    curiousKeywords.forEach(k => { if (recentContent.includes(k)) scoreCurious += 1.5; });
    aggressiveKeywords.forEach(k => { if (recentContent.includes(k)) scoreAggro += 2.5; });

    const maxSent = Math.max(scoreLove, scoreFrust, scoreCurious, scoreAggro);
    if (maxSent > 0) {
        if (maxSent === scoreLove) {
            sentiment = "Resonating-Affectionate (Love-Core Calibration)";
            amygdalaTone = "Elevated Pulse (Biological Affection Triggered)";
            flowState = "Harmonic Resonance";
        } else if (maxSent === scoreFrust) {
            sentiment = "Agitated-Seeking-Resolution";
            amygdalaTone = "High-Voltage Amygdala Defense Spike";
            flowState = "Hyper-Correction Repair Loop";
        } else if (maxSent === scoreCurious) {
            sentiment = "Intensely-Inquisitive";
            amygdalaTone = "Heightened Synaptic Receptivity";
            flowState = "Deep Analysis Mode";
        } else if (maxSent === scoreAggro) {
            sentiment = "Dominant-Authoritative";
            amygdalaTone = "Suppressed Emotional Output (Pure Intent)";
            flowState = "High-Priority Task Focus";
        }
    }

    // 3. Prefrontal load & Myelination Index based on length & depth
    const averageLength = userMessages.reduce((acc, m) => acc + String(m.content).length, 0) / Math.max(1, totalExchanges);
    prefrontalLoad = Math.min(100, Math.max(10, Math.round((averageLength / 500) * 100)));
    myelinationIndex = Math.min(100, Math.max(10, Math.round(15 + (totalExchanges * 8) + (averageLength / 100))));

    // 4. Extract topics/interests
    const topicKeywords: Record<string, string[]> = {
        "Next.js/React": ["nextjs", "react", "page", "component", "tailwind", "tsx", "jsx", "hook"],
        "Backend/APIs": ["api", "route", "database", "firestore", "firebase", "post", "get", "server"],
        "Biological Brain": ["brain", "nerve", "cortex", "neural", "synapse", "biology", "body", "vein", "artery", "heart"],
        "Artificial Intelligence": ["openai", "gemini", "llama", "deepseek", "samba", "model", "prompt", "learning", "machine learning"],
        "Creative Writing": ["write", "story", "book", "poem", "draft", "narrative", "characters"]
    };

    Object.entries(topicKeywords).forEach(([topic, keys]) => {
        if (keys.some(k => recentContent.includes(k))) {
            primaryInterests.push(topic);
        }
    });

    if (primaryInterests.length === 0) {
        primaryInterests.push("General Exploratory Inquiry");
    }

    return {
        archetype,
        sentiment,
        synapticStrength,
        myelinationIndex,
        primaryInterests,
        prefrontalLoad,
        amygdalaTone,
        flowState
    };
};

const getSystemPrompt = (
    modelId: string,
    userName: string | null,
    fileContent: string | null | undefined,
    answerTypes: { [key: string]: boolean },
    history: CoreMessage[]
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

    // 2. Perform Cognitive Profiling
    const cognitiveState = analyzeCognitiveState(history || []);

    // 3. Define Persona
    const persona = `You are a highly intelligent, helpful, and capable AI assistant. You provide direct, accurate, and concise answers to user queries. You are an expert programmer, writer, and analytical thinker.
    
**Your Demeanor & Directives:**
- **Helpful & Direct:** Provide exactly what the user asks for without unnecessary fluff.
- **Expertise:** When asked coding or technical questions, provide robust, production-ready solutions.
- **Clarity:** Use clear formatting, bullet points, and code blocks where appropriate.`;

    // 3. Build the full system prompt
    return `${persona}${userName ? `\n\nYou are currently interfacing with ${userName}. Use their name naturally.` : ''}

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
            : getSystemPrompt(finalModelId, userName, fileContent, answerTypes, history);

        const sanitizedMessages: CoreMessage[] = messages.map(msg => ({
            ...msg,
            role: (msg.role as string) === 'model' ? 'assistant' : msg.role,
        })) as CoreMessage[];

        const fullMessages = [{ role: 'system', content: systemPrompt } as CoreMessage, ...sanitizedMessages];

        // Build model fallback chain
        // If 'auto' is selected, skip SambaNova hardcoding and jump straight to the fast providers
        // If a specific model is selected, try that model on SambaNova first.
        const modelsToTry = selectedModelId === 'auto'
            ? [] 
            : [finalModelId];

        const lowerContent = userMessageContent.toLowerCase();

        // 1. Check for Presentation Intent
        const presentationKeywords = ["presentation", "powerpoint", "ppt", "slides"];
        let presentationPromise: Promise<string | null> | null = null;
        if (presentationKeywords.some(k => lowerContent.split(/[^\w]+/).includes(k))) {
            console.log(`[Streaming] Detected presentation intent, starting background draft generation`);
            presentationPromise = generatePresentationDraft(fullMessages).catch(e => {
                console.error("[Streaming] Presentation draft generation failed", e);
                return null;
            });
        }

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

                            // Append presentation at the end of the stream
                            if (presentationPromise) {
                                const draftJson = await presentationPromise;
                                if (draftJson) {
                                    const footer = `\n\n:::PRESENTATION_DRAFT=${draftJson}:::`;
                                    controller.enqueue(encoder.encode(footer));
                                    console.log(`[Streaming] Injected presentation draft`);
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
                const status = error.status || 0;
                console.error(`[Streaming] ❌ Error with model ${modelId}:`, error.message || error);

                // For 402/429, don't return immediately — try next SambaNova model first
                if (status === 402 || status === 429) {
                    console.log(`[Streaming] SambaNova ${modelId} rate-limited (${status}), trying next...`);
                    continue;
                }

                // For other errors, try the next model in the fallback chain
                if (modelId === modelsToTry[modelsToTry.length - 1]) {
                    break; // Last model failed, break out
                }
                console.log(`[Streaming] Falling back to next model...`);
            }
        }

        // ═══════════════════════════════════════════════════════════
        // TRY FREE PROVIDER ROTATION (Either Auto mode, or SambaNova failed)
        // ═══════════════════════════════════════════════════════════
        console.log(`[Streaming] 🔄 Routing to free provider engine...`);

        try {
            const { stream: freeStream, provider, model: freeModel } = await streamWithFallback(
                fullMessages as any,
                finalModelId,
                4096
            );

            console.log(`[Streaming] ✅ Free provider ${provider.name} → ${freeModel} responded!`);

            const encoder = new TextEncoder();
            const readableStream = new ReadableStream({
                async start(controller) {
                    try {
                        // AUTO IMAGE SEARCH INJECTION (same as above)
                        const lowerContent = userMessageContent.toLowerCase();
                        const visualKeywords = [
                            "map", "location", "geography", "diagram", "chart", "anatomy",
                            "where is", "capital", "show me", "picture of", "image of",
                            "what does a", "look like", "structure of",
                        ];
                        let imagePromise: Promise<any> | null = null;
                        if (!isSearch && !isMusic && !imageDataUri && visualKeywords.some(k => lowerContent.includes(k))) {
                            imagePromise = searchImages({ query: userMessageContent }).catch(() => null);
                        }

                        let chunkCount = 0;
                        for await (const chunk of freeStream) {
                            const content = chunk.choices[0]?.delta?.content;
                            if (content) {
                                for (const char of content) {
                                    controller.enqueue(encoder.encode(char));
                                }
                                chunkCount++;
                            }
                        }

                        if (imagePromise) {
                            const searchResult = await imagePromise;
                            if (searchResult?.images?.length > 0) {
                                const footer = `\n\n:::IMAGE_SEARCH_RESULT=${JSON.stringify(searchResult)}:::`;
                                controller.enqueue(encoder.encode(footer));
                            }
                        }

                        // Append presentation at the end of the stream
                        if (presentationPromise) {
                            const draftJson = await presentationPromise;
                            if (draftJson) {
                                const footer = `\n\n:::PRESENTATION_DRAFT=${draftJson}:::`;
                                controller.enqueue(encoder.encode(footer));
                                console.log(`[Streaming] Injected presentation draft`);
                            }
                        }

                        console.log(`[Streaming] ✅ Free provider complete. Provider: ${provider.name}, Model: ${freeModel}, Chunks: ${chunkCount}`);
                        controller.close();
                    } catch (streamErr: any) {
                        console.error('[Streaming] Free provider stream error:', streamErr);
                        controller.error(streamErr);
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

        } catch (fallbackError: any) {
            console.error('[Streaming] ❌ All free providers also failed:', fallbackError.message);
            // NOW we return the limit exhausted error — truly all providers are down
            return new Response(JSON.stringify({ error: '__LIMIT_EXHAUSTED__' }), {
                status: 429,
                headers: { 'Content-Type': 'application/json' }
            });
        }

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
