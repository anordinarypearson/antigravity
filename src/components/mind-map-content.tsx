
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wand2, BrainCircuit, AlertTriangle } from "lucide-react";
import { SidebarTrigger } from "./ui/sidebar";
import { BackButton } from "./back-button";
import { generateMindMapAction, GenerateMindMapOutput } from "@/app/actions";
import { ScrollArea } from "./ui/scroll-area";
import { Skeleton } from "./ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { cn } from "@/lib/utils";

import { SharedHeader } from "./shared-header";


export function MindMapContent() {
    const [content, setContent] = useState("");
    const [mindMap, setMindMap] = useState<GenerateMindMapOutput | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isGenerating, startGenerating] = useTransition();
    const { toast } = useToast();

    const handleGenerate = () => {
        if (content.trim().length < 50) {
            toast({
                title: "Content too short",
                description: "Please provide at least 50 characters to generate a mind map.",
                variant: "destructive",
            });
            return;
        }
        setError(null);
        setMindMap(null);
        startGenerating(async () => {
            const result = await generateMindMapAction({ content });
            if (result.error) {
                setError(result.error);
                toast({ title: "Mind Map Generation Failed", description: "Please check the panel for details.", variant: "destructive" });
            } else {
                setMindMap(result.data ?? null);
                toast({ title: "Mind Map Generated!", description: "Your mind map is ready for review." });
            }
        });
    };

    return (
        <div className="flex h-full flex-col bg-muted/20 dark:bg-transparent">
            <SharedHeader
                title="Mind Map Creator"
                leftElement={<BackButton />}
            />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <div className="grid grid-cols-1 gap-8 xl:grid-cols-3 h-full items-start">
                    <Card className="flex flex-col h-full xl:col-span-1">
                        <CardHeader>
                            <CardTitle>Enter Your Content</CardTitle>
                            <CardDescription>Paste your study material below to generate a structured mind map using our AI.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col">
                            <Textarea
                                placeholder="Paste your content here..."
                                className="h-full min-h-[400px] resize-none"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleGenerate} disabled={isGenerating || content.trim().length < 50}>
                                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                Generate Mind Map
                            </Button>
                        </CardFooter>
                    </Card>
                    <div className="xl:col-span-2 h-full">
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle>Generated Mind Map</CardTitle>
                                <CardDescription>Explore your content in a visual, hierarchical structure.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[calc(100vh-20rem)] w-full">
                                    {isGenerating ? (
                                        <div className="space-y-6 pr-4 flex items-center justify-center h-full">
                                            <div className="text-center">
                                                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                                                <p className="mt-2 text-muted-foreground">Generating your mind map...</p>
                                            </div>
                                        </div>
                                    ) : error ? (
                                        <Alert variant="destructive">
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertTitle>Generation Failed</AlertTitle>
                                            <AlertDescription>
                                                The AI model could not generate a mind map. This might be due to an invalid API key or a network issue. Please check your configuration and try again.
                                                <p className="text-xs font-mono mt-2 bg-destructive/10 p-2 rounded">Error: {error}</p>
                                            </AlertDescription>
                                        </Alert>
                                    ) : mindMap ? (
                                        <div className="pr-4">
                                            <Card className="bg-muted/50 p-4">
                                                <pre className="font-mono text-xs whitespace-pre-wrap break-words">
                                                    {mindMap.mindmapText}
                                                </pre>
                                            </Card>
                                        </div>
                                    ) : (
                                        <div className="flex h-full min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-muted bg-muted/50">
                                            <div className="text-center p-8">
                                                <BrainCircuit className="mx-auto h-12 w-12 text-muted-foreground" />
                                                <h3 className="mt-4 text-lg font-semibold">Your mind map will appear here</h3>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    Enter some content and click "Generate" to begin.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
