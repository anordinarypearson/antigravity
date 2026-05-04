'use server';

/**
 * @fileOverview AI Tutor for interactive learning.
 *
 * - chatWithTutor - A function that handles the conversational tutoring.
 * - ChatWithTutorInput - The input type for the chatWithTutor function.
 * - ChatWithTutorOutput - The return type for the chatWithTutor function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ChatWithTutorInputSchema = z.object({
  content: z.string().describe('The study material context.'),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).describe('The conversation history.'),
});
export type ChatWithTutorInput = z.infer<typeof ChatWithTutorInputSchema>;

const ChatWithTutorOutputSchema = z.object({
  response: z.string().describe('The tutor\'s response.'),
});
export type ChatWithTutorOutput = z.infer<typeof ChatWithTutorOutputSchema>;

export async function chatWithTutor(input: ChatWithTutorInput): Promise<ChatWithTutorOutput> {
  return chatWithTutorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatWithTutorPrompt',
  input: {schema: ChatWithTutorInputSchema},
  output: {schema: ChatWithTutorOutputSchema},
  prompt: `You are an expert AI tutor. Your goal is to help the user understand the provided study material. Engage in a supportive and encouraging conversation.

Study Material Context:
---
{{{content}}}
---

Conversation History:
---
{{#each history}}
**{{role}}**: {{{content}}}
{{/each}}
---

Based on the context and history, provide a helpful and encouraging response to the user's last message. Your response should be in Markdown format.`,
});

const chatWithTutorFlow = ai.defineFlow(
  {
    name: 'chatWithTutorFlow',
    inputSchema: ChatWithTutorInputSchema,
    outputSchema: ChatWithTutorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
