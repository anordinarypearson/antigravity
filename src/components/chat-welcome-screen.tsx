"use client";

import { Image as ImageIcon, Code, Wand2, Zap, Newspaper, Globe, Pencil, Check } from "lucide-react";
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
        <div className="flex h-full flex-col justify-start p-6 pt-12 overflow-y-auto">
            <div className="mx-auto w-full max-w-3xl space-y-10">

                {/* Hero Section */}
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase flex items-center gap-2">
                            <span className="text-foreground/50">Hello, </span>
                            {isEditing ? (
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="h-10 md:h-14 text-2xl md:text-4xl font-black uppercase bg-muted/50 border-primary shadow-sm focus-visible:ring-primary w-[200px] md:w-[350px]"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                                    />
                                    <Button size="icon" className="h-10 w-10 md:h-14 md:w-14 rounded-xl" onClick={handleSaveName}>
                                        <Check className="h-5 w-5 md:h-6 md:w-6" />
                                    </Button>
                                </div>
                            ) : (
                                <span className="text-foreground group relative flex items-center gap-3">
                                    {userName || 'Grok'}
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-muted/50 border hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                                        title="Edit name"
                                    >
                                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                    </button>
                                </span>
                            )}
                        </h1>
                    </div>
                    <p className="text-lg md:text-xl text-muted-foreground font-light max-w-2xl leading-relaxed">
                        Ready to explore? Create images, write code, or just chat.
                    </p>
                </div>



                {/* Suggestions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                    <button onClick={() => setActiveButton('image')} className="group flex flex-col p-2.5 rounded-2xl bg-background border border-foreground/20 hover:border-foreground transition-all text-left space-y-2 hover:shadow-md">
                        <div className="p-1.5 w-fit rounded-xl bg-neutral-500/10 text-neutral-400 group-hover:bg-neutral-600 group-hover:text-white transition-colors">
                            <ImageIcon className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm uppercase tracking-tight text-foreground">Generate Images</h3>
                            <p className="text-[10px] text-muted-foreground/80">Turn text into art</p>
                        </div>
                    </button>

                    <button onClick={() => handleSendMessage('Create a modern React component')} className="group flex flex-col p-2.5 rounded-2xl bg-background border border-foreground/20 hover:border-foreground transition-all text-left space-y-2 hover:shadow-md">
                        <div className="p-1.5 w-fit rounded-xl bg-neutral-500/10 text-neutral-400 group-hover:bg-neutral-600 group-hover:text-white transition-colors">
                            <Code className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm uppercase tracking-tight text-foreground">Write Code</h3>
                            <p className="text-[10px] text-muted-foreground/80">Debug and build</p>
                        </div>
                    </button>

                    <button onClick={() => setActiveButton('deepthink')} className="group flex flex-col p-2.5 rounded-2xl bg-background border border-foreground/20 hover:border-foreground transition-all text-left space-y-2 hover:shadow-md">
                        <div className="p-1.5 w-fit rounded-xl bg-neutral-500/10 text-neutral-400 group-hover:bg-neutral-600 group-hover:text-white transition-colors">
                            <Wand2 className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm uppercase tracking-tight text-foreground">Deep Think</h3>
                            <p className="text-[10px] text-muted-foreground/80">Complex reasoning</p>
                        </div>
                    </button>

                    <button onClick={() => handleSendMessage('Give me 5 creative startup ideas')} className="group flex flex-col p-2.5 rounded-2xl bg-background border border-foreground/20 hover:border-foreground transition-all text-left space-y-2 hover:shadow-md">
                        <div className="p-1.5 w-fit rounded-xl bg-neutral-500/10 text-neutral-400 group-hover:bg-neutral-600 group-hover:text-white transition-colors">
                            <Zap className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm uppercase tracking-tight text-foreground">Brainstorm</h3>
                            <p className="text-[10px] text-muted-foreground/80">Discover new ideas</p>
                        </div>
                    </button>
                </div>

                {/* Small Action Boxes */}
                <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[
                            { icon: Newspaper, label: 'News', query: 'Search the latest news' },
                            { icon: Zap, label: 'Tech', query: 'Latest in AI technology' },
                            { icon: Globe, label: 'Travel', query: 'Best travel destinations for 2024' },
                        ].map((item, i) => (
                            <button
                                key={i}
                                onClick={() => handleSendMessage(item.query)}
                                className="flex items-center gap-2 p-1.5 rounded-xl bg-background border border-foreground/10 hover:border-foreground hover:bg-foreground/5 transition-all text-left group"
                            >
                                <item.icon className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                                <span className="text-[9px] font-bold uppercase tracking-tight text-muted-foreground group-hover:text-foreground transition-colors">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
