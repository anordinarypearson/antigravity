
"use client";

import { generateFlashcardsAction, GenerateFlashcardsSambaOutput } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { PlusSquare, Wand2, Bot, Sparkles, Mic, Send, BookCopy, FileQuestion } from "lucide-react"
import { WavyLoader } from "@/components/ui/wavy-loader";
import React, { useState, useTransition, useEffect, useRef } from "react";
import { Flashcard } from "./flashcard";
import { ScrollArea } from "./ui/scroll-area";
import { SidebarTrigger } from "./ui/sidebar";
import { BackButton } from "./back-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { cn } from "@/lib/utils";
import { Input } from "./ui/input";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useUsageLimits } from "@/hooks/use-usage-limits";
import { LimitExhaustedDialog } from "./limit-exhausted-dialog";

const stylePresets = [
    { id: 'colorful', name: 'Colorful', description: 'Bright and vibrant cards.' },
    { id: 'minimal', name: 'Minimal', description: 'Clean and simple design.' },
    { id: 'neon', name: 'Dark Neon', description: 'Glowing text on dark cards.' },
    { id: 'pastel', name: 'Aesthetic', description: 'Soft and pleasing colors.' },
];

const numOptions = [5, 10, 20];

export function CreateFlashcardsContent() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [step, setStep] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, startProcessing] = useTransition();

    const [subject, setSubject] = useState('');
    const [topic, setTopic] = useState('');
    const [numCards, setNumCards] = useState(10);
    const [cardStyle, setCardStyle] = useState('colorful');

    const [generatedFlashcards, setGeneratedFlashcards] = useState<GenerateFlashcardsSambaOutput['flashcards'] | null>(null);
    const [isGenerating, startGenerating] = useTransition();

    const { toast } = useToast();
    const router = useRouter();
    const recognitionRef = useRef<any>(null);
    const { checkAndIncrementMessageLimit } = useUsageLimits();
    const [showLimitDialog, setShowLimitDialog] = useState(false);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Browser does not support SpeechRecognition.");
            return;
        }

        recognitionRef.current = new SpeechRecognition();
        const recognition = recognitionRef.current;
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (e: any) => toast({ title: "Voice Error", description: e.error, variant: 'destructive' });

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setUserInput(transcript);
        };
    }, [toast]);

    const handleStartListening = () => {
        if (isListening || !recognitionRef.current) return;
        recognitionRef.current.start();
    };

    const resetFlow = () => {
        setStep(0);
        setUserInput('');
        setSubject('');
        setTopic('');
        setIsDialogOpen(true);
    };

    const handleNextStep = () => {
        startProcessing(() => {
            if (step === 0) { // Greeting
                setStep(1);
                return;
            }
            if (step === 1) { // Subject
                if (!userInput.trim()) {
                    toast({ title: "Please enter a subject.", variant: "destructive" });
                    return;
                }
                setSubject(userInput);
                setUserInput('');
                setStep(2);
            } else if (step === 2) { // Topic
                if (!userInput.trim()) {
                    toast({ title: "Please enter a topic.", variant: "destructive" });
                    return;
                }
                setTopic(userInput);
                setUserInput('');
                setStep(3);
            } else if (step === 3) { // Number of cards (Handled by button click)
                setStep(4);
            } else if (step === 4) { // Style (Handled by button click)
                setStep(5);
            } else if (step === 5) { // Confirmation
                setIsDialogOpen(false);
                handleGenerateFlashcards();
            }
        });
    };

    const handleGenerateFlashcards = async () => {
        const allowed = await checkAndIncrementMessageLimit();
        if (!allowed) {
            setShowLimitDialog(true);
            return;
        }

        const content = `Subject: ${subject}. Topic: ${topic}. Please generate ${numCards} flashcards about this.`;

        startGenerating(async () => {
            const result = await generateFlashcardsAction({ content });
            if (result.error) {
                toast({ title: "Generation Failed", description: result.error, variant: "destructive" });
                setGeneratedFlashcards(null);
            } else {
                setGeneratedFlashcards(result.data?.flashcards ?? []);
                toast({ title: "Success!", description: "Your new flashcard deck is ready." });
            }
        });
    };

    const handlePlayQuiz = () => {
        if (!generatedFlashcards) return;
        const quizContent = `The flashcards are about ${subject}: ${topic}. Here are the questions and answers: ${generatedFlashcards.map(f => `${f.front}? ${f.back}`).join('\n')}`;
        try {
            localStorage.setItem('quizContent', quizContent);
            router.push('/quiz/options');
        } catch (e) {
            toast({
                title: "Could not start quiz",
                description: "There was an error preparing the quiz.",
                variant: "destructive",
            });
        }
    }


    const stepsContent = [
        {
            bot: "Hello! I'm here to help you create a new flashcard deck. Let's get started!",
            action: <Button onClick={handleNextStep} className="w-full justify-center">Let's go! <Sparkles className="ml-2 w-4 h-4" /></Button>
        },
        {
            bot: "First, what's the subject of your new deck? (e.g., Biology, History, JavaScript)",
            input: true
        },
        {
            bot: "Great! Now, what specific topic within that subject do you want to focus on?",
            input: true
        },
        {
            bot: `Awesome choice. How many flashcards would you like me to generate for "${topic}"?`,
            action: (
                <div className="flex gap-2">
                    {numOptions.map(num => <Button className="flex-1" key={num} variant="outline" onClick={() => { setNumCards(num); handleNextStep(); }}>{num}</Button>)}
                </div>
            )
        },
        {
            bot: `Got it, ${numCards} cards. Now, pick a style for your deck. Which one do you like?`,
            action: (
                <div className="grid grid-cols-2 gap-3">
                    {stylePresets.map(s => (
                        <Card key={s.id} className="text-center rounded-lg bg-card/50 border-border/50 hover:border-primary/80 hover:bg-primary/10 cursor-pointer transition-all" onClick={() => { setCardStyle(s.id); handleNextStep(); }}>
                            <CardContent className="p-4">
                                <h3 className="font-semibold text-base">{s.name}</h3>
                                <p className="text-xs text-muted-foreground">{s.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )
        },
        {
            bot: (
                <div>
                    <p>Perfect! Here’s what I’ve got:</p>
                    <ul className="mt-2 text-sm list-disc list-inside bg-white/5 p-4 rounded-lg border border-white/10">
                        <li><strong>Subject:</strong> {subject}</li>
                        <li><strong>Topic:</strong> {topic}</li>
                        <li><strong>Number of Cards:</strong> {numCards}</li>
                        <li><strong>Style:</strong> <span className="capitalize">{cardStyle}</span></li>
                    </ul>
                    <p className="mt-3">Does that look right?</p>
                </div>
            ),
            action: <Button onClick={handleNextStep} className="w-full justify-center">Looks Good, Generate! <Wand2 className="ml-2 w-4 h-4" /></Button>
        },
    ];

    return (
        <div className="flex h-full flex-col bg-black bg-grid-white/[0.05]">
            <LimitExhaustedDialog isOpen={showLimitDialog} onOpenChange={setShowLimitDialog} />
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-md bg-black/50 backdrop-blur-md border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 font-normal text-lg"><Bot className="text-cyan-400" /> Flashcard Assistant</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4 min-h-[20rem] flex flex-col justify-between">
                        <div className="prose prose-sm prose-invert max-w-none">
                            {stepsContent[step]?.bot}
                        </div>
                        <div>
                            {stepsContent[step]?.input ? (
                                <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="flex items-center gap-2 mt-4">
                                    <Input
                                        value={userInput}
                                        onChange={(e) => setUserInput(e.target.value)}
                                        placeholder="Type your answer..."
                                        disabled={isProcessing}
                                        className="bg-white/5 border-white/10 focus:ring-cyan-400"
                                    />
                                    <Button size="icon" variant="ghost" type="button" onClick={handleStartListening} disabled={isListening}>
                                        <Mic className={cn("w-4 h-4", isListening && "text-cyan-400 animate-pulse")} />
                                    </Button>
                                    <Button size="icon" type="submit" disabled={isProcessing}>
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </form>
                            ) : stepsContent[step]?.action}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-black/50 backdrop-blur-md px-4 md:px-6">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <BackButton />
                    <h1 className="text-xl font-semibold tracking-tight text-white/90">Create Flashcards</h1>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <AnimatePresence mode="wait">
                    {isGenerating ? (
                        <motion.div
                            key="generating"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex flex-col items-center justify-center h-full text-center text-muted-foreground"
                        >
                            <WavyLoader className="w-12 h-12 animate-spin text-cyan-400 mb-4" />
                            <h2 className="text-2xl font-semibold text-white">Generating Your Deck...</h2>
                            <p>The AI is working its magic. This might take a moment.</p>
                        </motion.div>
                    ) : generatedFlashcards ? (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div className="mb-8 text-center">
                                <h2 className="text-3xl font-bold text-white">Your "{topic}" Deck is Ready!</h2>
                                <p className="text-muted-foreground">Click a card to flip it. What would you like to do next?</p>
                                <div className="mt-6 flex justify-center gap-4">
                                    <Button variant="outline" onClick={resetFlow} className="border-white/20 text-white/80 hover:bg-white/10 hover:text-white">
                                        <PlusSquare className="mr-2 h-4 w-4" /> Create Another Deck
                                    </Button>
                                    <Button onClick={handlePlayQuiz}>
                                        <FileQuestion className="mr-2 h-4 w-4" /> Play Quiz Mode
                                    </Button>
                                </div>
                            </div>
                            <ScrollArea className="h-[calc(100vh-22rem)]">
                                <div className="grid grid-cols-1 gap-6 pr-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                    {generatedFlashcards.map((card, i) => <Flashcard key={i} {...card} />)}
                                </div>
                            </ScrollArea>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="initial"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex h-full min-h-[300px] items-center justify-center"
                        >
                            <div className="text-center p-8">
                                <BookCopy className="mx-auto h-16 w-16 text-muted-foreground" />
                                <h3 className="mt-4 text-2xl font-semibold text-white">Create a New Flashcard Deck</h3>
                                <p className="mt-2 text-muted-foreground">
                                    Click the button below to start a conversation with our AI assistant to build your deck.
                                </p>
                                <Button size="lg" className="mt-6" onClick={() => setIsDialogOpen(true)}>
                                    <Sparkles className="mr-2 h-5 w-5" />
                                    Start Creating
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
