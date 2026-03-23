
"use client";

import { chatAction, SummarizeContentOutput, summarizeContentAction } from "@/app/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Bot,  Send, User, Sparkles, Sidebar, Moon, Sun } from "lucide-react"
import { WavyLoader } from "@/components/ui/wavy-loader";
import React, { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { marked } from "marked";
import { Skeleton } from "./ui/skeleton";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BackButton } from "./back-button";
import { SidebarTrigger } from "./ui/sidebar";
import { CoreMessage } from "ai";
import { useUsageLimits } from "@/hooks/use-usage-limits";
import { LimitExhaustedDialog } from "./limit-exhausted-dialog";

type Message = {
    role: "user" | "model";
    content: string;
};

type Article = {
    title: string;
    description: string;
    url: string;
    urlToImage: string;
    content: string | null;
    source: {
        name: string;
    };
    publishedAt: string;
};

const dummyPrompts = [
    "Explain this in simple terms.",
    "What is the key takeaway from this?",
    "Who is most affected by this news?",
    "What could be the long-term impact?",
    "Summarize the main arguments in 3 bullet points.",
    "Are there any counter-arguments to this?",
];

export function NewsReaderContent() {
    const { toast } = useToast();
    const router = useRouter();
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const [article, setArticle] = useState<Article | null>(null);
    const [summary, setSummary] = useState<SummarizeContentOutput | null>(null);
    const [isSummarizing, startSummarizing] = useTransition();
    const [history, setHistory] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isTyping, startTyping] = useTransition();
    const { checkAndIncrementMessageLimit } = useUsageLimits();
    const [showLimitDialog, setShowLimitDialog] = useState(false);

    // Load article from localStorage on mount
    useEffect(() => {
        try {
            const savedArticle = localStorage.getItem('selectedArticle');
            if (savedArticle) {
                const parsedArticle = JSON.parse(savedArticle);
                setArticle(parsedArticle);

                // Generate summary when article is loaded
                startSummarizing(async () => {
                    const allowed = await checkAndIncrementMessageLimit();
                    if (!allowed) {
                        setShowLimitDialog(true);
                        return;
                    }
                    const contentToSummarize = parsedArticle.content || parsedArticle.description;
                    if (!contentToSummarize) {
                        setSummary({ summary: "No content available to summarize." });
                        return;
                    }
                    // News summarization always uses Qwen
                    const result = await summarizeContentAction({ content: contentToSummarize });
                    if (result.error) {
                        toast({ title: "Summarization Failed", description: result.error, variant: "destructive" });
                    } else {
                        setSummary(result.data ?? null);
                    }
                });

            } else {
                toast({ title: "No article selected", description: "Please go back and select an article.", variant: "destructive" });
                router.push('/news');
            }
        } catch (e) {
            toast({ title: "Failed to load article", description: "The article data is corrupted.", variant: "destructive" });
            router.push('/news');
        }
    }, [router, toast]);

    const handleSendMessage = useCallback(async (messageContent?: string) => {
        const messageToSend = messageContent ?? input;
        if (!messageToSend.trim() || !article) return;

        const userMessage: Message = { role: "user", content: messageToSend };

        const allowed = await checkAndIncrementMessageLimit();
        if (!allowed) {
            setShowLimitDialog(true);
            return;
        }

        setHistory((prev) => [...prev, userMessage]);
        setInput("");

        startTyping(async () => {
            const fullHistory: CoreMessage[] = [...history, userMessage].map(m => ({ role: m.role, content: m.content }));

            const fileContent = `The user is asking a follow-up question about the news article titled "${article.title}". Here is the article summary for context: "${summary?.summary || article.description}". Answer the user's question based on this context.`;

            const result = await chatAction({
                history: fullHistory,
                fileContent: fileContent,
                model: 'Meta-Llama-3.1-8B-Instruct', // Use a fast model for news chat
            });

            if (result.error) {
                toast({ title: "Chat Error", description: result.error, variant: "destructive" });
                setHistory((prev) => prev.filter(msg => msg !== userMessage));
            } else if (result.data) {
                const modelMessage: Message = { role: "model", content: result.data.response };
                setHistory((prev) => [...prev, modelMessage]);
            }
        });
    }, [input, history, article, toast, summary]);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSendMessage();
    }

    useEffect(() => {
        if (scrollAreaRef.current) {
            setTimeout(() => {
                const viewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
                if (viewport) {
                    viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
                }
            }, 100);
        }
    }, [history, isTyping]);

    if (!article) {
        return null; // Or a loading spinner, handled by the page's Suspense boundary
    }

    return (
        <div className="flex h-full flex-col">
            <LimitExhaustedDialog isOpen={showLimitDialog} onOpenChange={setShowLimitDialog} />
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 md:px-6">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="lg:hidden" />
                    <BackButton />
                    <h1 className="text-xl font-semibold tracking-tight">News Reader</h1>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
                <div className="max-w-3xl mx-auto space-y-8">
                    <h1 className="text-4xl font-bold tracking-tight">{article.title}</h1>

                    {article.urlToImage && (
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden border">
                            <Image src={article.urlToImage} alt={article.title} fill className="object-cover" />
                        </div>
                    )}

                    <div>
                        <h2 className="text-2xl font-semibold mb-3">News Description</h2>
                        {isSummarizing ? (
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                            </div>
                        ) : (
                            <p className="prose dark:prose-invert max-w-none text-muted-foreground">
                                {summary?.summary || "No summary available."}
                            </p>
                        )}
                    </div>

                    <div className="border rounded-xl bg-card">
                        <div className="p-4 border-b">
                            <h3 className="font-semibold">Ask Follow-up Questions</h3>
                        </div>
                        <div className="h-[32rem] flex flex-col">
                            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                                <div className="space-y-4 pr-4">
                                    {history.map((message, index) => (
                                        <div
                                            key={index}
                                            className={cn(
                                                "flex items-start gap-4",
                                                message.role === "user" ? "justify-end" : ""
                                            )}
                                        >
                                            {message.role === "model" && (
                                                <Avatar className="h-9 w-9 border">
                                                    <AvatarFallback className="bg-primary/10 text-primary"><Bot className="size-5" /></AvatarFallback>
                                                </Avatar>
                                            )}
                                            <div className="max-w-lg">
                                                <div
                                                    className={cn(
                                                        "rounded-xl p-3 text-sm",
                                                        message.role === "user"
                                                            ? "bg-primary text-primary-foreground"
                                                            : "bg-muted"
                                                    )}
                                                >
                                                    <div className="prose dark:prose-invert prose-p:my-2 text-foreground" dangerouslySetInnerHTML={{ __html: message.role === 'model' ? marked(message.content) : message.content }} />
                                                </div>
                                            </div>
                                            {message.role === "user" && (
                                                <Avatar className="h-9 w-9 border">
                                                    <AvatarFallback><User className="size-5" /></AvatarFallback>
                                                </Avatar>
                                            )}
                                        </div>
                                    ))}
                                    {isTyping && (
                                        <div className="flex items-start gap-4">
                                            <Avatar className="h-9 w-9 border">
                                                <AvatarFallback className="bg-primary/10 text-primary"><Bot className="size-5" /></AvatarFallback>
                                            </Avatar>
                                            <div className="max-w-lg rounded-xl p-3 text-sm bg-muted flex items-center gap-2">
                                                <WavyLoader className="size-4 animate-spin" />
                                            </div>
                                        </div>
                                    )}
                                    {history.length === 0 && !isTyping && (
                                        <div className="pt-4">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Sparkles className="text-primary w-5 h-5" />
                                                <p className="text-sm font-semibold text-muted-foreground">Try asking...</p>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {dummyPrompts.map(prompt => (
                                                    <Button
                                                        key={prompt}
                                                        variant="outline"
                                                        className="h-auto text-left justify-start py-2"
                                                        onClick={() => handleSendMessage(prompt)}
                                                    >
                                                        {prompt}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                            <div className="p-4 border-t bg-background/80 rounded-b-lg">
                                <form onSubmit={handleFormSubmit} className="flex items-center gap-2 w-full">
                                    <Input
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Ask a follow-up question..."
                                        disabled={isTyping}
                                        className="h-10 text-base"
                                    />
                                    <Button type="submit" size="icon" className="h-10 w-10 flex-shrink-0" disabled={isTyping || !input.trim()}>
                                        {isTyping ? (
                                            <WavyLoader className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <Send className="h-5 w-5" />
                                        )}
                                        <span className="sr-only">Send</span>
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
