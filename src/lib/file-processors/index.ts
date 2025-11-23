/**
 * Unified File Processor
 * Central hub for processing all file types
 */

import { processPDF, ProcessingProgress as PDFProgress } from './pdf-processor';
import { extractTextFromImage, imageToDataURI } from './image-processor';
import { processTextFile, chunkText } from './text-processor';

export type FileType = 'pdf' | 'image' | 'text' | 'audio' | 'unknown';

export interface ProcessedFile {
    type: FileType;
    name: string;
    size: number;
    content: string;
    metadata?: Record<string, any>;
    dataUri?: string;
}

export interface ProcessOptions {
    enableOCR?: boolean;
    onProgress?: (progress: number, status: string) => void;
}

/**
 * Detect file type from File object
 */
export function detectFileType(file: File): FileType {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const mimeType = file.type.toLowerCase();

    // PDF
    if (ext === 'pdf' || mimeType === 'application/pdf') {
        return 'pdf';
    }

    // Images
    if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext || '')) {
        return 'image';
    }

    // Text files
    if (
        mimeType.startsWith('text/') ||
        ['txt', 'md', 'rtf', 'docx', 'doc'].includes(ext || '')
    ) {
        return 'text';
    }

    // Audio
    if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'm4a', 'ogg'].includes(ext || '')) {
        return 'audio';
    }

    return 'unknown';
}

/**
 * Process any file type
 */
export async function processFile(
    file: File,
    options: ProcessOptions = {}
): Promise<ProcessedFile> {
    const type = detectFileType(file);
    const { enableOCR = true, onProgress } = options;

    let content = '';
    let metadata: Record<string, any> = {};
    let dataUri: string | undefined;

    switch (type) {
        case 'pdf':
            onProgress?.(0, 'Processing PDF...');
            const pdfResult = await processPDF(file, (progress) => {
                onProgress?.(progress.percent, `Processing PDF (Page ${progress.currentPage}/${progress.totalPages})`);
            });
            content = pdfResult.text;
            metadata = {
                pages: pdfResult.pages,
                hasTextLayer: pdfResult.hasTextLayer,
                ...pdfResult.metadata,
            };
            break;

        case 'image':
            onProgress?.(0, 'Processing image...');
            if (enableOCR) {
                const imageResult = await extractTextFromImage(file, (progress) => {
                    onProgress?.(progress, 'Extracting text from image...');
                });
                content = imageResult.text;
                metadata = {
                    confidence: imageResult.confidence,
                    dimensions: imageResult.dimensions,
                    hasText: imageResult.hasText,
                };
            }
            dataUri = await imageToDataURI(file);
            break;

        case 'text':
            onProgress?.(0, 'Processing text file...');
            const textResult = await processTextFile(file);
            content = textResult.text;
            metadata = {
                format: textResult.format,
                wordCount: textResult.wordCount,
                charCount: textResult.charCount,
            };
            onProgress?.(100, 'Text file processed');
            break;

        case 'audio':
            onProgress?.(0, 'Audio processing not yet implemented');
            content = '[Audio file - transcription coming soon]';
            break;

        default:
            throw new Error(`Unsupported file type: ${file.type}`);
    }

    return {
        type,
        name: file.name,
        size: file.size,
        content,
        metadata,
        dataUri,
    };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Check if file size is acceptable
 */
export function isFileSizeAcceptable(file: File, maxSizeMB = 10): boolean {
    const maxBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxBytes;
}
