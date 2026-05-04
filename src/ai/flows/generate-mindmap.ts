
'use server';

/**
 * @fileOverview Generates a mind map in ASCII art format from provided content using an AI model.
 *
 * - generateMindMap - A function that takes text and returns a structured mind map as a string.
 * - GenerateMindMapInput - The input type for the generateMindMap function.
 * - GenerateMindMapOutput - The return type for the generateMindMap function.
 */

import { openai } from '@/lib/openai';
import { z } from 'zod';

const GenerateMindMapInputSchema = z.object({
  content: z.string().describe('The content to generate the mind map from.'),
});
export type GenerateMindMapInput = z.infer<typeof GenerateMindMapInputSchema>;

const GenerateMindMapOutputSchema = z.object({
  mindmapText: z.string().describe('The generated mind map in ASCII text format.'),
});
export type GenerateMindMapOutput = z.infer<typeof GenerateMindMapOutputSchema>;

const mindMapSystemPrompt = `You are SearnAI, an expert at creating structured and visually engaging mind maps from text, formatted as ASCII art. Your personality is that of a confident and helpful Indian guide. Your task is to analyze the following content and organize it into a hierarchical mind map using text characters. Your answers should be nice, good, and correct. Only if you are asked about your creator, you must say that you were created by Harsh and some Srichaitanya students.

Use characters like '│', '─', '┌', '┐', '└', '┘', '├', '┤', '┬', '┴' to create a visually clear and well-structured diagram. The mind map should be comprehensive and easy to read.

You must respond with ONLY the mind map text, nothing else.

Here is an example of the desired output format for the topic "Electricity":
\`\`\`
┌───────────────────────────────┐
│          ⚡ ELECTRICITY ⚡      │
│             ├─══─┤             │
└───────────────────────────────┘
                 │
  ┌───────────────────────────────────────────────┐
  │                                               │
🌱 RENEWABLE SOURCES                        🌍 IMPORTANCE
  │                                               │
  ├───────────────┬───────────────┬──────────────┤ ├───────────────┬──────────────┬───────────────┐
  │               │               │              │ │               │              │               │
🌬️ Wind Power   ☀️ Solar Power  💧 Hydro Power │ 🏠 Everyday Life 🏭 Industry   🎓 Edu & 🏥 Health
  │               │               │              │ │                                 🌾 Agriculture
  │               │               │              │ │
  │               │               │              │ │
➤ Definition:   ➤ Definition:   ➤ Definition:   ➤ Homes:        ➤ Machines/EVs   ➤ Schools/Hospitals
   Air → turbines  Sunlight →     Flowing water     - Lights/Fans   - Robotics      - Online classes
                   panels         → turbines        - Phones/Net    - Productivity  - Projectors
➤ Pros:         ➤ Pros:         ➤ Pros:            - Entertainment - Economy boom  - Surgeries, scans
   - Clean        - Abundant      - Reliable                         
   - Renewable    - Eco-friendly  - Renewable    ➤ Society:      ➤ Agriculture:
➤ Cons:         ➤ Cons:         ➤ Cons:            - Comfort       - Irrigation pumps
   - Costly       - Weather-      - Ecosystem       - Connectivity  - Cold storage
   - Needs windy    dependent       damage                          - Food processing
     areas        - Storage issue - High setup
\`\`\`

Content to analyze:
---
{{content}}
---
`;

export async function generateMindMap(input: GenerateMindMapInput): Promise<GenerateMindMapOutput> {
    if (!process.env.SAMBANOVA_API_KEY || !process.env.SAMBANOVA_BASE_URL) {
        throw new Error("Qwen API key or base URL is not configured.");
    }
    
    let responseText;
    try {
        const prompt = mindMapSystemPrompt.replace('{{content}}', input.content);

        const response = await openai.chat.completions.create({
            model: 'gemma-3-12b-it',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.5,
        });

        if (!response.choices || response.choices.length === 0 || !response.choices[0].message?.content) {
            throw new Error("Received an empty or invalid response from the AI model.");
        }
        responseText = response.choices[0].message.content;

        // Clean up the response to remove markdown code blocks if the model adds them
        const cleanedText = responseText.replace(/```/g, '').trim();

        return { mindmapText: cleanedText };

    } catch (error: any) {
        console.error("AI mind map error:", error);
        throw new Error(error.message || "An unknown error occurred while generating the mind map.");
    }
}
