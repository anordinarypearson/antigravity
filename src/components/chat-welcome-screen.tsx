"use client";

import { Zap, Newspaper, Globe, Pencil, Check, Sparkles, Code, Image as ImageIcon, Brain, BookOpen, ArrowRight } from "lucide-react";
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
}

const greetings = [
    "What would you like to create today?",
    "Ready to explore something new?",
    "Let's build something amazing.",
    "How can I assist you today?",
];

const quickActions = [
    {
        icon: Newspaper,
        label: 'Latest News',
        description: 'Get the top headlines',
        query: 'Search the latest news headlines today',
        gradient: 'from-amber-500/10 to-orange-500/10',
        borderHover: 'hover:border-amber-500/30',
        iconColor: 'text-amber-500',
    },
    {
        icon: Code,
        label: 'Write Code',
        description: 'Generate or debug code',
        query: 'Help me write a React component',
        gradient: 'from-blue-500/10 to-cyan-500/10',
        borderHover: 'hover:border-blue-500/30',
        iconColor: 'text-blue-500',
    },
    {
        icon: Brain,
        label: 'Brainstorm',
        description: 'Generate creative ideas',
        query: 'Help me brainstorm ideas for a project',
        gradient: 'from-purple-500/10 to-pink-500/10',
        borderHover: 'hover:border-purple-500/30',
        iconColor: 'text-purple-500',
    },
    {
        icon: BookOpen,
        label: 'Learn',
        description: 'Explain any concept',
        query: 'Explain quantum computing simply',
        gradient: 'from-emerald-500/10 to-green-500/10',
        borderHover: 'hover:border-emerald-500/30',
        iconColor: 'text-emerald-500',
    },
];

export function ChatWelcomeScreen({ userName, setActiveButton, handleSendMessage, onUpdateName }: ChatWelcomeScreenProps) {
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

    return (
        <div className="relative flex h-full flex-col justify-center p-4 sm:p-8 overflow-y-auto">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

            <div className="mx-auto w-full max-w-3xl space-y-10 sm:space-y-14 relative z-10">

                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="space-y-5 text-center"
                >
                    {/* Time-based greeting */}
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        className="text-sm font-medium text-muted-foreground tracking-widest uppercase"
                    >
                        {timeGreeting}
                    </motion.p>

                    {/* Name with edit */}
                    <div className="flex items-center justify-center gap-3">
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight flex flex-wrap items-center justify-center gap-3">
                            <span className="text-muted-foreground/60">Hello,</span>
                            {isEditing ? (
                                <div className="flex items-center gap-3">
                                    <Input
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="h-12 sm:h-14 text-3xl sm:text-4xl font-black bg-muted/50 border-primary/50 shadow-sm focus-visible:ring-primary w-[200px] sm:w-[300px] text-center"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                                    />
                                    <Button size="icon" className="h-12 w-12 rounded-2xl touch-manipulation" onClick={handleSaveName}>
                                        <Check className="h-6 w-6" />
                                    </Button>
                                </div>
                            ) : (
                                <span className="group relative flex items-center gap-2">
                                    <motion.span
                                        key={userName || 'Creator'}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
                                    >
                                        {userName || 'Creator'}
                                    </motion.span>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-muted/30 border border-transparent hover:border-border hover:bg-muted transition-all opacity-0 group-hover:opacity-100 touch-manipulation transform hover:scale-110"
                                        title="Edit name"
                                    >
                                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                    </button>
                                </span>
                            )}
                        </h1>
                    </div>

                    {/* Animated subtitle */}
                    <div className="h-8 flex items-center justify-center overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={greetingIndex}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -16 }}
                                transition={{ duration: 0.4, ease: "easeInOut" }}
                                className="text-lg text-muted-foreground font-light"
                            >
                                {greetings[greetingIndex]}
                            </motion.p>
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Quick Action Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                >
                    {quickActions.map((item, i) => (
                        <motion.button
                            key={i}
                            onClick={() => handleSendMessage(item.query)}
                            whileHover={{ y: -4, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            className={cn(
                                "flex flex-col items-center gap-3 p-5 rounded-2xl border bg-gradient-to-br transition-all duration-300",
                                "border-border/50 shadow-sm hover:shadow-md",
                                item.gradient,
                                item.borderHover,
                            )}
                        >
                            <div className={cn("p-2.5 rounded-xl bg-background/80 backdrop-blur-sm border border-border/30", item.iconColor)}>
                                <item.icon className="h-5 w-5" />
                            </div>
                            <div className="text-center">
                                <span className="text-sm font-semibold text-foreground block">{item.label}</span>
                                <span className="text-[11px] text-muted-foreground mt-0.5 block">{item.description}</span>
                            </div>
                        </motion.button>
                    ))}
                </motion.div>

                {/* Sparkle hint */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60"
                >
                    <Sparkles className="h-3 w-3" />
                    <span>Type a message below or pick a quick action to get started</span>
                    <Sparkles className="h-3 w-3" />
                </motion.div>
            </div>
        </div>
    );
}
