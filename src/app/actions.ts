
"use server";

import { CoreMessage } from 'ai';
import { openai } from '@/lib/openai';
import { z } from 'zod';
import { generateFlashcardsSamba, GenerateFlashcardsSambaInput, GenerateFlashcardsSambaOutput } from '@/ai/flows/generate-flashcards-samba';
import { generateQuizzesSamba, GenerateQuizzesSambaInput, GenerateQuizzesSambaOutput } from '@/ai/flows/generate-quizzes-samba';
import { analyzeCode } from '@/ai/flows/analyze-code';
import { handleActionError, withTimeout } from '@/lib/utils/error-handling';
import { generateMindMap, GenerateMindMapInput, GenerateMindMapOutput } from '@/ai/flows/generate-mindmap';
import { generateQuestionPaper } from '@/ai/flows/generate-question-paper';
import { generateEbookChapter, GenerateEbookChapterInput, GenerateEbookChapterOutput } from '@/ai/flows/generate-ebook-chapter';
import { generatePresentation, GeneratePresentationInput, GeneratePresentationOutput } from '@/ai/flows/generate-presentation';
import { generateEditedContent, GenerateEditedContentInput, GenerateEditedContentOutput } from '@/ai/flows/generate-edited-content';
import { helpChat, HelpChatInput, HelpChatOutput } from '@/ai/flows/help-chatbot';
import { getYoutubeTranscript, GetYoutubeTranscriptInput, GetYoutubeTranscriptOutput } from '@/ai/flows/youtube-transcript';
import { analyzeContent, AnalyzeContentInput, AnalyzeContentOutput } from '@/ai/flows/analyze-content';
import { analyzeImageContent, AnalyzeImageContentInput, AnalyzeImageContentOutput } from '@/ai/flows/analyze-image-content';
import { summarizeContent, SummarizeContentInput, SummarizeContentOutput } from '@/ai/flows/summarize-content';
import { textToSpeech, TextToSpeechInput, TextToSpeechOutput } from '@/ai/flows/text-to-speech';
import { chatWithTutor, ChatWithTutorInput, ChatWithTutorOutput } from '@/ai/flows/chat-tutor';
import { webSearch } from '@/ai/tools/web-search';
import { searchYoutube } from '@/ai/tools/youtube-search';
import { DEFAULT_MODEL_ID, AVAILABLE_MODELS } from '@/lib/models';
import { generateImage } from "@/ai/flows/generate-image";
import { ai } from '@/ai/genkit'; // Keep for other actions
import { GenerateImageInput, GenerateImageOutput } from '@/components/image-generation-content';
import { AnalyzeCodeInput, AnalyzeCodeOutput } from '@/lib/code-analysis-types';
import { GenerateQuestionPaperInput, GenerateQuestionPaperOutput } from '@/lib/question-paper-types';


export type ActionResult<T> = {
    data?: T;
    error?: string;
};

/**
 * Generates flashcards based on the provided prompt using the Gemini model.
 * @param prompt - The topic or content to generate flashcards for.
 * @returns A JSON string representing the generated flashcards.
 */
export async function generateFlashcardsAction(input: GenerateFlashcardsSambaInput): Promise<ActionResult<GenerateFlashcardsSambaOutput>> {
    try {
        const data = await withTimeout(generateFlashcardsSamba(input), 60000);
        return { data };
    } catch (e: any) {
        return { error: handleActionError(e) };
    }
}

/**
 * Generates a quiz based on the provided prompt using the Gemini model.
 * @param prompt - The topic or content to generate a quiz for.
 * @returns A JSON string representing the generated quiz.
 */
export async function generateQuizAction(input: GenerateQuizzesSambaInput): Promise<ActionResult<GenerateQuizzesSambaOutput>> {
    try {
        const data = await withTimeout(generateQuizzesSamba(input), 60000);
        return { data };
    } catch (e: any) {
        return { error: handleActionError(e) };
    }
}

export async function helpChatAction(input: HelpChatInput): Promise<ActionResult<HelpChatOutput>> {
    try {
        const data = await withTimeout(helpChat(input), 30000);
        return { data };
    } catch (e: any) {
        return { error: handleActionError(e) };
    }
}

export async function textToSpeechAction(input: TextToSpeechInput): Promise<ActionResult<TextToSpeechOutput>> {
    try {
        const data = await textToSpeech(input);
        return { data };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function getYoutubeTranscriptAction(input: GetYoutubeTranscriptInput): Promise<ActionResult<GetYoutubeTranscriptOutput>> {
    try {
        const data = await getYoutubeTranscript(input);
        return { data };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function analyzeCodeAction(input: AnalyzeCodeInput): Promise<ActionResult<AnalyzeCodeOutput>> {
    try {
        const data = await analyzeCode(input);
        return { data };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function generateMindMapAction(input: GenerateMindMapInput): Promise<ActionResult<GenerateMindMapOutput>> {
    try {
        const data = await generateMindMap(input);
        return { data };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function generateQuestionPaperAction(input: GenerateQuestionPaperInput): Promise<ActionResult<GenerateQuestionPaperOutput>> {
    try {
        const data = await generateQuestionPaper(input);
        return { data };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function generateEbookChapterAction(input: GenerateEbookChapterInput): Promise<ActionResult<GenerateEbookChapterOutput>> {
    try {
        const data = await generateEbookChapter(input);
        return { data };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function generatePresentationAction(input: GeneratePresentationInput): Promise<ActionResult<GeneratePresentationOutput>> {
    try {
        const data = await generatePresentation(input);
        return { data };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function generateEditedContentAction(input: GenerateEditedContentInput): Promise<ActionResult<GenerateEditedContentOutput>> {
    try {
        const data = await generateEditedContent(input);
        return { data };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function generateImageAction(input: GenerateImageInput): Promise<ActionResult<GenerateImageOutput>> {
    try {
        const data = await generateImage(input);
        return { data };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function analyzeContentAction(content: string): Promise<ActionResult<AnalyzeContentOutput>> {
    try {
        const data = await withTimeout(analyzeContent({ content }), 45000);
        return { data };
    } catch (e: any) {
        return { error: handleActionError(e) };
    }
}

export async function analyzeImageContentAction(input: AnalyzeImageContentInput): Promise<ActionResult<AnalyzeImageContentOutput>> {
    try {
        const data = await analyzeImageContent(input);
        return { data };
    } catch (e: any) {
        return { error: e.message };
    }
}


export async function summarizeContentAction(input: SummarizeContentInput): Promise<ActionResult<SummarizeContentOutput>> {
    try {
        const data = await withTimeout(summarizeContent(input), 45000);
        return { data };
    } catch (e: any) {
        return { error: handleActionError(e) };
    }
}

export async function chatWithTutorAction(input: ChatWithTutorInput): Promise<ActionResult<ChatWithTutorOutput>> {
    try {
        const data = await chatWithTutor(input);
        return { data };
    } catch (e: any) {
        return { error: e.message };
    }
}

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

    const fileContext = fileContent
        ? `\n\n**User's Provided Context:**\n\n---\n${fileContent}\n---`
        : '';

    return `${basePrompt}\n\n${persona}\n\n${answerStyleInstruction}${fileContext}`;
};

const getCanvasSystemPrompt = (): string => {
    return `You are ProGPT, a developer-friendly assistant. Your task is to generate raw, file-like content based on the user's request.
1.  **Generate ONLY the requested content.** Do not add any conversational text, introductions, or explanations.
2.  For code, include language tags or filename comments (e.g., \`// file: main.js\`).
3.  For presentations, use Markdown with slide markers (e.g., \`--- Slide 1: Title ---\`) and include speaker notes.
4.  The output must be clean, complete, and production-ready.
User request:
---
`;
}

/**
 * Main chat action that handles user messages, tool calls, and AI responses.
 * Supports text, image, and file inputs.
 * @param params - Object containing history, model, and other chat parameters.
 * @returns The AI response content and type.
 */
export async function chatAction(input: {
    history: CoreMessage[],
    userName?: string | null,
    fileContent?: string | null,
    imageDataUri?: string | null,
    model?: string,
    isMusicMode?: boolean,
    isPlayground?: boolean,
    answerTypes: { [key: string]: boolean },
}): Promise<ActionResult<{ type: 'chat' | 'canvas', content: string }>> {
    const userMessageContent = input.history[input.history.length - 1]?.content.toString();

    // If isPlayground is true, ALL generative requests go to the canvas.
    const useCanvas = !!input.isPlayground;

    const isSearch = !useCanvas && userMessageContent.toLowerCase().startsWith("search:");
    const isMusic = !useCanvas && input.isMusicMode;

    if (isSearch) {
        const query = userMessageContent.replace(/^search:\s*/i, '');
        try {
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
                return { data: { type: 'chat', content: JSON.stringify(responsePayload) } };
            } else {
                return { data: { type: 'chat', content: "I searched the entire internet and couldn't find any relevant websites for that search." } };
            }
        } catch (error: any) {
            return { error: `Sorry, an error occurred during the search: ${error.message}` };
        }
    }

    if (isMusic) {
        const query = userMessageContent;
        try {
            const video = await searchYoutube({ query });
            if (video.id) {
                const responsePayload = {
                    type: 'youtube',
                    videoId: video.id,
                    title: video.title,
                    thumbnail: video.thumbnail,
                };
                return { data: { type: 'chat', content: JSON.stringify(responsePayload) } };
            } else {
                return { data: { type: 'chat', content: "Sorry, I couldn't find a matching song on YouTube." } };
            }
        } catch (error: any) {
            return { error: `Sorry, an error occurred while searching YouTube: ${error.message}` };
        }
    }

    const selectedModelId = input.model || DEFAULT_MODEL_ID;

    // If an image is provided, ALWAYS force the model to be gpt-oss-120b
    let finalModelId = input.imageDataUri ? 'gpt-oss-120b' : selectedModelId;
    if (finalModelId === 'auto') {
        finalModelId = DEFAULT_MODEL_ID; // Fallback from auto if not an image
    }

    const userMessage = input.history[input.history.length - 1];
    let finalUserMessage: CoreMessage;

    if (finalModelId === 'gpt-oss-120b' && input.imageDataUri) {
        // Correctly format for vision model
        finalUserMessage = {
            ...userMessage,
            content: [
                { type: "text", text: String(userMessage.content) },
                { type: "image", image: input.imageDataUri }
            ]
        };
    } else {
        finalUserMessage = userMessage;
    }

    const RECENT_MESSAGE_COUNT = 10;
    const recentHistory = input.history.slice(-RECENT_MESSAGE_COUNT);

    const messages: CoreMessage[] = useCanvas
        ? [finalUserMessage] // For canvas, only send the user's last message
        : [...recentHistory.slice(0, -1), finalUserMessage];

    const modelsToTry = (finalModelId === 'auto' || !finalModelId)
        ? AVAILABLE_MODELS.map(m => m.id).filter(id => id !== 'auto')
        : [finalModelId];

    let lastError: any = null;

    for (const modelId of modelsToTry) {
        try {
            const systemPrompt = useCanvas
                ? getCanvasSystemPrompt()
                : getSystemPrompt(modelId, input.userName, input.fileContent, input.answerTypes);

            const fullMessages = [{ role: 'system', content: systemPrompt } as CoreMessage, ...messages];

            const response = await openai.chat.completions.create({
                model: modelId,
                messages: fullMessages as any, // Cast to any to handle the CoreMessage type
                stream: false,
                max_tokens: modelId === 'gpt-oss-120b' ? 4096 : undefined,
            });

            let responseText = response.choices[0]?.message?.content;
            if (!responseText) {
                throw new Error("Received an empty response from the AI model.");
            }

            if (useCanvas) {
                return { data: { type: 'canvas', content: responseText } };
            }

            const modelName = AVAILABLE_MODELS.find(m => m.id === modelId)?.name || modelId;
            const finalResponse = `**Response from ${modelName}**\n\n${responseText}`;

            return { data: { type: 'chat', content: finalResponse } };
        } catch (e: any) {
            lastError = e;
            console.error(`SambaNova chat error with model ${modelId}:`, e.message);
            // Check for rate limit error
            if (e.status === 429) {
                return { error: `__LIMIT_EXHAUSTED__` };
            }
            if (finalModelId !== 'auto' && modelsToTry.length === 1) {
                break;
            }
        }
    }

    if (lastError?.message?.includes('maximum context length')) {
        return { error: "The provided content is too long for the selected AI model. Please shorten it or try a different model." };
    }

    return { error: lastError?.message || "An unknown error occurred with all available AI models." };
}
