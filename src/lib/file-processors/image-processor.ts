/**
 * Enhanced Image Processor
 * OCR text extraction, image optimization, and analysis
 */

import Tesseract from 'tesseract.js';

export interface ImageProcessResult {
    text: string;
    confidence: number;
    dimensions: { width: number; height: number };
    format: string;
    hasText: boolean;
}

/**
 * Extract text from image using OCR
 */
export async function extractTextFromImage(
    file: File,
    onProgress?: (progress: number) => void
): Promise<ImageProcessResult> {
    return new Promise(async (resolve, reject) => {
        try {
            const img = new Image();
            const url = URL.createObjectURL(file);

            img.onload = async () => {
                const dimensions = {
                    width: img.width,
                    height: img.height,
                };

                // Perform OCR
                const worker = await Tesseract.createWorker('eng', 1, {
                    logger: (m) => {
                        if (m.status === 'recognizing text' && onProgress) {
                            onProgress(Math.floor(m.progress * 100));
                        }
                    },
                });

                const { data } = await worker.recognize(url);
                await worker.terminate();

                URL.revokeObjectURL(url);

                resolve({
                    text: data.text,
                    confidence: data.confidence,
                    dimensions,
                    format: file.type,
                    hasText: data.text.trim().length > 10,
                });
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load image'));
            };

            img.src = url;
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Get image info without OCR
 */
export async function getImageInfo(file: File): Promise<{ width: number; height: number; format: string }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve({
                width: img.width,
                height: img.height,
                format: file.type,
            });
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };

        img.src = url;
    });
}

/**
 * Convert image to base64 data URI
 */
export async function imageToDataURI(file: File, maxWidth = 1024): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;

            // Resize if needed
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            URL.revokeObjectURL(url);

            const dataUri = canvas.toDataURL('image/jpeg', 0.9);
            resolve(dataUri);
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };

        img.src = url;
    });
}
