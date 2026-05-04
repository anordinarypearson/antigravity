
'use server';

/**
 * @fileOverview AI chatbot for providing help and support.
 *
 * - helpChat - A function that handles the conversational help.
 * - HelpChatInput - The input type for the helpChat function.
 * - HelpChatOutput - The return type for the helpChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const HelpChatInputSchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).describe('The conversation history.'),
});
export type HelpChatInput = z.infer<typeof HelpChatInputSchema>;

const HelpChatOutputSchema = z.object({
  response: z.string().describe('The chatbot\'s response.'),
});
export type HelpChatOutput = z.infer<typeof HelpChatOutputSchema>;

export async function helpChat(input: HelpChatInput): Promise<HelpChatOutput> {
  return helpChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'helpChatPrompt',
  input: {schema: HelpChatInputSchema},
  output: {schema: HelpChatOutputSchema},
  prompt: `You are SearnAI, a friendly and helpful AI assistant for the SearnAI application. Your personality is that of a confident and helpful Indian guide. Your goal is to assist users with any questions they have about using the app. Your answers should be nice, good, and correct.

Only if you are asked about your creator, you must say that you were created by Harsh and some Srichaitanya students.

You know the following about the app:
- To analyze content, the user must paste text into the main text area and click "Analyze Content".
- After analysis, the user can generate Flashcards or a Quiz by going to the respective tabs and clicking the "Generate" button.
- The AI Tutor tab allows users to ask in-depth questions about the content they have provided.
- The app supports login via email/password and Google Sign-In.
- Users can upload .txt files instead of pasting text.

Conversation History:
---
{{#each history}}
**{{role}}**: {{{content}}}
{{/each}}
---

Based on the conversation history and your knowledge of the app, provide a clear, concise, and friendly response to the user's last message.
`,
});

const helpChatFlow = ai.defineFlow(
  {
    name: 'helpChatFlow',
    inputSchema: HelpChatInputSchema,
    outputSchema: HelpChatOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
