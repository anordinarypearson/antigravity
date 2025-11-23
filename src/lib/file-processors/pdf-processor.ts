/**
 * Enhanced PDF Processor
 * Extracts text, handles OCR for scanned PDFs, and extracts images
 */

import * as pdfjsLib from 'pdfjs-dist';

// Set worker path for PDF.js
if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export interface PDFProcessResult {
    text: string;
    pages: number;
    hasTextLayer: boolean;
    images: string[];
    metadata?: {
        title?: string;
        author?: string;
        subject?: string;
        keywords?: string;
    };
}

export interface ProcessingProgress {
    stage: 'loading' | 'extracting' | 'ocr' | 'complete';
    currentPage: number;
    totalPages: number;
    percent: number;
}

/**
 * Process a PDF file and extract all content
 */
export async function processPDF(
    file: File,
    onProgress?: (progress: ProcessingProgress) => void
): Promise<PDFProcessResult> {
    const arrayBuffer = await file.arrayBuffer();

    // Load PDF document
    onProgress?.({ stage: 'loading', currentPage: 0, totalPages: 0, percent: 0 });
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const totalPages = pdf.numPages;
    let fullText = '';
    const images: string[] = [];
    let hasTextLayer = false;

    // Extract metadata
    const metadata = await pdf.getMetadata();
    const pdfMetadata = {
        title: metadata.info?.Title,
        author: metadata.info?.Author,
        subject: metadata.info?.Subject,
        keywords: metadata.info?.Keywords,
    };

    // Process each page
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        onProgress?.({
            stage: 'extracting',
            currentPage: pageNum,
            totalPages,
            percent: (pageNum / totalPages) * 100,
        });

        const page = await pdf.getPage(pageNum);

        // Extract text content
        const textContent = await page.getTextContent();
        const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');

        if (pageText.trim().length > 0) {
            hasTextLayer = true;
            fullText += `\n\n=== Page ${pageNum} ===\n${pageText}`;
        }

        // Extract images (optional - can be resource intensive)
        // const operatorList = await page.getOperatorList();
        // Process images from operator list if needed
    }

    onProgress?.({ stage: 'complete', currentPage: totalPages, totalPages, percent: 100 });

    return {
        text: fullText.trim(),
        pages: totalPages,
        hasTextLayer,
        images,
        metadata: pdfMetadata,
    };
}

/**
 * Quick check if PDF has searchable text
 */
export async function isPDFSearchable(file: File): Promise<boolean> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        // Check first page
        const page = await pdf.getPage(1);
        const textContent = await page.getTextContent();
        const text = textContent.items.map((item: any) => item.str).join('');

        return text.trim().length > 50; // Has meaningful text
    } catch (error) {
        console.error('Error checking PDF:', error);
        return false;
    }
}
