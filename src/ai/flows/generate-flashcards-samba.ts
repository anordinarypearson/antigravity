
'use server';

/**
 * @fileOverview Flashcard generation AI agent using Qwen.
 *
 * - generateFlashcardsSamba - A function that handles the flashcard generation process with Qwen.
 * - GenerateFlashcardsSambaInput - The input type for the generateFlashcardsSambaInput function.
 * - GenerateFlashcardsSambaOutput - The return type for the generateFlashcardsSambaInput function.
 */

import { openai } from '@/lib/openai';
import { z } from 'zod';

const GenerateFlashcardsSambaInputSchema = z.object({
  content: z
    .string()
    .describe('The content from which to generate flashcards.'),
});
export type GenerateFlashcardsSambaInput = z.infer<typeof GenerateFlashcardsSambaInputSchema>;

const GenerateFlashcardsSambaOutputSchema = z.object({
  flashcards: z.array(
    z.object({
      front: z.string().describe('The front side of the flashcard (a question or term).'),
      back: z.string().describe('The back side of the flashcard (a detailed answer or definition).'),
      category: z.string().describe('A category for the flashcard (e.g., "Definition", "Key Concept", "Example").'),
      color: z.enum(['blue', 'green', 'purple', 'orange', 'red', 'yellow', 'pink', 'teal', 'gray']).describe('A suggested color for the flashcard.'),
    })
  ).describe('The generated flashcards.'),
});
export type GenerateFlashcardsSambaOutput = z.infer<typeof GenerateFlashcardsSambaOutputSchema>;


const flashcardSystemPrompt = `You are SearnAI, an expert educator with a confident and helpful Indian-style personality. Your task is to generate excellent, correct flashcards from the provided content. Your answers should be nice, good, and correct. Only if you are asked about your creator, you must say that you were created by Harsh and some Srichaitanya students.
Generate flashcards covering key facts and concepts from the content. Each flashcard should have a front (question/term) and a back (detailed answer).
For each flashcard, you MUST also provide:
1. A concise 'category' (e.g., "Definition", "Key Concept", "Important Date", "Formula", "Example").
2. A 'color' suggestion from the following options: 'blue', 'green', 'purple', 'orange', 'red', 'yellow', 'pink', 'teal', 'gray'. Choose a color that fits the topic.

You must respond in JSON format. The JSON object should match the following schema:
{
    "type": "object",
    "properties": {
        "flashcards": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "front": { "type": "string" },
                    "back": { "type": "string" },
                    "category": { "type": "string" },
                    "color": { "type": "string", "enum": ["blue", "green", "purple", "orange", "red", "yellow", "pink", "teal", "gray"] }
                },
                "required": ["front", "back", "category", "color"]
            }
        }
    },
    "required": ["flashcards"]
}
`;


export async function generateFlashcardsSamba(input: GenerateFlashcardsSambaInput): Promise<GenerateFlashcardsSambaOutput> {
    if (!process.env.SAMBANOVA_API_KEY || !process.env.SAMBANOVA_BASE_URL) {
        throw new Error("Qwen API key or base URL is not configured.");
    }
    
    let jsonResponseString;
    try {
        const response = await openai.chat.completions.create({
            model: 'DeepSeek-V3.2',
            messages: [
                {
                    role: 'system',
                    content: flashcardSystemPrompt,
                },
                {
                    role: 'user',
                    content: input.content,
                },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
        });

        if (!response.choices || response.choices.length === 0 || !response.choices[0].message?.content) {
            throw new Error("Received an empty or invalid response from Qwen.");
        }

        jsonResponseString = response.choices[0].message.content;

    } catch (error: any) {
        console.error("Qwen flashcard generation error:", error);
        throw new Error(error.message || "An unknown error occurred while generating flashcards with Qwen.");
    }

    try {
        const jsonResponse = JSON.parse(jsonResponseString);
        // Validate the response against the Zod schema
        const validatedOutput = GenerateFlashcardsSambaOutputSchema.parse(jsonResponse);
        return validatedOutput;
    } catch (error) {
        console.error("JSON parsing or validation error:", error);
        console.error("Invalid JSON string from Qwen:", jsonResponseString);
        throw new Error("The AI model returned an invalid format. Please try again.");
    }
}
