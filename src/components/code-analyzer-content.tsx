
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Wand2, Bug, Zap, Code, AlertTriangle } from "lucide-react"
import { WavyLoader } from "@/components/ui/wavy-loader";
import { SidebarTrigger } from "./ui/sidebar";
import { BackButton } from "./back-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { analyzeCodeAction } from "@/app/actions";
import { AnalyzeCodeOutput } from "@/lib/code-analysis-types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { ScrollArea } from "./ui/scroll-area";
import { Skeleton } from "./ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";


export function CodeAnalyzerContent() {
    const [code, setCode] = useState("");
    const [language, setLanguage] = useState<"python" | "cpp">("python");
    const [analysis, setAnalysis] = useState<AnalyzeCodeOutput | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isAnalyzing, startAnalyzing] = useTransition();
    const { toast } = useToast();

    const handleAnalyzeCode = () => {
        if (code.trim().length < 10) {
            toast({
                title: "Code too short",
                description: "Please provide at least 10 characters of code to analyze.",
                variant: "destructive",
            });
            return;
        }
        setError(null);
        setAnalysis(null);
        startAnalyzing(async () => {
            const result = await analyzeCodeAction({ code, language });
            if (result.error) {
                setError(result.error);
                toast({ title: "Code Analysis Failed", description: "Please check the analysis panel for details.", variant: "destructive" });
            } else {
                setAnalysis(result.data ?? null);
                toast({ title: "Code Analyzed!", description: "The analysis is ready for review." });
            }
        });
    };

    return (
        <div className="flex h-full flex-col bg-muted/20 dark:bg-transparent">
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 md:px-6">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <BackButton />
                    <h1 className="text-xl font-semibold tracking-tight">Code Analyzer</h1>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 h-full items-start">
                    <Card className="flex flex-col h-full">
                        <CardHeader>
                            <CardTitle>Enter Your Code</CardTitle>
                            <CardDescription>Paste your C++ or Python code below for an AI-powered analysis.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col gap-4">
                            <Select value={language} onValueChange={(v) => setLanguage(v as "python" | "cpp")}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="python">Python</SelectItem>
                                    <SelectItem value="cpp">C++</SelectItem>
                                </SelectContent>
                            </Select>
                            <Textarea
                                placeholder={`// Paste your ${language} code here...`}
                                className="h-full min-h-[400px] resize-none font-mono text-sm"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                            />
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleAnalyzeCode} disabled={isAnalyzing || code.trim().length < 10}>
                                {isAnalyzing ? <WavyLoader className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                Analyze Code
                            </Button>
                        </CardFooter>
                    </Card>
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>AI Analysis</CardTitle>
                            <CardDescription>Review the explanation, potential bugs, and optimizations.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[520px] w-full">
                                {isAnalyzing ? (
                                    <div className="space-y-6 pr-4">
                                        <div className="space-y-2">
                                            <Skeleton className="h-6 w-1/3" />
                                            <Skeleton className="h-16 w-full" />
                                        </div>
                                        <div className="space-y-2">
                                            <Skeleton className="h-6 w-1/3" />
                                            <Skeleton className="h-20 w-full" />
                                        </div>
                                        <div className="space-y-2">
                                            <Skeleton className="h-6 w-1/3" />
                                            <Skeleton className="h-20 w-full" />
                                        </div>
                                    </div>
                                ) : error ? (
                                    <Alert variant="destructive">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle>Code Analysis Failed</AlertTitle>
                                        <AlertDescription>
                                            {error}
                                        </AlertDescription>
                                    </Alert>
                                ) : analysis ? (
                                    <Accordion type="multiple" defaultValue={['explanation', 'bugs', 'optimizations']} className="w-full pr-4 space-y-3">
                                        <AccordionItem value="explanation" className="rounded-md border bg-background px-4">
                                            <AccordionTrigger className="text-base font-semibold hover:no-underline">
                                                <div className="flex items-center gap-2"><Code className="h-5 w-5" />Explanation</div>
                                            </AccordionTrigger>
                                            <AccordionContent className="pt-2 text-muted-foreground">
                                                {analysis.explanation}
                                            </AccordionContent>
                                        </AccordionItem>
                                        
                                        <AccordionItem value="bugs" className="rounded-md border bg-background px-4">
                                            <AccordionTrigger className="text-base font-semibold hover:no-underline">
                                                <div className="flex items-center gap-2"><Bug className="h-5 w-5 text-red-500" />Potential Bugs</div>
                                            </AccordionTrigger>
                                            <AccordionContent className="pt-2 space-y-3">
                                                {analysis.potentialBugs.length > 0 ? analysis.potentialBugs.map((b, i) => (
                                                    <div key={i} className="p-3 rounded-md border border-red-500/20 bg-red-500/10">
                                                        <p className="font-semibold text-red-700 dark:text-red-400">Bug: {b.bug}</p>
                                                        <p className="text-sm text-muted-foreground mt-1"><span className="font-medium text-foreground">Fix:</span> {b.fix}</p>
                                                        {b.line && <p className="text-xs text-muted-foreground mt-1">Line: {b.line}</p>}
                                                    </div>
                                                )) : <p className="text-sm text-muted-foreground">No potential bugs found. Great job!</p>}
                                            </AccordionContent>
                                        </AccordionItem>
                                        
                                        <AccordionItem value="optimizations" className="rounded-md border bg-background px-4">
                                            <AccordionTrigger className="text-base font-semibold hover:no-underline">
                                                <div className="flex items-center gap-2"><Zap className="h-5 w-5 text-yellow-500" />Optimizations</div>
                                            </AccordionTrigger>
                                            <AccordionContent className="pt-2 space-y-3">
                                                {analysis.optimizations.length > 0 ? analysis.optimizations.map((o, i) => (
                                                    <div key={i} className="p-3 rounded-md border border-yellow-500/20 bg-yellow-500/10">
                                                        <p className="font-semibold text-yellow-700 dark:text-yellow-400">{o.suggestion}</p>
                                                         {o.line && <p className="text-xs text-muted-foreground mt-1">Line: {o.line}</p>}
                                                    </div>
                                                )) : <p className="text-sm text-muted-foreground">No specific optimizations suggested. The code looks clean.</p>}
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                ) : (
                                    <div className="flex h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-muted bg-muted/50">
                                        <div className="text-center p-8">
                                            <Wand2 className="mx-auto h-12 w-12 text-muted-foreground" />
                                            <h3 className="mt-4 text-lg font-semibold">Your analysis will appear here</h3>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Enter some code and click "Analyze" to begin.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
