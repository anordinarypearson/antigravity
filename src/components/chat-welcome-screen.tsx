"use client";

import { Image as ImageIcon, Code, Wand2, Zap, Palette, Terminal, Sparkles, ChevronRight, Plus, Search, Newspaper, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatWelcomeScreenProps {
    userName: string | null;
    setActiveButton: (button: 'deepthink' | 'music' | 'image' | null) => void;
    handleSendMessage: (message: string) => void;
}

export function ChatWelcomeScreen({ userName, setActiveButton, handleSendMessage }: ChatWelcomeScreenProps) {
    return (
        <div className="flex h-full flex-col justify-start p-6 pt-8 overflow-y-auto">
            <div className="mx-auto w-full max-w-5xl space-y-8">

                {/* Hero Section */}
                <div className="space-y-2">
                    <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase">
                        <span className="text-foreground/50">Hello, </span>
                        <span className="text-foreground">{userName || 'Grok'}</span>
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground font-light max-w-2xl">
                        Ready to explore? Create images, write code, or just chat.
                    </p>
                </div>

                {/* Suggestions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                    <button onClick={() => setActiveButton('image')} className="group flex flex-col p-3 rounded-none bg-background border border-foreground/20 hover:border-foreground transition-all text-left space-y-2 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]">
                        <div className="p-1.5 w-fit rounded-none bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                            <ImageIcon className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm uppercase tracking-tight text-foreground">Generate Images</h3>
                            <p className="text-[10px] text-muted-foreground/80">Turn text into art</p>
                        </div>
                    </button>

                    <button onClick={() => handleSendMessage('Create a modern React component')} className="group flex flex-col p-3 rounded-none bg-background border border-foreground/20 hover:border-foreground transition-all text-left space-y-2 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]">
                        <div className="p-1.5 w-fit rounded-none bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                            <Code className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm uppercase tracking-tight text-foreground">Write Code</h3>
                            <p className="text-[10px] text-muted-foreground/80">Debug and build</p>
                        </div>
                    </button>

                    <button onClick={() => setActiveButton('deepthink')} className="group flex flex-col p-3 rounded-none bg-background border border-foreground/20 hover:border-foreground transition-all text-left space-y-2 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]">
                        <div className="p-1.5 w-fit rounded-none bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                            <Wand2 className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm uppercase tracking-tight text-foreground">Deep Think</h3>
                            <p className="text-[10px] text-muted-foreground/80">Complex reasoning</p>
                        </div>
                    </button>

                    <button onClick={() => handleSendMessage('Give me 5 creative startup ideas')} className="group flex flex-col p-3 rounded-none bg-background border border-foreground/20 hover:border-foreground transition-all text-left space-y-2 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]">
                        <div className="p-1.5 w-fit rounded-none bg-green-500/10 text-green-500 group-hover:bg-green-500 group-hover:text-white transition-colors">
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
                    <h2 className="text-[9px] font-black text-foreground uppercase tracking-[0.2em] px-1 opacity-50">Quick Explorations</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2">
                        {[
                            { icon: Newspaper, label: 'News', query: 'Search the latest news' },
                            { icon: Terminal, label: 'Explore', query: 'Show me something interesting' },
                            { icon: Palette, label: 'Art', query: 'Contemporary art trends' },
                            { icon: Zap, label: 'Tech', query: 'Latest in AI technology' },
                            { icon: Globe, label: 'Travel', query: 'Best travel destinations for 2024' },
                            { icon: Code, label: 'Science', query: 'Recent scientific breakthroughs' },
                            { icon: Terminal, label: 'Finance', query: 'Market updates' },
                            { icon: Zap, label: 'Sports', query: 'Latest sports scores' },
                        ].map((item, i) => (
                            <button
                                key={i}
                                onClick={() => handleSendMessage(item.query)}
                                className="flex items-center gap-2 p-1.5 rounded-none bg-background border border-foreground/10 hover:border-foreground hover:bg-foreground/5 transition-all text-left group"
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
