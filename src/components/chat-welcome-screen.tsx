"use client";

import { Zap, Newspaper, Globe, Pencil, Check, Code, Image as ImageIcon, Brain, BookOpen, ArrowRight, Search, Sparkles, Wand2, Timer, Calculator, Palette, Dices, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { motion, AnimatePresence } from "framer-motion";

interface ChatWelcomeScreenProps {
    userName: string | null;
    setActiveButton: (button: 'tools' | 'music' | 'image' | null) => void;
    handleSendMessage: (message: string) => void;
    onUpdateName: (name: string) => void;
    chatBar?: React.ReactNode;
}

const greetings = [
    "What would you like to discover today?",
    "Ready to explore something new?",
    "Let's find answers together.",
    "Ask me anything — I'm here to help.",
];

const QUICK_CHIPS = [
    { query: "Tell me about Next.js", icon: "⚡" },
    { query: "Today's top news", icon: "📰" },
    { query: "What is quantum computing?", icon: "⚛️" },
    { query: "How does AI work?", icon: "🤖" },
    { query: "Latest tech innovations", icon: "🔬" },
    { query: "Climate change updates", icon: "🌍" },
];

// ─── Feature showcase cards ───────────────────────────────────────────────────
const FEATURE_CARDS = [
    {
        icon: Brain,
        label: "Deep Think",
        description: "Extended reasoning for complex problems",
        gradient: "from-violet-500/20 to-fuchsia-500/10",
        border: "border-violet-500/20",
        iconColor: "text-violet-400",
        action: "Explain the theory of relativity using deep reasoning",
    },
    {
        icon: Globe,
        label: "Web Search",
        description: "Real-time search across the internet",
        gradient: "from-blue-500/20 to-cyan-500/10",
        border: "border-blue-500/20",
        iconColor: "text-blue-400",
        action: "/websearch What happened in tech today?",
    },
    {
        icon: Code,
        label: "Code Helper",
        description: "Write, debug & explain any code",
        gradient: "from-emerald-500/20 to-teal-500/10",
        border: "border-emerald-500/20",
        iconColor: "text-emerald-400",
        action: "Write a Python function to generate Fibonacci numbers with memoization",
    },
    {
        icon: ImageIcon,
        label: "Image Gen",
        description: "Create stunning AI images",
        gradient: "from-rose-500/20 to-orange-500/10",
        border: "border-rose-500/20",
        iconColor: "text-rose-400",
        action: "/image A futuristic cityscape at sunset with flying cars",
    },
    {
        icon: BrainCircuit,
        label: "Mind Maps",
        description: "Visualize complex topics as maps",
        gradient: "from-amber-500/20 to-yellow-500/10",
        border: "border-amber-500/20",
        iconColor: "text-amber-400",
        action: "Create a mind map about machine learning",
    },
    {
        icon: Calculator,
        label: "Calculator",
        description: "Scientific & expression calculator",
        gradient: "from-orange-500/20 to-red-500/10",
        border: "border-orange-500/20",
        iconColor: "text-orange-400",
        action: "/calculator",
    },
];

export function ChatWelcomeScreen({ userName, setActiveButton, handleSendMessage, onUpdateName, chatBar }: ChatWelcomeScreenProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(userName || '');
    const [greetingIndex, setGreetingIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setGreetingIndex((prev) => (prev + 1) % greetings.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const handleSaveName = () => {
        if (newName.trim()) {
            onUpdateName(newName.trim());
            setIsEditing(false);
        }
    };

    const currentHour = new Date().getHours();
    const timeGreeting = currentHour < 12 ? "Good morning" : currentHour < 17 ? "Good afternoon" : "Good evening";
    const timeEmoji = currentHour < 12 ? "🌅" : currentHour < 17 ? "☀️" : "🌙";

    return (
        <div className="relative flex h-full flex-col justify-start p-4 sm:p-6 overflow-y-auto custom-scrollbar">
            {/* Background ambient blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3], rotate: [0, 90, 0] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{ x: [0, 100, 0], y: [0, -50, 0], scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[100px]"
                />
                <motion.div
                    animate={{ x: [0, -100, 0], y: [0, 100, 0], opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[20%] right-[20%] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px]"
                />
            </div>

            <div className="mx-auto w-full max-w-4xl space-y-6 sm:space-y-8 relative z-10 mt-2 sm:mt-6 md:mt-8">

                {/* ── Hero ────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="space-y-3 text-center"
                >
                    {/* Time greeting pill */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        className="flex items-center justify-center gap-2"
                    >
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/30 border border-border/30 backdrop-blur-sm">
                            <span>{timeEmoji}</span>
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[11px] font-semibold text-muted-foreground/70 tracking-[0.15em] uppercase">{timeGreeting}</span>
                        </div>
                    </motion.div>

                    {/* Name */}
                    <div className="flex items-center justify-center gap-3">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                            <span className="text-muted-foreground/40">Hello,</span>
                            {isEditing ? (
                                <div className="flex items-center gap-3">
                                    <Input
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="h-12 sm:h-14 text-2xl sm:text-3xl font-black bg-muted/30 border-primary/40 shadow-sm focus-visible:ring-primary w-[180px] sm:w-[260px] text-center rounded-xl"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                                    />
                                    <Button size="icon" className="h-11 w-11 rounded-xl" onClick={handleSaveName}>
                                        <Check className="h-5 w-5" />
                                    </Button>
                                </div>
                            ) : (
                                <span className="group relative flex items-center gap-2">
                                    <motion.span
                                        key={userName || 'Creator'}
                                        initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                        transition={{ type: "spring", stiffness: 100, damping: 15 }}
                                        className="bg-gradient-to-br from-foreground via-foreground/90 to-foreground/50 bg-clip-text text-transparent drop-shadow-sm"
                                    >
                                        {userName || 'Creator'}
                                    </motion.span>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-muted/20 border border-transparent hover:border-border/50 hover:bg-muted/40 transition-all opacity-0 group-hover:opacity-100 transform hover:scale-110"
                                        title="Edit name"
                                    >
                                        <Pencil className="h-3 w-3 text-muted-foreground/60" />
                                    </button>
                                </span>
                            )}
                        </h1>
                    </div>

                    {/* Animated subtitle */}
                    <div className="h-7 flex items-center justify-center overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={greetingIndex}
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -14 }}
                                transition={{ duration: 0.4, ease: "easeInOut" }}
                                className="text-sm sm:text-base text-muted-foreground/50 font-light"
                            >
                                {greetings[greetingIndex]}
                            </motion.p>
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* ── Chat Bar ─────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                    {chatBar}

                    {/* Quick chips */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mt-4 space-y-2"
                    >
                        <div className="flex flex-wrap items-center justify-center gap-2">
                            {QUICK_CHIPS.map((chip, i) => (
                                <motion.button
                                    key={i}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.35 + i * 0.05 }}
                                    whileHover={{ scale: 1.04, y: -2 }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => handleSendMessage(chip.query)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium",
                                        "bg-background/40 backdrop-blur-xl border border-white/10 dark:border-white/5",
                                        "text-foreground/80 hover:text-foreground",
                                        "hover:border-primary/50 hover:bg-primary/10 hover:shadow-[0_0_20px_rgba(var(--primary),0.15)]",
                                        "transition-all duration-300 ease-out",
                                        i >= 4 ? "hidden sm:flex" : ""
                                    )}
                                >
                                    <span>{chip.icon}</span>
                                    {chip.query}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>


            </div>
        </div>
    );
}
