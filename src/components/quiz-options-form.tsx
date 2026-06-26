
"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WavyLoader } from "@/components/ui/wavy-loader";
import { BackButton } from "./back-button";
import { generateQuizAction } from "@/app/actions";
import type { GenerateQuizzesSambaInput as GenerateQuizzesInput } from "@/ai/flows/generate-quizzes-samba";
import { useUsageLimits } from "@/hooks/use-usage-limits";
import { LimitExhaustedDialog } from "./limit-exhausted-dialog";


export function QuizOptionsForm() {
    const router = useRouter();
    const { toast } = useToast();
    const [isGenerating, startGenerating] = useTransition();

    const [content, setContent] = useState<string | null>(null);
    const [difficulty, setDifficulty] = useState("medium");
    const [numQuestions, setNumQuestions] = useState("10");
    const [timeLimit, setTimeLimit] = useState("10");
    const { checkAndIncrementMessageLimit } = useUsageLimits();
    const [showLimitDialog, setShowLimitDialog] = useState(false);

    // On component mount, retrieve the content from localStorage
    useEffect(() => {
        const savedContent = localStorage.getItem('quizContent');
        if (savedContent) {
            setContent(savedContent);
        } else {
            // If there's no content, the user shouldn't be on this page.
            toast({
                title: "No Content Found",
                description: "Please go back and provide some study material first.",
                variant: "destructive"
            });
            router.push('/quiz');
        }
    }, [router, toast]);


    const handleGenerateQuiz = () => {
        if (!content) return;

        startGenerating(async () => {
            const allowed = await checkAndIncrementMessageLimit();
            if (!allowed) {
                setShowLimitDialog(true);
                return;
            }

            const quizInput: GenerateQuizzesInput = {
                content,
                difficulty: difficulty as "easy" | "medium" | "hard",
                numQuestions: parseInt(numQuestions),
            };

            const result = await generateQuizAction(quizInput);

            if (result.error) {
                toast({
                    title: "Could not generate quiz",
                    description: result.error,
                    variant: "destructive",
                });
                return;
            }

            if (result.data) {
                toast({ title: "Quiz Generated!", description: "Your quiz is ready. Redirecting..." });

                const quizData = {
                    quizzes: result.data.quizzes,
                    options: {
                        difficulty,
                        numQuestions: parseInt(numQuestions),
                        timeLimit: parseInt(timeLimit) * 60, // convert to seconds
                    }
                };
                localStorage.setItem('currentQuiz', JSON.stringify(quizData));
                router.push('/quiz/start');
            }
        });
    };

    if (!content) {
        // Render loading or a redirecting message
        return <div className="flex h-full items-center justify-center">Loading content...</div>;
    }

    return (
        <div className="flex justify-center items-center p-4 md:p-6">
            <LimitExhaustedDialog isOpen={showLimitDialog} onOpenChange={setShowLimitDialog} />
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <BackButton />
                        <CardTitle>Customize Your Quiz</CardTitle>
                    </div>
                    <CardDescription>Set the parameters for your quiz below. The quiz will be generated using Qwen.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-3">
                        <Label className="font-semibold">Difficulty</Label>
                        <RadioGroup defaultValue="medium" value={difficulty} onValueChange={setDifficulty} className="flex gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="easy" id="easy" />
                                <Label htmlFor="easy">Easy</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="medium" id="medium" />
                                <Label htmlFor="medium">Medium</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="hard" id="hard" />
                                <Label htmlFor="hard">Hard</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <Label className="font-semibold" htmlFor="num-questions">Number of Questions</Label>
                            <Select value={numQuestions} onValueChange={setNumQuestions}>
                                <SelectTrigger id="num-questions">
                                    <SelectValue placeholder="Select number of questions" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="5">5 Questions</SelectItem>
                                    <SelectItem value="10">10 Questions</SelectItem>
                                    <SelectItem value="15">15 Questions</SelectItem>
                                    <SelectItem value="20">20 Questions</SelectItem>
                                    <SelectItem value="25">25 Questions</SelectItem>
                                    <SelectItem value="50">50 Questions</SelectItem>
                                    <SelectItem value="100">100 Questions</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label className="font-semibold" htmlFor="time-limit">Time Limit</Label>
                            <Select value={timeLimit} onValueChange={setTimeLimit}>
                                <SelectTrigger id="time-limit">
                                    <SelectValue placeholder="Select time limit" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="5">5 Minutes</SelectItem>
                                    <SelectItem value="10">10 Minutes</SelectItem>
                                    <SelectItem value="30">30 Minutes</SelectItem>
                                    <SelectItem value="60">60 Minutes</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button onClick={handleGenerateQuiz} disabled={isGenerating}>
                        {isGenerating && <WavyLoader className="mr-2 h-4 w-4 animate-spin" />}
                        Create Quiz
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

