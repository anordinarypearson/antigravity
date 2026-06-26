
"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "./back-button";
import { SharedHeader } from "./shared-header";
import { Brush, Wand2,  Copy, Check, RotateCcw, ChevronDown, ChevronUp, ArrowLeftRight } from "lucide-react"
import { WavyLoader } from "@/components/ui/wavy-loader";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { generateEditedContentAction } from "@/app/actions";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ─── Preset quick-action instructions ────────────────────────────────────────
const QUICK_ACTIONS = [
    { label: "Fix Grammar", icon: "✏️", instruction: "Fix all grammar and spelling errors. Keep the original tone and content intact." },
    { label: "Improve Style", icon: "✨", instruction: "Improve the writing style to be more engaging, clear, and professional." },
    { label: "Make Formal", icon: "👔", instruction: "Rewrite this in formal, professional language suitable for business communication." },
    { label: "Simplify", icon: "🎯", instruction: "Simplify this content so it's easy for a general audience to understand. Use plain language." },
    { label: "Make Concise", icon: "⚡", instruction: "Make this more concise. Remove unnecessary words and redundancies while preserving all key information." },
    { label: "Expand Detail", icon: "📝", instruction: "Expand this with more detail, examples, and context to make it more comprehensive." },
    { label: "Bulletize", icon: "📋", instruction: "Convert this into a well-organized bullet-point list with clear categories." },
    { label: "Add Emojis", icon: "🎨", instruction: "Add relevant emojis throughout this text to make it more vibrant and engaging." },
    { label: "Translate EN", icon: "🌐", instruction: "Translate this text into English, preserving meaning and tone as closely as possible." },
    { label: "Code Review", icon: "🔍", instruction: "Review this code for bugs, inefficiencies, and improvements. Explain any issues found." },
    { label: "Add Comments", icon: "💬", instruction: "Add clear, helpful inline comments to this code explaining what each section does." },
    { label: "Write Tests", icon: "🧪", instruction: "Write unit tests for this code covering the main functionality and edge cases." },
];

// ─── Word / Character counter ────────────────────────────────────────────────
function TextStats({ text }: { text: string }) {
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    return (
        <span className="text-[10px] text-muted-foreground/50 font-mono">
            {words}w • {chars}ch
        </span>
    );
}

// ─── Diff viewer: highlights added/changed lines ──────────────────────────────
function DiffView({ original, edited }: { original: string; edited: string }) {
    const origLines = original.split("\n");
    const editLines = edited.split("\n");
    const maxLen = Math.max(origLines.length, editLines.length);

    return (
        <div className="font-mono text-xs leading-relaxed overflow-auto max-h-[22rem]">
            {Array.from({ length: maxLen }, (_, i) => {
                const a = origLines[i] ?? "";
                const b = editLines[i] ?? "";
                if (a === b) return (
                    <div key={i} className="flex">
                        <span className="w-6 flex-shrink-0 text-muted-foreground/30 select-none text-right mr-2">{i + 1}</span>
                        <span className="text-foreground/70">{b || " "}</span>
                    </div>
                );
                return (
                    <div key={i} className="flex flex-col">
                        {a && (
                            <div className="flex bg-red-500/10">
                                <span className="w-6 flex-shrink-0 text-red-400/50 select-none text-right mr-2">{i + 1}</span>
                                <span className="text-red-400/80 line-through">{a}</span>
                            </div>
                        )}
                        {b && (
                            <div className="flex bg-emerald-500/10">
                                <span className="w-6 flex-shrink-0 text-emerald-400/50 select-none text-right mr-2">{i + 1}</span>
                                <span className="text-emerald-400">{b}</span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function AiEditorContent({ embedded }: { embedded?: boolean }) {
    const [instruction, setInstruction] = useState("");
    const [inputContent, setInputContent] = useState("");
    const [outputContent, setOutputContent] = useState("");
    const [isGenerating, startGenerating] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [view, setView] = useState<"output" | "diff">("output");
    const [showAllActions, setShowAllActions] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const contentFromCanvas = localStorage.getItem("aiEditorContent");
        if (contentFromCanvas) {
            setInputContent(contentFromCanvas);
            localStorage.removeItem("aiEditorContent");
        }
    }, []);

    const handleGenerate = () => {
        if (!instruction.trim()) {
            toast({ title: "Instruction missing", description: "Please provide an instruction for the AI.", variant: "destructive" });
            return;
        }
        setError(null);
        setOutputContent("");
        setView("output");
        startGenerating(async () => {
            const result = await generateEditedContentAction({ instruction, content: inputContent });
            if (result.error) {
                setError(result.error);
            } else if (result.data) {
                setOutputContent(result.data.editedContent);
            }
        });
    };

    const handleCopy = () => {
        if (!outputContent) return;
        navigator.clipboard.writeText(outputContent);
        setCopied(true);
        toast({ title: "Copied!", description: "The generated content has been copied." });
        setTimeout(() => setCopied(false), 2000);
    };

    const handleQuickAction = (instr: string) => {
        setInstruction(instr);
    };

    const visibleActions = showAllActions ? QUICK_ACTIONS : QUICK_ACTIONS.slice(0, 6);

    const header = !embedded && (
        <SharedHeader title="AI Editor" leftElement={<BackButton />} />
    );

    return (
        <div className="flex h-full flex-col bg-muted/20 dark:bg-transparent">
            {header}
            <main className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-5">

                        {/* ── Quick Action Chips ─── */}
                        <Card className="border-border/40">
                            <CardHeader className="pb-2 pt-4 px-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                                        Quick Actions
                                    </CardTitle>
                                    <button
                                        onClick={() => setShowAllActions(s => !s)}
                                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                                    >
                                        {showAllActions ? <><ChevronUp className="h-3 w-3" />Less</> : <><ChevronDown className="h-3 w-3" />More</>}
                                    </button>
                                </div>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <div className="flex flex-wrap gap-2">
                                    <AnimatePresence>
                                        {visibleActions.map((action, i) => (
                                            <motion.button
                                                key={action.label}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: i * 0.03 }}
                                                onClick={() => handleQuickAction(action.instruction)}
                                                className={cn(
                                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                                                    instruction === action.instruction
                                                        ? "bg-primary/15 border-primary/40 text-primary"
                                                        : "bg-muted/40 border-border/40 text-muted-foreground hover:bg-muted hover:border-border hover:text-foreground"
                                                )}
                                            >
                                                <span>{action.icon}</span>
                                                {action.label}
                                            </motion.button>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </CardContent>
                        </Card>

                        {/* ── Main Grid ─── */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

                            {/* LEFT: Instruction + Input */}
                            <div className="space-y-4">
                                {/* Instruction */}
                                <Card className="border-border/40">
                                    <CardHeader className="p-4 pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm flex items-center gap-2">
                                                <span className="h-5 w-5 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold">1</span>
                                                Your Instruction
                                            </CardTitle>
                                            {instruction && (
                                                <button onClick={() => setInstruction("")} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                                                    Clear
                                                </button>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-2">
                                        <Textarea
                                            placeholder="e.g., 'Fix grammar and spelling', 'Write a Python function that returns prime numbers', or 'Convert this to a formal email'…"
                                            value={instruction}
                                            onChange={(e) => setInstruction(e.target.value)}
                                            className="h-24 resize-none text-sm"
                                        />
                                        <div className="flex justify-end mt-1">
                                            <TextStats text={instruction} />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Input content */}
                                <Card className="border-border/40">
                                    <CardHeader className="p-4 pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm flex items-center gap-2">
                                                <span className="h-5 w-5 rounded-full bg-muted/60 text-muted-foreground flex items-center justify-center text-xs font-bold">2</span>
                                                Input Content
                                                <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                                            </CardTitle>
                                            {inputContent && (
                                                <button onClick={() => setInputContent("")} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                                                    Clear
                                                </button>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-2">
                                        <Textarea
                                            placeholder="Paste your text or code here for the AI to edit, analyze, or transform…"
                                            value={inputContent}
                                            onChange={(e) => setInputContent(e.target.value)}
                                            className="h-48 resize-none text-sm font-mono"
                                        />
                                        <div className="flex justify-end mt-1">
                                            <TextStats text={inputContent} />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Button
                                    onClick={handleGenerate}
                                    disabled={isGenerating || !instruction.trim()}
                                    className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
                                >
                                    {isGenerating
                                        ? <><WavyLoader className="mr-2 h-4 w-4 animate-spin" />Processing...</>
                                        : <><Wand2 className="mr-2 h-4 w-4" />Generate</>
                                    }
                                </Button>
                            </div>

                            {/* RIGHT: Output */}
                            <div className="space-y-2">
                                <Card className="border-border/40 h-full">
                                    <CardHeader className="p-4 pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm flex items-center gap-2">
                                                <span className="h-5 w-5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-xs font-bold">3</span>
                                                AI Generated Output
                                                {outputContent && (
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                )}
                                            </CardTitle>
                                            <div className="flex items-center gap-1">
                                                {outputContent && inputContent && (
                                                    <button
                                                        onClick={() => setView(v => v === "diff" ? "output" : "diff")}
                                                        className={cn(
                                                            "flex items-center gap-1 text-[10px] px-2 py-1 rounded-md border transition-all",
                                                            view === "diff"
                                                                ? "bg-primary/10 border-primary/30 text-primary"
                                                                : "border-border/40 text-muted-foreground hover:text-foreground"
                                                        )}
                                                    >
                                                        <ArrowLeftRight className="h-3 w-3" />
                                                        Diff
                                                    </button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={handleCopy}
                                                    disabled={!outputContent}
                                                >
                                                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                                                </Button>
                                                {outputContent && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        onClick={() => { setOutputContent(""); setView("output"); }}
                                                        title="Clear output"
                                                    >
                                                        <RotateCcw className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-2">
                                        {isGenerating ? (
                                            <div className="flex flex-col items-center justify-center h-[22rem] gap-3">
                                                <div className="relative">
                                                    <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                                                    <Wand2 className="absolute inset-0 m-auto h-5 w-5 text-primary" />
                                                </div>
                                                <p className="text-sm text-muted-foreground animate-pulse">AI is processing your request…</p>
                                            </div>
                                        ) : error ? (
                                            <div className="h-[22rem] flex items-start p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                                                <div>
                                                    <p className="font-semibold text-red-400 text-sm">Generation Failed</p>
                                                    <p className="text-xs text-red-400/70 mt-1">{error}</p>
                                                </div>
                                            </div>
                                        ) : view === "diff" && outputContent && inputContent ? (
                                            <div className="rounded-xl bg-muted/30 border border-border/40 p-3 h-[22rem]">
                                                <DiffView original={inputContent} edited={outputContent} />
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <Textarea
                                                    placeholder="The AI's response will appear here…"
                                                    value={outputContent}
                                                    readOnly
                                                    className="h-[22rem] resize-none bg-muted/30 font-mono text-sm"
                                                />
                                                {outputContent && (
                                                    <div className="absolute bottom-3 right-3">
                                                        <TextStats text={outputContent} />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Action row after output */}
                                        {outputContent && !isGenerating && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="mt-3 flex items-center gap-2"
                                            >
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-xs h-8 border-border/40"
                                                    onClick={() => { setInputContent(outputContent); setOutputContent(""); setView("output"); }}
                                                >
                                                    Use as new input
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-xs h-8 border-border/40"
                                                    onClick={handleCopy}
                                                >
                                                    {copied ? <Check className="h-3 w-3 mr-1 text-emerald-400" /> : <Copy className="h-3 w-3 mr-1" />}
                                                    Copy result
                                                </Button>
                                            </motion.div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </main>
        </div>
    );
}
