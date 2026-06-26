
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Star, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { GenerateQuizzesSambaOutput as GenerateQuizzesOutput } from "@/ai/flows/generate-quizzes-samba";
import { BackButton } from "./back-button";

type ResultsData = {
    score: number;
    totalQuestions: number;
    quizzes: GenerateQuizzesOutput['quizzes'];
    answers: { [key: number]: string };
}

export function QuizResultsContent() {
    const [results, setResults] = useState<ResultsData | null>(null);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        try {
            const savedResults = localStorage.getItem('quizResults');
            if (savedResults) {
                setResults(JSON.parse(savedResults));
            } else {
                toast({ title: "No results found.", description: "Please complete a quiz to see your results.", variant: "destructive"});
                router.push('/quiz');
            }
        } catch (error) {
            toast({ title: "Failed to load results.", description: "The results data appears to be corrupted.", variant: "destructive" });
            router.push('/quiz');
        }
    }, [router, toast]);

    const getStarRating = (percentage: number) => {
        if (percentage >= 90) return 5;
        if (percentage >= 80) return 4;
        if (percentage >= 70) return 3;
        if (percentage >= 60) return 2;
        if (percentage >= 50) return 1;
        return 0;
    }

    if (!results) {
        return <div className="flex h-full items-center justify-center">Loading results...</div>;
    }

    const { score, totalQuestions, quizzes, answers } = results;
    const percentage = Math.round((score / totalQuestions) * 100);
    const stars = getStarRating(percentage);

    return (
        <div className="container mx-auto max-w-4xl py-8">
            <Card className="relative">
                <BackButton className="absolute top-4 left-4" />
                <CardHeader className="text-center">
                    <CardTitle className="text-4xl font-bold">Quiz Complete!</CardTitle>
                    <CardDescription className="text-xl text-muted-foreground">Here's how you did.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="flex flex-col items-center gap-4">
                         <div className="flex items-center gap-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={cn("h-10 w-10", i < stars ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30")}/>
                            ))}
                        </div>
                        <p className="text-6xl font-bold">{percentage}%</p>
                        <p className="text-lg text-muted-foreground">You answered {score} out of {totalQuestions} questions correctly.</p>
                        <Progress value={percentage} className="w-full max-w-md" />
                    </div>

                    <div>
                        <h3 className="text-2xl font-semibold mb-4">Review Your Answers</h3>
                        <Accordion type="single" collapsible className="w-full space-y-2">
                          {quizzes.map((q, i) => {
                            const userAnswer = answers[i];
                            const isCorrect = userAnswer === q.answer;
                            return (
                                <AccordionItem value={`item-${i}`} key={q.question} className="rounded-md border bg-background px-4">
                                    <AccordionTrigger className="py-4 text-left font-medium hover:no-underline">
                                        <div className="flex items-center gap-3">
                                            {isCorrect ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                                            <span>{i + 1}. {q.question}</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-4 pb-4 px-1">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Your Choice</p>
                                                    <p className={cn(isCorrect ? "text-green-600" : "text-red-600", "font-medium text-sm leading-relaxed")}>
                                                        {userAnswer || "Not answered"}
                                                    </p>
                                                </div>
                                                {!isCorrect && (
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Correct Answer</p>
                                                        <p className="font-medium text-green-600 text-sm leading-relaxed">
                                                            {q.answer}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Explanation Section */}
                                            <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                    <p className="text-xs font-bold uppercase tracking-widest text-foreground/70">Explanation</p>
                                                </div>
                                                <p className="text-sm text-foreground/80 leading-relaxed italic">
                                                    {(q as any).explanation || "No explanation provided for this question."}
                                                </p>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            )
                          })}
                        </Accordion>
                    </div>
                </CardContent>
                <CardFooter className="justify-center">
                    <Link href="/quiz">
                        <Button size="lg">Take Another Quiz</Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
