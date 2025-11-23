/**
 * Enhanced Text File Processor
 * Supports multiple formats with encoding detection
 */

import mammoth from 'mammoth';

export interface TextProcessResult {
    text: string;
    format: string;
    encoding?: string;
    wordCount: number;
    charCount: number;
}

/**
 * Process text file with format detection
 */
export async function processTextFile(file: File): Promise<TextProcessResult> {
    const format = file.name.split('.').pop()?.toLowerCase() || 'txt';

    let text = '';

    switch (format) {
        case 'docx':
            text = await processDocx(file);
            break;
        case 'txt':
        case 'md':
        case 'rtf':
        default:
            text = await file.text();
            break;
    }

    // Clean and normalize text
    text = cleanText(text);

    const wordCount = countWords(text);
    const charCount = text.length;

    return {
        text,
        format,
        wordCount,
        charCount,
    };
}

/**
 * Process DOCX file
 */
async function processDocx(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
}

/**
 * Clean and normalize text
 */
function cleanText(text: string): string {
    return text
        .replace(/\r\n/g, '\n') // Normalize line endings
        .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
        .replace(/[ \t]+/g, ' ') // Normalize spaces
        .trim();
}

/**
 * Count words in text
 */
function countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Chunk large text for processing
 */
export function chunkText(text: string, maxChunkSize = 10000): string[] {
    const chunks: string[] = [];
    const paragraphs = text.split('\n\n');

    let currentChunk = '';

    for (const paragraph of paragraphs) {
        if ((currentChunk + paragraph).length > maxChunkSize && currentChunk) {
            chunks.push(currentChunk.trim());
            currentChunk = paragraph;
        } else {
            currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        }
    }

    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}
