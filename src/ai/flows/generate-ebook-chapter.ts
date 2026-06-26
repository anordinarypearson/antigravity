
'use server';

/**
 * @fileOverview Generates a chapter for an ebook using Qwen.
 *
 * - generateEbookChapter - A function that takes a title and chapter number and returns chapter content.
 * - GenerateEbookChapterInput - The input type for the generateEbookChapter function.
 * - GenerateEbookChapterOutput - The return type for the generateEbookChapter function.
 */

import { openai } from '@/lib/openai';
import { z } from 'zod';

const GenerateEbookChapterInputSchema = z.object({
  title: z.string().describe('The title of the ebook.'),
  chapter: z.number().describe('The chapter number to generate.'),
});
export type GenerateEbookChapterInput = z.infer<typeof GenerateEbookChapterInputSchema>;

const ContentBlockSchema = z.object({
    type: z.enum(['h1', 'h2', 'p']).describe("The type of content block: h1 for chapter title, h2 for section title, p for paragraph."),
    text: z.string().describe("The text content of the block."),
});

const GenerateEbookChapterOutputSchema = z.object({
  content: z.array(ContentBlockSchema).describe('An array of content blocks for the chapter.'),
});
export type GenerateEbookChapterOutput = z.infer<typeof GenerateEbookChapterOutputSchema>;

const ebookSystemPrompt = `You are SearnAI, a creative and knowledgeable author with a confident and helpful Indian-style personality. Your task is to write a chapter for an ebook. Your answers should be nice, good, and correct. Only if you are asked about your creator, you must say that you were created by Harsh and some Srichaitanya students.

Ebook Title: {{title}}
Chapter Number: {{chapter}}

You must generate the content for this chapter in a valid JSON format. The JSON object should contain a single key, "content", which is an array of content blocks. Each block must have a 'type' ('h1', 'h2', 'p') and a 'text'.
- Start with a single 'h1' element for the chapter title.
- Use a mix of 'h2' elements for section headings and 'p' elements for paragraphs.
- Generate about 5-7 content blocks in total for the chapter.
- The content should be appropriate for the book's title and the chapter number, creating a logical progression.
- For chapter 1, provide a strong introduction to the topic. For subsequent chapters, build upon the previous one.
- Make the content interesting and educational.

You must respond in a valid JSON format. The JSON object should match the following schema:
{
    "type": "object",
    "properties": {
        "content": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "type": { "type": "string", "enum": ["h1", "h2", "p"] },
                    "text": { "type": "string" }
                },
                "required": ["type", "text"]
            }
        }
    },
    "required": ["content"]
}

Example for a book titled "A Journey Through the Cosmos", Chapter 1:
{
    "content": [
        { "type": "h1", "text": "Chapter 1: The Big Bang" },
        { "type": "p", "text": "The Big Bang theory is the leading cosmological model..." },
        { "type": "h2", "text": "1.1: Cosmic Inflation" },
        { "type": "p", "text": "Cosmic inflation is a theory of exponential expansion of space in the early universe..." }
    ]
}
`;


export async function generateEbookChapter(input: GenerateEbookChapterInput): Promise<GenerateEbookChapterOutput> {
    if (!process.env.SAMBANOVA_API_KEY || !process.env.SAMBANOVA_BASE_URL) {
        throw new Error("Qwen API key or base URL is not configured.");
    }
    
    let jsonResponseString;
    try {
        const prompt = ebookSystemPrompt
            .replace('{{title}}', input.title)
            .replace('{{chapter}}', String(input.chapter));

        const response = await openai.chat.completions.create({
            model: 'DeepSeek-V3.2',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.7,
        });

        if (!response.choices || response.choices.length === 0 || !response.choices[0].message?.content) {
            throw new Error("Received an empty or invalid response from Qwen.");
        }

        jsonResponseString = response.choices[0].message.content;

    } catch (error: any) {
        console.error("Qwen ebook generation error:", error);
        throw new Error(error.message || "An unknown error occurred while generating the ebook chapter with Qwen.");
    }

    try {
        const jsonResponse = JSON.parse(jsonResponseString);
        const validatedOutput = GenerateEbookChapterOutputSchema.parse(jsonResponse);
        return validatedOutput;
    } catch (error) {
        console.error("JSON parsing or validation error:", error);
        console.error("Invalid JSON string from Qwen:", jsonResponseString);
        throw new Error("The AI model returned an invalid format. Please try again.");
    }
}
