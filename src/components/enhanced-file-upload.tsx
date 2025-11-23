'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, Image as ImageIcon, FileType, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { processFile, formatFileSize, isFileSizeAcceptable, type ProcessedFile } from '@/lib/file-processors';

interface EnhancedFileUploadProps {
    onFileProcessed?: (file: ProcessedFile) => void;
    acceptedTypes?: string[];
    maxSizeMB?: number;
}

export function EnhancedFileUpload({
    onFileProcessed,
    acceptedTypes = ['.pdf', '.txt', '.md', '.docx', '.jpg', '.jpeg', '.png', '.gif'],
    maxSizeMB = 10,
}: EnhancedFileUploadProps) {
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [processedFile, setProcessedFile] = useState<ProcessedFile | null>(null);

    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setError(null);
        setProcessedFile(null);

        // Check file size
        if (!isFileSizeAcceptable(file, maxSizeMB)) {
            setError(`File too large. Maximum size is ${maxSizeMB}MB`);
            return;
        }

        setProcessing(true);
        setProgress(0);
        setStatus('Starting...');

        try {
            const result = await processFile(file, {
                enableOCR: true,
                onProgress: (percent, statusText) => {
                    setProgress(percent);
                    setStatus(statusText);
                },
            });

            setProcessedFile(result);
            onFileProcessed?.(result);
            setStatus('Complete!');
        } catch (err: any) {
            setError(err.message || 'Failed to process file');
            console.error('File processing error:', err);
        } finally {
            setProcessing(false);
        }
    }, [maxSizeMB, onFileProcessed]);

    const getFileIcon = (type: string) => {
        switch (type) {
            case 'pdf':
                return <FileType className="h-8 w-8 text-red-500" />;
            case 'image':
                return <ImageIcon className="h-8 w-8 text-blue-500" />;
            case 'text':
                return <FileText className="h-8 w-8 text-green-500" />;
            default:
                return <FileText className="h-8 w-8 text-gray-500" />;
        }
    };

    return (
        <div className="space-y-4">
            <Card className="p-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-center">
                        <label htmlFor="file-upload" className="cursor-pointer">
                            <div className="flex flex-col items-center gap-2 p-8 border-2 border-dashed rounded-lg hover:border-primary transition-colors">
                                <Upload className="h-12 w-12 text-muted-foreground" />
                                <div className="text-center">
                                    <p className="text-sm font-medium">Click to upload or drag and drop</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        PDF, Images, Text files (max {maxSizeMB}MB)
                                    </p>
                                </div>
                            </div>
                            <input
                                id="file-upload"
                                type="file"
                                className="hidden"
                                accept={acceptedTypes.join(',')}
                                onChange={handleFileChange}
                                disabled={processing}
                            />
                        </label>
                    </div>

                    {processing && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{status}</span>
                                <span className="font-medium">{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} />
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
                            <p className="text-sm text-destructive">{error}</p>
                        </div>
                    )}

                    {processedFile && !processing && (
                        <div className="space-y-3">
                            <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                                {getFileIcon(processedFile.type)}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{processedFile.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {formatFileSize(processedFile.size)}
                                        {processedFile.metadata?.pages && ` • ${processedFile.metadata.pages} pages`}
                                        {processedFile.metadata?.wordCount && ` • ${processedFile.metadata.wordCount} words`}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setProcessedFile(null)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            {processedFile.content && (
                                <div className="p-4 bg-muted/50 rounded-lg max-h-60 overflow-y-auto">
                                    <p className="text-xs font-mono whitespace-pre-wrap">
                                        {processedFile.content.substring(0, 500)}
                                        {processedFile.content.length > 500 && '...'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
