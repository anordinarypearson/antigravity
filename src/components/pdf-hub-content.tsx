"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { FileUp, File } from "lucide-react"
import { WavyLoader } from "@/components/ui/wavy-loader";
import { BackButton } from "./back-button";
import { SidebarTrigger } from "./ui/sidebar";
import { SharedHeader } from "./shared-header";
import * as pdfjs from 'pdfjs-dist';

// Required for pdf.js to work
if (typeof window !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
}


export function PdfHubContent() {
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
        } else {
            setFile(null);
            toast({ title: 'Invalid File', description: 'Please select a PDF file.', variant: 'destructive' });
        }
    };

    const handleUpload = async () => {
        if (!file) {
            toast({ title: 'No file selected', description: 'Please choose a PDF file to upload.', variant: 'destructive' });
            return;
        }

        setIsLoading(true);
        toast({ title: 'Processing PDF...', description: 'Extracting text. This may take a moment.' });

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                fullText += pageText + '\n\n';
            }

            // Store the extracted content and title in localStorage for the Study Session page to pick up.
            localStorage.setItem('pdfStudyContent', JSON.stringify({
                title: file.name.replace(/\.pdf$/i, ''),
                content: fullText
            }));

            toast({ title: 'PDF Processed!', description: 'Redirecting to Study Session...' });
            router.push('/study-now');

        } catch (error: any) {
            console.error("PDF processing error:", error);
            toast({
                title: 'PDF Processing Failed',
                description: error.message || 'Could not extract text from the PDF.',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-full flex-col">
            <SharedHeader
                title="PDF Study Hub"
                leftElement={<BackButton />}
            />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 flex items-center justify-center">
                <div className="mx-auto w-full max-w-md space-y-6">
                    <Card className="text-center">
                        <CardHeader>
                            <CardTitle>Upload Your PDF</CardTitle>
                            <CardDescription>Upload a PDF document to extract its text and create a study session.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div
                                className="flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed border-muted-foreground/30 text-center cursor-pointer hover:bg-muted/50 transition-colors min-h-[200px]"
                                onClick={() => document.getElementById('pdf-upload')?.click()}
                            >
                                {file ? (
                                    <>
                                        <File className="w-16 h-16 text-primary" />
                                        <p className="mt-4 font-semibold text-foreground">{file.name}</p>
                                    </>
                                ) : (
                                    <>
                                        <FileUp className="w-12 h-12 text-muted-foreground" />
                                        <p className="mt-4 font-semibold">Click to upload or drag and drop</p>
                                        <p className="text-sm text-muted-foreground">PDF (max 5MB)</p>
                                    </>
                                )}
                                <Input
                                    id="pdf-upload"
                                    type="file"
                                    className="hidden"
                                    accept="application/pdf"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </CardContent>
                    </Card>
                    <Button className="w-full" size="lg" disabled={!file || isLoading} onClick={handleUpload}>
                        {isLoading && <WavyLoader className="mr-2 h-4 w-4 animate-spin" />}
                        Create Study Session
                    </Button>
                </div>
            </main>
        </div>
    );
}
