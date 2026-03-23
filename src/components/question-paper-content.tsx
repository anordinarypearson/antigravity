
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FileText, Wand2, AlertTriangle } from "lucide-react"
import { WavyLoader } from "@/components/ui/wavy-loader";
import { SidebarTrigger } from "./ui/sidebar";
import { BackButton } from "./back-button";
import { generateQuestionPaperAction } from "@/app/actions";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Skeleton } from "./ui/skeleton";

export function QuestionPaperContent() {
    const [className, setClassName] = useState("");
    const [subject, setSubject] = useState("");
    const [topic, setTopic] = useState("");
    const [error, setError] = useState<string | null>(null);

    const [isGenerating, startGenerating] = useTransition();
    const { toast } = useToast();
    const router = useRouter();

    const handleGenerate = () => {
        if (!className || !subject || !topic) {
            toast({
                title: "Missing Information",
                description: "Please fill in all fields to generate a paper.",
                variant: "destructive",
            });
            return;
        }
        setError(null);
        startGenerating(async () => {
            const result = await generateQuestionPaperAction({ className, subject, topic });
            if (result.error) {
                setError(result.error);
                toast({ title: "Generation Failed", description: result.error, variant: "destructive" });
            } else if (result.data) {
                try {
                    localStorage.setItem('questionPaper', JSON.stringify(result.data));
                    toast({ title: "Paper Generated!", description: "Redirecting to viewer..." });
                    router.push('/question-paper/view');
                } catch (e) {
                    setError("Could not store the generated paper. Please try again.");
                    toast({ title: "Storage Error", description: "Could not store the generated paper.", variant: "destructive" });
                }
            }
        });
    };

    return (
        <div className="flex h-full flex-col bg-muted/20 dark:bg-transparent">
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 md:px-6">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <BackButton />
                    <h1 className="text-xl font-semibold tracking-tight">Question Paper Generator</h1>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                 <div className="mx-auto max-w-xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Paper Details</CardTitle>
                            <CardDescription>Provide the details for your question paper. The generator uses a SambaNova model to create a paper based on the CBSE pattern.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isGenerating ? (
                                <div className="flex flex-col items-center justify-center space-y-4 py-8">
                                    <WavyLoader className="h-8 w-8 animate-spin text-primary" />
                                    <p className="text-muted-foreground">Generating your paper, please wait...</p>
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="class">Class</Label>
                                        <Input id="class" placeholder="e.g., 10th, 12th" value={className} onChange={e => setClassName(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="subject">Subject</Label>
                                        <Input id="subject" placeholder="e.g., Physics" value={subject} onChange={e => setSubject(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="topic">Topic / Chapter</Label>
                                        <Input id="topic" placeholder="e.g., Light and Optics" value={topic} onChange={e => setTopic(e.target.value)} />
                                    </div>
                                </>
                            )}
                            {error && (
                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>Generation Failed</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
                                {isGenerating ? <WavyLoader className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                Generate Paper
                            </Button>
                        </CardFooter>
                    </Card>
                 </div>
            </main>
        </div>
    );
}
