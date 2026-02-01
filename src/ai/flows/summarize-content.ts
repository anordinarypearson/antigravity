
// src/ai/flows/summarize-content.ts
'use server';

/**
 * @fileOverview Summarizes content into a concise overview.
 *
 * - summarizeContent - A function that takes text and returns a summary.
 * - SummarizeContentInput - The input type for the summarizeContent function.
 * - SummarizeContentOutput - The return type for the summarizeContent function.
 */

import { openai } from '@/lib/openai';
import { z } from 'zod';

const SummarizeContentInputSchema = z.object({
  content: z.string().describe('The content to summarize.'),
});
export type SummarizeContentInput = z.infer<typeof SummarizeContentInputSchema>;

const SummarizeContentOutputSchema = z.object({
  summary: z.string().describe('The generated summary of the content.'),
});
export type SummarizeContentOutput = z.infer<typeof SummarizeContentOutputSchema>;

export async function summarizeContent(input: SummarizeContentInput): Promise<SummarizeContentOutput> {
  if (!input.content) {
    throw new Error("Content is required for summarization.");
  }

  const prompt = `You are an AI assistant that excels at summarizing complex topics into clear and concise summaries.

Content to summarize:
---
${input.content}
---

Please generate a concise summary of the provided content. The summary should capture the main ideas and key points of the text. Return the result as a JSON object with a "summary" key.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'Meta-Llama-3.1-8B-Instruct',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
      temperature: 0.5,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from AI model.");
    }

    const json = JSON.parse(content);
    return SummarizeContentOutputSchema.parse(json);
  } catch (error: any) {
    console.error("Summarization error:", error);
    // Fallback: if JSON parsing fails, try to return the raw text if it looks like a summary, or throw
    throw new Error(`Failed to summarize content: ${error.message}`);
  }
}
