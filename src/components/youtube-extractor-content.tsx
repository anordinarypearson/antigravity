
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getYoutubeTranscriptAction, summarizeContentAction, SummarizeContentOutput } from "@/app/actions";
import { Loader2, Wand2, Save, Copy, Pilcrow } from "lucide-react";
import { useRouter } from "next/navigation";
import { BackButton } from "./back-button";
import { Skeleton } from "./ui/skeleton";
import { SidebarTrigger } from "./ui/sidebar";


export function YouTubeExtractorContent() {
    const [videoUrl, setVideoUrl] = useState("");
    const [transcript, setTranscript] = useState("");
    const [summary, setSummary] = useState<SummarizeContentOutput | null>(null);
    const [isExtracting, startExtracting] = useTransition();
    const [isSummarizing, startSummarizing] = useTransition();
    const { toast } = useToast();
    const router = useRouter();

    const handleExtractTranscript = () => {
        if (!videoUrl.trim()) {
            toast({ title: "Please enter a YouTube URL", variant: 'destructive' });
            return;
        }

        startExtracting(async () => {
            setTranscript("");
            setSummary(null);
            try {
                console.log('[YouTubeExtractor] Calling getYoutubeTranscriptAction with:', videoUrl);
                const result = await getYoutubeTranscriptAction({ videoUrl });
                console.log('[YouTubeExtractor] Result:', result);

                if (result.error) {
                    toast({ title: "Failed to get transcript", description: result.error, variant: 'destructive' });
                } else if (result.data && result.data.transcript) {
                    setTranscript(result.data.transcript);
                    toast({ title: "Transcript extracted successfully!" });
                } else {
                    toast({ title: "Failed to get transcript", description: "No transcript data returned. The video may not have subtitles available.", variant: 'destructive' });
                }
            } catch (err: any) {
                console.error('[YouTubeExtractor] Error:', err);
                toast({ title: "Failed to get transcript", description: err.message || "An unexpected error occurred", variant: 'destructive' });
            }
        });
    };


    const handleSummarize = () => {
        if (!transcript) {
            toast({ title: "No transcript available", description: "Please extract a transcript first.", variant: 'destructive' });
            return;
        }
        startSummarizing(async () => {
            const result = await summarizeContentAction({ content: transcript });
            if (result.error) {
                toast({ title: "Summarization Failed", description: result.error, variant: "destructive" });
            } else {
                setSummary(result.data ?? null);
            }
        });
    };

    const handleCopyToClipboard = (textToCopy: string, type: string) => {
        if (!textToCopy.trim()) {
            toast({ title: `No ${type} to copy`, variant: 'destructive' });
            return;
        }
        navigator.clipboard.writeText(textToCopy);
        toast({ title: `Copied to clipboard!`, description: `The ${type} has been copied.` });
    }

    return (
        <div className="flex h-full flex-col">
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 md:px-6">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <BackButton />
                    <h1 className="text-xl font-semibold tracking-tight">YouTube Tools</h1>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <div className="mx-auto max-w-2xl space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>YouTube Transcript Extractor</CardTitle>
                            <CardDescription>Paste a YouTube video URL to get its full transcript.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex w-full items-center space-x-2">
                                <Input
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    value={videoUrl}
                                    onChange={(e) => setVideoUrl(e.target.value)}
                                    disabled={isExtracting}
                                />
                                <Button onClick={handleExtractTranscript} disabled={isExtracting || !videoUrl.trim()}>
                                    {isExtracting ? <Loader2 className="mr-2 animate-spin" /> : <Wand2 className="mr-2" />}
                                    Extract
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Extracted Transcript</CardTitle>
                            <CardDescription>The transcript will appear below. You can copy it or generate a summary.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                placeholder="Transcript will appear here..."
                                className="h-64 resize-none"
                                value={transcript}
                                readOnly
                            />
                        </CardContent>
                        <CardFooter className="flex gap-2">
                            <Button onClick={() => handleCopyToClipboard(transcript, "transcript")} disabled={isExtracting || !transcript.trim()}>
                                <Copy className="mr-2" />
                                Copy Transcript
                            </Button>
                            <Button onClick={handleSummarize} disabled={isSummarizing || !transcript.trim()}>
                                {isSummarizing ? <Loader2 className="mr-2 animate-spin" /> : <Pilcrow className="mr-2" />}
                                Summarize
                            </Button>
                        </CardFooter>
                    </Card>

                    {(isSummarizing || summary) && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Video Summary</CardTitle>
                                <CardDescription>An AI-generated summary of the video's content.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isSummarizing ? (
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-3/4" />
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">{summary?.summary}</p>
                                )}
                            </CardContent>
                            {summary && (
                                <CardFooter>
                                    <Button variant="outline" onClick={() => handleCopyToClipboard(summary.summary, "summary")}>
                                        <Copy className="mr-2" />
                                        Copy Summary
                                    </Button>
                                </CardFooter>
                            )}
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}
