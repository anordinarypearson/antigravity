
"use client";
import { useEffect, useState } from "react";
import QuizInterface from "./quiz-interface";
import type { GenerateQuizzesSambaOutput as GenerateQuizzesOutput } from "@/ai/flows/generate-quizzes-samba";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { BackButton } from "./back-button";

type QuizData = {
    quizzes: GenerateQuizzesOutput['quizzes'];
    options: {
        difficulty: string;
        numQuestions: number;
        timeLimit: number;
    }
}

type Answers = {
    [key: number]: string;
}

export function QuizStartContent() {
    const [quizData, setQuizData] = useState<QuizData | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Answers>({});
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        try {
            const savedQuiz = localStorage.getItem('currentQuiz');
            if (savedQuiz) {
                const parsedData: QuizData = JSON.parse(savedQuiz);
                // Ensure number of questions matches the options
                const trimmedQuizzes = parsedData.quizzes.slice(0, parsedData.options.numQuestions);
                setQuizData({...parsedData, quizzes: trimmedQuizzes });
            } else {
                router.push('/quiz');
                toast({ title: "No quiz found.", description: "Please generate a quiz first.", variant: "destructive" });
            }
        } catch (error) {
            router.push('/quiz');
            toast({ title: "Failed to load quiz.", description: "The quiz data appears to be corrupted.", variant: "destructive" });
        }
    }, [router, toast]);

    const handleAnswer = (answer: string) => {
        setAnswers(prev => ({ ...prev, [currentQuestionIndex]: answer }));
    };

    const handleNext = () => {
        if (quizData && currentQuestionIndex < quizData.quizzes.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };
    
    const handleSubmit = () => {
        if (!quizData) return;

        const score = quizData.quizzes.reduce((acc, quiz, index) => {
            if (answers[index] === quiz.answer) {
                return acc + 1;
            }
            return acc;
        }, 0);
        
        try {
            const resultsData = {
                score,
                totalQuestions: quizData.quizzes.length,
                quizzes: quizData.quizzes,
                answers,
            };
            localStorage.setItem('quizResults', JSON.stringify(resultsData));
            // Cleanup current quiz from storage
            localStorage.removeItem('currentQuiz');
            router.push("/quiz/results");
        } catch (error) {
            toast({ title: "Error", description: "Could not save quiz results.", variant: "destructive"});
        }
    }

    const handleTimeUp = () => {
        toast({ title: "Time's up!", description: "Submitting your quiz now."});
        handleSubmit();
    }

    if (!quizData) {
        return <div className="flex h-screen w-full items-center justify-center">Loading Quiz...</div>;
    }

    const currentQuestion = quizData.quizzes[currentQuestionIndex];
    if (!currentQuestion) {
        return <div className="flex h-screen w-full items-center justify-center">Error: Question not found.</div>;
    }


    return (
        <>
            <div className="absolute top-4 left-4 z-[60]">
                <BackButton />
            </div>
            <QuizInterface 
                subject={quizData.options.difficulty}
                durationSec={quizData.options.timeLimit}
                currentQuestion={currentQuestionIndex + 1}
                totalQuestions={quizData.quizzes.length}
                questionText={currentQuestion.question}
                options={currentQuestion.options}
                selectedAnswer={answers[currentQuestionIndex]}
                onAnswer={handleAnswer}
                onNext={handleNext}
                onPrev={handlePrev}
                onSubmit={() => setShowSubmitConfirm(true)}
                onTimeUp={handleTimeUp}
                autoStart
            />
            <AlertDialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to submit?</AlertDialogTitle>
                    <AlertDialogDescription>
                        You cannot change your answers after submitting.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <Button variant="ghost" onClick={() => setShowSubmitConfirm(false)}>Cancel</Button>
                    <AlertDialogAction onClick={handleSubmit}>Submit</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
