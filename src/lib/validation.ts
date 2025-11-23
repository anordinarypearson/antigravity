import { z } from 'zod';

// Chat input validation
export const chatMessageSchema = z.object({
    content: z.string().min(1, 'Message cannot be empty').max(10000, 'Message too long'),
    imageDataUri: z.string().optional(),
    fileContent: z.string().max(50000, 'File content too large').optional(),
});

// Flashcard generation validation
export const flashcardSchema = z.object({
    topic: z.string().min(1, 'Topic is required').max(500, 'Topic too long'),
    count: z.number().min(1).max(50).default(10),
});

// Quiz generation validation
export const quizSchema = z.object({
    topic: z.string().min(1, 'Topic is required').max(500, 'Topic too long'),
    questionCount: z.number().min(1).max(30).default(10),
    difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
});

// Image upload validation
export const imageUploadSchema = z.object({
    file: z.instanceof(File),
    maxSize: z.number().default(10 * 1024 * 1024), // 10MB default
});

// Web scraper validation
export const webScraperSchema = z.object({
    query: z.string().min(3, 'Query too short').max(500, 'Query too long'),
});

// Helper function to validate and sanitize input
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
    try {
        const validated = schema.parse(data);
        return { success: true, data: validated };
    } catch (error) {
        if (error instanceof z.ZodError) {
            const firstError = error.errors[0];
            return { success: false, error: firstError.message };
        }
        return { success: false, error: 'Validation failed' };
    }
}
