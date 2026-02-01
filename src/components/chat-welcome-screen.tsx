"use client";

import { Zap, Newspaper, Globe, Pencil, Check, Sparkles, MessageSquare, ArrowRight } from "lucide-react";
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
        <div className="relative flex h-full flex-col justify-center p-4 sm:p-8 overflow-y-auto">

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
                                    <span className="bg-gradient-to-r from-red-500 via-red-600 to-red-800 bg-clip-text text-transparent animate-gradient-x">
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
