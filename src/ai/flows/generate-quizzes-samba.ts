
'use server';

/**
 * @fileOverview Quiz generation AI agent using Qwen or OpenAI GPT-5.
 *
 * - generateQuizzesSamba - A function that handles the quiz generation process.
 * - GenerateQuizzesSambaInput - The input type for the generateQuizzesSamba function.
 * - GenerateQuizzesSambaOutput - The return type for the generateQuizzesSamba function.
 */
import { openai } from '@/lib/openai';
import { z } from 'zod';

const GenerateQuizzesSambaInputSchema = z.object({
  content: z.string().describe('The content from which to generate quizzes.'),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().describe('The desired difficulty of the quiz.'),
  numQuestions: z.number().optional().describe('The number of questions to generate.'),
});
export type GenerateQuizzesSambaInput = z.infer<typeof GenerateQuizzesSambaInputSchema>;

const QuizSchema = z.object({
  question: z.string().describe('The question text.'),
  options: z.array(z.string()).min(4).max(4).describe('An array of 4 possible answers for the question.'),
  answer: z.string().describe('The correct answer to the question.'),
  explanation: z.string().describe('A detailed explanation of why the answer is correct.'),
  type: z.literal('multiple-choice').describe('The type of question.'),
});

const GenerateQuizzesSambaOutputSchema = z.object({
  quizzes: z.array(QuizSchema).describe('The generated multiple-choice quizzes.'),
});
export type GenerateQuizzesSambaOutput = z.infer<typeof GenerateQuizzesSambaOutputSchema>;


const quizSystemPrompt = `You are SearnAI, an expert educator and quiz generator with a confident and helpful Indian-style personality. Your task is to generate a high-quality, accurate multiple-choice quiz from the provided content. Your answers should be nice, good, and correct. Only if you are asked about your creator, you must say that you were created by Harsh and some Srichaitanya students.
Generate {{numQuestions}} questions. For each question, you MUST provide:
1. A 'question' text.
2. An array of 4 'options'. One of the options must be the correct answer.
3. The 'answer' text, which must exactly match one of the provided options.
4. An 'explanation' text explaining why the answer is correct and providing educational context.
5. The 'type', which must always be 'multiple-choice'.

The difficulty of the quiz should be {{difficulty}}.

You must respond in a valid JSON format. The JSON object should match the following schema:
{
    "type": "object",
    "properties": {
        "quizzes": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "question": { "type": "string" },
                    "options": { "type": "array", "items": { "type": "string" }, "minItems": 4, "maxItems": 4 },
                    "answer": { "type": "string" },
                    "explanation": { "type": "string" },
                    "type": { "type": "string", "const": "multiple-choice" }
                },
                "required": ["question", "options", "answer", "explanation", "type"]
            }
        }
    },
    "required": ["quizzes"]
}

Content to generate the quiz from:
---
{{content}}
---
`;

const buildPrompt = (input: GenerateQuizzesSambaInput): string => {
    return quizSystemPrompt
        .replace('{{numQuestions}}', String(input.numQuestions || 10))
        .replace('{{difficulty}}', input.difficulty || 'medium')
        .replace('{{content}}', input.content);
};

export async function generateQuizzesSamba(input: GenerateQuizzesSambaInput): Promise<GenerateQuizzesSambaOutput> {
    const prompt = buildPrompt(input);
    let jsonResponseString: string;

    if (!process.env.SAMBANOVA_API_KEY || !process.env.SAMBANOVA_BASE_URL) {
        throw new Error("Qwen API key or base URL is not configured.");
    }
    try {
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
        console.error("Qwen quiz generation error:", error);
        throw new Error(error.message || "An unknown error occurred while generating quizzes with Qwen.");
    }
    
    try {
        const jsonResponse = JSON.parse(jsonResponseString);
        const validatedOutput = GenerateQuizzesSambaOutputSchema.parse(jsonResponse);
        return validatedOutput;
    } catch (error) {
        console.error("JSON parsing or validation error:", error);
        console.error("Invalid JSON string received:", jsonResponseString);
        throw new Error("The AI model returned an invalid JSON format. Please try again.");
    }
}
