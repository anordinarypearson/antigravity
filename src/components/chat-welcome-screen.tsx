"use client";

import { Image as ImageIcon, Code, Wand2, Zap, Newspaper, Globe, Pencil, Check, Sparkles, MessageSquare, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface ChatWelcomeScreenProps {
    userName: string | null;
    setActiveButton: (button: 'deepthink' | 'music' | 'image' | null) => void;
    handleSendMessage: (message: string) => void;
    onUpdateName: (name: string) => void;
}

export function ChatWelcomeScreen({ userName, setActiveButton, handleSendMessage, onUpdateName }: ChatWelcomeScreenProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(userName || '');

    const handleSaveName = () => {
        if (newName.trim()) {
            onUpdateName(newName.trim());
            setIsEditing(false);
        }
    };

    return (
        <div className="flex h-full flex-col justify-center p-4 sm:p-8 overflow-y-auto bg-grid-pattern">
            <div className="mx-auto w-full max-w-5xl space-y-8 sm:space-y-12">

                {/* Hero Section */}
                <div className="space-y-4 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-3">
                        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter uppercase flex flex-wrap items-center gap-3">
                            <span className="text-foreground/40">Hello, </span>
                            {isEditing ? (
                                <div className="flex items-center gap-3">
                                    <Input
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="h-12 sm:h-16 md:h-20 text-3xl sm:text-4xl md:text-6xl font-black uppercase bg-muted/50 border-primary/50 shadow-sm focus-visible:ring-primary w-[200px] sm:w-[300px] md:w-[450px] text-center sm:text-left"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                                    />
                                    <Button size="icon" className="h-12 w-12 sm:h-16 sm:w-16 rounded-2xl touch-manipulation" onClick={handleSaveName}>
                                        <Check className="h-6 w-6 sm:h-8 sm:w-8" />
                                    </Button>
                                </div>
                            ) : (
                                <span className="group relative flex items-center gap-3">
                                    <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient-x">
                                        {userName || 'Creator'}
                                    </span>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="inline-flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-muted/30 border border-transparent hover:border-border hover:bg-muted transition-all opacity-0 group-hover:opacity-100 touch-manipulation transform hover:scale-110"
                                        title="Edit name"
                                    >
                                        <Pencil className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                                    </button>
                                </span>
                            )}
                        </h1>
                    </div>
                    <p className="text-lg sm:text-2xl text-muted-foreground font-light max-w-3xl leading-relaxed mx-auto sm:mx-0">
                        Ready to shape the future? <span className="text-foreground font-medium">Create images</span>, <span className="text-foreground font-medium">write code</span>, or <span className="text-foreground font-medium">brainstorm</span> ideas.
                    </p>
                </div>

                {/* Feature Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {/* Image Generation Card */}
                    <button
                        onClick={() => setActiveButton('image')}
                        className="group relative flex flex-col justify-between p-4 h-36 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 hover:bg-orange-50/50 dark:hover:bg-orange-950/10 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-orange-500/10 overflow-hidden text-left"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative z-10 p-2 w-fit rounded-2xl bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform duration-500">
                            <ImageIcon className="h-6 w-6" />
                        </div>
                        <div className="relative z-10 space-y-1">
                            <h3 className="text-lg font-bold uppercase tracking-tight text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">Generate Images</h3>
                            <p className="text-sm text-muted-foreground font-medium">Turn text into stunning artwork with AI</p>
                        </div>
                        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                            <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
                                <ArrowRight className="h-4 w-4" />
                            </div>
                        </div>
                    </button>

                    {/* Write Code Card */}
                    <button
                        onClick={() => handleSendMessage('Create a modern React component')}
                        className="group relative flex flex-col justify-between p-4 h-36 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/10 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/10 overflow-hidden text-left"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative z-10 p-2 w-fit rounded-2xl bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-500">
                            <Code className="h-6 w-6" />
                        </div>
                        <div className="relative z-10 space-y-1">
                            <h3 className="text-lg font-bold uppercase tracking-tight text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Write Code</h3>
                            <p className="text-sm text-muted-foreground font-medium">Debug, refactor, and build software</p>
                        </div>
                        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                <ArrowRight className="h-4 w-4" />
                            </div>
                        </div>
                    </button>

                    {/* Deep Think Card */}
                    <button
                        onClick={() => setActiveButton('deepthink')}
                        className="group relative flex flex-col justify-between p-4 h-36 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 hover:bg-green-50/50 dark:hover:bg-green-950/10 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-green-500/10 overflow-hidden text-left"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative z-10 p-2 w-fit rounded-2xl bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform duration-500">
                            <Wand2 className="h-6 w-6" />
                        </div>
                        <div className="relative z-10 space-y-1">
                            <h3 className="text-lg font-bold uppercase tracking-tight text-foreground group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Deep Think</h3>
                            <p className="text-sm text-muted-foreground font-medium">Complex reasoning and logic</p>
                        </div>
                        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                                <ArrowRight className="h-4 w-4" />
                            </div>
                        </div>
                    </button>

                    {/* Brainstorm Card */}
                    <button
                        onClick={() => handleSendMessage('Give me 5 creative startup ideas')}
                        className="group relative flex flex-col justify-between p-4 h-36 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 hover:bg-purple-50/50 dark:hover:bg-purple-950/10 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/10 overflow-hidden text-left"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative z-10 p-2 w-fit rounded-2xl bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-500">
                            <Zap className="h-6 w-6" />
                        </div>
                        <div className="relative z-10 space-y-1">
                            <h3 className="text-lg font-bold uppercase tracking-tight text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Brainstorm</h3>
                            <p className="text-sm text-muted-foreground font-medium">Spark new ideas and creativity</p>
                        </div>
                        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                                <ArrowRight className="h-4 w-4" />
                            </div>
                        </div>
                    </button>
                </div>

                {/* Quick Action Pills */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                    {[
                        { icon: Newspaper, label: 'Latest News', query: 'Search the latest news headlines today' },
                        { icon: Globe, label: 'Tech Trends', query: 'What correspond to the latest AI tech trends?' },
                        { icon: Zap, label: 'Explain Quantum', query: 'Explain quantum computing simply' },
                    ].map((item, i) => (
                        <button
                            key={i}
                            onClick={() => handleSendMessage(item.query)}
                            className="flex items-center gap-2 px-6 py-3 rounded-full bg-background border border-border shadow-sm hover:shadow-md hover:border-foreground/50 transition-all active:scale-95"
                        >
                            <item.icon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">{item.label}</span>
                        </button>
                    ))}
                </div>

            </div>
        </div>
    );
}
