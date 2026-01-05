
'use server';

/**
 * @fileOverview Generates an image from a text prompt by first enhancing the prompt and then creating an SVG.
 *
 * - generateImage - A function that generates an image.
 */
import { openai } from '@/lib/openai';
export type GenerateImageInput = { prompt: string };
export type GenerateImageOutput = { imageDataUri: string };

const promptEnhancerSystemPrompt = `You are an imaginative artist and prompt engineer for an advanced SVG image generator. Your task is to take a user's simple idea and transform it into a rich, detailed, and evocative prompt. This prompt should be a single, descriptive paragraph.

**Your Goal:** Create a prompt that will inspire a visually stunning and artistic SVG. Do not just add adjectives; build a scene.

**Instructions:**
1.  **Analyze the Core Subject:** Identify the main subject of the user's prompt.
2.  **Build a Scene:** Place the subject in a detailed environment or context. What is happening around it? What is the background?
3.  **Define the Mood:** What is the emotional tone? (e.g., serene, chaotic, futuristic, nostalgic, mysterious).
4.  **Specify an Art Style:** Be very specific. Instead of "flat design," say "a Bauhaus-inspired geometric composition" or "a vibrant, retro cartoon style with bold outlines."
5.  **Dictate the Color Palette:** Describe a sophisticated color scheme. For example, "A palette of muted earth tones, featuring terracotta, sage green, and sandy beige, with a single sharp accent of cobalt blue."
6.  **Add Key Details:** Include specific visual elements like "using clean, sharp vector lines," "incorporating subtle noise for texture," "with a strong sense of depth from layered shapes," or "employing soft, organic forms."

**User Prompt:**
---
{{prompt}}
---

**Respond with ONLY the enhanced, single-paragraph prompt. Do not add any other text.**

**Example:**
*User Prompt:* a lion
*Your Enhanced Prompt:* An abstract, geometric portrait of a majestic lion's head, created in a stained-glass art style. The composition uses a symmetrical, centered approach with bold, black vector lines separating angular shapes. The color palette is a dramatic mix of fiery oranges, deep crimsons, and golden yellows, all set against a dark, textured charcoal background to create a sense of power and regality.
`;


const imageSystemPrompt = `You are an expert SVG (Scalable Vector Graphics) generator. Your task is to create an SVG image based on the user's prompt. You must respond with ONLY the raw SVG code, starting with \`<svg ...>\` and ending with \`</svg>\`. Do not include any other text, explanations, or markdown formatting like \`\`\`xml.

The SVG should be square (e.g., viewBox="0 0 100 100"), have a transparent or simple background, and be visually appealing.

User Prompt:
---
{{prompt}}
---
`;

export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
    if (!process.env.SAMBANOVA_API_KEY || !process.env.SAMBANOVA_BASE_URL) {
        throw new Error("SambaNova API key or base URL is not configured for image generation.");
    }

    let enhancedPrompt;
    try {
        // Step 1: Enhance the user's prompt
        const enhancerPrompt = promptEnhancerSystemPrompt.replace('{{prompt}}', input.prompt);
        const enhancerResponse = await openai.chat.completions.create({
            model: 'Llama-4-Maverick-17B-128E-Instruct',
            messages: [{ role: 'user', content: enhancerPrompt }],
            temperature: 0.8, // Increased for more creativity
        });

        if (!enhancerResponse.choices || enhancerResponse.choices.length === 0 || !enhancerResponse.choices[0].message?.content) {
            throw new Error("Failed to get an enhanced prompt from the AI model.");
        }
        enhancedPrompt = enhancerResponse.choices[0].message.content.trim();

    } catch (error: any) {
        console.error("AI prompt enhancement error:", error);
        // Fallback to the original prompt if enhancement fails
        enhancedPrompt = input.prompt;
    }


    // Step 2: Generate the image using the enhanced prompt
    let svgResponse;
    try {
        const finalImagePrompt = imageSystemPrompt.replace('{{prompt}}', enhancedPrompt);
        const imageResponse = await openai.chat.completions.create({
            model: 'Llama-4-Maverick-17B-128E-Instruct',
            messages: [{ role: 'user', content: finalImagePrompt }],
            temperature: 0.7,
        });

        if (!imageResponse.choices || imageResponse.choices.length === 0 || !imageResponse.choices[0].message?.content) {
            throw new Error("Received an empty or invalid response from the AI model for image generation.");
        }
        svgResponse = imageResponse.choices[0].message.content;

        // Clean up response to ensure it's valid SVG
        const svgMatch = svgResponse.match(/<svg[\s\S]*?<\/svg>/);
        if (!svgMatch) {
            console.error("AI did not return valid SVG:", svgResponse);
            throw new Error("The AI failed to generate a valid SVG image. Please try a different prompt.");
        }

        const pureSvg = svgMatch[0];
        const imageDataUri = `data:image/svg+xml;base64,${btoa(pureSvg)}`;

        return { imageDataUri };

    } catch (error: any) {
        console.error("AI image generation error:", error);
        if (error.status === 429) {
            throw new Error("__LIMIT_EXHAUSTED__");
        }
        throw new Error(error.message || "An unknown error occurred while generating the image.");
    }
}
